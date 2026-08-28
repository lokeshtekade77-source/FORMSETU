import io
import os
from pathlib import Path
from typing import Any, Dict, Tuple, List, Optional
from PIL import Image, UnidentifiedImageError
try:
    import pymupdf as fitz
except ImportError:
    import fitz
from app.models.models import DocumentRequirement

ALLOWED_UPLOAD_MAX_BYTES = 20 * 1024 * 1024  # 20 MB safety ceiling

class DocumentValidator:
    @staticmethod
    def inspect_magic(content: bytes) -> Tuple[str, str]:
        """Detect actual file format and MIME type from magic byte signature."""
        if content.startswith(b"\xff\xd8\xff"):
            return "jpg", "image/jpeg"
        elif content.startswith(b"\x89PNG\r\n\x1a\n"):
            return "png", "image/png"
        elif content.startswith(b"RIFF") and len(content) >= 12 and content[8:12] == b"WEBP":
            return "webp", "image/webp"
        elif content.startswith(b"%PDF-"):
            return "pdf", "application/pdf"
        return "unknown", "application/octet-stream"

    @staticmethod
    def validate_file(
        content: bytes,
        filename: str,
        requirement: DocumentRequirement
    ) -> Dict[str, Any]:
        """Comprehensive content validation against document requirement."""
        # Security: filename path traversal prevention
        safe_filename = Path(filename).name
        if len(safe_filename) == 0:
            safe_filename = "upload.bin"

        size_bytes = len(content)
        size_kb = round(size_bytes / 1024, 2)
        
        detected_fmt, detected_mime = DocumentValidator.inspect_magic(content)

        checks: List[Dict[str, Any]] = []
        is_valid = True
        preparable = False

        # 1. Upload Size Ceiling Check
        if size_bytes > ALLOWED_UPLOAD_MAX_BYTES:
            checks.append({
                "name": "upload_ceiling",
                "passed": False,
                "actual": f"{size_kb} KB",
                "required_max": "20480 KB",
                "message": "File exceeds maximum upload safety limit (20 MB)."
            })
            return {
                "valid": False,
                "status": "INVALID",
                "detected_format": detected_fmt,
                "detected_mime": detected_mime,
                "size_bytes": size_bytes,
                "size_kb": size_kb,
                "width": None,
                "height": None,
                "pages": None,
                "checks": checks
            }

        # 2. Format Check
        allowed_fmts = [f.lower() for f in (requirement.allowed_formats or [])]
        # Normalize jpg/jpeg equivalence
        normal_detected_fmt = "jpg" if detected_fmt in {"jpg", "jpeg"} else detected_fmt
        normal_allowed_fmts = ["jpg" if f in {"jpg", "jpeg"} else f for f in allowed_fmts]

        format_passed = normal_detected_fmt in normal_allowed_fmts
        image_convertible = detected_fmt in {"jpg", "jpeg", "png", "webp"} and any(f in {"jpg", "jpeg", "png", "webp"} for f in normal_allowed_fmts)

        checks.append({
            "name": "format",
            "passed": format_passed,
            "actual": detected_fmt.upper(),
            "required": [f.upper() for f in allowed_fmts],
            "message": f"Format is {detected_fmt.upper()} (Allowed: {', '.join([f.upper() for f in allowed_fmts])})"
            if format_passed
            else f"Format {detected_fmt.upper()} will be converted to JPEG during preparation"
            if image_convertible
            else f"Invalid format: {detected_fmt.upper()} (Required: {', '.join([f.upper() for f in allowed_fmts])})"
        })
        if not format_passed:
            is_valid = False
            if image_convertible:
                preparable = True

        # 3. File Size Check
        max_kb = requirement.max_size_kb
        # Standard 1 MB in binary is 1024 KB. If max_kb is set to 1000 (shorthand for 1 MB), allow up to 1024 KB.
        effective_max_kb = 1024 if max_kb == 1000 else max_kb
        min_kb = requirement.min_size_kb or 0
        size_passed = size_kb <= effective_max_kb and size_kb >= min_kb

        checks.append({
            "name": "file_size",
            "passed": size_passed,
            "actual_kb": size_kb,
            "required_max_kb": effective_max_kb,
            "required_min_kb": min_kb,
            "message": f"File size is {size_kb} KB (Max allowed: {effective_max_kb} KB)"
            if size_passed
            else f"File size {size_kb} KB exceeds maximum allowed ({effective_max_kb} KB)"
        })
        if not size_passed:
            is_valid = False
            if format_passed and detected_fmt in {"jpg", "jpeg", "png", "webp"}:
                preparable = True

        width: int | None = None
        height: int | None = None
        pages: int | None = None

        # 4. Image Dimensions Check (if image format)
        if detected_fmt in {"jpg", "jpeg", "png", "webp"}:
            try:
                with Image.open(io.BytesIO(content)) as img:
                    width, height = img.size
                    req_w = requirement.required_width
                    req_h = requirement.required_height

                    if req_w is not None and req_h is not None:
                        dim_passed = (width == req_w) and (height == req_h)
                        checks.append({
                            "name": "dimensions",
                            "passed": dim_passed,
                            "actual": f"{width}x{height}",
                            "required": f"{req_w}x{req_h}",
                            "message": f"Dimensions match {width}×{height} px"
                            if dim_passed
                            else f"Dimensions {width}×{height} px do not match required {req_w}×{req_h} px"
                        })
                        if not dim_passed:
                            is_valid = False
                            if format_passed:
                                preparable = True

            except UnidentifiedImageError:
                checks.append({
                    "name": "image_integrity",
                    "passed": False,
                    "actual": "corrupt",
                    "required": "valid image",
                    "message": "Image file is corrupt or unreadable."
                })
                is_valid = False
                preparable = False

        # 5. PDF Check (if PDF format)
        elif detected_fmt == "pdf":
            try:
                pdf_doc = fitz.open(stream=content, filetype="pdf")
                pages = pdf_doc.page_count
                pdf_doc.close()

                max_pages = requirement.max_pages or 1
                page_passed = pages <= max_pages
                checks.append({
                    "name": "page_count",
                    "passed": page_passed,
                    "actual": pages,
                    "required_max": max_pages,
                    "message": f"Page count is {pages} (Max allowed: {max_pages})"
                    if page_passed
                    else f"Page count {pages} exceeds maximum allowed ({max_pages})"
                })
                if not page_passed:
                    is_valid = False
            except Exception:
                checks.append({
                    "name": "pdf_readability",
                    "passed": False,
                    "actual": "corrupt",
                    "required": "valid pdf",
                    "message": "PDF document is corrupt or unreadable."
                })
                is_valid = False

        # Overall Status Determination
        status = "VALID" if is_valid else ("PREPARABLE" if preparable else "INVALID")
        if detected_fmt == "unknown":
            status = "UNSUPPORTED"

        return {
            "valid": is_valid,
            "status": status,
            "detected_format": detected_fmt,
            "detected_mime": detected_mime,
            "size_bytes": size_bytes,
            "size_kb": size_kb,
            "width": width,
            "height": height,
            "pages": pages,
            "checks": checks
        }

    @staticmethod
    def validate(
        content: bytes,
        filename: str = "document.pdf",
        mime_type: str = "application/pdf",
        allowed_formats: List[str] = None,
        max_size_kb: int = 1024,
        min_size_kb: Optional[int] = None,
        required_width: Optional[int] = None,
        required_height: Optional[int] = None,
        max_pages: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generic validation helper for DocumentComplianceAnalyzer."""
        req = DocumentRequirement(
            document_type="document",
            label="Document",
            required=True,
            allowed_formats=allowed_formats or ["pdf", "jpg", "jpeg", "png"],
            max_size_kb=max_size_kb,
            min_size_kb=min_size_kb,
            required_width=required_width,
            required_height=required_height,
            max_pages=max_pages,
            description="Generic validation requirement"
        )
        val_res = DocumentValidator.validate_file(content, filename, req)
        val_res["is_valid"] = val_res["valid"]
        return val_res


class FieldValidator:
    """Validator for application form fields (Phone, Email, PIN, DOB, Text)."""

    @staticmethod
    def validate_field(key: str, value: str, field_type: str = "text") -> Dict[str, Any]:
        val_str = (value or "").strip()
        key_lower = (key or "").lower()

        if not val_str:
            return {
                "valid": False,
                "message": "Field is empty. Value is required.",
                "code": "EMPTY_FIELD"
            }

        # Mobile / Phone number check
        if any(k in key_lower for k in ["mobile", "phone", "contact", "cell", "whatsapp"]):
            # Strip spaces, hyphens, parentheses, plus
            digits_only = re.sub(r"[^\d]", "", val_str)
            if len(digits_only) < 10:
                return {
                    "valid": False,
                    "message": f"Invalid phone number: '{val_str}'. Must contain at least 10 digits.",
                    "code": "INVALID_PHONE"
                }
            if len(digits_only) > 15:
                return {
                    "valid": False,
                    "message": f"Invalid phone number: '{val_str}'. Exceeds maximum 15 digits.",
                    "code": "INVALID_PHONE"
                }
            return {
                "valid": True,
                "message": f"✓ Phone number verified ({digits_only[-10:]})",
                "code": "VALID"
            }

        # Email check
        if any(k in key_lower for k in ["email", "e-mail", "mail"]):
            email_pattern = r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
            if not re.match(email_pattern, val_str):
                return {
                    "valid": False,
                    "message": f"Invalid email format: '{val_str}'. Example: user@domain.com",
                    "code": "INVALID_EMAIL"
                }
            return {
                "valid": True,
                "message": "✓ Email address verified",
                "code": "VALID"
            }

        # PIN / Postal code check
        if any(k in key_lower for k in ["pin", "pincode", "postal", "zip"]):
            digits_only = re.sub(r"[^\d]", "", val_str)
            if len(digits_only) != 6:
                return {
                    "valid": False,
                    "message": f"Invalid PIN code: '{val_str}'. Must be exactly 6 digits.",
                    "code": "INVALID_PIN"
                }
            return {
                "valid": True,
                "message": f"✓ PIN code verified ({digits_only})",
                "code": "VALID"
            }

        # Date of birth check
        if any(k in key_lower for k in ["dob", "birth", "date_of_birth"]):
            if len(val_str) < 4 or not any(c.isdigit() for c in val_str):
                return {
                    "valid": False,
                    "message": f"Invalid date of birth: '{val_str}'. Format should be DD/MM/YYYY or DD Mon YYYY.",
                    "code": "INVALID_DOB"
                }
            return {
                "valid": True,
                "message": "✓ Date of birth verified",
                "code": "VALID"
            }

        # Default text check
        if len(val_str) < 1:
            return {
                "valid": False,
                "message": "Value is required.",
                "code": "INVALID_TEXT"
            }

        return {
            "valid": True,
            "message": "✓ Field value verified",
            "code": "VALID"
        }

