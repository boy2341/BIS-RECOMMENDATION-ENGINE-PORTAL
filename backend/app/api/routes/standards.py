from fastapi import APIRouter, HTTPException, Request
router = APIRouter()
@router.get('/standards')
def list_standards(request: Request):
    return {'count':len(request.app.state.standards_store.all()),'standards':request.app.state.standards_store.all()}
@router.get('/standards/{standard_number:path}')
def get_standard(standard_number: str, request: Request):
    record=request.app.state.standards_store.get(standard_number)
    if not record: raise HTTPException(status_code=404, detail='Standard not found in prototype knowledge base.')
    return record
@router.post('/standards/reindex')
def reindex(request: Request):
    request.app.state.vector_store.rebuild()
    return {'status':'ok','indexed':len(request.app.state.standards_store.all())}
