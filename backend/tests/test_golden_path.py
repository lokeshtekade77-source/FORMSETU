import os
import io
import pytest
from PIL import Image
try:
    import pymupdf as fitz
except ImportError:
    import fitz

if os.path.exists("./golden_test.db"):
    try:
        os.remove("./golden_test.db")
    except Exception:
        pass
os.environ["DATABASE_URL"] = "sqlite:///./golden_test.db"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_golden_path_23_steps():
    """
    FormSetu Phase 5A Golden Path End-to-End Test (23 Steps)
    Exhaustively tests the judge demonstration workflow from clean demo session to APPLICATION READY.
    """
    # 1. Create demo session
    res = client.post("/api/sessions")
    assert res.status_code == 200
    sess = res.json()
    sid = sess["id"]
    appid = sess["application"]["id"]

    # 2. Load demo application
    res = client.get(f"/api/applications/{appid}")
    assert res.status_code == 200
    assert res.json()["status"] == "draft"

    # 3. View requirements
    res = client.get(f"/api/applications/{appid}/requirements")
    assert res.status_code == 200
    reqs = res.json()
    assert len(reqs) == 8

    # 4. View previous application
    res = client.get("/api/previous-applications", params={"session_id": sid})
    assert res.status_code == 200
    prev_apps = res.json()
    assert len(prev_apps) >= 1
    prev_id = prev_apps[0]["id"]

    # 5. Run Smart Import
    res = client.post(f"/api/applications/{appid}/smart-import", json={"previous_application_id": prev_id})
    assert res.status_code == 200
    smart_data = res.json()
    assert smart_data["total_found"] >= 6
    assert smart_data["automatically_changed_count"] == 0
    import_id = smart_data["import_id"]

    # 6. Review smart matches (Assert zero silent changes)
    res = client.get(f"/api/applications/{appid}/imports")
    assert res.status_code == 200
    import_records = res.json()
    assert len(import_records) >= 1
    imported_fields = import_records[0]["fields"]

    sug_map = {f["source_field_key"]: f for f in imported_fields}

    # 7. Accept exact matches (Full Name, DOB, Father Name, College)
    for key in ["full_name", "dob", "father_name", "college"]:
        f_item = sug_map[key]
        r = client.post(f"/api/imports/{import_id}/fields/{f_item['id']}/decision", json={"decision": "use"})
        assert r.status_code == 200

    # 8. Accept semantic matches (Permanent Address -> Residential Address, Course -> Degree / Course)
    for key in ["permanent_address", "course"]:
        f_item = sug_map[key]
        r = client.post(f"/api/imports/{import_id}/fields/{f_item['id']}/decision", json={"decision": "use"})
        assert r.status_code == 200

    # Reload Test Checkpoint 1 (After Smart Import Decisions)
    res_reload = client.get(f"/api/applications/{appid}/imports")
    assert res_reload.status_code == 200
    assert len(res_reload.json()[0]["fields"]) == len(imported_fields)

    # 9. Trigger district conflict
    res = client.get(f"/api/applications/{appid}/conflicts")
    assert res.status_code == 200
    conflicts = res.json()
    assert len(conflicts) >= 1
    dist_conflict = conflicts[0]
    assert dist_conflict["previous_value"] == "Nagpur"
    assert dist_conflict["current_value"] == "Bhandara"
    assert dist_conflict["status"] == "unresolved"

    # 10. Resolve conflict (Choose current value "Bhandara")
    res = client.post(f"/api/conflicts/{dist_conflict['id']}/resolve", json={"resolution": "current"})
    assert res.status_code == 200
    assert res.json()["resolved_value"] == "Bhandara"

    # Reload Test Checkpoint 2 (After Conflict Resolution)
    res_conf_reload = client.get(f"/api/applications/{appid}/conflicts")
    assert res_conf_reload.json()[0]["status"] == "resolved"

    # 11. Open form & verify field provenance
    res = client.get(f"/api/applications/{appid}/fields")
    assert res.status_code == 200
    fields = res.json()
    full_name_field = next(f for f in fields if f["key"] == "full_name")
    assert full_name_field["source"] == "previous_application"

    # 12. Edit one imported field (Change Aarav Sharma -> Aarav Persisted Name)
    res = client.post(f"/api/applications/{appid}/fields/{full_name_field['id']}/update", json={"value": "Aarav Persisted Name"})
    assert res.status_code == 200
    assert res.json()["value"] == "Aarav Persisted Name"

    # 13 & 14. Save & Reload Application (Verify edited value, import decision, provenance persist)
    res = client.get(f"/api/applications/{appid}/fields")
    reloaded_name = next(f for f in res.json() if f["key"] == "full_name")
    assert reloaded_name["value"] == "Aarav Persisted Name"
    assert reloaded_name["source"] == "previous_application"
    assert reloaded_name["status"] == "edited"

    # 15. Open Documents
    res = client.get(f"/api/applications/{appid}/documents")
    assert res.status_code == 200
    doc_slots = res.json()
    photo_req = next(r for r in reqs if r["document_type"] == "photo")
    photo_slot = next(d for d in doc_slots if d["document_requirement_id"] == photo_req["id"])

    # 16. Upload synthetic oversized JPEG (4032 x 3024, >50 KB)
    large_img = Image.new("RGB", (4032, 3024), color="blue")
    buf = io.BytesIO()
    large_img.save(buf, format="JPEG", quality=95)

    res = client.post(
        f"/api/applications/{appid}/documents/upload",
        files={"file": ("photo.jpg", buf.getvalue(), "image/jpeg")},
        data={"document_requirement_id": photo_req["id"]}
    )
    assert res.status_code == 200
    upload_res = res.json()
    doc_id = upload_res["document_id"]

    # 17. Validate initial upload (FORMAT PASS, SIZE FAIL, DIMENSIONS FAIL -> PREPARABLE)
    assert upload_res["validation_status"] == "preparable"
    checks = upload_res["checks"]
    size_check = next(c for c in checks if c["name"] == "file_size")
    dim_check = next(c for c in checks if c["name"] == "dimensions")
    assert size_check["passed"] is False
    assert dim_check["passed"] is False

    # 18. Prepare Automatically (crop, resize, compress)
    res = client.post(f"/api/documents/{doc_id}/prepare")
    assert res.status_code == 200
    prep_res = res.json()

    # 19. Revalidate (VALID, 200 x 230, <= 50 KB, JPEG)
    assert prep_res["status"] == "SUCCESS"
    assert prep_res["is_valid"] is True
    assert prep_res["prepared_dimensions"] == "200x230"
    assert prep_res["prepared_size"] <= 50 * 1024

    # Upload valid synthetic files for remaining required slots to satisfy completion readiness
    for r in reqs:
        if r["required"] and r["document_type"] != "photo":
            if "pdf" in r["allowed_formats"]:
                doc = fitz.open()
                page = doc.new_page()
                page.insert_text((50, 50), f"Synthetic {r['label']}")
                pdf_bytes = doc.tobytes()
                doc.close()
                client.post(
                    f"/api/applications/{appid}/documents/upload",
                    files={"file": (f"{r['document_type']}.pdf", pdf_bytes, "application/pdf")},
                    data={"document_requirement_id": r["id"]}
                )
            else:
                w = r["required_width"] or 140
                h = r["required_height"] or 60
                img = Image.new("RGB", (w, h), color="navy")
                ibuf = io.BytesIO()
                img.save(ibuf, format="JPEG", quality=90)
                up = client.post(
                    f"/api/applications/{appid}/documents/upload",
                    files={"file": (f"{r['document_type']}.jpg", ibuf.getvalue(), "image/jpeg")},
                    data={"document_requirement_id": r["id"]}
                ).json()
                if up["validation_status"] == "preparable":
                    client.post(f"/api/documents/{up['document_id']}/prepare")

    # Reload Test Checkpoint 3 (After Document Preparation)
    res_docs_reload = client.get(f"/api/applications/{appid}/documents")
    assert res_docs_reload.status_code == 200

    # 20. Review application
    res = client.get(f"/api/applications/{appid}/validation")
    assert res.status_code == 200
    val_res = res.json()
    assert val_res["valid"] is True
    assert len(val_res["unresolved_conflicts"]) == 0

    # Reload Test Checkpoint 4 (Before Declaration)
    res_before_decl = client.get(f"/api/applications/{appid}")
    assert res_before_decl.status_code == 200

    # 21. Declaration (Accept demo declaration)
    res = client.post(f"/api/applications/{appid}/declaration", json={"accepted": True})
    assert res.status_code == 200
    assert res.json()["accepted"] is True

    # 22. Complete Demo
    res = client.post(f"/api/applications/{appid}/complete-demo")
    assert res.status_code == 200

    # 23. Application Ready
    assert res.json()["status"] == "ready"

    # ==================================================
    # RESET TEST
    # ==================================================
    res_reset = client.post(f"/api/sessions/{sid}/reset")
    assert res_reset.status_code == 200
    new_app = res_reset.json()["application"]
    new_appid = new_app["id"]

    assert new_app["status"] == "draft"
    assert new_app["progress"] == 0

    # Verify reset database state
    res_reset_fields = client.get(f"/api/applications/{new_appid}/fields")
    reset_name_field = next(f for f in res_reset_fields.json() if f["key"] == "full_name")
    assert reset_name_field["value"] != "Aarav Persisted Name"
    assert reset_name_field["status"] in {"available", "unconfirmed"}

    res_reset_conflicts = client.get(f"/api/applications/{new_appid}/conflicts")
    assert res_reset_conflicts.json()[0]["status"] == "unresolved"

    res_reset_docs = client.get(f"/api/applications/{new_appid}/documents")
    assert all(d["status"] == "missing" for d in res_reset_docs.json())

def test_document_edge_cases():
    """Verify document validation edge cases."""
    res = client.post("/api/sessions")
    appid = res.json()["application"]["id"]
    reqs = client.get(f"/api/applications/{appid}/requirements").json()
    photo_req = next(r for r in reqs if r["document_type"] == "photo")

    # 1. Invalid file signature (fake JPEG)
    fake_buf = io.BytesIO(b"NOT_A_REAL_IMAGE_HEADER_CONTENT")
    res = client.post(
        f"/api/applications/{appid}/documents/upload",
        files={"file": ("fake.jpg", fake_buf.getvalue(), "image/jpeg")},
        data={"document_requirement_id": photo_req["id"]}
    )
    assert res.status_code == 400
    assert res.json()["detail"]["error"]["code"] == "UNSUPPORTED_FORMAT"

    # 2. Unsupported file type (.exe)
    exe_buf = io.BytesIO(b"MZ_EXECUTABLE_HEADER")
    res = client.post(
        f"/api/applications/{appid}/documents/upload",
        files={"file": ("virus.exe", exe_buf.getvalue(), "application/octet-stream")},
        data={"document_requirement_id": photo_req["id"]}
    )
    assert res.status_code == 400
    assert res.json()["detail"]["error"]["code"] == "UNSUPPORTED_FORMAT"

    # 3. Path traversal filename
    img = Image.new("RGB", (200, 230), color="green")
    ibuf = io.BytesIO()
    img.save(ibuf, format="JPEG")
    res = client.post(
        f"/api/applications/{appid}/documents/upload",
        files={"file": ("../../etc/passwd", ibuf.getvalue(), "image/jpeg")},
        data={"document_requirement_id": photo_req["id"]}
    )
    assert res.status_code == 200
    # Verified filename is sanitized
    assert ".." not in res.json()["name"]
