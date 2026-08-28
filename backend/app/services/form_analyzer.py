import io
import re
from typing import Any, Dict, List, Optional, Tuple
from PIL import Image

try:
    import pymupdf as fitz
except ImportError:
    import fitz


class FormAnalysisService:
    """
    Offline analysis engine that inspects uploaded application forms (PDF, JPG, PNG)
    and extracts structured requirement specs (title, sections, fields, documents, photo rules, declarations).
    """

    @staticmethod
    def analyze_form_file(content: bytes, filename: str, mime_type: str) -> Dict[str, Any]:
        text_content = ""
        widget_data: Dict[str, str] = {}
        is_pdf = mime_type == "application/pdf" or filename.lower().endswith(".pdf")

        if is_pdf:
            try:
                doc = fitz.open(stream=content, filetype="pdf")
                pages_text = []
                for page in doc:
                    pages_text.append(page.get_text())
                    # Extract AcroForm widgets if present
                    try:
                        for w in page.widgets():
                            w_name = (w.field_name or "").strip()
                            w_val = (w.field_value or "").strip()
                            if w_name and w_val:
                                widget_data[w_name] = w_val
                    except Exception:
                        pass
                text_content = "\n".join(pages_text)
            except Exception:
                text_content = ""

        # Extract title from text or filename
        title = FormAnalysisService._extract_title(text_content, filename)

        # Detect sections and fields (passing widget_data if available)
        sections, fields_count = FormAnalysisService._extract_sections_and_fields(text_content, widget_data)

        # Detect document requirements
        documents = FormAnalysisService._extract_documents(text_content)

        # Detect photo requirements
        photo_rules = FormAnalysisService._extract_photo_rules(text_content)

        # Detect declarations
        declarations = FormAnalysisService._extract_declarations(text_content)

        # Calculate confidence indicators
        confidence_summary = {
            "title_confidence": "high" if len(title) > 3 else "medium",
            "fields_confidence": "high" if fields_count >= 4 else "medium",
            "documents_confidence": "high" if len(documents) >= 2 else "medium",
            "photo_confidence": "high" if photo_rules.get("max_size_kb") is not None else "medium",
            "declaration_confidence": "high" if len(declarations) >= 1 else "medium",
            "unconfident_notes": [] if fields_count >= 3 else [
                "Some requirement details could not be extracted with 100% certainty. Please review and edit requirements before proceeding."
            ]
        }

        return {
            "title": title,
            "sections": sections,
            "documents": documents,
            "photo_rules": photo_rules,
            "declarations": declarations,
            "confidence_summary": confidence_summary
        }

    @staticmethod
    def _extract_title(text: str, filename: str) -> str:
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:5]:
            if any(kw in line.lower() for kw in ["application", "form", "recruitment", "scholarship", "registration", "scheme", "hcl", "biodata", "resume", "profile"]):
                if len(line) <= 80:
                    return line.title()
        
        # Fallback to cleaned filename
        clean_name = re.sub(r"[_\-]+", " ", filename.rsplit(".", 1)[0]).title()
        if "Application" not in clean_name and "Form" not in clean_name:
            clean_name += " Application Form"
        return clean_name

    @staticmethod
    def _extract_sections_and_fields(text: str, widget_data: Dict[str, str] = None) -> Tuple[List[Dict[str, Any]], int]:
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        
        extracted_map: Dict[str, Dict[str, Any]] = {}

        label_key_map = {
            "application no": ("application_number", "Application Number", "text"),
            "application number": ("application_number", "Application Number", "text"),
            "form no": ("application_number", "Application Number", "text"),
            "form number": ("application_number", "Application Number", "text"),
            "registration no": ("application_number", "Registration Number", "text"),
            "registration number": ("application_number", "Registration Number", "text"),
            "roll number": ("roll_number", "Roll Number", "text"),
            "roll no": ("roll_number", "Roll Number", "text"),
            "reference number": ("application_number", "Reference Number", "text"),
            "ref no": ("application_number", "Reference Number", "text"),
            "candidate id": ("application_number", "Candidate ID", "text"),
            "employee id": ("application_number", "Employee ID", "text"),
            "emp id": ("application_number", "Employee ID", "text"),
            "hcl form id": ("application_number", "HCL Form ID", "text"),
            
            "name": ("full_name", "Applicant Name", "text"),
            "applicant name": ("full_name", "Applicant Name", "text"),
            "candidate name": ("full_name", "Candidate Name", "text"),
            "full name": ("full_name", "Full Name", "text"),
            "name of applicant": ("full_name", "Applicant Name", "text"),
            "name of candidate": ("full_name", "Candidate Name", "text"),
            "first name": ("full_name", "Full Name", "text"),
            
            "father's name": ("father_name", "Father's Name", "text"),
            "father name": ("father_name", "Father's Name", "text"),
            "guardian's name": ("father_name", "Guardian's Name", "text"),
            "mother's name": ("mother_name", "Mother's Name", "text"),
            "mother name": ("mother_name", "Mother's Name", "text"),
            
            "date of birth": ("dob", "Date of Birth", "date"),
            "dob": ("dob", "Date of Birth", "date"),
            "birth date": ("dob", "Date of Birth", "date"),
            "d.o.b": ("dob", "Date of Birth", "date"),
            "d.o.b.": ("dob", "Date of Birth", "date"),
            
            "age": ("age", "Age", "text"),
            "gender": ("gender", "Gender", "select"),
            "sex": ("gender", "Gender", "select"),
            
            "mobile number": ("mobile", "Mobile Number", "text"),
            "mobile": ("mobile", "Mobile Number", "text"),
            "mobile no": ("mobile", "Mobile Number", "text"),
            "phone number": ("mobile", "Mobile Number", "text"),
            "phone no": ("mobile", "Mobile Number", "text"),
            "phone": ("mobile", "Mobile Number", "text"),
            "contact number": ("mobile", "Contact Number", "text"),
            "contact no": ("mobile", "Contact Number", "text"),
            "cell no": ("mobile", "Mobile Number", "text"),
            "whatsapp no": ("mobile", "WhatsApp Number", "text"),
            
            "email id": ("email", "Email ID", "text"),
            "email": ("email", "Email ID", "text"),
            "email address": ("email", "Email ID", "text"),
            "e-mail": ("email", "Email ID", "text"),
            "e-mail id": ("email", "Email ID", "text"),
            
            "country": ("country", "Country", "text"),
            "state": ("state", "State", "text"),
            "district": ("district", "District", "text"),
            "city": ("city", "City", "text"),
            "town": ("city", "City / Town", "text"),
            "address line 1": ("address_line_1", "Address Line 1", "text"),
            "address line 2": ("address_line_2", "Address Line 2", "text"),
            "permanent address": ("permanent_address", "Permanent Address", "text"),
            "correspondence address": ("correspondence_address", "Correspondence Address", "text"),
            "present address": ("correspondence_address", "Present Address", "text"),
            "address": ("permanent_address", "Address", "text"),
            "residential address": ("permanent_address", "Residential Address", "text"),
            "pincode": ("pin", "PIN Code", "text"),
            "pin code": ("pin", "PIN Code", "text"),
            "pin": ("pin", "PIN Code", "text"),
            "postal code": ("pin", "Postal Code", "text"),
            "zip code": ("pin", "ZIP Code", "text"),
            
            "category": ("category", "Category", "text"),
            "caste": ("category", "Category", "text"),
            "social category": ("category", "Category", "text"),
            
            "company": ("company", "Company / Employer", "text"),
            "company name": ("company", "Company Name", "text"),
            "employer": ("company", "Employer Name", "text"),
            "organization": ("company", "Organization", "text"),
            "designation": ("designation", "Designation", "text"),
            "role": ("designation", "Role / Position", "text"),
            "position": ("designation", "Position", "text"),

            "school name": ("school_name", "School Name", "text"),
            "name of board": ("board", "Board / Education Council", "text"),
            "college": ("college", "College / Institution", "text"),
            "name of college/institution": ("college", "College / Institution", "text"),
            "university": ("university", "University", "text"),
            "institution": ("college", "Institution", "text"),
            "degree name": ("qualification", "Degree / Qualification", "text"),
            "degree": ("qualification", "Degree", "text"),
            "qualification": ("qualification", "Qualification", "text"),
            "degree specialization": ("specialization", "Specialization / Major", "text"),
            "specialization": ("specialization", "Specialization", "text"),
            "highest qualification": ("qualification", "Highest Qualification", "text"),
            "what is your highest qualification?": ("qualification", "Highest Qualification", "text"),
            "stream": ("stream", "Academic Stream", "text"),
            "obtained percentage/cgpa": ("percentage", "Obtained Percentage / CGPA", "text"),
            "percentage": ("percentage", "Percentage / Marks", "text"),
            "cgpa": ("percentage", "CGPA", "text"),
            "year of passing": ("passing_year", "Year of Passing", "text"),
            "passing year": ("passing_year", "Year of Passing", "text"),
            
            "experience": ("experience", "Work Experience", "text"),
            "total experience": ("experience", "Total Experience", "text"),
            "work experience": ("experience", "Work Experience", "text"),
            "income": ("income", "Annual Income", "text"),
            "ctc": ("income", "Current CTC", "text")
        }

        # 0. Widget / AcroForm data incorporation first
        if widget_data:
            for w_k, w_v in widget_data.items():
                w_k_clean = w_k.strip().lower()
                matched_key = None
                for l_k, (fk, flabel, ftype) in label_key_map.items():
                    if l_k in w_k_clean:
                        matched_key = (fk, flabel, ftype)
                        break
                if matched_key:
                    fk, flabel, ftype = matched_key
                    extracted_map[fk] = {
                        "key": fk,
                        "label": flabel,
                        "field_type": ftype,
                        "value": w_v,
                        "source": "uploaded_pdf",
                        "required": True
                    }

        # 1. Key: Value line parsing (e.g. "APPLICATION NO: HCLTFP2322840", "Mobile Number: 9876543210", "Full Name = ...")
        for line in lines:
            for sep in [":", "=", " - "]:
                if sep in line:
                    parts = line.split(sep, 1)
                    k_raw = parts[0].strip().lower()
                    v_raw = parts[1].strip()
                    if k_raw in label_key_map:
                        key, label, ftype = label_key_map[k_raw]
                        if key not in extracted_map or not extracted_map[key]["value"]:
                            extracted_map[key] = {
                                "key": key,
                                "label": label,
                                "field_type": ftype,
                                "value": v_raw,
                                "source": "uploaded_pdf" if v_raw else "uploaded_form",
                                "required": True
                            }

        # 2. Alternating lines parsing (Line i is field label, Line i+1 is field value)
        for i in range(len(lines) - 1):
            curr = lines[i].strip().lower()
            nxt = lines[i+1].strip()
            if curr in label_key_map:
                key, label, ftype = label_key_map[curr]
                if key not in extracted_map or not extracted_map[key]["value"]:
                    if nxt.lower() not in label_key_map and not any(kw in nxt.lower() for kw in ["details", "section", "academic", "upload", "certification", "declaration"]):
                        if 0 < len(nxt) < 150:
                            extracted_map[key] = {
                                "key": key,
                                "label": label,
                                "field_type": ftype,
                                "value": nxt,
                                "source": "uploaded_pdf",
                                "required": True
                            }

        # 3. Regex Fallbacks for standard fields
        regex_patterns = [
            ("application_number", "Application Number", "text", r"(?:application\s*(?:no|num|number|id)|form\s*(?:no|num|number|id)|reg(?:istration)?\s*(?:no|num|number|id)|hcl\s*(?:form|id|no)|emp(?:loyee)?\s*id)\s*[:=\-]?\s*([A-Za-z0-9\-/]{4,35})"),
            ("full_name", "Applicant Name", "text", r"(?:applicant\s*name|full\s*name|candidate\s*name|name\s*of\s*applicant)\s*[:=\-]?\s*([A-Za-z\s\.]{2,40})"),
            ("father_name", "Father's Name", "text", r"(?:father(?:'s)?\s*name|father\s*name|guardian\s*name)\s*[:=\-]?\s*([A-Za-z\s\.]{2,40})"),
            ("mother_name", "Mother's Name", "text", r"(?:mother(?:'s)?\s*name|mother\s*name)\s*[:=\-]?\s*([A-Za-z\s\.]{2,40})"),
            ("dob", "Date of Birth", "date", r"(?:date\s*of\s*birth|d\.?o\.?b\.?|birth\s*date)\s*[:=\-]?\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})"),
            ("age", "Age", "text", r"\b(?:age)\s*[:=\-]?\s*(\d{1,3}(?:\s*(?:years|yrs))?)"),
            ("gender", "Gender", "select", r"(?:gender|sex)\s*[:=\-]?\s*(male|female|transgender|other|m|f)\b"),
            ("mobile", "Mobile Number", "text", r"(?:mobile\s*(?:no|num|number)?|phone\s*(?:no|num|number)?|contact\s*(?:no|num|number)?|cell\s*(?:no|num|number)?)\s*[:=\-]?\s*(\+?\d[\d\s\-]{8,14}\d)"),
            ("email", "Email ID", "text", r"(?:email\s*(?:id|address)?|e-mail)\s*[:=\-]?\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})"),
            ("email", "Email ID", "text", r"([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})"),
            ("pin", "PIN Code", "text", r"(?:pin\s*code|pincode|postal\s*code|zip\s*code|pin)\s*[:=\-]?\s*(\d{6})")
        ]

        for key, label, ftype, pat in regex_patterns:
            if key not in extracted_map or not extracted_map[key]["value"]:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    val = m.group(1).strip().split('\n')[0].strip()
                    if val and not any(kw in val.lower() for kw in ["enter", "select", "please", "note"]):
                        extracted_map[key] = {
                            "key": key,
                            "label": label,
                            "field_type": ftype,
                            "value": val,
                            "source": "uploaded_pdf",
                            "required": True
                        }

        # 4. Fallback: Parse ANY general "Label: Value" line from the text so no unmapped key-value pair is lost
        for line in lines:
            if ":" in line and len(line) < 120:
                parts = line.split(":", 1)
                raw_k = parts[0].strip()
                raw_v = parts[1].strip()
                if raw_k and raw_v and 2 <= len(raw_k) <= 40 and len(raw_v) <= 120:
                    clean_k = re.sub(r"[^\w]+", "_", raw_k.lower()).strip("_")
                    if clean_k and clean_k not in extracted_map and not any(kw in raw_k.lower() for kw in ["http", "www", "note", "disclaimer", "page", "date"]):
                        extracted_map[clean_k] = {
                            "key": clean_k,
                            "label": raw_k.title(),
                            "field_type": "text",
                            "value": raw_v,
                            "source": "uploaded_pdf",
                            "required": True
                        }

        # Compute Derived Age if DOB is found and Age is missing
        if "dob" in extracted_map and "age" not in extracted_map and extracted_map["dob"]["value"]:
            dob_str = extracted_map["dob"]["value"]
            m_year = re.search(r"\b(19\d\d|20\d\d)\b", dob_str)
            if m_year:
                birth_year = int(m_year.group(1))
                calc_age = 2026 - birth_year
                if 14 <= calc_age <= 100:
                    extracted_map["age"] = {
                        "key": "age",
                        "label": "Age",
                        "field_type": "text",
                        "value": f"{calc_age} Years",
                        "source": "uploaded_pdf",
                        "required": True
                    }

        extracted_fields = list(extracted_map.values())

        if extracted_fields:
            personal_keys = {"application_number", "full_name", "father_name", "mother_name", "dob", "age", "gender", "mobile", "email", "permanent_address", "correspondence_address", "address_line_1", "address_line_2", "district", "city", "state", "country", "pin", "category"}
            
            personal_f = [f for f in extracted_fields if f["key"] in personal_keys]
            edu_f = [f for f in extracted_fields if f["key"] not in personal_keys]

            sections = []
            if personal_f:
                sections.append({
                    "slug": "personal_details",
                    "title": "Personal Details & Contact",
                    "description": "Fields and auto-extracted values from uploaded application form",
                    "fields": personal_f
                })
            if edu_f:
                sections.append({
                    "slug": "education_details",
                    "title": "Qualifications & Educational Details",
                    "description": "Educational records and academic qualifications extracted from form",
                    "fields": edu_f
                })
            if not sections:
                sections.append({
                    "slug": "general_details",
                    "title": "Extracted Application Fields",
                    "description": "Fields auto-fetched from uploaded application form",
                    "fields": extracted_fields
                })

            total_fields = sum(len(s["fields"]) for s in sections)
            return sections, total_fields

        # Default dynamic template if no text could be parsed
        personal_fields = [
            {"key": "application_number", "label": "Application Number", "field_type": "text", "value": "", "source": "uploaded_form", "required": True},
            {"key": "full_name", "label": "Applicant Name", "field_type": "text", "value": "", "source": "uploaded_form", "required": True},
            {"key": "dob", "label": "Date of Birth", "field_type": "date", "value": "", "source": "uploaded_form", "required": True},
            {"key": "age", "label": "Age", "field_type": "text", "value": "", "source": "uploaded_form", "required": True},
            {"key": "gender", "label": "Gender", "field_type": "select", "value": "", "source": "uploaded_form", "required": True},
            {"key": "father_name", "label": "Father's Name", "field_type": "text", "value": "", "source": "uploaded_form", "required": True},
            {"key": "permanent_address", "label": "Permanent Address", "field_type": "text", "value": "", "source": "uploaded_form", "required": True},
            {"key": "district", "label": "District", "field_type": "text", "value": "", "source": "uploaded_form", "required": True},
            {"key": "state", "label": "State", "field_type": "text", "value": "", "source": "uploaded_form", "required": True},
            {"key": "pin", "label": "PIN Code", "field_type": "text", "value": "", "source": "uploaded_form", "required": True},
            {"key": "mobile", "label": "Mobile Number", "field_type": "text", "value": "", "source": "uploaded_form", "required": True},
            {"key": "email", "label": "Email ID", "field_type": "text", "value": "", "source": "uploaded_form", "required": False}
        ]

        education_fields = [
            {"key": "college", "label": "College / Institution", "field_type": "text", "value": "", "source": "uploaded_form", "required": True},
            {"key": "qualification", "label": "Degree / Course", "field_type": "text", "value": "", "source": "uploaded_form", "required": True}
        ]

        sections = [
            {
                "slug": "personal_details",
                "title": "Personal Information",
                "description": "Applicant demographic and contact details",
                "fields": personal_fields
            },
            {
                "slug": "education",
                "title": "Qualifications",
                "description": "Academic records and institution details",
                "fields": education_fields
            }
        ]

        total_fields = sum(len(s["fields"]) for s in sections)
        return sections, total_fields


    @staticmethod
    def _extract_documents(text: str) -> List[Dict[str, Any]]:
        lower_text = text.lower()

        docs = [
            {
                "document_type": "photograph",
                "label": "Passport Photograph",
                "required": True,
                "allowed_formats": ["jpg", "jpeg"],
                "max_size_kb": 50,
                "required_width": 200,
                "required_height": 230,
                "description": "Recent passport photo with plain background (max 50 KB, 200x230 px)."
            },
            {
                "document_type": "signature",
                "label": "Applicant Signature",
                "required": True,
                "allowed_formats": ["jpg", "jpeg", "png"],
                "max_size_kb": 50,
                "required_width": 140,
                "required_height": 60,
                "description": "Specimen signature on white paper (max 50 KB)."
            },
            {
                "document_type": "identity_proof",
                "label": "Identity Proof",
                "required": True,
                "allowed_formats": ["pdf", "jpg", "jpeg", "png"],
                "max_size_kb": 500,
                "description": "Self-attested identity proof copy (max 500 KB)."
            },
            {
                "document_type": "marksheet",
                "label": "Qualification Marksheet",
                "required": True,
                "allowed_formats": ["pdf", "jpg", "jpeg"],
                "max_size_kb": 1024,
                "description": "Highest educational qualification certificate/marksheet (max 1 MB)."
            }
        ]

        # Look for specific certificate mentions
        if "income" in lower_text:
            docs.append({
                "document_type": "income_certificate",
                "label": "Income Certificate",
                "required": True,
                "allowed_formats": ["pdf", "jpg", "jpeg"],
                "max_size_kb": 500,
                "description": "Annual household income certificate issued by competent authority."
            })
        if "caste" in lower_text or "category" in lower_text:
            docs.append({
                "document_type": "caste_certificate",
                "label": "Caste / Category Certificate",
                "required": False,
                "allowed_formats": ["pdf", "jpg", "jpeg"],
                "max_size_kb": 500,
                "description": "Category verification certificate if claiming reservation benefits."
            })

        return docs

    @staticmethod
    def _extract_photo_rules(text: str) -> Dict[str, Any]:
        # Parse explicit size/dimension hints if present in text
        max_kb = 50
        width = 200
        height = 230

        size_match = re.search(r"(\d+)\s*kb", text, re.IGNORECASE)
        if size_match:
            try:
                parsed_kb = int(size_match.group(1))
                if 10 <= parsed_kb <= 2000:
                    max_kb = parsed_kb
            except ValueError:
                pass

        dim_match = re.search(r"(\d+)\s*x\s*(\d+)", text, re.IGNORECASE)
        if dim_match:
            try:
                parsed_w = int(dim_match.group(1))
                parsed_h = int(dim_match.group(2))
                if 50 <= parsed_w <= 1000 and 50 <= parsed_h <= 1000:
                    width = parsed_w
                    height = parsed_h
            except ValueError:
                pass

        return {
            "allowed_formats": ["jpg", "jpeg"],
            "max_size_kb": max_kb,
            "min_size_kb": 10,
            "required_width": width,
            "required_height": height,
            "background": "white",
            "face_orientation": "front-facing",
            "body_framing_percent": 70,
            "face_required": True,
            "gaze_required": True,
            "plain_background": True
        }

    @staticmethod
    def _extract_declarations(text: str) -> List[str]:
        default_decls = [
            "I hereby declare that all information provided in this application form is true, correct, and complete to the best of my knowledge.",
            "I understand that providing false or misleading information will result in the immediate rejection of my application."
        ]

        if "declare" in text.lower():
            lines = text.split("\n")
            extracted = []
            for line in lines:
                if "declare" in line.lower() or "solemnly" in line.lower():
                    if len(line.strip()) > 20:
                        extracted.append(line.strip())
            if extracted:
                return extracted[:2]

        return default_decls
