from datetime import datetime
from uuid import uuid4
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
def uid(): return str(uuid4())
class IdTime(Base):
    __abstract__=True
    id: Mapped[str]=mapped_column(String(36), primary_key=True, default=uid)
    created_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow)
class DemoSession(IdTime):
    __tablename__="demo_sessions"; updated_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow); status: Mapped[str]=mapped_column(String(30), default="active"); applications=relationship("Application", back_populates="session", cascade="all, delete-orphan"); previous_applications=relationship("PreviousApplication", back_populates="session", cascade="all, delete-orphan")
class ApplicationType(IdTime):
    __tablename__="application_types"; slug: Mapped[str]=mapped_column(String(100), unique=True); title: Mapped[str]=mapped_column(String(200)); organization_name: Mapped[str]=mapped_column(String(200)); organization_short_name: Mapped[str]=mapped_column(String(50)); description: Mapped[str]=mapped_column(Text); is_demo: Mapped[bool]=mapped_column(Boolean, default=True); sections=relationship("ApplicationSection", back_populates="application_type", cascade="all, delete-orphan"); requirements=relationship("DocumentRequirement", back_populates="application_type", cascade="all, delete-orphan")
class Application(IdTime):
    __tablename__="applications"; session_id: Mapped[str]=mapped_column(ForeignKey("demo_sessions.id")); application_type_id: Mapped[str]=mapped_column(ForeignKey("application_types.id")); application_mode: Mapped[str]=mapped_column(String(30), default="DEMO"); status: Mapped[str]=mapped_column(String(30), default="draft"); progress: Mapped[int]=mapped_column(Integer, default=0); updated_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow); session=relationship("DemoSession", back_populates="applications"); field_values=relationship("FieldValue", back_populates="application", cascade="all, delete-orphan"); imports=relationship("ImportRecord", back_populates="application", cascade="all, delete-orphan"); conflicts=relationship("Conflict", back_populates="application", cascade="all, delete-orphan"); documents=relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan"); declaration=relationship("Declaration", back_populates="application", uselist=False, cascade="all, delete-orphan")
class ApplicationSection(IdTime):
    __tablename__="application_sections"; application_type_id: Mapped[str]=mapped_column(ForeignKey("application_types.id")); slug: Mapped[str]=mapped_column(String(50)); title: Mapped[str]=mapped_column(String(100)); description: Mapped[str]=mapped_column(Text); display_order: Mapped[int]=mapped_column(Integer); required: Mapped[bool]=mapped_column(Boolean, default=True); application_type=relationship("ApplicationType", back_populates="sections"); fields=relationship("ApplicationField", back_populates="section", cascade="all, delete-orphan")
class ApplicationField(IdTime):
    __tablename__="application_fields"; section_id: Mapped[str]=mapped_column(ForeignKey("application_sections.id")); key: Mapped[str]=mapped_column(String(100)); label: Mapped[str]=mapped_column(String(100)); field_type: Mapped[str]=mapped_column(String(30), default="text"); required: Mapped[bool]=mapped_column(Boolean, default=True); display_order: Mapped[int]=mapped_column(Integer); validation_rules: Mapped[dict]=mapped_column(JSON, default=dict); section=relationship("ApplicationSection", back_populates="fields")
class FieldValue(IdTime):
    __tablename__="field_values"; application_id: Mapped[str]=mapped_column(ForeignKey("applications.id")); field_id: Mapped[str]=mapped_column(ForeignKey("application_fields.id")); value: Mapped[str]=mapped_column(Text); source: Mapped[str]=mapped_column(String(30), default="manual"); source_application_id: Mapped[str|None]=mapped_column(String(36), nullable=True); source_field_key: Mapped[str|None]=mapped_column(String(100), nullable=True); status: Mapped[str]=mapped_column(String(30), default="available"); confidence: Mapped[float]=mapped_column(Float, default=1); last_verified: Mapped[datetime|None]=mapped_column(DateTime, nullable=True); updated_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow); application=relationship("Application", back_populates="field_values"); field=relationship("ApplicationField")
class PreviousApplication(IdTime):
    __tablename__="previous_applications"; session_id: Mapped[str]=mapped_column(ForeignKey("demo_sessions.id")); application_type_id: Mapped[str]=mapped_column(ForeignKey("application_types.id")); title: Mapped[str]=mapped_column(String(200)); application_year: Mapped[int]=mapped_column(Integer); status: Mapped[str]=mapped_column(String(30)); session=relationship("DemoSession", back_populates="previous_applications"); fields=relationship("PreviousApplicationField", back_populates="previous_application", cascade="all, delete-orphan")
class PreviousApplicationField(IdTime):
    __tablename__="previous_application_fields"; previous_application_id: Mapped[str]=mapped_column(ForeignKey("previous_applications.id")); field_key: Mapped[str]=mapped_column(String(100)); label: Mapped[str]=mapped_column(String(100)); value: Mapped[str]=mapped_column(Text); last_verified: Mapped[datetime]=mapped_column(DateTime); previous_application=relationship("PreviousApplication", back_populates="fields")
class ImportRecord(IdTime):
    __tablename__="import_records"; application_id: Mapped[str]=mapped_column(ForeignKey("applications.id")); previous_application_id: Mapped[str]=mapped_column(ForeignKey("previous_applications.id")); status: Mapped[str]=mapped_column(String(30), default="reviewing"); application=relationship("Application", back_populates="imports"); fields=relationship("FieldImport", back_populates="import_record", cascade="all, delete-orphan")
class FieldImport(IdTime):
    __tablename__="field_imports"; import_record_id: Mapped[str]=mapped_column(ForeignKey("import_records.id")); source_field_key: Mapped[str]=mapped_column(String(100)); target_field_key: Mapped[str]=mapped_column(String(100)); source_label: Mapped[str|None]=mapped_column(String(100), nullable=True); target_label: Mapped[str|None]=mapped_column(String(100), nullable=True); source_value: Mapped[str]=mapped_column(Text); target_value: Mapped[str|None]=mapped_column(Text, nullable=True); match_type: Mapped[str]=mapped_column(String(30), default="EXACT"); confidence: Mapped[float]=mapped_column(Float, default=1.0); decision: Mapped[str]=mapped_column(String(30), default="available"); reason: Mapped[str|None]=mapped_column(Text, nullable=True); import_record=relationship("ImportRecord", back_populates="fields")
class Conflict(IdTime):
    __tablename__="conflicts"; application_id: Mapped[str]=mapped_column(ForeignKey("applications.id")); field_key: Mapped[str]=mapped_column(String(100)); previous_value: Mapped[str]=mapped_column(Text); current_value: Mapped[str]=mapped_column(Text); status: Mapped[str]=mapped_column(String(30), default="unresolved"); resolution: Mapped[str|None]=mapped_column(String(30), nullable=True); resolved_value: Mapped[str|None]=mapped_column(Text, nullable=True); resolved_at: Mapped[datetime|None]=mapped_column(DateTime, nullable=True); application=relationship("Application", back_populates="conflicts")
class Document(IdTime):
    __tablename__="documents"; session_id: Mapped[str]=mapped_column(ForeignKey("demo_sessions.id")); name: Mapped[str]=mapped_column(String(150)); document_type: Mapped[str]=mapped_column(String(50)); mime_type: Mapped[str]=mapped_column(String(80)); original_filename: Mapped[str]=mapped_column(String(255)); original_size: Mapped[int]=mapped_column(Integer); storage_path: Mapped[str]=mapped_column(String(255)); source_application_id: Mapped[str|None]=mapped_column(String(36), nullable=True); width: Mapped[int|None]=mapped_column(Integer, nullable=True); height: Mapped[int|None]=mapped_column(Integer, nullable=True); pages: Mapped[int|None]=mapped_column(Integer, nullable=True); last_verified: Mapped[datetime|None]=mapped_column(DateTime, nullable=True); status: Mapped[str]=mapped_column(String(30), default="valid")
class DocumentRequirement(IdTime):
    __tablename__="document_requirements"; application_type_id: Mapped[str]=mapped_column(ForeignKey("application_types.id")); document_type: Mapped[str]=mapped_column(String(50)); label: Mapped[str]=mapped_column(String(100)); required: Mapped[bool]=mapped_column(Boolean); allowed_formats: Mapped[list]=mapped_column(JSON); max_size_kb: Mapped[int]=mapped_column(Integer); min_size_kb: Mapped[int|None]=mapped_column(Integer, nullable=True); required_width: Mapped[int|None]=mapped_column(Integer, nullable=True); required_height: Mapped[int|None]=mapped_column(Integer, nullable=True); max_pages: Mapped[int|None]=mapped_column(Integer, nullable=True); photo_rules: Mapped[dict]=mapped_column(JSON, default=dict); description: Mapped[str]=mapped_column(Text); application_type=relationship("ApplicationType", back_populates="requirements")
class ApplicationDocument(IdTime):
    __tablename__="application_documents"; application_id: Mapped[str]=mapped_column(ForeignKey("applications.id")); document_requirement_id: Mapped[str]=mapped_column(ForeignKey("document_requirements.id")); document_id: Mapped[str|None]=mapped_column(ForeignKey("documents.id"), nullable=True); status: Mapped[str]=mapped_column(String(30), default="missing"); validation_status: Mapped[str]=mapped_column(String(30), default="pending"); preparation_status: Mapped[str]=mapped_column(String(30), default="not_required"); compression_acknowledged: Mapped[bool]=mapped_column(Boolean, default=False); application=relationship("Application", back_populates="documents")
class DocumentValidation(IdTime):
    __tablename__="document_validations"; document_id: Mapped[str]=mapped_column(ForeignKey("documents.id")); is_valid: Mapped[bool]=mapped_column(Boolean, default=False); status: Mapped[str]=mapped_column(String(30), default="INVALID"); checks_json: Mapped[dict]=mapped_column("checks", JSON, default=dict); validated_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow)
class DocumentPreparation(IdTime):
    __tablename__="document_preparations"; document_id: Mapped[str]=mapped_column(ForeignKey("documents.id")); original_size: Mapped[int]=mapped_column(Integer); prepared_size: Mapped[int]=mapped_column(Integer); original_mime: Mapped[str]=mapped_column(String(80)); prepared_mime: Mapped[str]=mapped_column(String(80)); original_width: Mapped[int|None]=mapped_column(Integer, nullable=True); original_height: Mapped[int|None]=mapped_column(Integer, nullable=True); prepared_width: Mapped[int|None]=mapped_column(Integer, nullable=True); prepared_height: Mapped[int|None]=mapped_column(Integer, nullable=True); status: Mapped[str]=mapped_column(String(30), default="SUCCESS"); quality: Mapped[int|None]=mapped_column(Integer, nullable=True); output_storage_key: Mapped[str|None]=mapped_column(String(255), nullable=True)
class PhotoComplianceResult(IdTime):
    __tablename__="photo_compliance_results"; document_id: Mapped[str]=mapped_column(ForeignKey("documents.id")); status: Mapped[str]=mapped_column(String(30), default="PASS"); score: Mapped[int]=mapped_column(Integer, default=100); checks_json: Mapped[dict]=mapped_column("checks", JSON, default=dict); rules_snapshot: Mapped[dict]=mapped_column("rules", JSON, default=dict); created_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow)
class SignatureComplianceResult(IdTime):
    __tablename__="signature_compliance_results"; document_id: Mapped[str]=mapped_column(ForeignKey("documents.id")); status: Mapped[str]=mapped_column(String(30), default="PASS"); score: Mapped[int]=mapped_column(Integer, default=100); checks_json: Mapped[dict]=mapped_column("checks", JSON, default=dict); rules_snapshot: Mapped[dict]=mapped_column("rules", JSON, default=dict); created_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow)

class Declaration(IdTime):
    __tablename__="declarations"; application_id: Mapped[str]=mapped_column(ForeignKey("applications.id"), unique=True); accepted: Mapped[bool]=mapped_column(Boolean, default=False); accepted_at: Mapped[datetime|None]=mapped_column(DateTime, nullable=True); application=relationship("Application", back_populates="declaration")
class AuditEvent(IdTime):
    __tablename__="audit_events"; session_id: Mapped[str]=mapped_column(ForeignKey("demo_sessions.id")); application_id: Mapped[str|None]=mapped_column(ForeignKey("applications.id"), nullable=True); event_type: Mapped[str]=mapped_column(String(100)); metadata_json: Mapped[dict]=mapped_column("metadata", JSON, default=dict)

class TestApplication(IdTime):
    __tablename__="test_applications"
    session_id: Mapped[str|None]=mapped_column(String(36), nullable=True)
    title: Mapped[str]=mapped_column(String(200), default="Uploaded Application Form")
    status: Mapped[str]=mapped_column(String(30), default="created") # created, uploaded, analyzed, reviewed, active
    original_filename: Mapped[str|None]=mapped_column(String(255), nullable=True)
    storage_path: Mapped[str|None]=mapped_column(String(255), nullable=True)
    mime_type: Mapped[str|None]=mapped_column(String(80), nullable=True)
    generated_application_id: Mapped[str|None]=mapped_column(String(36), nullable=True)
    updated_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    analysis=relationship("TestApplicationAnalysis", back_populates="test_application", uselist=False, cascade="all, delete-orphan")

class TestApplicationAnalysis(IdTime):
    __tablename__="test_application_analyses"
    test_application_id: Mapped[str]=mapped_column(ForeignKey("test_applications.id"))
    title: Mapped[str]=mapped_column(String(200), default="Detected Application Form")
    sections_json: Mapped[list]=mapped_column(JSON, default=list)
    documents_json: Mapped[list]=mapped_column(JSON, default=list)
    photo_rules_json: Mapped[dict]=mapped_column(JSON, default=dict)
    declarations_json: Mapped[list]=mapped_column(JSON, default=list)
    confidence_summary_json: Mapped[dict]=mapped_column(JSON, default=dict)
    reviewed_at: Mapped[datetime|None]=mapped_column(DateTime, nullable=True)
    test_application=relationship("TestApplication", back_populates="analysis")

