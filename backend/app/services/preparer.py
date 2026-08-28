import io
from PIL import Image
from typing import Any, Dict, Optional, Tuple
from app.models.models import DocumentRequirement
from app.services.validator import DocumentValidator

class DocumentPreparationService:
    @staticmethod
    def prepare_image(
        original_content: bytes,
        filename: str,
        requirement: DocumentRequirement
    ) -> Dict[str, Any]:
        """Automatically prepares, crops, resizes, and compresses an image document."""
        fmt, mime = DocumentValidator.inspect_magic(original_content)
        
        if fmt not in {"jpg", "jpeg", "png", "webp"}:
            return {
                "success": False,
                "status": "UNSUPPORTED",
                "message": f"Automatic preparation is not supported for {fmt.upper()} files."
            }

        try:
            with Image.open(io.BytesIO(original_content)) as img:
                orig_w, orig_h = img.size
                
                # Convert to RGB for JPEG output
                target_format = "JPEG"
                target_mime = "image/jpeg"

                work_img = img.convert("RGB")

                req_w = requirement.required_width
                req_h = requirement.required_height

                # Step 1: Aspect Ratio Crop & Resize if dimensions required
                if req_w is not None and req_h is not None:
                    target_aspect = req_w / req_h
                    current_aspect = orig_w / orig_h

                    if current_aspect > target_aspect:
                        # Too wide -> Crop left & right
                        new_w = int(orig_h * target_aspect)
                        crop_x = (orig_w - new_w) // 2
                        crop_box = (crop_x, 0, crop_x + new_w, orig_h)
                    else:
                        # Too tall -> Crop top & bottom
                        new_h = int(orig_w / target_aspect)
                        crop_y = (orig_h - new_h) // 2
                        crop_box = (0, crop_y, orig_w, crop_y + new_h)

                    cropped_img = work_img.crop(crop_box)
                    work_img = cropped_img.resize((req_w, req_h), Image.Resampling.LANCZOS)

                prep_w, prep_h = work_img.size

                # Step 2: Progressive JPEG Compression Quality Reduction
                max_kb = requirement.max_size_kb
                min_kb = requirement.min_size_kb or 0
                chosen_quality = 90
                final_bytes: Optional[bytes] = None

                quality_steps = [95, 90, 80, 70, 60, 50, 40, 30]

                # First try quality reduction to satisfy max_kb & min_kb
                for q in quality_steps:
                    buf = io.BytesIO()
                    work_img.save(buf, format=target_format, quality=q, optimize=True)
                    out_bytes = buf.getvalue()
                    out_kb = len(out_bytes) / 1024

                    if out_kb <= max_kb and out_kb >= min_kb:
                        chosen_quality = q
                        final_bytes = out_bytes
                        break

                # If out_kb <= max_kb but < min_kb, pick highest quality step <= max_kb
                if final_bytes is None:
                    for q in quality_steps:
                        buf = io.BytesIO()
                        work_img.save(buf, format=target_format, quality=q, optimize=True)
                        out_bytes = buf.getvalue()
                        out_kb = len(out_bytes) / 1024

                        if out_kb <= max_kb:
                            chosen_quality = q
                            final_bytes = out_bytes
                            break

                # If still larger than max_kb at quality 30, scale down iteratively if allowed
                if final_bytes is None:
                    scaling_img = work_img
                    for scale_factor in [0.9, 0.8, 0.7, 0.6, 0.5]:
                        sw = max(50, int(prep_w * scale_factor))
                        sh = max(50, int(prep_h * scale_factor))
                        scaled = scaling_img.resize((sw, sh), Image.Resampling.LANCZOS)
                        
                        for q in quality_steps:
                            buf = io.BytesIO()
                            scaled.save(buf, format=target_format, quality=q, optimize=True)
                            out_bytes = buf.getvalue()
                            out_kb = len(out_bytes) / 1024

                            if out_kb <= max_kb:
                                chosen_quality = q
                                final_bytes = out_bytes
                                prep_w, prep_h = sw, sh
                                break
                        if final_bytes is not None:
                            break

                # Fallback if extremely strict limit
                if final_bytes is None:
                    buf = io.BytesIO()
                    work_img.save(buf, format=target_format, quality=30, optimize=True)
                    final_bytes = buf.getvalue()
                    chosen_quality = 30

                # Step 3: Handle min_size_kb requirement via standard JPEG Comment marker padding
                if min_kb > 0 and len(final_bytes) < min_kb * 1024:
                    padding_needed = int(min_kb * 1024 - len(final_bytes)) + 512
                    if final_bytes.endswith(b"\xff\xd9"):
                        comment_header = b"\xff\xfe" + (padding_needed + 2).to_bytes(2, "big") + (b"\x00" * padding_needed)
                        final_bytes = final_bytes[:-2] + comment_header + b"\xff\xd9"

                # Re-validate prepared result
                val_result = DocumentValidator.validate_file(
                    final_bytes,
                    f"prepared_{filename}.jpg",
                    requirement
                )

                return {
                    "success": True,
                    "status": "SUCCESS" if val_result["valid"] else "FAILED",
                    "prepared_bytes": final_bytes,
                    "prepared_mime": target_mime,
                    "original_size": len(original_content),
                    "prepared_size": len(final_bytes),
                    "original_width": orig_w,
                    "original_height": orig_h,
                    "prepared_width": prep_w,
                    "prepared_height": prep_h,
                    "quality": chosen_quality,
                    "validation_result": val_result
                }

        except Exception as err:
            return {
                "success": False,
                "status": "FAILED",
                "message": f"Failed during automatic image preparation: {str(err)}"
            }
