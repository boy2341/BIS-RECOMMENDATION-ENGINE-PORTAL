from fastapi import APIRouter, Request
router = APIRouter()
@router.get('/health')
def health(request: Request):
    settings = request.app.state.settings
    return {'status':'ok','standards_loaded':len(request.app.state.standards_store.all()),'vector_store':'chromadb','embedding_model':settings.embedding_model,'llm_enabled':bool(settings.groq_api_key),'llm_provider':'groq' if settings.groq_api_key else None,'llm_model':settings.groq_model if settings.groq_api_key else None}
