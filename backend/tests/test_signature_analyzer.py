import io
import pytest
from PIL import Image, ImageDraw
from app.services.signature_analyzer import SignatureComplianceAnalyzer

def create_signature_image(has_strokes: bool = True, bg_color: tuple = (255, 255, 255), fg_color: tuple = (0, 0, 0)) -> bytes:
    img = Image.new("RGB", (300, 100), color=bg_color)
    draw = ImageDraw.Draw(img)
    if has_strokes:
        # Draw a simulated signature curve
        draw.arc((30, 20, 270, 80), start=0, end=180, fill=fg_color, width=4)
        draw.line((40, 50, 250, 60), fill=fg_color, width=3)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_signature_compliance_valid():
    sig_bytes = create_signature_image(has_strokes=True)
    rules = {"max_size_kb": 100, "min_size_kb": 1, "required_width": 300, "required_height": 100}
    res = SignatureComplianceAnalyzer.analyze_signature(sig_bytes, rules=rules, mime_type="image/png", filename="sig.png")

    assert res["status"] in {"PASS", "WARNING"}
    assert res["score"] >= 70
    assert res["requires_new_signature"] is False
    assert any("Signature-like marks detected" in c["message"] for c in res["checks"])

def test_signature_compliance_blank_image():
    blank_bytes = create_signature_image(has_strokes=False)
    rules = {"max_size_kb": 100, "min_size_kb": 1, "required_width": 300, "required_height": 100}
    res = SignatureComplianceAnalyzer.analyze_signature(blank_bytes, rules=rules, mime_type="image/png", filename="blank_sig.png")

    assert res["status"] == "FAIL"
    assert res["score"] < 70
    assert res["requires_new_signature"] is True
    assert any("No clear signature marks detected" in c["message"] for c in res["checks"])
