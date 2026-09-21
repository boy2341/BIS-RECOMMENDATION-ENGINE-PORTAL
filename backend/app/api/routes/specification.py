from fastapi import APIRouter, HTTPException, Request
from app.schemas.api import GenerateSpecificationRequest, GenerateSpecificationResponse
router = APIRouter()
@router.post('/specification/generate', response_model=GenerateSpecificationResponse)
def generate(payload: GenerateSpecificationRequest, request: Request):
    standards=[request.app.state.standards_store.get(n) for n in payload.selected_standards]
    standards=[s for s in standards if s]
    if not standards: raise HTTPException(status_code=400, detail='At least one valid standard from the prototype knowledge base must be selected.')
    if request.app.state.groq_service is None:
        raise HTTPException(status_code=503, detail='GROQ_API_KEY is not configured.')
    try:
        result=request.app.state.groq_service.generate_specification(payload.product,[p.model_dump() for p in payload.requirements],standards,payload.context)
        result['ai']={'provider':'groq','model':request.app.state.groq_service.model,'grounded':True}
        return result
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'Specification generation failed: {exc}')
