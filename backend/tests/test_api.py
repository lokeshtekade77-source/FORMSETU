import os
import io
from PIL import Image
try:
    import pymupdf as fitz
except ImportError:
    import fitz
if os.path.exists("./test_formsetu.db"):
    try:
        os.remove("./test_formsetu.db")
    except Exception:
        pass
os.environ["DATABASE_URL"]="sqlite:///./test_formsetu.db"
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_demo_workflow():
    assert client.get("/api/health").status_code == 200
    session = client.post("/api/sessions").json()
    sid = session["id"]
    appid = session["application"]["id"]
    assert client.get(f"/api/sessions/{sid}").status_code == 200
    
    reqs = client.get(f"/api/applications/{appid}/requirements").json()
    assert len(reqs) == 8

    # Test Previous App Import & Decision
    previous = client.get("/api/previous-applications", params={"session_id": sid}).json()[0]
    assert len(client.get(f"/api/previous-applications/{previous['id']}").json()["fields"]) >= 20
    imp = client.post(f"/api/applications/{appid}/imports", json={"previous_application_id": previous["id"]}).json()
    imported = client.get(f"/api/applications/{appid}/imports").json()[0]["fields"][0]
    assert client.post(f"/api/imports/{imp['id']}/fields/{imported['id']}/decision", json={"decision": "use"}).status_code == 200

    # Conflict Resolution
    conflict = client.get(f"/api/applications/{appid}/conflicts").json()[0]
    assert conflict["previous_value"] == "Nagpur" and conflict["status"] == "unresolved"
    assert client.post(f"/api/conflicts/{conflict['id']}/resolve", json={"resolution": "current"}).status_code == 200

    # Field Update
    field = client.get(f"/api/applications/{appid}/fields").json()[0]
    assert client.post(f"/api/applications/{appid}/fields/{field['id']}/update", json={"value": "Aarav Demo User"}).status_code == 200

    # 1. Document Upload & Preparation for Photo
    photo_req = next(r for r in reqs if r["document_type"] == "photo")
    large_img = Image.new("RGB", (4032, 3024), color="blue")
    buf = io.BytesIO()
    large_img.save(buf, format="JPEG", quality=95)
    
    up_res = client.post(
        f"/api/applications/{appid}/documents/upload",
        files={"file": ("photo.jpg", buf.getvalue(), "image/jpeg")},
        data={"document_requirement_id": photo_req["id"]}
    ).json()
    assert up_res["validation_status"] == "preparable"
    doc_id = up_res["document_id"]

    prep_res = client.post(f"/api/documents/{doc_id}/prepare").json()
    assert prep_res["status"] == "SUCCESS"
    assert prep_res["is_valid"] is True

    # 2. Upload valid documents for remaining required slots
    for r in reqs:
        if r["required"] and r["document_type"] != "photo":
            if "pdf" in r["allowed_formats"]:
                doc = fitz.open()
                page = doc.new_page()
                page.insert_text((50, 50), f"Synthetic {r['label']}")
                pdf_bytes = doc.tobytes()
                doc.close()
                up = client.post(
                    f"/api/applications/{appid}/documents/upload",
                    files={"file": (f"{r['document_type']}.pdf", pdf_bytes, "application/pdf")},
                    data={"document_requirement_id": r["id"]}
                ).json()
                assert up["validation_status"] in {"valid", "ready"}
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

    # Declaration & Completion
    assert client.post(f"/api/applications/{appid}/declaration", json={"accepted": True}).status_code == 200
    complete_res = client.post(f"/api/applications/{appid}/complete-demo").json()
    assert complete_res["status"] == "ready"

    # Reset
    assert client.post(f"/api/sessions/{sid}/reset").status_code == 200


def test_clear_fields_and_reject_decision():
    session = client.post("/api/sessions").json()
    sid = session["id"]
    appid = session["application"]["id"]

    # Verify initial seeded fields exist
    fields = client.get(f"/api/applications/{appid}/fields").json()
    name_field = next(f for f in fields if f["key"] == "full_name")
    assert name_field["value"] == "Chaitanya Demo User"

    # Test reject decision clears seeded demo data
    previous = client.get("/api/previous-applications", params={"session_id": sid}).json()[0]
    imp = client.post(f"/api/applications/{appid}/imports", json={"previous_application_id": previous["id"]}).json()
    imported = client.get(f"/api/applications/{appid}/imports").json()[0]["fields"][0]
    
    res = client.post(f"/api/imports/{imp['id']}/fields/{imported['id']}/decision", json={"decision": "reject"})
    assert res.status_code == 200

    fields_after = client.get(f"/api/applications/{appid}/fields").json()
    target_key = imported["target_field_key"]
    target_field = next(f for f in fields_after if f["key"] == target_key)
    assert target_field["value"] == ""
    assert target_field["status"] == "rejected"

    # Test clear-fields clears all pre-filled values
    clear_res = client.post(f"/api/applications/{appid}/clear-fields")
    assert clear_res.status_code == 200
    assert clear_res.json()["status"] == "cleared"

    cleared_fields = client.get(f"/api/applications/{appid}/fields").json()
    for f in cleared_fields:
        assert f["value"] == ""


def test_auto_fetch_endpoint():
    session = client.post("/api/sessions").json()
    appid = session["application"]["id"]

    res = client.post(f"/api/applications/{appid}/auto-fetch")
    assert res.status_code == 200
    data = res.json()
    assert "import_id" in data
    assert data["status"] == "reviewing"


