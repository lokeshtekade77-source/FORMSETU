from pydantic import BaseModel, Field
from typing import Literal, List, Dict, Any, Optional

class ImportRequest(BaseModel): previous_application_id: str
class SmartImportRequest(BaseModel): previous_application_id: Optional[str] = None; auto_apply: Optional[bool] = False
class DecisionRequest(BaseModel): decision: Literal["use","edit","reject"]; value: Optional[str]=None
class UpdateRequest(BaseModel): value: str = Field(min_length=1, max_length=2000)
class ResolveRequest(BaseModel): resolution: Literal["previous","current","custom"]; value: Optional[str]=None
class DeclarationRequest(BaseModel): accepted: bool
class LinkDocumentRequest(BaseModel): document_id: Optional[str]=None

class UploadDocumentResponse(BaseModel):
    document_id: str
    name: str
    document_type: str
    original_size: int
    validation_status: str
    preparation_status: str
    checks: List[Dict[str, Any]]

class DocumentValidationResponse(BaseModel):
    document_id: str
    is_valid: bool
    status: str
    checks: List[Dict[str, Any]]

class DocumentPreparationResponse(BaseModel):
    document_id: str
    status: str
    original_size: int
    prepared_size: int
    original_dimensions: str
    prepared_dimensions: str
    quality: Optional[int] = None
    is_valid: bool
    is_compressed: Optional[bool] = None
    compression_ratio: Optional[float] = None
    compression_status: Optional[str] = None
    acknowledged: Optional[bool] = None

class AcknowledgeCompressionResponse(BaseModel):
    document_id: str
    acknowledged: bool
    message: str

class FieldSuggestionItem(BaseModel):
    id: str
    source_field_key: str
    source_label: Optional[str] = None
    source_value: str
    target_field_key: str
    target_label: Optional[str] = None
    match_type: str
    confidence: float
    reason: Optional[str] = None
    decision: str

class SmartImportResponse(BaseModel):
    import_id: str
    status: str
    total_found: int
    exact_count: int
    semantic_count: int
    review_count: int
    automatically_changed_count: int
    suggestions: List[FieldSuggestionItem]

class PhotoCheckItem(BaseModel):
    name: str
    status: str  # PASS | WARNING | FAIL | REVIEW | UNSUPPORTED
    message: str

class PhotoComplianceResponse(BaseModel):
    document_id: str
    status: str          # PASS | WARNING | FAIL | REVIEW
    score: int
    checks: List[PhotoCheckItem]
    requires_new_photo: bool

class TestApplicationCreateRequest(BaseModel):
    session_id: Optional[str] = None

class TestApplicationCreateOut(BaseModel):
    id: str
    status: str
    created_at: str

class TestApplicationUploadOut(BaseModel):
    id: str
    status: str
    original_filename: str

class TestApplicationAnalysisOut(BaseModel):
    id: str
    title: str
    status: str
    sections: List[Dict[str, Any]]
    documents: List[Dict[str, Any]]
    photo_rules: Dict[str, Any]
    declarations: List[str]
    confidence_summary: Dict[str, Any]

class TestApplicationRequirementsUpdateIn(BaseModel):
    title: Optional[str] = None
    sections: Optional[List[Dict[str, Any]]] = None
    documents: Optional[List[Dict[str, Any]]] = None
    photo_rules: Optional[Dict[str, Any]] = None
    declarations: Optional[List[str]] = None

class TestApplicationStartOut(BaseModel):
    id: str
    application_id: str
    status: str

class SignatureCheckItem(BaseModel):
    name: str
    status: str  # PASS | WARNING | FAIL
    message: str

class SignatureComplianceResponse(BaseModel):
    document_id: str
    status: str          # PASS | WARNING | FAIL | REVIEW
    score: int
    checks: List[SignatureCheckItem]
    requires_new_signature: bool

class StepProgressItem(BaseModel):
    key: str
    label: str
    status: str  # LOCKED | CURRENT | IN_PROGRESS | COMPLETED | NEEDS_REVIEW | FAILED

class ProgressResponse(BaseModel):
    application_id: str
    application_mode: str
    current_step: str
    progress_percent: int
    steps: List[StepProgressItem]

