import { describe, it, expect } from "vitest";
import {
  FieldMappingEngine,
  HybridMapper,
  RuleBasedMapper,
  SemanticMapper,
  areSynonyms,
  getLevenshteinDistance,
  normalizeString,
  SourceFieldPayload
} from "./fieldMappingEngine";

describe("Field Mapping Engine Unit Tests", () => {
  it("normalizes field strings properly", () => {
    expect(normalizeString("applicant_full_name")).toBe("applicant full name");
    expect(normalizeString("dateOfBirth")).toBe("date of birth");
  });

  it("calculates Levenshtein distance correctly", () => {
    expect(getLevenshteinDistance("kitten", "sitting")).toBe(3);
    expect(getLevenshteinDistance("pincode", "pincode")).toBe(0);
  });

  it("detects synonyms correctly", () => {
    expect(areSynonyms("dob", "date_of_birth")).toBe(true);
    expect(areSynonyms("fullName", "applicantname")).toBe(true);
    expect(areSynonyms("ifsc", "ifsc_code")).toBe(true);
  });

  const sources: SourceFieldPayload[] = [
    {
      key: "fullName",
      label: "Full Name",
      value: "Priya Sharma",
      sourceApplicationName: "Recruitment 2025",
      sourceApplicationId: "app-1"
    },
    {
      key: "dob",
      label: "Date of Birth",
      value: "1998-05-14",
      sourceApplicationName: "Recruitment 2025",
      sourceApplicationId: "app-1"
    },
    {
      key: "district",
      label: "District",
      value: "Nagpur",
      sourceApplicationName: "Recruitment 2025",
      sourceApplicationId: "app-1"
    },
    {
      key: "district",
      label: "District",
      value: "Pune",
      sourceApplicationName: "Scholarship 2024",
      sourceApplicationId: "app-2"
    }
  ];

  it("RuleBasedMapper performs exact & synonym mapping", () => {
    const res = RuleBasedMapper.mapField("date_of_birth", "Applicant Date of Birth", sources);
    expect(res.confidence).toBeGreaterThan(80);
    expect(res.bestMatch?.value).toBe("1998-05-14");
  });

  it("HybridMapper computes weighted scores accurately", () => {
    const res = HybridMapper.mapField("applicantname", "Applicant Full Name", sources);
    expect(res.confidence).toBeGreaterThan(50);
    expect(res.bestMatch?.value).toBe("Priya Sharma");
  });

  it("FieldMappingEngine detects conflicting historical records", () => {
    const engine = new FieldMappingEngine("hybrid");
    const mappings = engine.mapFields(
      [{ key: "district", label: "District" }],
      sources
    );
    const conflicts = FieldMappingEngine.detectConflicts(mappings);
    expect(conflicts["district"]).toBeDefined();
    expect(conflicts["district"].length).toBe(2);
  });
});
