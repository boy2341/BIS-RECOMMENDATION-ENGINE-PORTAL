from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from app.schemas.api import AnalyzeRequest, AnalysisResponse

router = APIRouter()

@router.post('/analyze', response_model=AnalysisResponse)
def analyze(payload: AnalyzeRequest, request: Request):
    if request.app.state.analysis_service is None:
        raise HTTPException(status_code=503, detail='GROQ_API_KEY is not configured.')
    try:
        return request.app.state.analysis_service.analyze(payload.text, payload.top_k)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'AI analysis failed: {exc}')

@router.post('/upload')
async def upload(request: Request, file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail='Only PDF files are supported.')
    settings = request.app.state.settings
    data = await file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f'File exceeds {settings.max_upload_mb} MB limit.')
    if request.app.state.analysis_service is None:
        raise HTTPException(status_code=503, detail='GROQ_API_KEY is not configured.')
    try:
        text = request.app.state.document_service.extract_pdf(data)
        if len(text) < 5:
            raise ValueError('No usable text was extracted from the PDF. Scanned PDFs need OCR, which is not enabled in this prototype.')
        result = request.app.state.analysis_service.analyze(text, settings.top_k)
        return {'filename':file.filename,'extracted_characters':len(text),'result':result}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'PDF analysis failed: {exc}')
