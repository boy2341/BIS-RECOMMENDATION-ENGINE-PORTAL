from typing import Any, Literal
from pydantic import BaseModel, Field

class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=5, max_length=100_000)
    top_k: int = Field(default=5, ge=1, le=10)

class ExtractedParameter(BaseModel):
    name: str
    value: str
    confidence: float = Field(ge=0, le=1)

class Understanding(BaseModel):
    product: str
    product_category: str
    application: str | None = None
    language: str = 'English'
    confidence: float = Field(ge=0, le=1)
    parameters: list[ExtractedParameter] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)

class StandardCandidate(BaseModel):
    standard_number: str
    title: str
    year: str | None = None
    relevance_score: float = Field(ge=0, le=100)
    match_type: Literal['primary', 'related', 'test', 'safety', 'installation', 'reference', 'other'] = 'other'
    rationale: str
    status: str | None = None
    amendment: str | None = None
    source_url: str | None = None

class RelatedStandard(BaseModel):
    standard_number: str
    title: str
    relationship: str
    source_url: str | None = None

class ComplianceItem(BaseModel):
    item: str
    status: Literal['verify', 'applicable', 'not-applicable', 'unknown']
    note: str

class AnalysisResponse(BaseModel):
    understanding: Understanding
    recommended_standards: list[StandardCandidate]
    related_standards: list[RelatedStandard]
    compliance: list[ComplianceItem]
    explanation: dict[str, Any]
    procurement_checklist: list[str]
    ai: dict[str, Any]

class GenerateSpecificationRequest(BaseModel):
    product: str
    requirements: list[ExtractedParameter] = Field(default_factory=list)
    selected_standards: list[str] = []
    context: str = ''

class GenerateSpecificationResponse(BaseModel):
    title: str
    clause: str
    required_fields: list[str]
    notes: list[str]
    ai: dict[str, Any]
