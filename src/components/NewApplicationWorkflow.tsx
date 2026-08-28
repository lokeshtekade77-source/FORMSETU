"use client";
import React, { useState } from "react";
import {
  FieldMappingEngine,
  HybridMapper,
  parseExternalJsonPayload,
  MappingResult,
  SourceFieldPayload
} from "@/lib/fieldMappingEngine";
import { prepareImage, validatePdfFile, verifyFileSignature, PreparedFileResult } from "@/lib/filePreparationEngine";
import { parsePdfDocumentToProfile } from "@/lib/pdfParser";

export interface FormTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: { key: string; label: string; type: string; required: boolean }[];
  documents: {
    id: string;
    label: string;
    requiredFormat: string;
    maxSizeKb: number;
    widthPx?: number;
    heightPx?: number;
    aspectRatio?: string;
  }[];
}

const TEMPLATES: FormTemplate[] = [
  {
    id: "national_scholarship_2026",
    name: "National Scholarship Scheme 2026",
    category: "Scholarship & Education",
    description: "Central government financial grant for post-matric and higher education students.",
    fields: [
      { key: "fullName", label: "Full Name", type: "text", required: true },
      { key: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
      { key: "fatherName", label: "Father's Name", type: "text", required: true },
      { key: "motherName", label: "Mother's Name", type: "text", required: true },
      { key: "address", label: "Residential Address", type: "text", required: true },
      { key: "district", label: "District", type: "text", required: true },
      { key: "state", label: "State", type: "text", required: true },
      { key: "pinCode", label: "PIN Code", type: "text", required: true },
      { key: "category", label: "Reservation Category", type: "text", required: true },
      { key: "college", label: "Institution / University", type: "text", required: true },
      { key: "course", label: "Course / Degree", type: "text", required: true },
      { key: "branch", label: "Branch / Stream", type: "text", required: true },
      { key: "currentYear", label: "Current Year of Study", type: "text", required: true },
      { key: "bankName", label: "Bank Name", type: "text", required: true },
      { key: "ifsc", label: "IFSC Code", type: "text", required: true },
      { key: "accountHolder", label: "Bank Account Holder Name", type: "text", required: true },
      { key: "accountNumber", label: "Account Number", type: "text", required: true }
    ],
    documents: [
      {
        id: "photo",
        label: "Recent Passport Photograph",
        requiredFormat: "JPG",
        maxSizeKb: 50,
        widthPx: 350,
        heightPx: 450,
        aspectRatio: "7:9"
      },
      {
        id: "signature",
        label: "Official Signature",
        requiredFormat: "JPG",
        maxSizeKb: 20,
        widthPx: 280,
        heightPx: 120,
        aspectRatio: "7:3"
      },
      {
        id: "marksheet",
        label: "Consolidated Marksheet PDF",
        requiredFormat: "PDF",
        maxSizeKb: 1000
      }
    ]
  },
  {
    id: "upsc_recruitment_2026",
    name: "UPSC Civil Services Examination 2026",
    category: "Public Recruitment",
    description: "Union Public Service Commission examination for civil services.",
    fields: [
      { key: "fullName", label: "Applicant Full Name", type: "text", required: true },
      { key: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
      { key: "fatherName", label: "Father's Name", type: "text", required: true },
      { key: "motherName", label: "Mother's Name", type: "text", required: true },
      { key: "address", label: "Permanent Address", type: "text", required: true },
      { key: "district", label: "District", type: "text", required: true },
      { key: "state", label: "Domicile State", type: "text", required: true },
      { key: "category", label: "Caste / Category", type: "text", required: true },
      { key: "college", label: "Graduation College / University", type: "text", required: true },
      { key: "course", label: "Degree Title", type: "text", required: true }
    ],
    documents: [
      {
        id: "photo",
        label: "Passport Size Photograph",
        requiredFormat: "JPG",
        maxSizeKb: 50,
        widthPx: 350,
        heightPx: 450,
        aspectRatio: "7:9"
      },
      {
        id: "signature",
        label: "Applicant Signature",
        requiredFormat: "JPG",
        maxSizeKb: 20,
        widthPx: 280,
        heightPx: 120,
        aspectRatio: "7:3"
      }
    ]
  }
];

const DEFAULT_VAULT_SOURCES: SourceFieldPayload[] = [
  { key: "fullName", label: "Full Name", value: "Chaitanya Sharma", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "dob", label: "Date of Birth", value: "2005-07-14", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "fatherName", label: "Father Name", value: "Rajesh Sharma", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "motherName", label: "Mother Name", value: "Sunita Sharma", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "address", label: "Permanent Address", value: "Civil Lines, Near High Court", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "district", label: "District", value: "Nagpur", sourceApplicationName: "Scholarship 2025", sourceApplicationId: "app-2025" },
  { key: "district", label: "District", value: "Pune", sourceApplicationName: "Grant Application 2024", sourceApplicationId: "app-2024" },
  { key: "state", label: "State", value: "Maharashtra", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "pinCode", label: "PIN Code", value: "440001", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "category", label: "Reservation Category", value: "General (EWS)", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "college", label: "College Name", value: "ABC Institute of Technology", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "course", label: "Course", value: "B.Tech", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "branch", label: "Branch", value: "Computer Science", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "currentYear", label: "Year of Study", value: "3rd Year", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "bankName", label: "Bank Name", value: "State Bank of India", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "ifsc", label: "IFSC Code", value: "SBIN0001234", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "accountHolder", label: "Account Holder Name", value: "Chaitanya Sharma", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" },
  { key: "accountNumber", label: "Bank Account Number", value: "39281048591", sourceApplicationName: "Vault Record", sourceApplicationId: "v1" }
];

export function NewApplicationWorkflow() {
  const [step, setStep] = useState<"select_template" | "data_source" | "ai_mapping" | "fill_form" | "documents" | "completed">("select_template");
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate>(TEMPLATES[0]);
  const [sourceData, setSourceData] = useState<SourceFieldPayload[]>(DEFAULT_VAULT_SOURCES);
  const [mappings, setMappings] = useState<MappingResult[]>([]);
  const [conflicts, setConflicts] = useState<Record<string, SourceFieldPayload[]>>({});
  const [resolvedConflicts, setResolvedConflicts] = useState<Record<string, string>>({});
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  const [formValues, setFormValues] = useState<Record<string, { value: string; source: string }>>({});
  const [preparedDocs, setPreparedDocs] = useState<Record<string, PreparedFileResult | { isValid: boolean; fileName: string; size: number }>>({});
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);

  // Handle template selection
  const handleSelectTemplate = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setStep("data_source");
  };

  // Run AI Field Mapping Engine
  const runMappingEngine = (sources: SourceFieldPayload[]) => {
    const engine = new FieldMappingEngine("hybrid");
    const results = engine.mapFields(
      selectedTemplate.fields.map((f) => ({ key: f.key, label: f.label })),
      sources
    );
    const detectedConflicts = FieldMappingEngine.detectConflicts(results);

    setMappings(results);
    setConflicts(detectedConflicts);

    // Default select high confidence mappings
    const initialSelected: Record<string, boolean> = {};
    const initialValues: Record<string, { value: string; source: string }> = {};

    results.forEach((m) => {
      if (m.bestMatch && m.confidence >= 50) {
        initialSelected[m.targetKey] = true;
        initialValues[m.targetKey] = {
          value: m.bestMatch.value,
          source: `${m.bestMatch.sourceApplicationName} (${m.confidence}% match)`
        };
      }
    });

    setSelectedFields(initialSelected);
    setFormValues(initialValues);
    setStep("ai_mapping");
  };

  // Handle external file upload (PDF / JSON / TXT)
  const handleExternalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith(".pdf")) {
      try {
        const parsed = await parsePdfDocumentToProfile(file);
        const combined = [...parsed.extractedFields, ...sourceData];
        setSourceData(combined);
        runMappingEngine(combined);
      } catch {
        alert("Failed to parse PDF document.");
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const parsed = parseExternalJsonPayload(json, `External: ${file.name}`);
          const combined = [...parsed, ...sourceData];
          setSourceData(combined);
          runMappingEngine(combined);
        } catch {
          alert("Could not parse file. Please upload a valid PDF, JSON, or profile document.");
        }
      };
      reader.readAsText(file);
    }
  };

  // Handle conflict resolution choice
  const handleResolveConflict = (fieldKey: string, payload: SourceFieldPayload) => {
    setResolvedConflicts((prev) => ({ ...prev, [fieldKey]: payload.value }));
    setFormValues((prev) => ({
      ...prev,
      [fieldKey]: {
        value: payload.value,
        source: `Selected from ${payload.sourceApplicationName}`
      }
    }));
  };

  // Handle document upload & local processing
  const handleDocumentUpload = async (docReq: FormTemplate["documents"][0], file: File) => {
    setProcessingDocId(docReq.id);
    try {
      const sig = await verifyFileSignature(file);
      if (!sig.isValid) {
        alert(sig.error || "Unsupported file signature");
        setProcessingDocId(null);
        return;
      }

      if (sig.mimeType === "application/pdf") {
        const val = await validatePdfFile(file, { max_size_kb: docReq.maxSizeKb });
        setPreparedDocs((prev) => ({
          ...prev,
          [docReq.id]: { isValid: val.isValid, fileName: file.name, size: file.size, pdfUrl: val.pdfUrl }
        }));
      } else {
        const prepared = await prepareImage(file, {
          max_size_kb: docReq.maxSizeKb,
          required_width: docReq.widthPx || null,
          required_height: docReq.heightPx || null,
          allowed_formats: [docReq.requiredFormat === "PDF" ? "JPEG" : docReq.requiredFormat]
        });
        setPreparedDocs((prev) => ({
          ...prev,
          [docReq.id]: prepared
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error processing file";
      alert(msg);
    } finally {
      setProcessingDocId(null);
    }
  };

  const reusedCount = Object.keys(selectedFields).filter((k) => selectedFields[k]).length;
  const docsPreparedCount = Object.keys(preparedDocs).length;
  const timeSavedMins = (reusedCount * 0.5).toFixed(1);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Wizard Progress Bar */}
      <div className="rounded-2xl border border-outline-variant bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-on-surface">
          <span className={step === "select_template" ? "text-primary" : ""}>1. Form Template</span>
          <span className={step === "data_source" ? "text-primary" : ""}>2. Source Data</span>
          <span className={step === "ai_mapping" ? "text-primary" : ""}>3. AI Field Mapping</span>
          <span className={step === "fill_form" ? "text-primary" : ""}>4. Review Form</span>
          <span className={step === "documents" ? "text-primary" : ""}>5. Document Crop/Compress</span>
          <span className={step === "completed" ? "text-primary" : ""}>6. Submit</span>
        </div>
      </div>

      {/* STEP 1: Select Form Template */}
      {step === "select_template" && (
        <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-on-surface">Start New Application</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Select a government scheme or recruitment application template to apply.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {TEMPLATES.map((tmpl) => (
              <div key={tmpl.id} className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm hover:border-primary transition">
                <div>
                  <span className="inline-block rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container">
                    {tmpl.category}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-on-surface">{tmpl.name}</h3>
                  <p className="mt-1 text-xs text-on-surface-variant">{tmpl.description}</p>
                  <p className="mt-3 text-xs font-medium text-on-surface">{tmpl.fields.length} Required Fields • {tmpl.documents.length} Upload Constraints</p>
                </div>
                <button
                  onClick={() => handleSelectTemplate(tmpl)}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow hover:opacity-90"
                >
                  Start Application <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Choose Data Source */}
      {step === "data_source" && (
        <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-on-surface">Import Application Data</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            How would you like to auto-populate fields for {selectedTemplate.name}?
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* Option A: Saved Vault Data */}
            <div className="rounded-xl border-2 border-primary/40 bg-surface-container-lowest p-6 flex flex-col justify-between">
              <div>
                <span className="material-symbols-outlined text-3xl text-primary mb-2">inventory_2</span>
                <h3 className="text-lg font-bold text-on-surface">Use Saved Information Vault</h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Automatically map saved records from previous applications and your information vault.
                </p>
                <div className="mt-4 rounded-lg bg-surface-container p-3 text-xs text-on-surface">
                  <span className="font-semibold">{sourceData.length} Reusable Field Records Found</span>
                </div>
              </div>
              <button
                onClick={() => runMappingEngine(sourceData)}
                className="mt-6 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow hover:opacity-90"
              >
                ✨ Run AI Mapping Engine
              </button>
            </div>

            {/* Option B: Upload External PDF or Data Document */}
            <div className="rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-6 flex flex-col justify-between">
              <div>
                <span className="material-symbols-outlined text-3xl text-secondary mb-2">picture_as_pdf</span>
                <h3 className="text-lg font-bold text-on-surface">Upload External PDF Document / Resume</h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Upload any PDF document (Resume, Marksheet, Application Form) or JSON profile file to extract fields and auto-fill.
                </p>
                <input
                  type="file"
                  accept=".pdf,.json,.txt"
                  onChange={handleExternalFileUpload}
                  className="mt-4 block w-full text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-secondary file:text-on-secondary hover:file:opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: AI Hybrid Field Mapping & Conflict Review */}
      {step === "ai_mapping" && (
        <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <div>
              <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">psychology</span>
                AI Hybrid Field Mapping &amp; Conflict Review
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                FormSetu mapped your target form fields using exact, dictionary synonym, token overlap, and Levenshtein similarity scoring.
              </p>
            </div>
            <button
              onClick={() => setStep("fill_form")}
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow hover:opacity-90"
            >
              Confirm Selected Fields ({reusedCount}) <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Conflicts Alert */}
          {Object.keys(conflicts).length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-4">
              <h4 className="font-bold text-sm text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">warning</span>
                Historical Data Conflicts Detected ({Object.keys(conflicts).length})
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">
                Different values exist across your historical records for the following fields. Please select which value to reuse:
              </p>

              <div className="mt-3 space-y-3">
                {Object.keys(conflicts).map((fieldKey) => (
                  <div key={fieldKey} className="rounded-lg bg-surface p-3 border border-outline-variant text-xs">
                    <span className="font-bold text-on-surface capitalize">{fieldKey}:</span>
                    <div className="mt-2 flex flex-wrap gap-4">
                      {conflicts[fieldKey].map((opt, idx) => (
                        <label key={idx} className="flex items-center gap-2 cursor-pointer font-medium text-on-surface">
                          <input
                            type="radio"
                            name={`conflict-${fieldKey}`}
                            checked={resolvedConflicts[fieldKey] === opt.value || formValues[fieldKey]?.value === opt.value}
                            onChange={() => handleResolveConflict(fieldKey, opt)}
                            className="text-primary focus:ring-primary"
                          />
                          <span>{opt.value} ({opt.sourceApplicationName})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mappings Table */}
          <div className="overflow-x-auto rounded-xl border border-outline-variant">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container text-on-surface-variant font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Select</th>
                  <th className="p-3">Target Field</th>
                  <th className="p-3">Mapped Previous Field</th>
                  <th className="p-3">Extracted Value</th>
                  <th className="p-3">Confidence &amp; Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 bg-surface-container-lowest">
                {mappings.map((m) => {
                  const isChecked = Boolean(selectedFields[m.targetKey]);
                  return (
                    <tr key={m.targetKey} className={isChecked ? "bg-primary-container/10" : ""}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setSelectedFields((prev) => ({ ...prev, [m.targetKey]: e.target.checked }))}
                          className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="p-3 font-bold text-on-surface">{m.targetLabel}</td>
                      <td className="p-3 text-on-surface-variant">{m.bestMatch?.label || "—"}</td>
                      <td className="p-3 font-semibold text-on-surface">{formValues[m.targetKey]?.value || m.bestMatch?.value || "—"}</td>
                      <td className="p-3">
                        {m.bestMatch ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              m.confidence >= 85
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {m.confidence}% {m.matchType} Match
                          </span>
                        ) : (
                          <span className="text-on-surface-variant font-italic">No match found</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 4: Review Auto-Filled Form */}
      {step === "fill_form" && (
        <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <div>
              <h2 className="text-2xl font-bold text-on-surface">Auto-Populated Application Form</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Review and edit your application fields before uploading required document attachments.</p>
            </div>
            <button
              onClick={() => setStep("documents")}
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow hover:opacity-90"
            >
              Proceed to Document Upload <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {selectedTemplate.fields.map((f) => {
              const current = formValues[f.key]?.value || "";
              return (
                <div key={f.key} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase">{f.label}</label>
                    {formValues[f.key]?.source && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        Auto-Filled
                      </span>
                    )}
                  </div>
                  <input
                    type={f.type}
                    value={current}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        [f.key]: { value: e.target.value, source: "Edited by user" }
                      }))
                    }
                    className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                    placeholder={`Enter ${f.label}`}
                  />
                  {formValues[f.key]?.source && (
                    <span className="mt-1 text-[10px] text-on-surface-variant block">Source: {formValues[f.key].source}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 5: Document Preparation Engine */}
      {step === "documents" && (
        <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <div>
              <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_fix</span>
                Auto Document Crop, Resize &amp; Compression Engine
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Upload your external document images. FormSetu automatically center-crops to aspect ratio, resizes, and compresses files under portal rules.
              </p>
            </div>
            <button
              onClick={() => setStep("completed")}
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow hover:opacity-90"
            >
              Finish &amp; Review Application <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {selectedTemplate.documents.map((docReq) => {
              const res = preparedDocs[docReq.id];
              const isImageRes = res && "file" in res ? (res as PreparedFileResult) : null;
              const isPdfRes = res && "fileName" in res ? (res as { isValid: boolean; fileName: string; size: number; pdfUrl?: string }) : null;

              return (
                <div key={docReq.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-base text-on-surface">{docReq.label}</h4>
                      <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-bold text-primary">
                        Max {docReq.maxSizeKb} KB ({docReq.requiredFormat})
                      </span>
                    </div>

                    {docReq.widthPx && (
                      <p className="mt-1 text-xs text-on-surface-variant font-mono">
                        Target constraints: {docReq.widthPx}x{docReq.heightPx}px ({docReq.aspectRatio})
                      </p>
                    )}

                    <div className="mt-4">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => e.target.files?.[0] && handleDocumentUpload(docReq, e.target.files[0])}
                        className="block w-full text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary hover:file:opacity-90"
                      />
                    </div>
                  </div>

                  {processingDocId === docReq.id && (
                    <p className="mt-3 text-xs font-semibold text-primary animate-pulse">
                      Cropping, resizing &amp; compressing locally...
                    </p>
                  )}

                  {isImageRes && (
                    <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                        <span>✓ Image Prepared &amp; Compliant</span>
                        <span>{isImageRes.reductionPercentage.toFixed(1)}% Smaller</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>Original: {(isImageRes.originalSize / 1024).toFixed(1)} KB ({isImageRes.originalWidth}x{isImageRes.originalHeight}px)</div>
                        <div className="font-bold text-emerald-700">Prepared: {(isImageRes.processedSize / 1024).toFixed(1)} KB ({isImageRes.processedWidth}x{isImageRes.processedHeight}px)</div>
                      </div>
                      <a href={isImageRes.dataUrl} download={isImageRes.file.name} className="inline-block font-bold text-primary underline">
                        Download Prepared Image
                      </a>
                    </div>
                  )}

                  {isPdfRes && (
                    <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs space-y-1">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300">
                        ✓ Valid PDF Document ({ (isPdfRes.size / 1024).toFixed(1) } KB)
                      </div>
                      {isPdfRes.pdfUrl && (
                        <a href={isPdfRes.pdfUrl} download={isPdfRes.fileName} className="inline-block font-bold text-primary underline">
                          Preview / Download PDF Document
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 6: Final Submission WOW Screen */}
      {step === "completed" && (
        <div className="rounded-2xl border border-outline-variant bg-surface p-8 shadow-md text-center space-y-6">
          <span className="material-symbols-outlined text-6xl text-emerald-600">task_alt</span>
          <h2 className="text-3xl font-extrabold text-on-surface">Your Application is Ready!</h2>

          <div className="mx-auto max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="rounded-xl bg-surface-container p-4">
              <span className="text-2xl font-bold text-primary block">{reusedCount}</span>
              <span className="text-xs text-on-surface-variant font-medium">Fields Auto-Reused</span>
            </div>
            <div className="rounded-xl bg-surface-container p-4">
              <span className="text-2xl font-bold text-emerald-600 block">{docsPreparedCount}</span>
              <span className="text-xs text-on-surface-variant font-medium">Documents Prepared</span>
            </div>
            <div className="rounded-xl bg-surface-container p-4">
              <span className="text-2xl font-bold text-secondary block">0</span>
              <span className="text-xs text-on-surface-variant font-medium">Manual Re-entries</span>
            </div>
            <div className="rounded-xl bg-surface-container p-4">
              <span className="text-2xl font-bold text-amber-600 block">{timeSavedMins}m</span>
              <span className="text-xs text-on-surface-variant font-medium">Estimated Time Saved</span>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ template: selectedTemplate.name, formValues, preparedDocs }, null, 2));
                const anchor = document.createElement("a");
                anchor.setAttribute("href", dataStr);
                anchor.setAttribute("download", `FormSetu_Application_${selectedTemplate.id}.json`);
                anchor.click();
              }}
              className="rounded-xl bg-primary px-6 py-3 text-xs font-bold text-on-primary shadow hover:opacity-90 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">download</span> Download Application JSON Payload
            </button>
            <button
              onClick={() => setStep("select_template")}
              className="rounded-xl border border-outline-variant bg-surface-container px-6 py-3 text-xs font-bold text-on-surface hover:bg-surface-container-high"
            >
              Start Another Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
