from typing import Any, Dict, Optional
from app.services.photo_analyzer import PhotoComplianceAnalyzer
from app.services.signature_analyzer import SignatureComplianceAnalyzer
from app.services.validator import DocumentValidator


class DocumentComplianceAnalyzer:
    """
    Unified entrypoint for document compliance analysis.
    Dispatches to specialized analyzers (Photo, Signature, Generic) based on document_type.
    """

    @staticmethod
    def analyze_document(
        document_type: str,
        content: bytes,
        rules: Optional[Dict[str, Any]] = None,
        mime_type: Optional[str] = None,
        filename: Optional[str] = None
    ) -> Dict[str, Any]:
        norm_type = (document_type or "other").lower().strip()

        if norm_type in {"photo", "photograph", "passport_photo"}:
            result = PhotoComplianceAnalyzer.analyze_photo(content, rules=rules)
            result["document_type"] = "PHOTO"
            return result

        if norm_type in {"signature", "applicant_signature"}:
            return SignatureComplianceAnalyzer.analyze_signature(
                content,
                rules=rules,
                mime_type=mime_type,
                filename=filename
            )

        # Generic Document Validation (Certificates, Marksheets, ID Proofs)
        val_result = DocumentValidator.validate(
            content=content,
            filename=filename or "document.pdf",
            mime_type=mime_type or "application/pdf",
            allowed_formats=rules.get("allowed_formats", ["pdf", "jpg", "jpeg", "png"]) if rules else ["pdf", "jpg", "jpeg", "png"],
            max_size_kb=rules.get("max_size_kb", 1024) if rules else 1024,
            min_size_kb=rules.get("min_size_kb") if rules else None,
            required_width=rules.get("required_width") if rules else None,
            required_height=rules.get("required_height") if rules else None,
            max_pages=rules.get("max_pages") if rules else None
        )

        checks = val_result.get("checks", [])
        is_valid = val_result.get("is_valid", False)

        return {
            "document_type": norm_type.upper(),
            "status": "PASS" if is_valid else "FAIL",
            "score": 100 if is_valid else 0,
            "requires_new_document": not is_valid,
            "checks": [
                {
                    "name": c["name"],
                    "status": "PASS" if c["passed"] else "FAIL",
                    "message": c.get("message", f"Check {c['name']}")
                }
                for c in checks
            ],
            "rules": rules or {}
        }
