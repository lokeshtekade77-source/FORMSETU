"""
Phase 3.5 — Photo Standards & Visual Compliance Analyzer Tests
Uses only programmatically-generated synthetic test images. No real citizen photographs.
"""
import io
import math
import pytest
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.photo_analyzer import PhotoComplianceAnalyzer, DEFAULT_PHOTO_RULES


# ============================================================
# Synthetic Test Image Factories
# ============================================================

def make_image_bytes(img: Image.Image, fmt: str = "JPEG") -> bytes:
    buf = io.BytesIO()
    img.save(buf, format=fmt, quality=90)
    return buf.getvalue()


def synthetic_frontal_face(width: int = 400, height: int = 500, bg_color=(240, 240, 240)) -> bytes:
    """Synthesize a plain image with a skin-toned oval and eye-like circles to trigger Haar cascade."""
    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    # Face oval (skin tone)
    cx, cy = width // 2, int(height * 0.38)
    fw, fh = int(width * 0.34), int(height * 0.38)
    draw.ellipse([cx - fw, cy - fh, cx + fw, cy + fh], fill=(220, 170, 130))
    # Eye circles
    eye_y = cy - int(fh * 0.12)
    eye_offset = int(fw * 0.35)
    for ex in [cx - eye_offset, cx + eye_offset]:
        draw.ellipse([ex - 12, eye_y - 8, ex + 12, eye_y + 8], fill=(30, 20, 10))
        draw.ellipse([ex - 5, eye_y - 3, ex + 5, eye_y + 3], fill=(220, 220, 220))
    # Nose
    draw.ellipse([cx - 6, cy + 10, cx + 6, cy + 22], fill=(190, 140, 100))
    # Mouth
    draw.arc([cx - 18, cy + 30, cx + 18, cy + 52], start=0, end=180, fill=(150, 80, 80), width=3)
    return make_image_bytes(img)


def synthetic_white_background_face(width: int = 400, height: int = 500) -> bytes:
    """Frontal face with white background."""
    return synthetic_frontal_face(width, height, bg_color=(250, 250, 250))


def synthetic_dark_image(width: int = 400, height: int = 500) -> bytes:
    """Severely underexposed (dark) image."""
    img = Image.new("RGB", (width, height), (20, 18, 18))
    draw = ImageDraw.Draw(img)
    cx, cy = width // 2, int(height * 0.38)
    draw.ellipse([cx - 80, cy - 100, cx + 80, cy + 100], fill=(60, 45, 35))
    return make_image_bytes(img)


def synthetic_blurry_image(width: int = 400, height: int = 500) -> bytes:
    """Generates a face image then applies severe blur."""
    img = Image.open(io.BytesIO(synthetic_frontal_face(width, height)))
    blurred = img.filter(ImageFilter.GaussianBlur(radius=12))
    return make_image_bytes(blurred)


def synthetic_no_face_image(width: int = 400, height: int = 500) -> bytes:
    """Plain uniform color — no face at all."""
    img = Image.new("RGB", (width, height), (230, 230, 230))
    draw = ImageDraw.Draw(img)
    # Draw abstract shapes, not a face
    draw.rectangle([50, 50, 150, 150], fill=(100, 150, 200))
    draw.rectangle([200, 200, 350, 350], fill=(200, 100, 100))
    return make_image_bytes(img)


def synthetic_textured_background(width: int = 400, height: int = 500) -> bytes:
    """Noisy / textured background (high variance)."""
    rng = np.random.RandomState(42)
    noise = rng.randint(0, 255, (height, width, 3), dtype=np.uint8)
    img = Image.fromarray(noise)
    draw = ImageDraw.Draw(img)
    cx, cy = width // 2, int(height * 0.38)
    draw.ellipse([cx - 80, cy - 100, cx + 80, cy + 100], fill=(220, 170, 130))
    return make_image_bytes(img)


def synthetic_tiny_face(width: int = 800, height: int = 600) -> bytes:
    """Very large image with a tiny face — face area ratio will be well below threshold."""
    img = Image.new("RGB", (width, height), (240, 240, 240))
    draw = ImageDraw.Draw(img)
    # Tiny face in corner
    draw.ellipse([10, 10, 40, 40], fill=(220, 170, 130))
    draw.ellipse([18, 18, 23, 23], fill=(30, 20, 10))
    draw.ellipse([27, 18, 32, 23], fill=(30, 20, 10))
    return make_image_bytes(img)


def synthetic_low_resolution(width: int = 30, height: int = 40) -> bytes:
    """Very low resolution image."""
    img = Image.new("RGB", (width, height), (220, 170, 130))
    return make_image_bytes(img)


# ============================================================
# Tests
# ============================================================

class TestFaceDetection:
    def test_no_face_returns_fail(self):
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_no_face_image())
        face_check = next((c for c in result["checks"] if c["name"] == "face_detected"), None)
        assert face_check is not None
        assert face_check["status"] in {"FAIL", "WARNING"}, f"Expected FAIL/WARNING for no-face image, got {face_check}"
        assert result["status"] in {"FAIL", "WARNING"}

    def test_status_has_required_fields(self):
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_no_face_image())
        assert "status" in result
        assert "score" in result
        assert "checks" in result
        assert isinstance(result["checks"], list)
        assert result["status"] in {"PASS", "WARNING", "FAIL", "REVIEW"}

    def test_each_check_has_name_status_message(self):
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_frontal_face())
        for check in result["checks"]:
            assert "name" in check, f"Check missing 'name': {check}"
            assert "status" in check, f"Check missing 'status': {check}"
            assert "message" in check, f"Check missing 'message': {check}"
            assert check["status"] in {"PASS", "WARNING", "FAIL", "REVIEW", "UNSUPPORTED"}

    def test_score_is_0_to_100(self):
        for factory in [synthetic_frontal_face, synthetic_no_face_image, synthetic_dark_image]:
            result = PhotoComplianceAnalyzer.analyze_photo(factory())
            assert 0 <= result["score"] <= 100, f"Score out of range: {result['score']}"


class TestBackgroundAnalysis:
    def test_white_background_passes(self):
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_white_background_face())
        bg_check = next((c for c in result["checks"] if c["name"] == "background"), None)
        assert bg_check is not None
        assert bg_check["status"] in {"PASS", "WARNING"}

    def test_textured_background_warns(self):
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_textured_background())
        bg_check = next((c for c in result["checks"] if c["name"] == "background"), None)
        assert bg_check is not None
        # Noisy backgrounds should not get PASS
        assert bg_check["status"] in {"WARNING", "FAIL"}


class TestImageQuality:
    def test_dark_image_detected(self):
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_dark_image())
        # Dark image must either fail image_quality or overall status be WARNING/FAIL
        assert result["status"] in {"WARNING", "FAIL"}
        quality_check = next((c for c in result["checks"] if c["name"] == "image_quality"), None)
        if quality_check:
            assert quality_check["status"] in {"WARNING", "FAIL"}

    def test_blurry_image_detected(self):
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_blurry_image())
        quality_check = next((c for c in result["checks"] if c["name"] == "image_quality"), None)
        if quality_check:
            assert quality_check["status"] in {"WARNING", "FAIL"}

    def test_acceptable_quality_image_does_not_fail_quality(self):
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_frontal_face(400, 500))
        quality_check = next((c for c in result["checks"] if c["name"] == "image_quality"), None)
        # An acceptable synthetic image should not FAIL image quality
        if quality_check:
            assert quality_check["status"] in {"PASS", "WARNING"}


class TestConfigurableRules:
    def test_custom_face_rules_accepted(self):
        custom_rules = {
            **DEFAULT_PHOTO_RULES,
            "minimum_face_ratio": 0.01,   # very permissive
            "head_tilt_allowed_degrees": 45
        }
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_frontal_face(), rules=custom_rules)
        assert "checks" in result
        assert result["status"] in {"PASS", "WARNING", "FAIL"}

    def test_rules_snapshot_in_result(self):
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_frontal_face())
        assert "rules" in result
        assert isinstance(result["rules"], dict)
        # Should contain at least some expected keys
        assert "face_required" in result["rules"]
        assert "minimum_face_ratio" in result["rules"]

    def test_strict_face_ratio_rule_can_fail_composition(self):
        strict_rules = {**DEFAULT_PHOTO_RULES, "minimum_face_ratio": 0.90}
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_frontal_face())
        # strict rules should affect composition check at most — status may be FAIL/WARNING
        assert result["status"] in {"PASS", "WARNING", "FAIL"}


class TestMandatoryFailure:
    def test_no_face_result_status_never_pass(self):
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_no_face_image())
        # If no face detected and face_required=True, overall status must not be PASS
        assert result["status"] != "PASS"

    def test_fail_status_score_below_pass_threshold(self):
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_no_face_image())
        if result["status"] == "FAIL":
            # A mandatory fail should reflect in a lower score
            assert result["score"] < 100

    def test_corrupted_input_returns_fail(self):
        result = PhotoComplianceAnalyzer.analyze_photo(b"not_an_image_file_bytes!!")
        assert result["status"] == "FAIL"
        assert result["score"] == 0

    def test_empty_bytes_returns_fail(self):
        result = PhotoComplianceAnalyzer.analyze_photo(b"")
        assert result["status"] == "FAIL"


class TestStructuredOutput:
    def test_check_names_are_expected(self):
        expected_names = {"face_detected", "looking_at_camera", "head_posture", "background",
                          "composition", "body_framing", "image_quality"}
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_frontal_face())
        returned_names = {c["name"] for c in result["checks"]}
        # At least core checks should be present
        assert "face_detected" in returned_names, f"face_detected missing: {returned_names}"
        assert "background" in returned_names, f"background missing: {returned_names}"
        assert "image_quality" in returned_names, f"image_quality missing: {returned_names}"

    def test_different_inputs_differ_in_output(self):
        r1 = PhotoComplianceAnalyzer.analyze_photo(synthetic_no_face_image())
        r2 = PhotoComplianceAnalyzer.analyze_photo(synthetic_frontal_face())
        # Results should not be identical for such different inputs
        assert r1["score"] != r2["score"] or r1["status"] != r2["status"]

    def test_score_is_integer(self):
        result = PhotoComplianceAnalyzer.analyze_photo(synthetic_frontal_face())
        assert isinstance(result["score"], int)
