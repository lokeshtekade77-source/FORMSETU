import re
from typing import Any, Dict, List, Optional, Tuple

def normalize_label(text: str) -> str:
    """Normalize label: lowercase, trim, remove punctuation, expand common abbreviations."""
    if not text:
        return ""
    s = text.lower()
    # Replace common symbols & punctuation
    s = s.replace("'", "").replace("’", "").replace("-", " ").replace("_", " ").replace("/", " ")
    # Strip noise words
    noise = {"the", "applicant", "applicants", "details", "information", "name"}
    tokens = [t for t in re.findall(r"\w+", s) if t not in noise or s in {"full name", "father name", "mother name"}]
    norm = " ".join(tokens)

    # Common abbreviation expansions
    abbrevs = {
        "dob": "date of birth",
        "pin": "postal index number",
        "pincode": "postal index number"
    }
    return abbrevs.get(norm, norm)

# Semantic Category Clusters mapping normalized labels & keys to category names
SEMANTIC_CATEGORIES = {
    "person_name": {"full name", "full_name", "applicant name", "candidate name", "name"},
    "birth_date": {"date of birth", "dob", "birth date", "date_of_birth"},
    "father_name": {"father name", "fathers name", "father_name", "father full name"},
    "mother_name": {"mother name", "mothers name", "mother_name", "mother full name"},
    "address_permanent": {"permanent address", "residential address", "permanent_address", "home address", "residence address"},
    "address_correspondence": {"correspondence address", "present address", "mailing address", "correspondence_address", "current address"},
    "education_course": {"course", "degree course", "specialization", "branch", "degree_course"},
    "education_degree": {"graduation", "degree", "educational qualification", "highest qualification", "qualification"},
    "education_college": {"college", "university", "institute", "institution", "college_name"},
    "work_experience": {"experience", "work experience", "total experience", "employment history"},
    "contact_mobile": {"mobile", "phone", "contact number", "mobile_number", "phone_number"},
    "address_district": {"district", "district name", "city_district"}
}

def get_semantic_category(key: str, label: str) -> Optional[str]:
    nk = key.lower().replace("-", "_")
    nl = normalize_label(label)
    
    # 1. Exact member match first
    for cat, members in SEMANTIC_CATEGORIES.items():
        if nk in members or nl in members:
            return cat

    # 2. Substring member match
    for cat, members in SEMANTIC_CATEGORIES.items():
        for m in members:
            if m in nl or m in nk:
                return cat
    return None

class SemanticFieldMatcher:
    """Base interface for field matchers."""
    def match(
        self,
        source_key: str,
        source_label: str,
        source_val: str,
        target_key: str,
        target_label: str,
        current_val: Optional[str] = None
    ) -> Dict[str, Any]:
        raise NotImplementedError

class LocalSemanticMatcher(SemanticFieldMatcher):
    """Deterministic local semantic matcher operating 100% offline."""
    def match(
        self,
        source_key: str,
        source_label: str,
        source_val: str,
        target_key: str,
        target_label: str,
        current_val: Optional[str] = None
    ) -> Dict[str, Any]:
        sk_norm = source_key.lower().replace("-", "_")
        tk_norm = target_key.lower().replace("-", "_")
        
        sl_norm = normalize_label(source_label)
        tl_norm = normalize_label(target_label)

        # Conflict check: if target already has a value and it differs from source value
        if current_val and current_val.strip() and current_val.strip().lower() != source_val.strip().lower():
            return {
                "match_type": "CONFLICT",
                "confidence": 0.90,
                "reason": "Information differs between previous and current application.",
                "suggested_decision": "reject"
            }

        # 1. Exact Match (key equals key or normalized label equals normalized label)
        if sk_norm == tk_norm or sl_norm == tl_norm:
            return {
                "match_type": "EXACT",
                "confidence": 1.0,
                "reason": "Exact field label and identifier match.",
                "suggested_decision": "use"
            }

        # 2. Normalized Variation Match (e.g. Father Name vs Father's Name)
        # Check if stripping spaces/punctuation matches
        clean_sl = re.sub(r"\W+", "", source_label.lower())
        clean_tl = re.sub(r"\W+", "", target_label.lower())
        if clean_sl == clean_tl:
            return {
                "match_type": "NORMALIZED",
                "confidence": 0.98,
                "reason": f"Normalized label variation match ('{source_label}' → '{target_label}').",
                "suggested_decision": "use"
            }

        # 3. Semantic Category Match
        src_cat = get_semantic_category(source_key, source_label)
        tgt_cat = get_semantic_category(target_key, target_label)

        if src_cat and tgt_cat:
            if src_cat == tgt_cat:
                reason = "Both fields refer to the applicant's date of birth." if src_cat == "birth_date" \
                    else "Both fields refer to the applicant's residential location." if src_cat == "address_permanent" \
                    else "Both fields refer to the academic degree or course specialization." if src_cat in {"education_degree", "education_course"} \
                    else f"Both fields refer to the applicant's {src_cat.replace('_', ' ')}."

                return {
                    "match_type": "SEMANTIC",
                    "confidence": 0.95 if src_cat in {"address_permanent", "person_name", "birth_date"} else 0.92,
                    "reason": reason,
                    "suggested_decision": "use"
                }
            
            # Ambiguous Cross-Address Match (e.g. Permanent Address vs Correspondence Address)
            if src_cat.startswith("address_") and tgt_cat.startswith("address_"):
                return {
                    "match_type": "AMBIGUOUS",
                    "confidence": 0.75,
                    "reason": "Both fields refer to address information, but permanent and correspondence address may differ.",
                    "suggested_decision": "available"
                }

        # 4. Partial Substring Label Similarity
        if len(sl_norm) >= 4 and len(tl_norm) >= 4:
            if sl_norm in tl_norm or tl_norm in sl_norm:
                return {
                    "match_type": "SEMANTIC",
                    "confidence": 0.88,
                    "reason": f"Semantic substring overlap between '{source_label}' and '{target_label}'.",
                    "suggested_decision": "use"
                }

        # No Match
        return {
            "match_type": "NO_MATCH",
            "confidence": 0.0,
            "reason": "No semantic relationship found.",
            "suggested_decision": "available"
        }

class LLMFieldMatcher(SemanticFieldMatcher):
    """Pluggable LLM Field Matcher interface for future external LLM integration."""
    def __init__(self, api_key: Optional[str] = None):
        self.fallback = LocalSemanticMatcher()
        self.api_key = api_key

    def match(
        self,
        source_key: str,
        source_label: str,
        source_val: str,
        target_key: str,
        target_label: str,
        current_val: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.api_key:
            # Default to local deterministic matcher if no API key is provided
            return self.fallback.match(source_key, source_label, source_val, target_key, target_label, current_val)
        
        # Future LLM API template (e.g. OpenAI / Gemini prompt)
        return self.fallback.match(source_key, source_label, source_val, target_key, target_label, current_val)

class FieldMappingService:
    """Orchestrates intelligent field mapping between previous and target application fields."""
    def __init__(self, matcher: Optional[SemanticFieldMatcher] = None):
        self.matcher = matcher or LocalSemanticMatcher()

    def analyze_import(
        self,
        previous_fields: List[Any],
        target_fields: List[Any],
        current_values_map: Dict[str, str]
    ) -> Dict[str, Any]:
        suggestions: List[Dict[str, Any]] = []

        exact_count = 0
        semantic_count = 0
        review_count = 0

        target_map = {f.key: f for f in target_fields}
        
        for pf in previous_fields:
            # Search for best target match
            best_match: Optional[Dict[str, Any]] = None
            best_target = None
            highest_conf = -1.0

            # 1. First check if exact target key exists
            if pf.field_key in target_map:
                tf = target_map[pf.field_key]
                c_val = current_values_map.get(tf.key)
                m = self.matcher.match(pf.field_key, pf.label, pf.value, tf.key, tf.label, c_val)
                best_match = m
                best_target = tf
                highest_conf = m["confidence"]

            # 2. If no exact key match or confidence < 1.0, search across all target fields
            if highest_conf < 1.0:
                for tf in target_fields:
                    c_val = current_values_map.get(tf.key)
                    m = self.matcher.match(pf.field_key, pf.label, pf.value, tf.key, tf.label, c_val)
                    if m["confidence"] > highest_conf:
                        highest_conf = m["confidence"]
                        best_match = m
                        best_target = tf

            if best_match and best_target and best_match["match_type"] != "NO_MATCH":
                m_type = best_match["match_type"]
                if m_type == "EXACT":
                    exact_count += 1
                elif m_type in {"SEMANTIC", "NORMALIZED"}:
                    semantic_count += 1
                elif m_type in {"AMBIGUOUS", "CONFLICT"}:
                    review_count += 1

                suggestions.append({
                    "source_field_key": pf.field_key,
                    "source_label": pf.label,
                    "source_value": pf.value,
                    "target_field_key": best_target.key,
                    "target_label": best_target.label,
                    "match_type": m_type,
                    "confidence": round(best_match["confidence"], 2),
                    "reason": best_match["reason"],
                    "suggested_decision": best_match["suggested_decision"]
                })

        return {
            "total_found": len(suggestions),
            "exact_count": exact_count,
            "semantic_count": semantic_count,
            "review_count": review_count,
            "automatically_changed_count": 0,  # Zero silent changes
            "suggestions": suggestions
        }
