import pytest
from app.models.models import PreviousApplicationField, ApplicationField
from app.services.field_mapper import FieldMappingService, LocalSemanticMatcher

@pytest.fixture
def mapper():
    return FieldMappingService()

def test_exact_match(mapper):
    matcher = LocalSemanticMatcher()
    res = matcher.match("full_name", "Full Name", "Aarav Sharma", "full_name", "Full Name")
    assert res["match_type"] == "EXACT"
    assert res["confidence"] == 1.0
    assert "Exact" in res["reason"]

def test_normalized_match(mapper):
    matcher = LocalSemanticMatcher()
    res = matcher.match("father_name", "Father Name", "Rajesh Sharma", "father_name", "Father's Name")
    assert res["match_type"] in {"EXACT", "NORMALIZED"}
    assert res["confidence"] >= 0.98

def test_semantic_alias_match(mapper):
    matcher = LocalSemanticMatcher()
    res = matcher.match("permanent_address", "Permanent Address", "Nagpur, Maharashtra", "residential_address", "Residential Address")
    assert res["match_type"] == "SEMANTIC"
    assert res["confidence"] >= 0.90
    assert "residential location" in res["reason"]

def test_course_degree_match(mapper):
    matcher = LocalSemanticMatcher()
    res = matcher.match("course", "Course", "B.Tech Electronics", "degree_course", "Degree / Course")
    assert res["match_type"] == "SEMANTIC"
    assert res["confidence"] >= 0.90

def test_ambiguous_match(mapper):
    matcher = LocalSemanticMatcher()
    res = matcher.match("permanent_address", "Permanent Address", "Nagpur", "correspondence_address", "Correspondence Address")
    assert res["match_type"] == "AMBIGUOUS"
    assert res["confidence"] == 0.75

def test_conflict_detection(mapper):
    matcher = LocalSemanticMatcher()
    res = matcher.match(
        "district", "District", "Nagpur",
        "district", "District",
        current_val="Bhandara"
    )
    assert res["match_type"] == "CONFLICT"

def test_mandatory_demo_test_case(mapper):
    """
    MANDATORY DEMO TEST CASE (Step 20):
    Previous Application:
      - Full Name: Aarav Sharma
      - DOB: 15 January 2004
      - Permanent Address: Nagpur, Maharashtra
      - Father Name: Rajesh Sharma
      - College: Example Institute
      - Course: B.Tech Electronics
    Current Application Target Fields:
      - Full Name
      - DOB
      - Residential Address
      - Father's Name
      - College
      - Degree / Course
    """
    prev_fields = [
        PreviousApplicationField(field_key="full_name", label="Full Name", value="Aarav Sharma"),
        PreviousApplicationField(field_key="dob", label="DOB", value="15 January 2004"),
        PreviousApplicationField(field_key="permanent_address", label="Permanent Address", value="Nagpur, Maharashtra"),
        PreviousApplicationField(field_key="father_name", label="Father Name", value="Rajesh Sharma"),
        PreviousApplicationField(field_key="college", label="College", value="Example Institute"),
        PreviousApplicationField(field_key="course", label="Course", value="B.Tech Electronics")
    ]

    target_fields = [
        ApplicationField(key="full_name", label="Full Name"),
        ApplicationField(key="dob", label="DOB"),
        ApplicationField(key="residential_address", label="Residential Address"),
        ApplicationField(key="father_name", label="Father's Name"),
        ApplicationField(key="college", label="College"),
        ApplicationField(key="degree_course", label="Degree / Course")
    ]

    result = mapper.analyze_import(prev_fields, target_fields, {})

    assert result["total_found"] == 6
    assert result["automatically_changed_count"] == 0

    sug_map = {s["source_field_key"]: s for s in result["suggestions"]}

    # Full Name -> EXACT
    assert sug_map["full_name"]["target_field_key"] == "full_name"
    assert sug_map["full_name"]["match_type"] == "EXACT"

    # DOB -> EXACT
    assert sug_map["dob"]["target_field_key"] == "dob"
    assert sug_map["dob"]["match_type"] == "EXACT"

    # Permanent Address -> Residential Address (SEMANTIC)
    assert sug_map["permanent_address"]["target_field_key"] == "residential_address"
    assert sug_map["permanent_address"]["match_type"] == "SEMANTIC"
    assert sug_map["permanent_address"]["confidence"] >= 0.90

    # Father Name -> Father's Name (NORMALIZED or EXACT)
    assert sug_map["father_name"]["target_field_key"] == "father_name"
    assert sug_map["father_name"]["confidence"] >= 0.98

    # College -> EXACT
    assert sug_map["college"]["target_field_key"] == "college"
    assert sug_map["college"]["match_type"] == "EXACT"

    # Course -> Degree / Course (SEMANTIC)
    assert sug_map["course"]["target_field_key"] == "degree_course"
    assert sug_map["course"]["match_type"] == "SEMANTIC"
    assert sug_map["course"]["confidence"] >= 0.90
