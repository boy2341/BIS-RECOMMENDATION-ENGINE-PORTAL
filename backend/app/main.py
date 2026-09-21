from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.services.standards_store import StandardsStore
from app.services.vector_store import VectorStore
from app.services.groq_service import GroqService
from app.services.analysis_service import AnalysisService
from app.services.document_service import DocumentService
from app.api.routes import health, analyze, standards, specification

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    standards_store = StandardsStore(settings.standards_path)
    vector_store = VectorStore(settings.chroma_path, settings.embedding_model, standards_store)
    groq_service = GroqService(settings.groq_api_key, settings.groq_model) if settings.groq_api_key else None
    analysis_service = AnalysisService(standards_store, vector_store, groq_service) if groq_service else None
    app.state.settings = settings
    app.state.standards_store = standards_store
    app.state.vector_store = vector_store
    app.state.groq_service = groq_service
    app.state.analysis_service = analysis_service
    app.state.document_service = DocumentService()
    yield

app = FastAPI(
    title='IS-Assist API',
    version='1.0.0',
    description='AI-powered Indian Standards recommendation backend for procurement specifications.',
    lifespan=lifespan
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(health.router, prefix='/api')
app.include_router(analyze.router, prefix='/api')
app.include_router(standards.router, prefix='/api')
app.include_router(specification.router, prefix='/api')

# Detect if frontend production build exists (e.g. unified single-service Render deployment)
FRONTEND_DIST_CANDIDATES = [
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
    Path(__file__).resolve().parent.parent / "dist",
    Path("frontend/dist").resolve(),
    Path("dist").resolve(),
]
frontend_dist = next((p for p in FRONTEND_DIST_CANDIDATES if p.is_dir()), None)

if frontend_dist:
    assets_dir = frontend_dist / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Do not catch /api, /docs or /openapi.json
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="API route not found")
        requested = frontend_dist / full_path
        if requested.is_file():
            return FileResponse(str(requested))
        index_file = frontend_dist / "index.html"
        if index_file.is_file():
            return FileResponse(str(index_file))
        return {"message": "IS-Assist API Live"}
else:
    @app.get('/')
    def root():
        return {'name': 'IS-Assist API', 'docs': '/docs', 'health': '/api/health'}
