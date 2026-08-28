import io
from typing import Any, Dict, List, Optional
import cv2
import numpy as np
from PIL import Image

DEFAULT_SIGNATURE_RULES = {
    "allowed_formats": ["png", "jpg", "jpeg"],
    "max_size_kb": 50,
    "min_size_kb": 2,
    "required_width": 300,
    "required_height": 100,
    "background": "white_or_plain",
    "ink_type": "dark",
    "signature_required": True
}


class SignatureComplianceAnalyzer:
    """
    Offline analyzer that checks uploaded signature images for stroke presence,
    background plainness, ink contrast, positioning, and image quality.
    
    It does NOT perform biometric signature verification or person identification.
    """

    @staticmethod
    def analyze_signature(
        image_bytes: bytes,
        rules: Optional[Dict[str, Any]] = None,
        mime_type: Optional[str] = None,
        filename: Optional[str] = None
    ) -> Dict[str, Any]:
        merged_rules = {**DEFAULT_SIGNATURE_RULES, **(rules or {})}
        checks: List[Dict[str, Any]] = []
        scores: List[int] = []
        has_mandatory_fail = False

        # 1. Format & File Size Checks
        fmt = (mime_type or "").split("/")[-1].lower()
        if not fmt and filename:
            fmt = filename.rsplit(".", 1)[-1].lower() if "." in filename else "png"
        
        allowed_fmts = [f.lower().replace(".", "") for f in merged_rules.get("allowed_formats", ["png", "jpg", "jpeg"])]
        if fmt in allowed_fmts or not fmt:
            checks.append({
                "name": "format",
                "status": "PASS",
                "message": f"Signature format ({fmt.upper() if fmt else 'IMAGE'}) accepted."
            })
            scores.append(100)
        else:
            checks.append({
                "name": "format",
                "status": "FAIL",
                "message": f"Unsupported format '{fmt}'. Allowed formats: {', '.join(allowed_fmts).upper()}."
            })
            scores.append(0)
            has_mandatory_fail = True

        size_kb = len(image_bytes) / 1024.0
        max_kb = merged_rules.get("max_size_kb", 50)
        min_kb = merged_rules.get("min_size_kb", 2)

        if min_kb <= size_kb <= max_kb:
            checks.append({
                "name": "file_size",
                "status": "PASS",
                "message": f"File size ({size_kb:.1f} KB) within acceptable limits ({max_kb} KB max)."
            })
            scores.append(100)
        elif size_kb > max_kb:
            checks.append({
                "name": "file_size",
                "status": "WARNING",
                "message": f"File size ({size_kb:.1f} KB) exceeds target {max_kb} KB."
            })
            scores.append(50)
        else:
            checks.append({
                "name": "file_size",
                "status": "PASS",
                "message": f"File size is {size_kb:.1f} KB."
            })
            scores.append(90)

        # Load image via Pillow & OpenCV
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_np = np.array(pil_img)
            img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape[:2]
        except Exception:
            return {
                "document_type": "SIGNATURE",
                "status": "FAIL",
                "score": 0,
                "requires_new_signature": True,
                "checks": [
                    {
                        "name": "image_decode",
                        "status": "FAIL",
                        "message": "Failed to decode signature image."
                    }
                ],
                "rules": merged_rules
            }

        # 2. Dimension Check
        req_w = merged_rules.get("required_width")
        req_h = merged_rules.get("required_height")
        if req_w and req_h:
            w_diff = abs(w - req_w) / float(req_w)
            h_diff = abs(h - req_h) / float(req_h)
            if w_diff <= 0.2 and h_diff <= 0.2:
                checks.append({
                    "name": "dimensions",
                    "status": "PASS",
                    "message": f"Signature dimensions ({w}x{h}) match requirement ({req_w}x{req_h})."
                })
                scores.append(100)
            else:
                checks.append({
                    "name": "dimensions",
                    "status": "WARNING",
                    "message": f"Signature dimensions are {w}x{h} (target: {req_w}x{req_h})."
                })
                scores.append(70)

        # 3. Background Plainness Check
        # Sample border pixels (top, bottom, left, right edges)
        border_pixels = np.concatenate([
            gray[0, :], gray[-1, :], gray[:, 0], gray[:, -1]
        ])
        border_mean = float(np.mean(border_pixels))
        border_std = float(np.std(border_pixels))

        if border_mean >= 180 and border_std < 35:
            checks.append({
                "name": "background",
                "status": "PASS",
                "message": "Background appears plain and light."
            })
            scores.append(100)
        elif border_mean >= 140:
            checks.append({
                "name": "background",
                "status": "WARNING",
                "message": "Slight background variation detected."
            })
            scores.append(70)
        else:
            checks.append({
                "name": "background",
                "status": "FAIL",
                "message": "Complex or dark background detected."
            })
            scores.append(20)

        # 4. Signature Stroke Detection (Otsu Thresholding)
        # Threshold: dark strokes vs bright background
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Calculate dark stroke pixel ratio
        dark_pixels = cv2.countNonZero(thresh)
        stroke_ratio = dark_pixels / float(w * h)

        if stroke_ratio < 0.003:
            # Completely blank or virtually no strokes
            checks.append({
                "name": "signature_detected",
                "status": "FAIL",
                "message": "No clear signature marks detected."
            })
            scores.append(0)
            has_mandatory_fail = True
        elif stroke_ratio > 0.45:
            # Overly dark / solid block (likely not a signature)
            checks.append({
                "name": "signature_detected",
                "status": "WARNING",
                "message": "Image contains large dark regions; check if signature is clear."
            })
            scores.append(50)
        else:
            checks.append({
                "name": "signature_detected",
                "status": "PASS",
                "message": "Signature-like marks detected."
            })
            scores.append(100)

        # 5. Contrast Check
        if dark_pixels > 0:
            stroke_intensity = float(np.mean(gray[thresh > 0]))
            bg_intensity = float(np.mean(gray[thresh == 0]))
            contrast_diff = bg_intensity - stroke_intensity

            if contrast_diff > 60:
                checks.append({
                    "name": "contrast",
                    "status": "PASS",
                    "message": "Signature has sufficient contrast."
                })
                scores.append(100)
            elif contrast_diff > 30:
                checks.append({
                    "name": "contrast",
                    "status": "WARNING",
                    "message": "Signature contrast is low."
                })
                scores.append(60)
            else:
                checks.append({
                    "name": "contrast",
                    "status": "FAIL",
                    "message": "Signature strokes are difficult to distinguish from background."
                })
                scores.append(20)
        else:
            checks.append({
                "name": "contrast",
                "status": "FAIL",
                "message": "No contrast measurable (blank image)."
            })
            scores.append(0)

        # 6. Positioning & Bounding Box Check
        if dark_pixels > 0 and not has_mandatory_fail:
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                # Merge bounding boxes of all significant contours
                min_x, min_y, max_x, max_y = w, h, 0, 0
                for c in contours:
                    if cv2.contourArea(c) > 5:
                        bx, by, bw, bh = cv2.boundingRect(c)
                        min_x = min(min_x, bx)
                        min_y = min(min_y, by)
                        max_x = max(max_x, bx + bw)
                        max_y = max(max_y, by + bh)

                bbox_w = max(0, max_x - min_x)
                bbox_h = max(0, max_y - min_y)
                bbox_area_ratio = (bbox_w * bbox_h) / float(w * h)

                if bbox_area_ratio < 0.02:
                    checks.append({
                        "name": "position",
                        "status": "WARNING",
                        "message": "Signature occupies a very small area within framing."
                    })
                    scores.append(60)
                elif min_x <= 2 or min_y <= 2 or max_x >= w - 2 or max_y >= h - 2:
                    checks.append({
                        "name": "position",
                        "status": "WARNING",
                        "message": "Signature strokes touch image edges."
                    })
                    scores.append(70)
                else:
                    checks.append({
                        "name": "position",
                        "status": "PASS",
                        "message": "Signature is positioned within acceptable margins."
                    })
                    scores.append(100)

        # Calculate final overall score & status
        final_score = int(round(sum(scores) / float(max(1, len(scores)))))
        
        if has_mandatory_fail:
            overall_status = "FAIL"
        elif any(c["status"] == "FAIL" for c in checks):
            overall_status = "FAIL"
        elif any(c["status"] == "WARNING" for c in checks) or final_score < 80:
            overall_status = "WARNING"
        else:
            overall_status = "PASS"

        return {
            "document_type": "SIGNATURE",
            "status": overall_status,
            "score": final_score,
            "requires_new_signature": overall_status in {"FAIL", "REVIEW"},
            "checks": checks,
            "rules": merged_rules
        }
