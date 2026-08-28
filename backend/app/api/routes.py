import os
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from app.db.session import get_db, settings
from app.models.models import *
from app.schemas.schemas import *
from app.services.seed import seed_session, reset_session
from app.services.storage import DocumentStorage
from app.services.validator import DocumentValidator, FieldValidator
from app.services.preparer import DocumentPreparationService
from app.services.field_mapper import FieldMappingService
from app.services.photo_analyzer import PhotoComplianceAnalyzer
from app.services.signature_analyzer import SignatureComplianceAnalyzer
from app.services.document_compliance import DocumentComplianceAnalyzer
from app.services.form_analyzer import FormAnalysisService

router = APIRouter()

def fail(code: str, message: str, status: int = 404):
    raise HTTPException(status_code=status, detail={"error": {"code": code, "message": message}})

def application(db: Session, id: str):
    item = db.get(Application, id)
    if not item:
        kind = db.query(ApplicationType).filter_by(slug=id).first()
        if kind:
            item = db.query(Application).filter_by(application_type_id=kind.id).first()
    if not item:
        item = db.query(Application).first()
    if not item:
        sess = seed_session(db)
        item = sess.applications[0] if sess.applications else None
    if not item:
        fail("APPLICATION_NOT_FOUND", "Application was not found.")
    return item

def app_out(a):
    return {
        "id": a.id,
        "session_id": a.session_id,
        "application_type_id": a.application_type_id,
        "application_mode": getattr(a, "application_mode", "DEMO") or "DEMO",
        "status": a.status,
        "progress": a.progress,
        "created_at": a.created_at
    }


def recalc(db: Session, a: Application):
    values = db.query(FieldValue).filter_by(application_id=a.id).all()
    docs = db.query(ApplicationDocument).filter_by(application_id=a.id).all()
    
    total = max(1, len(values) + len(docs) + 2)
    
    done = sum(v.status in {"confirmed", "edited"} for v in values) + \
           sum(d.validation_status in {"valid", "READY"} or d.status in {"valid", "READY"} for d in docs) + \
           sum(c.status != "unresolved" for c in a.conflicts) + \
           (1 if a.declaration and a.declaration.accepted else 0)
           
    a.progress = round(done / total * 100)
    db.commit()
    return a.progress

@router.get("/health")
def health():
    return {"status": "ok", "service": "formsetu-api", "demo_only": True}

@router.post("/sessions")
def create_session(db: Session = Depends(get_db)):
    s = seed_session(db)
    return {
        "id": s.id,
        "status": s.status,
        "application": app_out(s.applications[0]),
        "disclaimer": "Independent prototype. Synthetic data only."
    }

@router.get("/sessions/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    s = db.get(DemoSession, session_id)
    if not s:
        s = seed_session(db)
    return {"id": s.id, "status": s.status, "applications": [app_out(a) for a in s.applications]}

@router.post("/sessions/{session_id}/reset")
def reset(session_id: str, db: Session = Depends(get_db)):
    s = db.get(DemoSession, session_id)
    if not s:
        s = seed_session(db)
    else:
        s = reset_session(db, s)
    return {"id": s.id, "application": app_out(s.applications[0]), "reset": True}

@router.get("/applications")
def applications(session_id: str, db: Session = Depends(get_db)):
    apps = db.query(Application).filter_by(session_id=session_id).all()
    if not apps:
        app_item = application(db, "demo-recruitment-2026")
        apps = [app_item]
    return [app_out(a) for a in apps]

@router.get("/applications/{application_id}")
def get_application(application_id: str, db: Session = Depends(get_db)):
    return app_out(application(db, application_id))

@router.get("/applications/{application_id}/requirements")
def requirements(application_id: str, db: Session = Depends(get_db)):
    a = application(db, application_id)
    reqs = db.query(DocumentRequirement).filter_by(application_type_id=a.application_type_id).all()
    return [{
        "id": r.id,
        "document_type": r.document_type,
        "label": r.label,
        "required": r.required,
        "allowed_formats": r.allowed_formats,
        "max_size_kb": r.max_size_kb,
        "min_size_kb": r.min_size_kb,
        "required_width": r.required_width,
        "required_height": r.required_height,
        "description": r.description
    } for r in reqs]

@router.get("/applications/{application_id}/sections")
def sections(application_id: str, db: Session = Depends(get_db)):
    a = application(db, application_id)
    return [{
        "slug": s.slug,
        "title": s.title,
        "description": s.description,
        "required": s.required
    } for s in db.query(ApplicationSection).filter_by(application_type_id=a.application_type_id).order_by(ApplicationSection.display_order)]

@router.get("/applications/{application_id}/fields")
def fields(application_id: str, db: Session = Depends(get_db)):
    a = application(db, application_id)
    rows = db.query(FieldValue, ApplicationField).join(ApplicationField, FieldValue.field_id == ApplicationField.id).filter(FieldValue.application_id == a.id).all()
    return [{
        "id": v.id,
        "field_id": f.id,
        "key": f.key,
        "label": f.label,
        "value": v.value,
        "source": v.source,
        "status": v.status,
        "last_verified": v.last_verified
    } for v, f in rows]

@router.get("/previous-applications")
def previous(session_id: str, db: Session = Depends(get_db)):
    return [{
        "id": p.id,
        "title": p.title,
        "year": p.application_year,
        "status": p.status,
        "field_count": len(p.fields)
    } for p in db.query(PreviousApplication).filter_by(session_id=session_id)]

@router.get("/previous-applications/{item_id}")
def previous_one(item_id: str, db: Session = Depends(get_db)):
    p = db.get(PreviousApplication, item_id)
    if not p:
        fail("PREVIOUS_APPLICATION_NOT_FOUND", "Previous application was not found.")
    return {
        "id": p.id,
        "title": p.title,
        "fields": [{
            "id": f.id,
            "key": f.field_key,
            "label": f.label,
            "value": f.value,
            "last_verified": f.last_verified
        } for f in p.fields]
    }

@router.post("/applications/{application_id}/imports")
def create_import(application_id: str, payload: ImportRequest, db: Session = Depends(get_db)):
    a = application(db, application_id)
    p = db.get(PreviousApplication, payload.previous_application_id)
    if not p or p.session_id != a.session_id:
        fail("PREVIOUS_APPLICATION_NOT_FOUND", "Previous application is unavailable.")
    
    target_fields = db.query(ApplicationField).join(ApplicationSection).filter(
        ApplicationSection.application_type_id == a.application_type_id
    ).all()
    
    curr_values = {v.field.key: v.value for v in a.field_values if v.value and v.status in {"confirmed", "edited"}}
    mapper = FieldMappingService()
    analysis = mapper.analyze_import(p.fields, target_fields, curr_values)

    record = ImportRecord(application_id=a.id, previous_application_id=p.id)
    db.add(record)
    db.flush()
    
    for sug in analysis["suggestions"]:
        db.add(FieldImport(
            import_record_id=record.id,
            source_field_key=sug["source_field_key"],
            target_field_key=sug["target_field_key"],
            source_label=sug["source_label"],
            target_label=sug["target_label"],
            source_value=sug["source_value"],
            target_value=None,
            match_type=sug["match_type"],
            confidence=sug["confidence"],
            reason=sug["reason"],
            decision="available"
        ))
    db.commit()
    return {"id": record.id, "status": record.status, "field_count": len(record.fields)}

@router.post("/applications/{application_id}/smart-import")
def smart_import(application_id: str, payload: Optional[SmartImportRequest] = None, db: Session = Depends(get_db)):
    a = application(db, application_id)
    
    prev_app = None
    if payload and payload.previous_application_id:
        prev_app = db.get(PreviousApplication, payload.previous_application_id)
    else:
        prev_app = db.query(PreviousApplication).filter_by(session_id=a.session_id).first()

    if not prev_app:
        fail("PREVIOUS_APPLICATION_NOT_FOUND", "No previous application found for smart import.")

    target_fields = db.query(ApplicationField).join(ApplicationSection).filter(
        ApplicationSection.application_type_id == a.application_type_id
    ).all()

    curr_values = {v.field.key: v.value for v in a.field_values if v.value and v.status in {"confirmed", "edited"}}

    mapper = FieldMappingService()
    analysis = mapper.analyze_import(prev_app.fields, target_fields, curr_values)

    record = ImportRecord(application_id=a.id, previous_application_id=prev_app.id, status="reviewing")
    db.add(record)
    db.flush()

    auto_apply = bool(payload and payload.auto_apply)
    auto_changed_count = 0

    suggestion_items = []
    for sug in analysis["suggestions"]:
        should_auto_use = auto_apply and sug.get("match_type") in {"EXACT", "SEMANTIC", "NORMALIZED"} and sug.get("confidence", 0) >= 0.85
        fi_decision = "use" if should_auto_use else "available"
        fi_target_val = sug["source_value"] if should_auto_use else None

        fi = FieldImport(
            import_record_id=record.id,
            source_field_key=sug["source_field_key"],
            target_field_key=sug["target_field_key"],
            source_label=sug["source_label"],
            target_label=sug["target_label"],
            source_value=sug["source_value"],
            target_value=fi_target_val,
            match_type=sug["match_type"],
            confidence=sug["confidence"],
            reason=sug["reason"],
            decision=fi_decision
        )
        db.add(fi)
        db.flush()

        if should_auto_use:
            fv = db.query(FieldValue).join(ApplicationField).filter(
                FieldValue.application_id == a.id,
                ApplicationField.key == sug["target_field_key"]
            ).first()
            if fv:
                fv.value = sug["source_value"]
                fv.status = "confirmed"
                fv.source = "previous_application"
                fv.source_application_id = prev_app.id
                fv.source_field_key = sug["source_field_key"]
                fv.last_verified = datetime.utcnow()
                auto_changed_count += 1

        suggestion_items.append({
            "id": fi.id,
            "source_field_key": fi.source_field_key,
            "source_label": fi.source_label,
            "source_value": fi.source_value,
            "target_field_key": fi.target_field_key,
            "target_label": fi.target_label,
            "match_type": fi.match_type,
            "confidence": fi.confidence,
            "reason": fi.reason,
            "decision": fi.decision
        })

    db.commit()
    recalc(db, a)

    return {
        "import_id": record.id,
        "status": record.status,
        "total_found": analysis["total_found"],
        "exact_count": analysis["exact_count"],
        "semantic_count": analysis["semantic_count"],
        "review_count": analysis["review_count"],
        "automatically_changed_count": auto_changed_count,
        "suggestions": suggestion_items
    }

@router.post("/applications/{application_id}/auto-fetch")
def auto_fetch(application_id: str, payload: Optional[SmartImportRequest] = None, db: Session = Depends(get_db)):
    req = payload or SmartImportRequest(auto_apply=True)
    req.auto_apply = True
    return smart_import(application_id, req, db)

@router.get("/applications/{application_id}/imports")
def imports(application_id: str, db: Session = Depends(get_db)):
    application(db, application_id)
    return [{
        "id": r.id,
        "status": r.status,
        "previous_application_id": r.previous_application_id,
        "fields": [{
            "id": f.id,
            "source_field_key": f.source_field_key,
            "target_field_key": f.target_field_key,
            "source_label": f.source_label,
            "target_label": f.target_label,
            "source_value": f.source_value,
            "target_value": f.target_value,
            "match_type": f.match_type,
            "confidence": f.confidence,
            "reason": f.reason,
            "decision": f.decision
        } for f in r.fields]
    } for r in db.query(ImportRecord).filter_by(application_id=application_id)]

@router.post("/imports/{import_id}/fields/{field_id}/decision")
def decision(import_id: str, field_id: str, payload: DecisionRequest, db: Session = Depends(get_db)):
    imp = db.get(ImportRecord, import_id)
    fi = db.get(FieldImport, field_id)
    if not imp or not fi or fi.import_record_id != imp.id:
        fail("IMPORT_FIELD_NOT_FOUND", "Import field was not found.")
    
    fi.decision = payload.decision
    fi.target_value = payload.value if payload.decision == "edit" else (fi.source_value if payload.decision == "use" else None)
    
    fv = db.query(FieldValue).join(ApplicationField).filter(
        FieldValue.application_id == imp.application_id,
        ApplicationField.key == fi.target_field_key
    ).first()

    if fv and payload.decision in {"use", "edit"}:
        fv.value = fi.target_value
        fv.status = "edited" if payload.decision == "edit" else "confirmed"
        fv.source = "previous_application"
        fv.source_application_id = imp.previous_application_id
        fv.source_field_key = fi.source_field_key
        fv.last_verified = datetime.utcnow()
    elif fv and payload.decision == "reject":
        if fv.source == "current_profile":
            fv.value = ""
        fv.status = "rejected"
    
    db.commit()
    recalc(db, imp.application)
    return {"id": fi.id, "decision": fi.decision, "value": fi.target_value, "match_type": fi.match_type}

@router.post("/applications/{application_id}/clear-fields")
def clear_fields(application_id: str, db: Session = Depends(get_db)):
    a = application(db, application_id)
    fields_list = db.query(FieldValue).filter_by(application_id=a.id).all()
    for f in fields_list:
        f.value = ""
        f.source = "manual"
        f.status = "available"
    db.commit()
    recalc(db, a)
    return {"status": "cleared", "field_count": len(fields_list)}


@router.post("/applications/{application_id}/fields/{field_id}/verify")
def verify(application_id: str, field_id: str, db: Session = Depends(get_db)):
    app_item = application(db, application_id)
    f = db.get(FieldValue, field_id)
    if not f or f.application_id != application_id:
        fail("FIELD_NOT_FOUND", "Field was not found.")
    
    val_res = FieldValidator.validate_field(f.field.key if f.field else "field", f.value or "", f.field.field_type if f.field else "text")
    f.status = "confirmed" if val_res["valid"] else "edited"
    f.last_verified = datetime.utcnow()
    db.commit()
    recalc(db, app_item)
    return {
        "id": f.id,
        "status": f.status,
        "value": f.value,
        "validation_passed": val_res["valid"],
        "validation_message": val_res["message"]
    }

@router.post("/applications/{application_id}/fields/{field_id}/update")
def update(application_id: str, field_id: str, payload: UpdateRequest, db: Session = Depends(get_db)):
    app_item = application(db, application_id)
    f = db.get(FieldValue, field_id)
    if not f or f.application_id != application_id:
        fail("FIELD_NOT_FOUND", "Field was not found.")
    f.value = payload.value
    if not f.source_application_id:
        f.source = "manual"
    
    val_res = FieldValidator.validate_field(f.field.key if f.field else "field", payload.value, f.field.field_type if f.field else "text")
    f.status = "edited"
    f.last_verified = datetime.utcnow()
    db.commit()
    recalc(db, app_item)
    return {
        "id": f.id,
        "value": f.value,
        "status": f.status,
        "validation_passed": val_res["valid"],
        "validation_message": val_res["message"]
    }

@router.get("/applications/{application_id}/conflicts")
def conflicts(application_id: str, db: Session = Depends(get_db)):
    application(db, application_id)
    return [{
        "id": c.id,
        "field_key": c.field_key,
        "previous_value": c.previous_value,
        "current_value": c.current_value,
        "status": c.status,
        "resolution": c.resolution,
        "resolved_value": c.resolved_value
    } for c in db.query(Conflict).filter_by(application_id=application_id)]

@router.post("/conflicts/{conflict_id}/resolve")
def resolve(conflict_id: str, payload: ResolveRequest, db: Session = Depends(get_db)):
    c = db.get(Conflict, conflict_id)
    if not c:
        fail("CONFLICT_NOT_FOUND", "Conflict was not found.")
    value = c.previous_value if payload.resolution == "previous" else c.current_value if payload.resolution == "current" else payload.value
    if not value:
        fail("VALUE_REQUIRED", "A custom resolution value is required.", 422)
    c.status = "resolved"
    c.resolution = payload.resolution
    c.resolved_value = value
    c.resolved_at = datetime.utcnow()
    db.commit()
    recalc(db, c.application)
    return {"id": c.id, "status": c.status, "resolved_value": value}

# === PHASE 3 DOCUMENT ENDPOINTS ===

@router.get("/documents")
def documents(session_id: str, db: Session = Depends(get_db)):
    return [{
        "id": d.id,
        "name": d.name,
        "document_type": d.document_type,
        "status": d.status,
        "original_size": d.original_size
    } for d in db.query(Document).filter_by(session_id=session_id)]

@router.post("/applications/{application_id}/documents/upload")
async def upload_document(
    application_id: str,
    file: UploadFile = File(...),
    document_requirement_id: str = Form(...),
    db: Session = Depends(get_db)
):
    app = application(db, application_id)
    req = db.get(DocumentRequirement, document_requirement_id)
    if not req:
        fail("REQUIREMENT_NOT_FOUND", "Document requirement not found.")

    content = await file.read()
    if len(content) == 0:
        fail("EMPTY_FILE", "Uploaded file is empty.", 400)

    # Save to storage using DocumentStorage
    storage = DocumentStorage(settings.document_storage_path)
    safe_filename = Path(file.filename or "upload.bin").name
    storage_key = storage.save(safe_filename, content)

    # Validate file against requirement
    val_data = DocumentValidator.validate_file(content, safe_filename, req)

    # Check format check
    format_check = next((c for c in val_data["checks"] if c["name"] == "format"), None)
    if format_check and not format_check["passed"] and not val_data.get("preparable", False):
        fail("UNSUPPORTED_FORMAT", f"Invalid file format or signature: {format_check.get('message', 'Unsupported format')}", 400)

    # Create Document record
    doc = Document(
        session_id=app.session_id,
        name=req.label,
        document_type=req.document_type,
        mime_type=val_data["detected_mime"],
        original_filename=safe_filename,
        original_size=val_data["size_bytes"],
        storage_path=storage_key,
        width=val_data["width"],
        height=val_data["height"],
        pages=val_data["pages"],
        status="valid" if val_data["valid"] else "invalid"
    )
    db.add(doc)
    db.flush()

    # Create DocumentValidation record
    doc_val = DocumentValidation(
        document_id=doc.id,
        is_valid=val_data["valid"],
        status=val_data["status"],
        checks_json={"checks": val_data["checks"]}
    )
    db.add(doc_val)

    # Link/update ApplicationDocument slot
    app_doc = db.query(ApplicationDocument).filter_by(
        application_id=app.id,
        document_requirement_id=req.id
    ).first()

    if not app_doc:
        app_doc = ApplicationDocument(
            application_id=app.id,
            document_requirement_id=req.id
        )
        db.add(app_doc)

    app_doc.document_id = doc.id
    app_doc.status = "valid" if val_data["valid"] else "invalid"
    app_doc.validation_status = val_data["status"].lower()
    app_doc.preparation_status = "preparable" if val_data["status"] == "PREPARABLE" else "not_required"

    db.commit()
    recalc(db, app)

    return {
        "document_id": doc.id,
        "name": doc.name,
        "document_type": doc.document_type,
        "original_size": doc.original_size,
        "validation_status": val_data["status"].lower(),
        "preparation_status": app_doc.preparation_status,
        "checks": val_data["checks"]
    }

@router.post("/documents/{document_id}/prepare")
def prepare_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        fail("DOCUMENT_NOT_FOUND", "Document not found.")

    app_doc = db.query(ApplicationDocument).filter_by(document_id=doc.id).first()
    if not app_doc:
        fail("APPLICATION_DOCUMENT_NOT_FOUND", "Document is not attached to an application slot.")

    req = db.get(DocumentRequirement, app_doc.document_requirement_id)
    if not req:
        fail("REQUIREMENT_NOT_FOUND", "Document requirement not found.")

    storage = DocumentStorage(settings.document_storage_path)
    if not storage.exists(doc.storage_path):
        fail("FILE_NOT_FOUND", "Original file is missing from storage.")

    original_bytes = storage.get(doc.storage_path)

    # Run preparation
    prep_result = DocumentPreparationService.prepare_image(
        original_bytes,
        doc.original_filename,
        req
    )

    if not prep_result["success"]:
        fail("PREPARATION_FAILED", prep_result.get("message", "Document preparation failed."), 422)

    prepared_bytes = prep_result["prepared_bytes"]
    prep_val = prep_result["validation_result"]

    # Save prepared file in DocumentStorage
    prep_key = storage.save(f"prep_{doc.original_filename}", prepared_bytes)

    # Save DocumentPreparation record
    doc_prep = DocumentPreparation(
        document_id=doc.id,
        original_size=prep_result["original_size"],
        prepared_size=prep_result["prepared_size"],
        original_mime=doc.mime_type,
        prepared_mime=prep_result["prepared_mime"],
        original_width=prep_result["original_width"],
        original_height=prep_result["original_height"],
        prepared_width=prep_result["prepared_width"],
        prepared_height=prep_result["prepared_height"],
        status="SUCCESS" if prep_val["valid"] else "FAILED",
        quality=prep_result["quality"],
        output_storage_key=prep_key
    )
    db.add(doc_prep)

    # Save new DocumentValidation record
    doc_val = DocumentValidation(
        document_id=doc.id,
        is_valid=prep_val["valid"],
        status=prep_val["status"],
        checks_json={"checks": prep_val["checks"]}
    )
    db.add(doc_val)

    # Update Document and ApplicationDocument
    doc.storage_path = prep_key
    doc.mime_type = prep_result["prepared_mime"]
    doc.original_size = prep_result["prepared_size"]
    doc.width = prep_result["prepared_width"]
    doc.height = prep_result["prepared_height"]
    doc.status = "valid" if prep_val["valid"] else "invalid"

    app_doc.status = "valid" if prep_val["valid"] else "invalid"
    app_doc.validation_status = "valid" if prep_val["valid"] else "invalid"
    app_doc.preparation_status = "prepared"

    db.commit()
    recalc(db, app_doc.application)

    orig_dim = f"{prep_result['original_width']}x{prep_result['original_height']}" if prep_result['original_width'] else "N/A"
    prep_dim = f"{prep_result['prepared_width']}x{prep_result['prepared_height']}" if prep_result['prepared_width'] else "N/A"

    is_compressed = prep_result["prepared_size"] < prep_result["original_size"] or prep_val["valid"]
    ratio = round((1 - prep_result["prepared_size"] / max(1, prep_result["original_size"])) * 100, 1) if is_compressed else 0.0

    return {
        "document_id": doc.id,
        "status": "SUCCESS" if prep_val["valid"] else "FAILED",
        "original_size": prep_result["original_size"],
        "prepared_size": prep_result["prepared_size"],
        "original_dimensions": orig_dim,
        "prepared_dimensions": prep_dim,
        "quality": prep_result["quality"],
        "is_valid": prep_val["valid"],
        "is_compressed": is_compressed,
        "compression_ratio": ratio,
        "compression_status": "COMPRESSED_AND_COMPLIANT" if is_compressed else "COMPLIANT_NO_COMPRESSION",
        "acknowledged": getattr(app_doc, "compression_acknowledged", False)
    }

@router.post("/documents/{document_id}/acknowledge-compression")
def acknowledge_compression(document_id: str, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        fail("DOCUMENT_NOT_FOUND", "Document not found.")

    app_doc = db.query(ApplicationDocument).filter_by(document_id=doc.id).first()
    if not app_doc:
        fail("APPLICATION_DOCUMENT_NOT_FOUND", "Application document slot not found.")

    if hasattr(app_doc, "compression_acknowledged"):
        app_doc.compression_acknowledged = True
        db.commit()

    return {
        "document_id": doc.id,
        "acknowledged": True,
        "message": "Image compression and resizing acknowledged by applicant."
    }

@router.delete("/documents/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        fail("DOCUMENT_NOT_FOUND", "Document not found.", 404)

    app_docs = db.query(ApplicationDocument).filter_by(document_id=doc.id).all()
    apps_to_recalc = set()

    for app_doc in app_docs:
        app_doc.document_id = None
        app_doc.status = "missing"
        app_doc.validation_status = "pending"
        app_doc.preparation_status = "not_required"
        if hasattr(app_doc, "compression_acknowledged"):
            app_doc.compression_acknowledged = False
        apps_to_recalc.add(app_doc.application_id)

    db.query(DocumentPreparation).filter_by(document_id=doc.id).delete()
    db.query(DocumentValidation).filter_by(document_id=doc.id).delete()

    storage = DocumentStorage(settings.document_storage_path)
    if storage.exists(doc.storage_path):
        storage.delete(doc.storage_path)

    db.delete(doc)
    db.commit()

    for app_id in apps_to_recalc:
        app = db.get(Application, app_id)
        if app:
            recalc(db, app)

    return {
        "document_id": document_id,
        "status": "deleted",
        "message": "Uploaded document removed successfully."
    }

@router.get("/documents/{document_id}/file")
def get_document_file(document_id: str, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        fail("DOCUMENT_NOT_FOUND", "Document not found.")

    storage = DocumentStorage(settings.document_storage_path)
    if not storage.exists(doc.storage_path):
        fail("FILE_NOT_FOUND", "File not found in storage.")

    content = storage.get(doc.storage_path)
    return Response(
        content=content,
        media_type=doc.mime_type or "image/jpeg",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@router.post("/documents/{document_id}/photo-analysis")
def photo_analysis(document_id: str, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        fail("DOCUMENT_NOT_FOUND", "Document not found.")

    # Only analyze image types
    if doc.mime_type not in {"image/jpeg", "image/png", "image/jpg"}:
        result = {
            "status": "UNSUPPORTED",
            "score": 0,
            "checks": [{"name": "image_decode", "status": "UNSUPPORTED", "message": "Photo compliance only applies to image documents."}],
            "rules": {}
        }
        pc = PhotoComplianceResult(
            document_id=doc.id,
            status="UNSUPPORTED",
            score=0,
            checks_json={"checks": result["checks"]},
            rules_snapshot={}
        )
        db.add(pc)
        db.commit()
        return {"document_id": doc.id, "status": "UNSUPPORTED", "score": 0, "checks": result["checks"], "requires_new_photo": False}

    # Fetch photo_rules from the document requirement
    app_doc = db.query(ApplicationDocument).filter_by(document_id=doc.id).first()
    photo_rules = {}
    if app_doc:
        req = db.get(DocumentRequirement, app_doc.document_requirement_id)
        if req and req.photo_rules:
            photo_rules = req.photo_rules

    # Load file bytes
    storage = DocumentStorage(settings.document_storage_path)
    if not storage.exists(doc.storage_path):
        fail("FILE_NOT_FOUND", "Document file not found in storage.")
    image_bytes = storage.get(doc.storage_path)

    result = PhotoComplianceAnalyzer.analyze_photo(image_bytes, photo_rules or None)

    # Determine if new photo is required (any mandatory FAIL)
    requires_new = result["status"] == "FAIL"

    # Persist result
    pc = PhotoComplianceResult(
        document_id=doc.id,
        status=result["status"],
        score=result["score"],
        checks_json={"checks": result["checks"]},
        rules_snapshot=result["rules"]
    )
    db.add(pc)
    db.commit()

    return {
        "document_id": doc.id,
        "status": result["status"],
        "score": result["score"],
        "checks": result["checks"],
        "requires_new_photo": requires_new
    }

@router.get("/documents/{document_id}/validation")
def document_validation(document_id: str, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        fail("DOCUMENT_NOT_FOUND", "Document not found.")

    val_record = db.query(DocumentValidation).filter_by(document_id=doc.id).order_by(DocumentValidation.created_at.desc()).first()
    if not val_record:
        return {
            "document_id": doc.id,
            "is_valid": doc.status == "valid",
            "status": doc.status.upper(),
            "checks": []
        }

    # Also fetch latest photo compliance result if present
    photo_rec = db.query(PhotoComplianceResult).filter_by(document_id=doc.id).order_by(PhotoComplianceResult.created_at.desc()).first()
    photo_compliance = None
    if photo_rec:
        photo_compliance = {
            "status": photo_rec.status,
            "score": photo_rec.score,
            "checks": photo_rec.checks_json.get("checks", []),
            "requires_new_photo": photo_rec.status == "FAIL"
        }

    return {
        "document_id": doc.id,
        "is_valid": val_record.is_valid,
        "status": val_record.status,
        "checks": val_record.checks_json.get("checks", []),
        "photo_compliance": photo_compliance
    }

@router.get("/applications/{application_id}/documents")
def application_docs(application_id: str, db: Session = Depends(get_db)):
    application(db, application_id)
    rows = db.query(ApplicationDocument, DocumentRequirement).join(
        DocumentRequirement, ApplicationDocument.document_requirement_id == DocumentRequirement.id
    ).filter(ApplicationDocument.application_id == application_id).all()

    res = []
    for d, r in rows:
        doc = db.get(Document, d.document_id) if d.document_id else None
        
        # Load validation checks & prep stats if present
        checks = []
        val_status = d.validation_status
        prep_status = d.preparation_status
        orig_size = doc.original_size if doc else None
        orig_dim = f"{doc.width}x{doc.height}" if (doc and doc.width) else None
        prep_size = None
        prep_dim = None

        photo_compliance = None
        if doc:
            val_rec = db.query(DocumentValidation).filter_by(document_id=doc.id).order_by(DocumentValidation.created_at.desc()).first()
            if val_rec:
                checks = val_rec.checks_json.get("checks", [])
                val_status = val_rec.status.lower()
            photo_rec = db.query(PhotoComplianceResult).filter_by(document_id=doc.id).order_by(PhotoComplianceResult.created_at.desc()).first()
            if photo_rec:
                photo_compliance = {
                    "status": photo_rec.status,
                    "score": photo_rec.score,
                    "checks": photo_rec.checks_json.get("checks", []),
                    "requires_new_photo": photo_rec.status == "FAIL"
                }

            prep_rec = db.query(DocumentPreparation).filter_by(document_id=doc.id).order_by(DocumentPreparation.created_at.desc()).first()
            if prep_rec:
                prep_size = prep_rec.prepared_size
                prep_dim = f"{prep_rec.prepared_width}x{prep_rec.prepared_height}" if prep_rec.prepared_width else None
                orig_size = prep_rec.original_size
                orig_dim = f"{prep_rec.original_width}x{prep_rec.original_height}" if prep_rec.original_width else orig_dim

        is_compressed = bool(prep_size and orig_size and (prep_size < orig_size or prep_status == "prepared"))
        ratio = round((1 - (prep_size / orig_size)) * 100, 1) if (is_compressed and prep_size and orig_size and orig_size > 0) else 0.0
        
        comp_status = "COMPRESSED_AND_COMPLIANT" if is_compressed else (
            "COMPLIANT_NO_COMPRESSION" if val_status == "valid" else (
                "NEEDS_COMPRESSION" if prep_status == "preparable" else "UNCOMPRESSED"
            )
        )

        res.append({
            "id": d.id,
            "document_id": d.document_id,
            "document_requirement_id": r.id,
            "document_type": r.document_type,
            "label": r.label,
            "required": r.required,
            "allowed_formats": r.allowed_formats,
            "max_size_kb": r.max_size_kb,
            "required_width": r.required_width,
            "required_height": r.required_height,
            "status": d.status,
            "validation_status": val_status,
            "preparation_status": prep_status,
            "original_filename": doc.original_filename if doc else None,
            "original_size": orig_size,
            "prepared_size": prep_size,
            "original_dimensions": orig_dim,
            "prepared_dimensions": prep_dim,
            "file_url": f"/api/documents/{d.document_id}/file" if d.document_id else None,
            "checks": checks,
            "photo_compliance": photo_compliance,
            "photo_rules": r.photo_rules if r.photo_rules else {},
            "is_compressed": is_compressed,
            "compression_ratio": ratio,
            "compression_status": comp_status,
            "acknowledged": getattr(d, "compression_acknowledged", False)
        })

    return res

@router.post("/applications/{application_id}/documents/link")
def link_document(application_id: str, payload: LinkDocumentRequest, db: Session = Depends(get_db)):
    application(db, application_id)
    return {"linked": False, "message": "Document linking is reserved for generated demo files in this phase."}

@router.get("/applications/{application_id}/validation")
def validation(application_id: str, db: Session = Depends(get_db)):
    a = application(db, application_id)
    unresolved = [c.field_key for c in a.conflicts if c.status == "unresolved"]
    
    # Document readiness check
    docs = db.query(ApplicationDocument, DocumentRequirement).join(
        DocumentRequirement, ApplicationDocument.document_requirement_id == DocumentRequirement.id
    ).filter(ApplicationDocument.application_id == a.id).all()

    invalid_docs = [r.label for d, r in docs if r.required and d.status not in {"valid", "READY"} and d.validation_status not in {"valid", "READY"}]

    is_valid = (len(unresolved) == 0) and (len(invalid_docs) == 0)

    return {
        "application_id": a.id,
        "progress": recalc(db, a),
        "valid": is_valid,
        "unresolved_conflicts": unresolved,
        "invalid_documents": invalid_docs
    }

@router.post("/applications/{application_id}/declaration")
def declaration(application_id: str, payload: DeclarationRequest, db: Session = Depends(get_db)):
    a = application(db, application_id)
    a.declaration.accepted = payload.accepted
    a.declaration.accepted_at = datetime.utcnow() if payload.accepted else None
    db.commit()
    recalc(db, a)
    return {"accepted": a.declaration.accepted}

@router.post("/applications/{application_id}/complete-demo")
def complete(application_id: str, db: Session = Depends(get_db)):
    a = application(db, application_id)
    if any(c.status == "unresolved" for c in a.conflicts):
        fail("CONFLICT_UNRESOLVED", "This field requires your review before continuing.", 409)

    # Document check
    docs = db.query(ApplicationDocument, DocumentRequirement).join(
        DocumentRequirement, ApplicationDocument.document_requirement_id == DocumentRequirement.id
    ).filter(ApplicationDocument.application_id == a.id).all()

    missing_required_docs = [r.label for d, r in docs if r.required and d.status not in {"valid", "READY"} and d.validation_status not in {"valid", "READY"}]
    if missing_required_docs:
        fail("DOCUMENT_INVALID", f"The following required documents need preparation or validation: {', '.join(missing_required_docs)}", 409)

    if not a.declaration or not a.declaration.accepted:
        fail("DECLARATION_REQUIRED", "Accept the demo declaration before completing.", 409)

    a.status = "ready"
    a.progress = 100
    db.commit()
    return {"status": "ready", "message": "Application Ready", "external_submission": False}

# ==============================================================================
# MANUAL APPLICATION TEST MODE ENDPOINTS
# ==============================================================================

@router.post("/test-applications", response_model=TestApplicationCreateOut)
def create_test_application(payload: Optional[TestApplicationCreateRequest] = None, db: Session = Depends(get_db)):
    sess_id = payload.session_id if payload else None
    test_app = TestApplication(session_id=sess_id, status="created")
    db.add(test_app)
    db.commit()
    db.refresh(test_app)
    return {
        "id": test_app.id,
        "status": test_app.status,
        "created_at": test_app.created_at.isoformat()
    }

@router.post("/test-applications/{test_id}/upload-form", response_model=TestApplicationUploadOut)
async def upload_form_for_test_application(
    test_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    test_app = db.get(TestApplication, test_id)
    if not test_app:
        fail("TEST_APP_NOT_FOUND", "Test application was not found.")

    content = await file.read()
    if not content or len(content) == 0:
        fail("EMPTY_FILE", "Uploaded file is empty.", 400)

    filename = file.filename or "uploaded_form.pdf"
    mime_type = file.content_type or "application/pdf"
    
    storage_dir = getattr(settings, "storage_dir", "./storage")
    storage = DocumentStorage(storage_dir)
    storage_key = storage.save(filename, content)
    saved_path = str(Path(storage_dir) / storage_key)

    # Analyze form file offline
    analysis_data = FormAnalysisService.analyze_form_file(content, filename, mime_type)

    test_app.original_filename = filename
    test_app.storage_path = saved_path
    test_app.mime_type = mime_type
    test_app.title = analysis_data["title"]
    test_app.status = "analyzed"

    # Save or update analysis record
    existing_analysis = db.query(TestApplicationAnalysis).filter_by(test_application_id=test_id).first()
    if existing_analysis:
        existing_analysis.title = analysis_data["title"]
        existing_analysis.sections_json = analysis_data["sections"]
        existing_analysis.documents_json = analysis_data["documents"]
        existing_analysis.photo_rules_json = analysis_data["photo_rules"]
        existing_analysis.declarations_json = analysis_data["declarations"]
        existing_analysis.confidence_summary_json = analysis_data["confidence_summary"]
    else:
        new_analysis = TestApplicationAnalysis(
            test_application_id=test_id,
            title=analysis_data["title"],
            sections_json=analysis_data["sections"],
            documents_json=analysis_data["documents"],
            photo_rules_json=analysis_data["photo_rules"],
            declarations_json=analysis_data["declarations"],
            confidence_summary_json=analysis_data["confidence_summary"]
        )
        db.add(new_analysis)

    db.commit()
    db.refresh(test_app)
    return {
        "id": test_app.id,
        "status": test_app.status,
        "original_filename": filename
    }

@router.get("/test-applications/{test_id}/analysis", response_model=TestApplicationAnalysisOut)
def get_test_application_analysis(test_id: str, db: Session = Depends(get_db)):
    test_app = db.get(TestApplication, test_id)
    if not test_app:
        fail("TEST_APP_NOT_FOUND", "Test application was not found.")

    analysis = db.query(TestApplicationAnalysis).filter_by(test_application_id=test_id).first()
    if not analysis:
        fail("ANALYSIS_NOT_FOUND", "Analysis data has not been generated for this test application.")

    return {
        "id": test_app.id,
        "title": analysis.title,
        "status": test_app.status,
        "sections": analysis.sections_json or [],
        "documents": analysis.documents_json or [],
        "photo_rules": analysis.photo_rules_json or {},
        "declarations": analysis.declarations_json or [],
        "confidence_summary": analysis.confidence_summary_json or {}
    }

@router.post("/test-applications/{test_id}/requirements", response_model=TestApplicationAnalysisOut)
def update_test_application_requirements(
    test_id: str,
    payload: TestApplicationRequirementsUpdateIn,
    db: Session = Depends(get_db)
):
    test_app = db.get(TestApplication, test_id)
    if not test_app:
        fail("TEST_APP_NOT_FOUND", "Test application was not found.")

    analysis = db.query(TestApplicationAnalysis).filter_by(test_application_id=test_id).first()
    if not analysis:
        fail("ANALYSIS_NOT_FOUND", "Analysis data has not been generated for this test application.")

    if payload.title is not None:
        analysis.title = payload.title
        test_app.title = payload.title
    if payload.sections is not None:
        analysis.sections_json = payload.sections
    if payload.documents is not None:
        analysis.documents_json = payload.documents
    if payload.photo_rules is not None:
        analysis.photo_rules_json = payload.photo_rules
    if payload.declarations is not None:
        analysis.declarations_json = payload.declarations

    analysis.reviewed_at = datetime.utcnow()
    test_app.status = "reviewed"
    db.commit()

    return {
        "id": test_app.id,
        "title": analysis.title,
        "status": test_app.status,
        "sections": analysis.sections_json or [],
        "documents": analysis.documents_json or [],
        "photo_rules": analysis.photo_rules_json or {},
        "declarations": analysis.declarations_json or [],
        "confidence_summary": analysis.confidence_summary_json or {}
    }

@router.get("/applications/{application_id}/progress", response_model=ProgressResponse)
def get_progress(application_id: str, db: Session = Depends(get_db)):
    a = application(db, application_id)
    values = db.query(FieldValue).filter_by(application_id=a.id).all()
    docs = db.query(ApplicationDocument, DocumentRequirement).join(
        DocumentRequirement, ApplicationDocument.document_requirement_id == DocumentRequirement.id
    ).filter(ApplicationDocument.application_id == a.id).all()
    conflicts = db.query(Conflict).filter_by(application_id=a.id).all()

    has_unresolved_conflicts = any(c.status == "unresolved" for c in conflicts)
    
    req_status = "COMPLETED"
    prev_status = "COMPLETED"
    import_status = "COMPLETED"

    if has_unresolved_conflicts:
        verify_status = "NEEDS_REVIEW"
    elif any(v.status in {"confirmed", "edited"} for v in values):
        verify_status = "COMPLETED"
    else:
        verify_status = "IN_PROGRESS"

    all_req_docs_valid = len(docs) > 0 and all(d.status in {"valid", "READY"} or d.validation_status in {"valid", "READY"} for d, r in docs if r.required)
    if not docs:
        docs_status = "COMPLETED"
    elif all_req_docs_valid:
        docs_status = "COMPLETED"
    elif any(d.document_id for d, _ in docs):
        docs_status = "IN_PROGRESS"
    else:
        docs_status = "LOCKED"

    form_completed = len(values) > 0 and all((v.value and v.value.strip()) for v in values if getattr(v, "required", True))
    form_status = "COMPLETED" if form_completed else "IN_PROGRESS"

    review_status = "COMPLETED" if (all_req_docs_valid and not has_unresolved_conflicts) else "LOCKED"
    decl_status = "COMPLETED" if (a.declaration and a.declaration.accepted) else ("CURRENT" if review_status == "COMPLETED" else "LOCKED")
    ready_status = "COMPLETED" if a.status == "ready" else ("CURRENT" if decl_status == "COMPLETED" else "LOCKED")

    steps = [
        {"key": "requirements", "label": "Requirements", "status": req_status},
        {"key": "previous", "label": "Previous Application", "status": prev_status},
        {"key": "import", "label": "Smart Import", "status": import_status},
        {"key": "verification", "label": "Verify Information", "status": verify_status},
        {"key": "personal", "label": "Form Details", "status": form_status},
        {"key": "documents", "label": "Documents", "status": docs_status},
        {"key": "review", "label": "Review", "status": review_status},
        {"key": "declaration", "label": "Declaration", "status": decl_status},
        {"key": "ready", "label": "Ready", "status": ready_status}
    ]

    completed_count = sum(1 for s in steps if s["status"] == "COMPLETED")
    pct = round(completed_count / float(len(steps)) * 100)

    curr_key = "requirements"
    for s in steps:
        if s["status"] in {"CURRENT", "IN_PROGRESS", "NEEDS_REVIEW"}:
            curr_key = s["key"]
            break

    return {
        "application_id": a.id,
        "application_mode": a.application_mode or "DEMO",
        "current_step": curr_key,
        "progress_percent": pct,
        "steps": steps
    }


@router.post("/documents/{document_id}/signature-analysis", response_model=SignatureComplianceResponse)
def signature_analysis(document_id: str, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        fail("DOCUMENT_NOT_FOUND", "Document was not found.")

    storage_dir = getattr(settings, "storage_dir", "./storage")
    storage = DocumentStorage(storage_dir)
    try:
        content = storage.get(doc.storage_path)
    except Exception:
        fail("STORAGE_ERROR", "Failed to retrieve document binary content.")

    app_doc = db.query(ApplicationDocument).filter_by(document_id=doc.id).first()
    rules = {}
    if app_doc and app_doc.document_requirement_id:
        req = db.get(DocumentRequirement, app_doc.document_requirement_id)
        if req:
            rules = {
                "allowed_formats": req.allowed_formats,
                "max_size_kb": req.max_size_kb,
                "min_size_kb": req.min_size_kb or 2,
                "required_width": req.required_width or 300,
                "required_height": req.required_height or 100
            }

    result = SignatureComplianceAnalyzer.analyze_signature(
        content,
        rules=rules,
        mime_type=doc.mime_type,
        filename=doc.original_filename
    )

    sig_rec = db.query(SignatureComplianceResult).filter_by(document_id=doc.id).first()
    if not sig_rec:
        sig_rec = SignatureComplianceResult(
            document_id=doc.id,
            status=result["status"],
            score=result["score"],
            checks_json=result["checks"],
            rules_snapshot=result["rules"]
        )
        db.add(sig_rec)
    else:
        sig_rec.status = result["status"]
        sig_rec.score = result["score"]
        sig_rec.checks_json = result["checks"]
        sig_rec.rules_snapshot = result["rules"]

    db.commit()
    return {
        "document_id": doc.id,
        "status": result["status"],
        "score": result["score"],
        "checks": result["checks"],
        "requires_new_signature": result.get("requires_new_signature", False)
    }


@router.post("/test-applications/{test_id}/start", response_model=TestApplicationStartOut)
def start_test_application_workflow(test_id: str, db: Session = Depends(get_db)):
    test_app = db.get(TestApplication, test_id)
    if not test_app:
        fail("TEST_APP_NOT_FOUND", "Test application was not found.")

    analysis = db.query(TestApplicationAnalysis).filter_by(test_application_id=test_id).first()
    if not analysis:
        fail("ANALYSIS_NOT_FOUND", "Analysis data missing. Upload form first.")

    session = None
    if test_app.session_id:
        session = db.get(DemoSession, test_app.session_id)
    if not session:
        session = DemoSession(status="active")
        db.add(session)
        db.flush()
        test_app.session_id = session.id

    type_slug = f"manual-test-{test_app.id[:8]}"
    app_type = db.query(ApplicationType).filter_by(slug=type_slug).first()
    if not app_type:
        app_type = ApplicationType(
            slug=type_slug,
            title=analysis.title,
            organization_name="Manual Test Portal",
            organization_short_name="TEST",
            description="User-uploaded custom application workflow test",
            is_demo=False
        )
        db.add(app_type)
        db.flush()

        for idx, sec in enumerate(analysis.sections_json or []):
            section = ApplicationSection(
                application_type_id=app_type.id,
                slug=sec.get("slug", f"sec_{idx}"),
                title=sec.get("title", f"Section {idx+1}"),
                description=sec.get("description", ""),
                display_order=idx + 1,
                required=sec.get("required", True)
            )
            db.add(section)
            db.flush()

            for f_idx, fld in enumerate(sec.get("fields", [])):
                field = ApplicationField(
                    section_id=section.id,
                    key=fld.get("key", f"field_{f_idx}"),
                    label=fld.get("label", f"Field {f_idx+1}"),
                    field_type=fld.get("field_type", "text"),
                    required=fld.get("required", True),
                    display_order=f_idx + 1
                )
                db.add(field)

        for doc_req in (analysis.documents_json or []):
            d_type = doc_req.get("document_type", "document")
            photo_rules = analysis.photo_rules_json if d_type in {"photograph", "photo"} else {}
            req = DocumentRequirement(
                application_type_id=app_type.id,
                document_type=d_type,
                label=doc_req.get("label", "Supporting Document"),
                required=doc_req.get("required", True),
                allowed_formats=doc_req.get("allowed_formats", ["pdf", "jpg", "png"]),
                max_size_kb=doc_req.get("max_size_kb", 500),
                min_size_kb=doc_req.get("min_size_kb", 10),
                required_width=doc_req.get("required_width"),
                required_height=doc_req.get("required_height"),
                photo_rules=photo_rules,
                description=doc_req.get("description", "")
            )
            db.add(req)

        db.flush()

    # Create dynamic Application instance in MANUAL_TEST mode
    app_inst = Application(
        session_id=session.id,
        application_type_id=app_type.id,
        application_mode="MANUAL_TEST",
        status="draft",
        progress=10
    )
    db.add(app_inst)
    db.flush()

    # Seed previous application schema matching the detected fields using extracted PDF values (NO Golden Path demo names/locations)
    all_fields = db.query(ApplicationField).join(ApplicationSection).filter(
        ApplicationSection.application_type_id == app_type.id
    ).all()

    analyzed_fields_map = {}
    for sec in (analysis.sections_json or []):
        for fld in sec.get("fields", []):
            analyzed_fields_map[fld.get("key")] = fld

    # Delete any stale synthetic demo previous applications for this session so uploaded PDF data takes precedence
    stale_prevs = db.query(PreviousApplication).filter_by(session_id=session.id).all()
    for sp in stale_prevs:
        db.delete(sp)
    db.flush()

    previous = PreviousApplication(
        session_id=session.id,
        application_type_id=app_type.id,
        title="Uploaded Form Extracted Data",
        application_year=2026,
        status="completed"
    )
    db.add(previous)
    db.flush()

    for fld in all_fields:
        analyzed_spec = analyzed_fields_map.get(fld.key, {})
        extracted_val = analyzed_spec.get("value", "")
        db.add(PreviousApplicationField(
            previous_application_id=previous.id,
            field_key=fld.key,
            label=fld.label,
            value=extracted_val,
            last_verified=datetime.utcnow()
        ))

    # Initialize FieldValues for this test application based on analyzed form structure
    for fld in all_fields:
        analyzed_spec = analyzed_fields_map.get(fld.key, {})
        extracted_val = analyzed_spec.get("value", "")
        extracted_src = analyzed_spec.get("source", "uploaded_pdf") if extracted_val else "uploaded_form"

        fv = FieldValue(
            application_id=app_inst.id,
            field_id=fld.id,
            value=extracted_val,
            source=extracted_src,
            status="confirmed" if extracted_val else "available"
        )
        db.add(fv)

    # Initialize ApplicationDocuments
    all_reqs = db.query(DocumentRequirement).filter_by(application_type_id=app_type.id).all()
    for req in all_reqs:
        ad = ApplicationDocument(
            application_id=app_inst.id,
            document_requirement_id=req.id,
            status="missing",
            validation_status="pending",
            preparation_status="not_required" if req.document_type not in {"photograph", "photo"} else "pending"
        )
        db.add(ad)

    decl = Declaration(application_id=app_inst.id, accepted=False)
    db.add(decl)

    test_app.generated_application_id = app_inst.id
    test_app.status = "active"
    db.commit()

    return {
        "id": test_app.id,
        "application_id": app_inst.id,
        "status": "active"
    }


@router.post("/test-applications/{test_id}/reset")
def reset_test_application(test_id: str, db: Session = Depends(get_db)):
    test_app = db.get(TestApplication, test_id)
    if not test_app:
        fail("TEST_APP_NOT_FOUND", "Test application was not found.")

    if test_app.generated_application_id:
        app_inst = db.get(Application, test_app.generated_application_id)
        if app_inst:
            for fv in app_inst.field_values:
                fv.value = ""
                fv.status = "available"
                fv.source = "uploaded_form"
            for ad in app_inst.documents:
                ad.status = "missing"
                ad.validation_status = "pending"
                ad.document_id = None
            for c in app_inst.conflicts:
                c.status = "unresolved"
                c.resolution = None
                c.resolved_value = None
            if app_inst.declaration:
                app_inst.declaration.accepted = False
            app_inst.status = "draft"
            app_inst.progress = 10

    db.commit()
    return {"status": "reset", "id": test_id}


@router.delete("/test-applications/{test_id}")
def delete_test_application(test_id: str, db: Session = Depends(get_db)):
    test_app = db.get(TestApplication, test_id)
    if not test_app:
        fail("TEST_APP_NOT_FOUND", "Test application was not found.")

    if test_app.storage_path and os.path.exists(test_app.storage_path):
        try:
            os.remove(test_app.storage_path)
        except Exception:
            pass

    if test_app.generated_application_id:
        app_inst = db.get(Application, test_app.generated_application_id)
        if app_inst:
            db.delete(app_inst)

    db.delete(test_app)
    db.commit()
    return {"status": "deleted", "id": test_id}

