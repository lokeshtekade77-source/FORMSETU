from fastapi.testclient import TestClient
from app.main import app
from app.services.seed import seed_session
from app.db.session import SessionLocal

client = TestClient(app)

def test_manual_test_mode_isolation():
    # 1. Ensure Golden Path demo application exists
    db = SessionLocal()
    try:
        sess = seed_session(db)
        demo_app = sess.applications[0]
        demo_app_id = demo_app.id
    finally:
        db.close()

    res = client.get(f"/api/applications/{demo_app_id}")
    assert res.status_code == 200
    demo_app_data = res.json()
    assert demo_app_data["application_mode"] == "DEMO"


    # 2. Create a Manual Test Mode application
    res = client.post("/api/test-applications")
    assert res.status_code == 200
    test_id = res.json()["id"]

    # Upload form with custom labels
    sample_text = "Custom Grant Application 2026\nApplicant Name: \nGrant Amount Requested: \nDistrict: \n"
    from test_manual_application import create_sample_pdf
    pdf_bytes = create_sample_pdf()

    files = {"file": ("grant_form.pdf", pdf_bytes, "application/pdf")}
    res = client.post(f"/api/test-applications/{test_id}/upload-form", files=files)
    assert res.status_code == 200

    # Start test application
    res = client.post(f"/api/test-applications/{test_id}/start")
    assert res.status_code == 200
    test_app_id = res.json()["application_id"]

    # Retrieve test application details
    res = client.get(f"/api/applications/{test_app_id}")
    assert res.status_code == 200
    test_app_data = res.json()

    # CRITICAL ISOLATION ASSERTION:
    assert test_app_data["application_mode"] == "MANUAL_TEST"
    assert test_app_id != demo_app_id

    # Verify fields do NOT leak Golden Path hardcoded values ("Aarav Sharma", "Nagpur")
    res = client.get(f"/api/applications/{test_app_id}/fields")
    assert res.status_code == 200
    fields = res.json()
    for f in fields:
        assert f["value"] != "Aarav Sharma"
        assert f["value"] != "Nagpur"

    # Verify progress endpoint works for test application
    res = client.get(f"/api/applications/{test_app_id}/progress")
    assert res.status_code == 200
    prog = res.json()
    assert prog["application_mode"] == "MANUAL_TEST"
    assert len(prog["steps"]) == 9
