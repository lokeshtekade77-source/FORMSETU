"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApplicationShell,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  StatusBadge,
  RequirementCard,
  DocumentCard
} from "./ui";
import { testApi, TestApplicationAnalysisOut } from "@/lib/test-api";
import { api, AppDocumentOut, FieldValueOut, ImportRecordOut } from "@/lib/api";

export function TestPrivacyNotice() {
  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-xs leading-relaxed text-blue-900 shadow-sm">
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-base text-blue-700">shield_lock</span>
        <div>
          <strong className="font-semibold text-blue-950">Prototype Evaluation & Privacy Control:</strong>{" "}
          Testing mode is for prototype evaluation. Use only application forms or documents you are authorized to process.
          Do not upload Aadhaar numbers, PAN numbers, passwords, OTPs, payment info, or sensitive credentials.
          FormSetu runs 100% offline and does not connect to external government portals or APIs.
        </div>
      </div>
    </div>
  );
}

// 1. ENTRY POINT & UPLOAD FORM
export function TestUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const sess = await testApi.createSession();
      const testId = sess.id;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("formsetu_test_id", testId);
      }
      await testApi.uploadForm(testId, file);
      router.push("/test/analyzing");
    } catch (err: any) {
      setError(err?.message || "Failed to upload application form. Please try again.");
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (/\.(pdf|jpg|jpeg|png)$/i.test(f.name)) {
        setFile(f);
      } else {
        setError("Please upload a PDF, JPG, or PNG document.");
      }
    }
  };

  return (
    <ApplicationShell>
      <SectionHeader
        eyebrow="🧪 Manual Application Test Mode"
        title="Test With Your Own Application"
        description="Upload an application form and see how FormSetu can analyze its requirements and generate a test workflow."
      />
      <TestPrivacyNotice />

      <div className="mx-auto max-w-2xl rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition ${
            dragActive ? "border-primary bg-primary-container/20" : "border-outline-variant bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
          <p className="mt-4 text-base font-semibold">Upload Application Form</p>
          <p className="mt-1 text-xs text-on-surface-variant">Supports PDF / JPG / PNG (Max 20 MB)</p>
          
          <input
            type="file"
            id="form-upload-input"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
            }}
          />
          <label
            htmlFor="form-upload-input"
            className="mt-6 cursor-pointer rounded-lg bg-surface-container-high px-4 py-2.5 text-xs font-semibold text-primary shadow-sm hover:bg-surface-container-highest"
          >
            Browse File
          </label>

          {file && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary-container/30 px-4 py-2 text-xs font-medium text-on-primary-container">
              <span className="material-symbols-outlined text-sm">description</span>
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-error-container p-3 text-xs font-medium text-on-error-container">
            {error}
          </div>
        )}

        <p className="mt-6 text-xs text-on-surface-variant text-center leading-relaxed">
          Use a sample or personal application form that you are authorized to use. Do not upload sensitive credentials or confidential information.
        </p>

        <div className="mt-8 flex justify-end gap-3">
          <SecondaryButton href="/applications">Cancel</SecondaryButton>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-xs font-semibold text-white shadow transition hover:opacity-90 ${
              !file || uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {uploading ? "Uploading & Analyzing..." : "Upload & Analyze Form"}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </ApplicationShell>
  );
}

// 3. ANALYSIS ANIMATION SCREEN
export function TestAnalyzingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [complete, setComplete] = useState<boolean>(false);

  const steps = [
    "Reading application structure",
    "Detecting sections",
    "Detecting input fields",
    "Detecting document requirements",
    "Detecting photo requirements",
    "Detecting declarations",
    "Preparing test workflow"
  ];

  useEffect(() => {
    const testId = typeof window !== "undefined" ? sessionStorage.getItem("formsetu_test_id") : null;
    if (!testId) {
      router.push("/test/upload");
      return;
    }

    // Pre-fetch analysis in background during animation
    testApi.getAnalysis(testId).catch(() => {});

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setComplete(true);
          setTimeout(() => {
            router.push("/test/requirements");
          }, 300);
          return prev;
        }
      });
    }, 200);

    return () => clearInterval(timer);
  }, [router, steps.length]);

  return (
    <ApplicationShell>
      <SectionHeader
        eyebrow="FormSetu Analysis Engine"
        title="Analyzing Application Form..."
        description="Parsing document structure, fields, document specifications, and declarations offline."
      />
      <TestPrivacyNotice />

      <div className="mx-auto max-w-xl rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined animate-spin text-2xl text-primary">sync</span>
          <h2 className="text-base font-semibold">Offline Analysis Progress</h2>
        </div>

        <div className="space-y-4">
          {steps.map((step, idx) => {
            const isDone = idx < currentStep || complete;
            const isCurrent = idx === currentStep && !complete;
            return (
              <div key={step} className="flex items-center justify-between text-sm">
                <span className={`flex items-center gap-3 ${isDone ? "text-primary font-medium" : isCurrent ? "text-on-surface font-semibold" : "text-on-surface-variant/60"}`}>
                  <span className="material-symbols-outlined text-base">
                    {isDone ? "check_circle" : isCurrent ? "hourglass_top" : "radio_button_unchecked"}
                  </span>
                  {step}
                </span>
                {isDone && <span className="text-xs font-semibold text-secondary">Done</span>}
                {isCurrent && <span className="text-xs text-primary animate-pulse">Analyzing...</span>}
              </div>
            );
          })}
        </div>

        {complete && (
          <div className="mt-8 rounded-xl bg-success-container/30 p-4 text-center text-sm font-semibold text-emerald-900 animate-fade-in">
            ✓ Application analysis complete! Redirecting to requirement review...
          </div>
        )}
      </div>
    </ApplicationShell>
  );
}

// 5. REQUIREMENT REVIEW SCREEN
export function TestRequirementsReviewPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<TestApplicationAnalysisOut | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewed, setReviewed] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [starting, setStarting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editTitle, setEditTitle] = useState<string>("");
  const [editPhotoMaxKb, setEditPhotoMaxKb] = useState<number>(50);
  const [editPhotoWidth, setEditPhotoWidth] = useState<number>(200);
  const [editPhotoHeight, setEditPhotoHeight] = useState<number>(230);
  const [editPhotoBg, setEditPhotoBg] = useState<string>("white");

  useEffect(() => {
    const testId = typeof window !== "undefined" ? sessionStorage.getItem("formsetu_test_id") : null;
    if (!testId) {
      router.push("/test/upload");
      return;
    }
    testApi.getAnalysis(testId)
      .then((data) => {
        setAnalysis(data);
        setEditTitle(data.title);
        setEditPhotoMaxKb(data.photo_rules?.max_size_kb || 50);
        setEditPhotoWidth(data.photo_rules?.required_width || 200);
        setEditPhotoHeight(data.photo_rules?.required_height || 230);
        setEditPhotoBg(data.photo_rules?.background || "white");
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load requirement analysis.");
        setLoading(false);
      });
  }, [router]);

  const handleSaveEdits = async () => {
    if (!analysis) return;
    const testId = sessionStorage.getItem("formsetu_test_id");
    if (!testId) return;

    try {
      const updated = await testApi.updateRequirements(testId, {
        title: editTitle,
        photo_rules: {
          ...analysis.photo_rules,
          max_size_kb: editPhotoMaxKb,
          required_width: editPhotoWidth,
          required_height: editPhotoHeight,
          background: editPhotoBg
        }
      });
      setAnalysis(updated);
      setEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update requirements.");
    }
  };

  const handleContinue = async () => {
    const testId = sessionStorage.getItem("formsetu_test_id");
    if (!testId) return;
    setStarting(true);
    try {
      const res = await testApi.startWorkflow(testId);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("formsetu_test_app_id", res.application_id);
        sessionStorage.setItem("formsetu_active_app_id", res.application_id);
      }
      router.push("/test/application");
    } catch (err: any) {
      setError(err.message || "Failed to generate test workflow.");
      setStarting(false);
    }
  };


  if (loading) {
    return (
      <ApplicationShell>
        <div className="flex justify-center p-12 text-on-surface-variant">Loading analysis...</div>
      </ApplicationShell>
    );
  }

  return (
    <ApplicationShell>
      <SectionHeader
        eyebrow="Detected Requirements Review"
        title="Application Requirements"
        description="Review detected requirements extracted from your uploaded form. Edit any values before generating your test workflow."
      />
      <TestPrivacyNotice />

      {error && (
        <div className="mb-6 rounded-lg bg-error-container p-4 text-xs text-on-error-container">{error}</div>
      )}

      {analysis?.confidence_summary?.unconfident_notes?.map((note, i) => (
        <div key={i} className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-2">
          <span className="material-symbols-outlined text-base text-amber-700">warning</span>
          <div>
            <strong>Extraction Note:</strong> {note}
          </div>
        </div>
      ))}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase text-secondary">Form Title</span>
                <h2 className="mt-1 text-xl font-bold">{analysis?.title}</h2>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-sm">edit</span> Edit Requirements
              </button>
            </div>

            {/* Sections & Fields */}
            <div className="mt-6 space-y-6">
              {analysis?.sections.map((sec) => (
                <div key={sec.slug} className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-4">
                  <h3 className="font-semibold text-sm text-primary mb-3">{sec.title}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {sec.fields.map((f) => (
                      <div key={f.key} className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                        <span className="font-medium">{f.label}</span>
                        {f.required && <span className="text-[10px] text-red-500 font-bold">*Required</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Documents */}
            <div className="mt-6 rounded-xl border border-outline-variant/60 bg-surface-container-low p-4">
              <h3 className="font-semibold text-sm text-primary mb-3">Required Documents</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {analysis?.documents.map((d) => (
                  <div key={d.document_type} className="flex items-center gap-2 text-xs">
                    <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                    <span>{d.label}</span>
                    <span className="text-[10px] text-on-surface-variant">({(d.allowed_formats || []).join(", ").toUpperCase()}, max {d.max_size_kb} KB)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo Specs */}
            <div className="mt-6 rounded-xl border border-outline-variant/60 bg-surface-container-low p-4">
              <h3 className="font-semibold text-sm text-primary mb-3">Photograph Technical Specs</h3>
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div className="rounded-lg bg-surface p-2.5">
                  <small className="text-on-surface-variant">Format</small>
                  <p className="font-semibold uppercase">{analysis?.photo_rules.allowed_formats?.join(", ") || "JPG"}</p>
                </div>
                <div className="rounded-lg bg-surface p-2.5">
                  <small className="text-on-surface-variant">Max Size</small>
                  <p className="font-semibold">{analysis?.photo_rules.max_size_kb || 50} KB</p>
                </div>
                <div className="rounded-lg bg-surface p-2.5">
                  <small className="text-on-surface-variant">Dimensions</small>
                  <p className="font-semibold">{analysis?.photo_rules.required_width || 200} × {analysis?.photo_rules.required_height || 230} px</p>
                </div>
                <div className="rounded-lg bg-surface p-2.5">
                  <small className="text-on-surface-variant">Background</small>
                  <p className="font-semibold capitalize">{analysis?.photo_rules.background || "Plain / White"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Card */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="font-bold text-base">Confirm & Continue</h3>
            <p className="mt-2 text-xs text-on-surface-variant leading-relaxed">
              Please explicitly confirm that you have reviewed the detected specifications before proceeding to workflow generation.
            </p>

            <label className="mt-6 flex items-start gap-3 rounded-xl border border-outline-variant/80 bg-surface-container-low p-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="text-xs font-medium text-on-surface">
                I have reviewed these detected requirements.
              </span>
            </label>

            <div className="mt-6">
              <button
                onClick={handleContinue}
                disabled={!reviewed || starting}
                className={`w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-semibold text-white shadow transition hover:opacity-90 ${
                  !reviewed || starting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {starting ? "Generating Workflow..." : "Continue to Test Application"}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Correction Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-bold">Edit Requirements (Manual Correction)</h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              Update form title or photograph technical guidelines.
            </p>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Application Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Photo Max Size (KB)</label>
                  <input
                    type="number"
                    value={editPhotoMaxKb}
                    onChange={(e) => setEditPhotoMaxKb(Number(e.target.value))}
                    className="w-full rounded-lg border border-outline-variant p-2.5"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Photo Background</label>
                  <select
                    value={editPhotoBg}
                    onChange={(e) => setEditPhotoBg(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant p-2.5"
                  >
                    <option value="white">Plain / White</option>
                    <option value="light">Light Color</option>
                    <option value="any">Any Background</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={editPhotoWidth}
                    onChange={(e) => setEditPhotoWidth(Number(e.target.value))}
                    className="w-full rounded-lg border border-outline-variant p-2.5"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={editPhotoHeight}
                    onChange={(e) => setEditPhotoHeight(Number(e.target.value))}
                    className="w-full rounded-lg border border-outline-variant p-2.5"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton onClick={() => setEditing(false)}>Cancel</SecondaryButton>
              <button
                onClick={handleSaveEdits}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </ApplicationShell>
  );
}

// 7. DYNAMIC TEST APPLICATION WORKFLOW
export function TestApplicationWorkflowPage() {
  const router = useRouter();
  const [appId, setAppId] = useState<string | null>(null);

  useEffect(() => {
    const storedAppId = typeof window !== "undefined" ? sessionStorage.getItem("formsetu_test_app_id") : null;
    if (!storedAppId) {
      router.push("/test/upload");
    } else {
      setAppId(storedAppId);
    }
  }, [router]);

  const handleBeginWorkflow = () => {
    if (typeof window !== "undefined" && appId) {
      sessionStorage.setItem("formsetu_active_app_id", appId);
      sessionStorage.setItem("formsetu_test_app_id", appId);
    }
    router.push(`/applications/demo-recruitment-2026/import?appId=${appId}`);
  };

  if (!appId) return null;

  return (
    <ApplicationShell>
      <SectionHeader
        eyebrow="🧪 Dynamic FormSetu Workflow"
        title="Test Application Stepper"
        description="Explore Smart Import, field verification, document validation, photo compliance, and final review on your uploaded application structure."
      />
      <TestPrivacyNotice />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="text-base font-bold text-primary mb-4">Generated Workflow Steps</h2>

            <div className="space-y-4">
              {[
                { title: "1. Previous Application & Smart Import", desc: "Maps synthetic prior data (Recruitment 2025 Demo) to your custom form fields.", icon: "sync_alt" },
                { title: "2. Personal & Educational Details", desc: "Review mapped fields, edit synthetic values, and resolve district conflicts.", icon: "edit_note" },
                { title: "3. Document Upload & Technical Validation", desc: "Test document upload against your form's size/format constraints.", icon: "folder_open" },
                { title: "4. Photograph Compliance Analysis", desc: "Test photo against your form's exact size (50 KB), dimension (200x230 px), and face rules.", icon: "photo_camera" },
                { title: "5. Declaration & Completion", desc: "Review synthesized data counters and mark test application ready.", icon: "fact_check" }
              ].map((step) => (
                <div key={step.title} className="flex items-start gap-4 rounded-xl border border-outline-variant/60 bg-surface-container-low p-4">
                  <span className="material-symbols-outlined text-xl text-primary mt-0.5">{step.icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{step.title}</h3>
                    <p className="mt-1 text-xs text-on-surface-variant">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <SecondaryButton href="/test/upload">Reset Test</SecondaryButton>
              <button
                onClick={handleBeginWorkflow}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-white shadow transition hover:opacity-90"
              >
                Begin Interactive Workflow <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ApplicationShell>
  );
}

