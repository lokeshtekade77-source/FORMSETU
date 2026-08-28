import io
import pytest
from PIL import Image
try:
    import pymupdf as fitz
except ImportError:
    import fitz
from app.models.models import DocumentRequirement
from app.services.validator import DocumentValidator
from app.services.preparer import DocumentPreparationService

@pytest.fixture
def photo_req():
    return DocumentRequirement(
        document_type="photo",
        label="Passport Photograph",
        required=True,
        allowed_formats=["jpg", "jpeg"],
        max_size_kb=50,
        required_width=200,
        required_height=230,
        description="Recent passport photograph"
    )

@pytest.fixture
def pdf_req():
    return DocumentRequirement(
        document_type="degree_certificate",
        label="Degree Certificate",
        required=True,
        allowed_formats=["pdf"],
        max_size_kb=500,
        max_pages=2,
        description="Degree certificate PDF"
    )

def test_magic_bytes_detection():
    # Valid JPEG magic bytes
    jpg_bytes = b"\xff\xd8\xff\xe0" + b"\x00" * 100
    fmt, mime = DocumentValidator.inspect_magic(jpg_bytes)
    assert fmt == "jpg"
    assert mime == "image/jpeg"

    # Fake extension (text file claiming to be JPEG)
    fake_bytes = b"Hello world, I am not a JPEG"
    fmt, mime = DocumentValidator.inspect_magic(fake_bytes)
    assert fmt == "unknown"
    assert mime == "application/octet-stream"

def test_filename_path_traversal_sanitization(photo_req):
    content = b"\xff\xd8\xff\xe0" + b"\x00" * 100
    res = DocumentValidator.validate_file(content, "../../../secret.jpg", photo_req)
    # Validation should run without throwing path traversal errors
    assert res["detected_format"] == "jpg"

def test_upload_ceiling_limit(photo_req):
    # Oversized content > 20MB safety limit
    huge_content = b"\xff\xd8\xff\xe0" + b"\x00" * (21 * 1024 * 1024)
    res = DocumentValidator.validate_file(huge_content, "huge.jpg", photo_req)
    assert res["valid"] is False
    assert res["status"] == "INVALID"
    assert any(c["name"] == "upload_ceiling" and c["passed"] is False for c in res["checks"])

def test_valid_image_validation(photo_req):
    # Create valid 200x230 JPEG under 50KB
    img = Image.new("RGB", (200, 230), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    valid_bytes = buf.getvalue()

    res = DocumentValidator.validate_file(valid_bytes, "valid_photo.jpg", photo_req)
    assert res["valid"] is True
    assert res["status"] == "VALID"
    assert res["width"] == 200
    assert res["height"] == 230

def test_center_crop_mathematical_bounds(photo_req):
    """
    Mathematical verification of center-crop bounds for 4032x3024 -> 200x230:
    1. crop width <= source width (2629 <= 4032)
    2. crop height <= source height (3024 <= 3024)
    3. crop aspect ratio approx equals target aspect ratio (2629 / 3024 approx 200 / 230)
    4. output dimensions exactly equal required dimensions (200x230)
    5. output passes final validation (valid=True, status='VALID')
    """
    orig_w, orig_h = 4032, 3024
    req_w, req_h = photo_req.required_width, photo_req.required_height
    target_aspect = req_w / req_h
    current_aspect = orig_w / orig_h

    # Calculate intermediate crop box mathematically
    new_w = int(orig_h * target_aspect)
    crop_x = (orig_w - new_w) // 2
    crop_box = (crop_x, 0, crop_x + new_w, orig_h)

    # 1. Assert crop width <= source width
    crop_w = crop_box[2] - crop_box[0]
    assert crop_w <= orig_w
    assert crop_w == 2629

    # 2. Assert crop height <= source height
    crop_h = crop_box[3] - crop_box[1]
    assert crop_h <= orig_h
    assert crop_h == 3024

    # 3. Assert crop aspect ratio approx equals target aspect ratio
    crop_aspect = crop_w / crop_h
    assert abs(crop_aspect - target_aspect) < 0.005

    # Run full preparation service
    large_img = Image.new("RGB", (4032, 3024), color="darkblue")
    buf = io.BytesIO()
    large_img.save(buf, format="JPEG", quality=95)
    
    prep_res = DocumentPreparationService.prepare_image(buf.getvalue(), "photo.jpg", photo_req)

    # 4. Assert output dimensions exactly equal required dimensions
    assert prep_res["prepared_width"] == req_w
    assert prep_res["prepared_height"] == req_h

    # 5. Assert output passes final validation
    assert prep_res["validation_result"]["valid"] is True
    assert prep_res["validation_result"]["status"] == "VALID"

def test_critical_oversized_jpeg_preparation_and_validation(photo_req):
    """
    CRITICAL TEST CASE (Step 24):
    Input: Synthetic 4032x3024 JPEG (exceeding 50 KB requirement)
    Requirement: max 50 KB, 200x230 px JPEG
    Expectation: Initial INVALID/PREPARABLE -> Preparation SUCCESS -> Prepared <= 50 KB, 200x230 -> Final VALID
    """
    large_img = Image.new("RGB", (4032, 3024), color="darkblue")
    buf = io.BytesIO()
    large_img.save(buf, format="JPEG", quality=95)
    oversized_bytes = buf.getvalue()

    # Confirm original image is 4032x3024 and exceeds 50 KB
    assert len(oversized_bytes) > 50 * 1024
    assert large_img.size == (4032, 3024)

    # 1. Initial Validation: Should fail size & dimensions checks, status = PREPARABLE
    initial_res = DocumentValidator.validate_file(oversized_bytes, "high_res_photo.jpg", photo_req)
    assert initial_res["valid"] is False
    assert initial_res["status"] == "PREPARABLE"
    assert initial_res["width"] == 4032
    assert initial_res["height"] == 3024

    # 2. Automatic Preparation
    prep_res = DocumentPreparationService.prepare_image(oversized_bytes, "high_res_photo.jpg", photo_req)
    assert prep_res["success"] is True
    assert prep_res["status"] == "SUCCESS"
    assert prep_res["prepared_width"] == 200
    assert prep_res["prepared_height"] == 230
    assert prep_res["prepared_size"] <= 50 * 1024

    # 3. Final Validation of Prepared Output
    final_val = prep_res["validation_result"]
    assert final_val["valid"] is True
    assert final_val["status"] == "VALID"
    assert final_val["width"] == 200
    assert final_val["height"] == 230
    assert final_val["size_kb"] <= 50

def test_pdf_validation(pdf_req):
    # Create synthetic 1-page PDF using PyMuPDF
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 50), "Synthetic Degree Certificate Demo")
    pdf_bytes = doc.tobytes()
    doc.close()

    res = DocumentValidator.validate_file(pdf_bytes, "certificate.pdf", pdf_req)
    assert res["valid"] is True
    assert res["status"] == "VALID"
    assert res["pages"] == 1

def test_pdf_exceeding_pages_validation(pdf_req):
    # Create synthetic 5-page PDF (exceeding max_pages=2)
    doc = fitz.open()
    for i in range(5):
        p = doc.new_page(width=595, height=842)
        p.insert_text((50, 50), f"Page {i+1}")
    multi_page_pdf = doc.tobytes()
    doc.close()

    res = DocumentValidator.validate_file(multi_page_pdf, "multipage.pdf", pdf_req)
    assert res["valid"] is False
    assert res["status"] == "INVALID"
    assert any(c["name"] == "page_count" and c["passed"] is False for c in res["checks"])

def test_compression_ratio_calculation(photo_req):
    large_img = Image.new("RGB", (2000, 2000), color="green")
    buf = io.BytesIO()
    large_img.save(buf, format="JPEG", quality=95)
    orig_bytes = buf.getvalue()
    orig_len = len(orig_bytes)

    prep_res = DocumentPreparationService.prepare_image(orig_bytes, "photo.jpg", photo_req)
    assert prep_res["success"] is True
    prep_len = prep_res["prepared_size"]
    
    assert prep_len < orig_len
    ratio = round((1 - prep_len / orig_len) * 100, 1)
    assert ratio > 0

def test_one_mb_pdf_file_validation():
    # 1 MB = 1024 KB = 1048576 bytes
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 50), "Synthetic 1 MB Document Test")
    pdf_bytes = doc.tobytes()
    # Pad to exactly 1 MB (1,048,576 bytes)
    if len(pdf_bytes) < 1048576:
        padding_needed = 1048576 - len(pdf_bytes)
        pdf_bytes = pdf_bytes + b" " * padding_needed
    doc.close()

    req = DocumentRequirement(
        document_type="education_certificate",
        label="Education Certificate",
        required=True,
        allowed_formats=["pdf"],
        max_size_kb=1024,
        max_pages=5,
        description="Education certificate PDF"
    )

    res = DocumentValidator.validate_file(pdf_bytes, "education_cert_1mb.pdf", req)
    assert res["valid"] is True
    assert res["status"] == "VALID"
    assert res["size_kb"] == 1024.0

