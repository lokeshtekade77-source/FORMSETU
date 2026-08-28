import os
import io
import pytest
from PIL import Image

try:
    import pymupdf as fitz
except ImportError:
    import fitz

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_sample_pdf() -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    text = (
        "Scholarship Application Form 2026\n"
        "Personal Information:\n"
        "Full Name: \n"
        "Date of Birth: \n"
        "Father's Name: \n"
        "Residential Address: \n"
        "District: \n"
        "Mobile Number: \n"
        "College / Institution: \n"
        "Degree / Course: \n"
        "Required Documents:\n"
        "1. Passport Photograph (max 50 KB, 200x230 px)\n"
        "2. Applicant Signature\n"
        "3. Income Certificate\n"
        "4. Qualification Marksheet\n"
        "Declaration:\n"
        "I hereby declare that all information provided is true and correct."
    )
    page.insert_text((50, 50), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def create_sample_image() -> bytes:
    img = Image.new("RGB", (400, 300), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_manual_application_lifecycle():
    # 1. Create Test Session
    res = client.post("/api/test-applications")
    assert res.status_code == 200
    data = res.json()
    test_id = data["id"]
    assert data["status"] == "created"

    # 2. Upload Sample PDF Application Form
    pdf_bytes = create_sample_pdf()
    files = {"file": ("sample_form.pdf", pdf_bytes, "application/pdf")}
    res = client.post(f"/api/test-applications/{test_id}/upload-form", files=files)
    assert res.status_code == 200
    upload_data = res.json()
    assert upload_data["status"] == "analyzed"
    assert upload_data["original_filename"] == "sample_form.pdf"

    # 3. Get Analysis Output
    res = client.get(f"/api/test-applications/{test_id}/analysis")
    assert res.status_code == 200
    analysis = res.json()
    assert "Scholarship Application" in analysis["title"]
    assert len(analysis["sections"]) >= 1
    assert len(analysis["documents"]) >= 2
    assert analysis["photo_rules"]["max_size_kb"] == 50

    # 4. Save Manually Corrected Requirements
    update_payload = {
        "title": "Custom Verified Scholarship Form",
        "photo_rules": {
            "max_size_kb": 60,
            "required_width": 210,
            "required_height": 240,
            "background": "white"
        }
    }
    res = client.post(f"/api/test-applications/{test_id}/requirements", json=update_payload)
    assert res.status_code == 200
    updated = res.json()
    assert updated["title"] == "Custom Verified Scholarship Form"
    assert updated["photo_rules"]["max_size_kb"] == 60

    # 5. Start Dynamic Workflow
    res = client.post(f"/api/test-applications/{test_id}/start")
    assert res.status_code == 200
    started = res.json()
    assert started["status"] == "active"
    app_id = started["application_id"]
    assert len(app_id) > 0

    # Verify Application generated fields
    res = client.get(f"/api/applications/{app_id}/fields")
    assert res.status_code == 200
    fields = res.json()
    assert len(fields) >= 4

    # 6. Delete Test Session
    res = client.delete(f"/api/test-applications/{test_id}")
    assert res.status_code == 200
    assert res.json()["status"] == "deleted"

def test_upload_image_form():
    res = client.post("/api/test-applications")
    test_id = res.json()["id"]

    img_bytes = create_sample_image()
    files = {"file": ("form_scan.jpg", img_bytes, "image/jpeg")}
    res = client.post(f"/api/test-applications/{test_id}/upload-form", files=files)
    assert res.status_code == 200
    assert res.json()["status"] == "analyzed"

    res = client.get(f"/api/test-applications/{test_id}/analysis")
    assert res.status_code == 200
    assert len(res.json()["documents"]) >= 2

def test_invalid_test_id():
    res = client.get("/api/test-applications/non-existent-id/analysis")
    assert res.status_code == 404
