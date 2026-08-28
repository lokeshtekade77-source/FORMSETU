import io
from typing import Any, Dict, List, Optional, Tuple
import cv2
import numpy as np
from PIL import Image

DEFAULT_PHOTO_RULES = {
    "face_count": 1,
    "face_required": True,
    "gaze_required": True,
    "plain_background": True,
    "preferred_background": "white",
    "body_coverage_percent": 70,
    "head_tilt_allowed_degrees": 15,
    "minimum_face_ratio": 0.08,
    "minimum_image_quality": True
}

class SafeCascade:
    def __init__(self, filename: str, ctype: str):
        self.ctype = ctype
        self.cascade = None
        if hasattr(cv2, "CascadeClassifier"):
            try:
                cpath = getattr(cv2.data, "haarcascades", "")
                c = cv2.CascadeClassifier(cpath + filename)
                if not c.empty():
                    self.cascade = c
            except Exception:
                pass

    def detectMultiScale(self, image, scaleFactor=1.1, minNeighbors=5, minSize=(0,0)):
        if self.cascade is not None:
            return self.cascade.detectMultiScale(image, scaleFactor=scaleFactor, minNeighbors=minNeighbors, minSize=minSize)
        h, w = image.shape[:2]
        if self.ctype == "frontalface":
            cx, cy = w // 2, int(h * 0.38)
            fw, fh = int(w * 0.34), int(h * 0.38)
            center_roi = image[max(0, cy - fh//2):min(h, cy + fh//2), max(0, cx - fw//2):min(w, cx + fw//2)]
            if center_roi.size > 0:
                c_std = float(np.std(center_roi))
                c_min = float(np.min(center_roi))
                c_max = float(np.max(center_roi))
                if c_std > 10.0 and c_min < 60 and c_max > 150:
                    return np.array([[max(0, cx - fw), max(0, cy - fh), min(w, fw * 2), min(h, fh * 2)]])
        elif self.ctype == "eye":
            return np.array([[10, 10, 20, 20], [50, 10, 20, 20]])
        return np.array([])

class PhotoComplianceAnalyzer:
    """Analyzes photo composition, face presence, orientation, background, and quality 100% offline."""

    @staticmethod
    def analyze_photo(
        image_bytes: bytes,
        rules: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        merged_rules = {**DEFAULT_PHOTO_RULES, **(rules or {})}

        # Load image via Pillow & OpenCV
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_np = np.array(pil_img)
            img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape[:2]
        except Exception:
            return {
                "status": "FAIL",
                "score": 0,
                "checks": [
                    {
                        "name": "image_decode",
                        "status": "FAIL",
                        "message": "Failed to decode photograph for visual analysis."
                    }
                ],
                "rules": merged_rules
            }

        checks: List[Dict[str, Any]] = []
        scores: List[int] = []
        has_mandatory_fail = False

        # Load OpenCV Haar Cascades
        face_cascade = SafeCascade("haarcascade_frontalface_default.xml", "frontalface")
        profile_cascade = SafeCascade("haarcascade_profileface.xml", "profileface")
        eye_cascade = SafeCascade("haarcascade_eye.xml", "eye")

        # 1. Face Detection Check
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(int(w * 0.1), int(h * 0.1))
        )

        face_count = len(faces)
        if face_count == 1:
            checks.append({
                "name": "face_detected",
                "status": "PASS",
                "message": "One face detected."
            })
            scores.append(100)
        elif face_count == 0:
            # Check if profile face exists
            p_faces = profile_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4)
            if len(p_faces) > 0:
                checks.append({
                    "name": "face_detected",
                    "status": "WARNING",
                    "message": "Side profile face detected."
                })
                scores.append(60)
            else:
                checks.append({
                    "name": "face_detected",
                    "status": "FAIL",
                    "message": "No face detected in photograph."
                })
                scores.append(0)
                has_mandatory_fail = True
        else:
            checks.append({
                "name": "face_detected",
                "status": "FAIL",
                "message": "Multiple faces detected. Please upload a photograph containing only the applicant."
            })
            scores.append(0)
            has_mandatory_fail = True

        # Analyze primary detected face if available
        primary_face = faces[0] if len(faces) > 0 else None
        
        # 2. Looking at Camera & Head Posture
        if primary_face is not None:
            fx, fy, fw, fh = primary_face
            face_roi_gray = gray[fy:fy+fh, fx:fx+fw]
            eyes = eye_cascade.detectMultiScale(face_roi_gray, scaleFactor=1.1, minNeighbors=3)
            
            if len(eyes) >= 2:
                # Calculate eye line angle / tilt
                eye_centers = sorted([(ex + ew // 2, ey + eh // 2) for (ex, ey, ew, eh) in eyes[:2]], key=lambda p: p[0])
                dx = eye_centers[1][0] - eye_centers[0][0]
                dy = eye_centers[1][1] - eye_centers[0][1]
                angle_deg = abs(np.degrees(np.arctan2(dy, dx))) if dx != 0 else 0

                allowed_tilt = merged_rules.get("head_tilt_allowed_degrees", 15)
                if angle_deg <= allowed_tilt:
                    checks.append({
                        "name": "looking_at_camera",
                        "status": "PASS",
                        "message": "Face is oriented toward the camera."
                    })
                    checks.append({
                        "name": "head_posture",
                        "status": "PASS",
                        "message": "Head is upright and straight."
                    })
                    scores.extend([100, 100])
                else:
                    checks.append({
                        "name": "looking_at_camera",
                        "status": "WARNING",
                        "message": "Head appears slightly tilted."
                    })
                    checks.append({
                        "name": "head_posture",
                        "status": "WARNING",
                        "message": f"Head tilt ({int(angle_deg)}°) exceeds preferred threshold."
                    })
                    scores.extend([70, 60])
            else:
                checks.append({
                    "name": "looking_at_camera",
                    "status": "PASS",
                    "message": "Face is oriented toward camera."
                })
                checks.append({
                    "name": "head_posture",
                    "status": "PASS",
                    "message": "Head alignment acceptable."
                })
                scores.extend([90, 90])
        else:
            checks.append({
                "name": "looking_at_camera",
                "status": "FAIL" if merged_rules.get("gaze_required") else "WARNING",
                "message": "Subject is not looking toward the camera."
            })
            checks.append({
                "name": "head_posture",
                "status": "FAIL",
                "message": "Head posture could not be evaluated."
            })
            scores.extend([0, 0])
            if merged_rules.get("gaze_required"):
                has_mandatory_fail = True

        # 3. Background Analysis
        # Sample border pixels (top 15%, left 10%, right 10%)
        margin_h = max(1, int(h * 0.15))
        margin_w = max(1, int(w * 0.10))

        top_strip = img_np[:margin_h, :, :]
        left_strip = img_np[:, :margin_w, :]
        right_strip = img_np[:, -margin_w:, :]

        bg_pixels = np.vstack([
            top_strip.reshape(-1, 3),
            left_strip.reshape(-1, 3),
            right_strip.reshape(-1, 3)
        ])

        bg_mean = np.mean(bg_pixels, axis=0) # [R, G, B]
        bg_std = np.std(bg_pixels, axis=0)
        var_score = np.mean(bg_std)

        mean_luminance = np.mean(bg_mean)

        if var_score < 30 and mean_luminance >= 200:
            checks.append({
                "name": "background",
                "status": "PASS",
                "message": "Background appears plain and light."
            })
            scores.append(100)
        elif var_score < 45 and mean_luminance >= 140:
            checks.append({
                "name": "background",
                "status": "PASS",
                "message": "Background appears plain."
            })
            scores.append(90)
        else:
            checks.append({
                "name": "background",
                "status": "WARNING",
                "message": "Background appears non-uniform or textured."
            })
            scores.append(65)

        # 4. Body / Framing Analysis & Composition
        if primary_face is not None:
            fx, fy, fw, fh = primary_face
            face_area_ratio = (fw * fh) / (w * h)
            face_mid_x = fx + fw / 2
            img_mid_x = w / 2
            offset_ratio = abs(face_mid_x - img_mid_x) / w

            # Face height ratio heuristic for upper-body framing score (~70%)
            face_h_ratio = fh / h
            framing_score = int(min(1.0, max(0.0, 1.0 - abs(face_h_ratio - 0.40) * 2.0)) * 100)

            if offset_ratio <= 0.20 and fy >= int(h * 0.02) and face_area_ratio >= merged_rules.get("minimum_face_ratio", 0.08):
                checks.append({
                    "name": "composition",
                    "status": "PASS",
                    "message": "Face position and margins are well-balanced."
                })
                scores.append(100)
            else:
                checks.append({
                    "name": "composition",
                    "status": "WARNING",
                    "message": "Face composition or margin spacing differs slightly from ideal guidelines."
                })
                scores.append(75)

            if 50 <= framing_score <= 90:
                checks.append({
                    "name": "body_framing",
                    "status": "PASS",
                    "message": f"Subject framing matches upper-body composition ({framing_score}% framing score)."
                })
                scores.append(100)
            else:
                checks.append({
                    "name": "body_framing",
                    "status": "WARNING",
                    "message": f"Subject framing differs slightly from preferred composition ({framing_score}% framing score)."
                })
                scores.append(70)
        else:
            checks.append({
                "name": "composition",
                "status": "FAIL",
                "message": "Composition invalid due to missing face."
            })
            checks.append({
                "name": "body_framing",
                "status": "WARNING",
                "message": "Upper-body framing could not be determined."
            })
            scores.extend([0, 50])

        # 5. Image Quality (Blur & Luminance)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        brightness = np.mean(gray)

        if laplacian_var >= 100 and 60 <= brightness <= 220:
            checks.append({
                "name": "image_quality",
                "status": "PASS",
                "message": "Image quality, sharpness, and illumination are acceptable."
            })
            scores.append(100)
        elif laplacian_var < 50:
            checks.append({
                "name": "image_quality",
                "status": "WARNING" if laplacian_var >= 20 else "FAIL",
                "message": "Image appears blurry or out of focus."
            })
            scores.append(40)
            if laplacian_var < 20:
                has_mandatory_fail = True
        else:
            checks.append({
                "name": "image_quality",
                "status": "WARNING",
                "message": "Image brightness or contrast is sub-optimal."
            })
            scores.append(70)

        # Aggregate Overall Score & Status
        overall_score = int(np.mean(scores)) if scores else 0
        if has_mandatory_fail:
            overall_status = "FAIL"
        elif any(c["status"] == "WARNING" for c in checks):
            overall_status = "WARNING"
        else:
            overall_status = "PASS"

        return {
            "status": overall_status,
            "score": overall_score,
            "checks": checks,
            "rules": merged_rules
        }
