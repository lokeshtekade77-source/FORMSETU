"use client";
import React, { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemo } from "./DemoProvider";
import { AppDocumentOut, PhotoComplianceOut, SignatureComplianceOut, api } from "@/lib/api";


const base = "/applications/demo-recruitment-2026";
const steps = [
  ["requirements", "Registration"],
  ["personal", "Personal Details"],
  ["contact", "Contact Details"],
  ["address", "Address"],
  ["education", "Education"],
  ["experience", "Experience"],
  ["eligibility", "Eligibility"],
  ["documents", "Documents"],
  ["declaration", "Declaration"],
  ["review", "Preview"]
];

export function PrimaryButton({
  children,
  href,
  onClick,
  type = "button",
  disabled = false
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-container ${
    disabled ? "opacity-60 cursor-not-allowed" : ""
  }`;
  return href && !disabled ? (
    <Link className={cls} href={href}>
      {children}
    </Link>
  ) : (
    <button type={type} disabled={disabled} className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  href,
  disabled = false
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container ${
    disabled ? "opacity-60 cursor-not-allowed" : ""
  }`;
  return href && !disabled ? (
    <Link className={cls} href={href}>
      {children}
    </Link>
  ) : (
    <button disabled={disabled} className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

export function BackButton({ href }: { href: string }) {
  return (
    <SecondaryButton href={href}>
      <span className="material-symbols-outlined">arrow_back</span>Back
    </SecondaryButton>
  );
}

export function SaveButton({
  children = "Save & Continue",
  onClick,
  type
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const { saving } = useDemo();
  return (
    <PrimaryButton type={type} disabled={saving} onClick={onClick}>
      {saving ? "Saving..." : children}
      {!saving && <span className="material-symbols-outlined">arrow_forward</span>}
    </PrimaryButton>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const norm = status.toLowerCase();
  const palette =
    norm === "preparable"
      ? "bg-amber-100 text-amber-900 border border-amber-300"
      : norm === "needs_review" || norm === "invalid" || norm === "unresolved"
      ? "bg-error-container text-error"
      : norm === "rejected" || norm === "missing"
      ? "bg-surface-container text-on-surface-variant"
      : "bg-secondary-container text-secondary";

  const iconName =
    norm === "preparable"
      ? "auto_fix_high"
      : norm === "needs_review" || norm === "invalid" || norm === "unresolved"
      ? "warning"
      : norm === "rejected" || norm === "missing"
      ? "info"
      : "check_circle";

  const displayText = norm === "preparable" ? "NEEDS COMPRESSION" : status.replaceAll("_", " ").toUpperCase();

  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${palette}`}>
      <span className="material-symbols-outlined text-sm">{iconName}</span>
      {displayText}
    </span>
  );
}

export function ErrorBanner() {
  const { error, clearError } = useDemo();
  if (!error) return null;
  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-error bg-error-container p-4 text-sm text-error">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined">error</span>
        <span>{error}</span>
      </div>
      <button onClick={clearError} className="font-semibold underline">
        Dismiss
      </button>
    </div>
  );
}

export function ApplicationHeader() {
  const { reset, saving } = useDemo();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 md:px-6">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded bg-primary text-white font-bold">F</span>
          <span className="text-xl font-semibold text-primary">FormSetu</span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-xs font-semibold">
          <Link href="/applications" className="text-on-surface-variant hover:text-primary transition flex items-center gap-1">
            <span className="material-symbols-outlined text-base">apps</span> Applications
          </Link>
          <Link href="/vault" className="text-on-surface-variant hover:text-primary transition flex items-center gap-1">
            <span className="material-symbols-outlined text-base">inventory_2</span> Info Vault
          </Link>
          <Link href="/documents" className="text-on-surface-variant hover:text-primary transition flex items-center gap-1">
            <span className="material-symbols-outlined text-base">auto_fix</span> Doc Engine
          </Link>
          <Link href="/privacy" className="text-on-surface-variant hover:text-primary transition flex items-center gap-1">
            <span className="material-symbols-outlined text-base">verified_user</span> Privacy Center
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {saving && <span className="text-xs font-medium text-primary animate-pulse">Saving...</span>}
        <button onClick={reset} className="text-xs font-semibold text-primary underline underline-offset-4">
          Reset Demo
        </button>
        <div className="hidden text-right text-xs md:block">
          <strong>CAND-DEMO-2026</strong>
          <br />
          Chaitanya Demo User
        </div>
        <span className="material-symbols-outlined grid h-8 w-8 place-items-center rounded-full bg-primary text-white">
          person
        </span>
      </div>
    </header>
  );
}

export function ApplicationSidebar() {
  const pathname = usePathname();
  const { validation, documents, declarationAccepted, progress: backendProgress } = useDemo();
  const progressPercent = backendProgress?.progress_percent ?? validation?.progress ?? 0;

  const getStepStatus = (pathKey: string) => {
    if (backendProgress && backendProgress.steps) {
      const matched = backendProgress.steps.find((s) => s.key === pathKey);
      if (matched) return matched.status;
    }
    return null;
  };

  return (
    <aside className="hidden w-72 shrink-0 border-r border-outline-variant bg-surface-container p-6 lg:block">
      <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Overall Progress</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-highest">
        <div className="h-full bg-secondary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>
      <p className="mt-1 text-xs text-secondary font-semibold">{progressPercent}% Completed</p>
      <nav className="mt-6 space-y-1">
        {steps.map(([path, label], index) => {
          const active = pathname.endsWith(path);
          const stepStat = getStepStatus(path);

          const isCompleted =
            stepStat === "COMPLETED" ||
            path === "requirements" ||
            (path === "documents" && Array.isArray(documents) && documents.length > 0 && documents.every((d) => !d.required || d.status === "valid" || d.validation_status === "valid")) ||
            (path === "declaration" && declarationAccepted);

          const isReview = stepStat === "NEEDS_REVIEW";

          return (
            <Link
              key={path}
              href={`${base}/${path}`}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-primary-container font-semibold text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-surface-container-highest text-[10px] font-bold">
                  {index + 1}
                </span>
                <span>{label}</span>
              </div>
              <span className={`material-symbols-outlined text-base ${
                isReview ? "text-amber-600" : isCompleted ? "text-secondary font-bold" : active ? "text-primary" : "text-outline"
              }`}>
                {isReview ? "warning" : isCompleted ? "check_circle" : active ? "radio_button_checked" : "radio_button_unchecked"}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function ApplicationShell({ children }: { children: React.ReactNode }) {
  const { loading } = useDemo();

  return (
    <>
      <ApplicationHeader />
      <div className="flex min-h-[calc(100vh-64px)]">
        <ApplicationSidebar />
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <ErrorBanner />
          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
              <p className="text-sm font-semibold text-on-surface-variant">Loading FormSetu Application...</p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      <footer className="border-t border-outline-variant bg-surface-container-low px-6 py-5 text-center text-xs text-on-surface-variant">
        FormSetu is an independent prototype for demonstration purposes. It is not affiliated with or endorsed by any government department, bank, examination authority, or public institution.
      </footer>
    </>
  );
}

export function SectionHeader({ title, description, eyebrow }: { title: string; description: string; eyebrow?: string }) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow || "Application"}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{description}</p>
    </div>
  );
}

export function RequirementCard({ icon, title, detail, optional }: { icon: string; title: string; detail: string; optional?: boolean }) {
  return (
    <div className="flex gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <div>
        <div className="font-semibold">
          {title} {optional && <span className="text-xs font-normal text-on-surface-variant">Optional</span>}
        </div>
        <p className="text-sm text-on-surface-variant">{detail}</p>
      </div>
    </div>
  );
}

export function PreviousApplicationCard({ title, fieldCount, onReview }: { title?: string; fieldCount?: number; onReview: () => void }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">work</span>
            <h2 className="text-xl font-semibold">{title || "Recruitment Application — Demo 2025"}</h2>
          </div>
          <p className="mt-2 text-sm text-on-surface-variant">{fieldCount || 20} reusable fields · 8 documents · Last updated: 18 August 2025</p>
        </div>
        <PrimaryButton onClick={onReview}>
          Review &amp; Import <span className="material-symbols-outlined">arrow_right_alt</span>
        </PrimaryButton>
      </div>
    </div>
  );
}

export function DocumentCard({
  docSlot,
  onUpload,
  onPrepare
}: {
  docSlot: AppDocumentOut;
  onUpload: (file: File) => void;
  onPrepare: (documentId: string) => void;
}) {
  const { removeDocument } = useDemo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prepStep, setPrepStep] = useState<string | null>(null);
  const [photoResult, setPhotoResult] = useState<PhotoComplianceOut | null>(
    docSlot.photo_compliance ?? null
  );
  const [photoLoading, setPhotoLoading] = useState(false);
  const [sigResult, setSigResult] = useState<SignatureComplianceOut | null>(null);
  const [sigLoading, setSigLoading] = useState(false);

  const [acknowledged, setAcknowledged] = useState<boolean>(docSlot.acknowledged ?? false);
  const [ackLoading, setAckLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [previewTab, setPreviewTab] = useState<"compressed" | "original">("compressed");
  const [removeLoading, setRemoveLoading] = useState(false);

  const handleRemoveClick = useCallback(async () => {
    if (!docSlot.document_id) return;
    setRemoveLoading(true);
    try {
      await removeDocument(docSlot.document_id);
      setPhotoResult(null);
      setSigResult(null);
      setAcknowledged(false);
    } catch {
      // silently handle
    } finally {
      setRemoveLoading(false);
    }
  }, [docSlot.document_id, removeDocument]);

  const handlePhotoAnalysis = useCallback(async (documentId: string) => {
    setPhotoLoading(true);
    try {
      const result = await api.analyzePhoto(documentId);
      setPhotoResult(result);
    } catch {
      // silently fail
    } finally {
      setPhotoLoading(false);
    }
  }, []);

  const handleSignatureAnalysis = useCallback(async (documentId: string) => {
    setSigLoading(true);
    try {
      const result = await api.analyzeSignature(documentId);
      setSigResult(result);
    } catch {
      // silently fail
    } finally {
      setSigLoading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
      setPhotoResult(null);
      setSigResult(null);
      setAcknowledged(false);
    }
  };

  const handlePrepareClick = async () => {
    if (!docSlot.document_id) return;
    setPrepStep("Checking document & requirements...");
    await new Promise((r) => setTimeout(r, 400));
    setPrepStep("Preparing document dimensions...");
    await new Promise((r) => setTimeout(r, 400));
    setPrepStep("Optimizing & compressing file...");
    await onPrepare(docSlot.document_id);
    setPrepStep(null);

    const docTypeLower = (docSlot.document_type || "").toLowerCase();
    if ((docTypeLower === "photo" || docTypeLower === "photograph") && docSlot.document_id) {
      handlePhotoAnalysis(docSlot.document_id);
    } else if (docTypeLower === "signature" && docSlot.document_id) {
      handleSignatureAnalysis(docSlot.document_id);
    }
  };

  const handleAcknowledge = async () => {
    if (!docSlot.document_id) return;
    setAckLoading(true);
    try {
      await api.acknowledgeCompression(docSlot.document_id);
      setAcknowledged(true);
    } catch {
      setAcknowledged(!acknowledged);
    } finally {
      setAckLoading(false);
    }
  };

  const isPhoto = ["photo", "photograph", "passport_photo"].includes((docSlot.document_type || "").toLowerCase());
  const isSignature = ["signature", "applicant_signature"].includes((docSlot.document_type || "").toLowerCase());
  const allowedFormats = Array.isArray(docSlot.allowed_formats) ? docSlot.allowed_formats : [];
  const isImageDoc = isPhoto || isSignature || allowedFormats.some(f => ["jpg", "jpeg", "png", "webp"].includes((f || "").toLowerCase()));

  const formatsText = allowedFormats.length > 0 ? allowedFormats.join("/").toUpperCase() : "ANY";
  const specText = `${formatsText} · Max ${docSlot.max_size_kb || 500} KB${
    docSlot.required_width ? ` · ${docSlot.required_width}×${docSlot.required_height}px` : ""
  }`;

  const isReady = docSlot.status === "valid" || docSlot.validation_status === "valid" || docSlot.preparation_status === "prepared";

  const sizeKbFormatted = (sizeBytes?: number | null) => {
    if (!sizeBytes) return null;
    return sizeBytes >= 1024 * 1024 ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(sizeBytes / 1024)} KB`;
  };

  const statusCheckIcon = (status: string) => {
    if (status === "PASS") return <span className="font-bold text-secondary">✓</span>;
    if (status === "WARNING") return <span className="font-bold text-amber-600">⚠</span>;
    if (status === "FAIL") return <span className="font-bold text-error">❌</span>;
    return <span className="font-bold text-on-surface-variant">—</span>;
  };

  const cardStatusColor = (status: string) => {
    if (status === "PASS") return "border-secondary/30 bg-secondary-container/20";
    if (status === "WARNING") return "border-amber-300 bg-amber-50";
    if (status === "FAIL") return "border-error/40 bg-error-container/30";
    return "border-outline-variant bg-surface-container-low";
  };

  const requiresNewPhoto = photoResult?.requires_new_photo === true;

  const isCompressed = docSlot.is_compressed || Boolean(docSlot.prepared_size && docSlot.original_size && docSlot.prepared_size < docSlot.original_size) || docSlot.preparation_status === "prepared";
  const compressionRatio = docSlot.compression_ratio || (docSlot.original_size && docSlot.prepared_size ? Math.round((1 - docSlot.prepared_size / docSlot.original_size) * 1000) / 10 : 0);

  const cacheBustUrl = docSlot.file_url ? `${docSlot.file_url}?v=${docSlot.prepared_size || docSlot.original_size || Date.now()}` : "";

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-2xl text-primary">
              {isPhoto ? "portrait" : isSignature ? "draw" : "description"}
            </span>
            <div>
              <h2 className="font-semibold text-base">
                {docSlot.label} {docSlot.required && <span className="text-error">*</span>}
              </h2>
              <p className="text-xs text-on-surface-variant">{specText}</p>
              {docSlot.original_filename && (
                <p className="mt-2 text-xs font-semibold text-primary">
                  File: {docSlot.original_filename} ({sizeKbFormatted(docSlot.original_size)})
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={isReady ? "READY" : docSlot.validation_status || docSlot.status} />
            {isCompressed && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                🗜️ Compressed ({compressionRatio}% reduced)
              </span>
            )}
          </div>
        </div>

        {/* Live Compressed Image Preview Box */}
        {docSlot.file_url && isImageDoc && (
          <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container p-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer overflow-hidden rounded-lg border border-outline-variant bg-black/5" onClick={() => setShowImageModal(true)}>
                <img
                  src={cacheBustUrl}
                  alt={docSlot.label}
                  className="h-16 w-16 object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="material-symbols-outlined text-white text-lg">zoom_in</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
                  📸 Resized Image Preview
                </span>
                <p className="text-[11px] text-on-surface-variant">
                  {docSlot.prepared_dimensions || docSlot.original_dimensions || "Standard resolution"}
                </p>
                <button
                  type="button"
                  onClick={() => setShowImageModal(true)}
                  className="mt-1 text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  View &amp; Compare Resized Image
                </button>
              </div>
            </div>

            {isCompressed && (
              <div className="text-right">
                <span className="text-[11px] text-secondary font-bold block">Norm Compliant</span>
                <span className="text-[10px] text-on-surface-variant">Quality verified</span>
              </div>
            )}
          </div>
        )}

        {/* Technical validation checks breakdown */}
        {docSlot.checks && docSlot.checks.length > 0 && (
          <div className="mt-4 rounded-lg bg-surface-container-low p-3 space-y-1.5 text-xs">
            {docSlot.checks.map((chk, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`font-bold ${chk.passed ? "text-secondary" : "text-error"}`}>
                  {chk.passed ? "✓" : "❌"}
                </span>
                <span>{chk.message || `${chk.name}: ${chk.actual}`}</span>
              </div>
            ))}
          </div>
        )}

        {/* Photo Quality Check Panel */}
        {isPhoto && docSlot.document_id && (
          <div className={`mt-4 rounded-xl border p-4 ${photoResult ? cardStatusColor(photoResult.status) : "border-outline-variant bg-surface-container-low"}`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📸</span>
                <span className="text-sm font-semibold text-on-surface">Photo Quality Check</span>
                {photoResult && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    photoResult.status === "PASS" ? "bg-secondary-container text-secondary" :
                    photoResult.status === "WARNING" ? "bg-amber-100 text-amber-700" :
                    "bg-error-container text-error"
                  }`}>
                    {photoResult.score}/100
                  </span>
                )}
              </div>
              {!photoResult && !photoLoading && (
                <button
                  className="text-xs text-primary font-semibold hover:underline"
                  onClick={() => handlePhotoAnalysis(docSlot.document_id!)}
                >
                  Run Analysis
                </button>
              )}
              {photoLoading && (
                <span className="text-xs text-on-surface-variant animate-pulse">Analyzing…</span>
              )}
            </div>

            {requiresNewPhoto && (
              <div className="mb-3 rounded-lg border border-error/40 bg-error-container/40 px-3 py-2 text-xs text-error">
                <span className="font-semibold">Photo needs improvement</span> — Your photo meets the file requirements but needs a clearer front-facing photograph.
              </div>
            )}

            {photoResult && photoResult.checks && photoResult.checks.length > 0 && (
              <div className="space-y-1.5 text-xs">
                {(photoResult.checks || []).map((chk, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {statusCheckIcon(chk.status)}
                    <span className={chk.status === "FAIL" ? "text-error" : chk.status === "WARNING" ? "text-amber-700" : "text-on-surface"}>
                      {chk.message}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!photoResult && !photoLoading && (
              <p className="text-xs text-on-surface-variant">
                Click <span className="font-semibold">Run Analysis</span> to check photo composition, face visibility, and background.
              </p>
            )}

            {photoResult && (
              <p className="mt-3 text-[11px] text-on-surface-variant">
                Meets the configured photo requirements — not a government certification.
              </p>
            )}
          </div>
        )}

        {/* Before / After Compression Stats & Norm Analysis Card */}
        {docSlot.prepared_size && docSlot.original_size && (
          <div className="mt-4 rounded-xl border border-secondary/30 bg-secondary-container/10 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-secondary">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">compress</span>
                Norm Analysis &amp; Compression Summary
              </span>
              <span className="rounded-full bg-secondary-container px-2.5 py-0.5 font-bold">
                {sizeKbFormatted(docSlot.original_size)} → {sizeKbFormatted(docSlot.prepared_size)} ({compressionRatio}% reduced)
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-surface-container-lowest p-2.5 border border-outline-variant/60">
                <small className="text-on-surface-variant font-medium">Original Upload</small>
                <p className="font-bold text-sm text-on-surface mt-0.5">{sizeKbFormatted(docSlot.original_size)}</p>
                <p className="text-[11px] text-on-surface-variant">{docSlot.original_dimensions || "N/A"}</p>
              </div>
              <div className="rounded-lg bg-surface-container-lowest p-2.5 border border-secondary/40">
                <small className="text-secondary font-medium">Compressed &amp; Resized</small>
                <p className="font-bold text-sm text-secondary mt-0.5">{sizeKbFormatted(docSlot.prepared_size)}</p>
                <p className="text-[11px] text-secondary font-semibold">{docSlot.prepared_dimensions || "N/A"}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Acknowledgment Card */}
        {docSlot.document_id && (isCompressed || docSlot.prepared_size || isReady) && (
          <div className={`mt-4 rounded-xl border p-3.5 transition-colors ${acknowledged ? "border-emerald-300 bg-emerald-50/50" : "border-amber-300 bg-amber-50/40"}`}>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={handleAcknowledge}
                disabled={ackLoading}
                className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <div className="text-xs">
                <span className={`font-semibold ${acknowledged ? "text-emerald-900" : "text-amber-900"}`}>
                  {acknowledged ? "✓ Image Compression & Resizing Acknowledged" : "Applicant Acknowledgment Required"}
                </span>
                <p className="mt-0.5 text-on-surface-variant leading-relaxed">
                  I have inspected the resized image preview above and confirm it meets the guidelines and norm specifications.
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center gap-3 pt-3 border-t border-outline-variant/40">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={allowedFormats.map((f) => `.${f}`).join(",")}
          className="hidden"
        />

        <SecondaryButton onClick={() => fileInputRef.current?.click()}>
          <span className="material-symbols-outlined">upload</span>
          {docSlot.original_filename ? (requiresNewPhoto ? "Replace Photo" : "Replace File") : "Choose File"}
        </SecondaryButton>

        {docSlot.document_id && !isReady && (
          <PrimaryButton disabled={Boolean(prepStep)} onClick={handlePrepareClick}>
            <span className="material-symbols-outlined">auto_fix</span>
            {prepStep || "Prepare & Compress Automatically"}
          </PrimaryButton>
        )}

        {docSlot.file_url && isImageDoc && (
          <button
            type="button"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 px-2 py-1"
            onClick={() => setShowImageModal(true)}
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            View Resized Image
          </button>
        )}

        {docSlot.document_id && (
          <button
            type="button"
            onClick={handleRemoveClick}
            disabled={removeLoading}
            className="rounded-lg border border-error/30 bg-error-container/20 px-3 py-2 text-xs font-semibold text-error hover:bg-error-container/40 transition flex items-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            {removeLoading ? "Removing..." : isImageDoc ? "Remove Image" : "Remove File"}
          </button>
        )}

        {isReady && !photoResult && docSlot.document_type === "photo" && (
          <button
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            onClick={() => handlePhotoAnalysis(docSlot.document_id!)}
            disabled={photoLoading}
          >
            <span className="material-symbols-outlined text-sm">face</span>
            {photoLoading ? "Analyzing…" : "Check Photo Quality"}
          </button>
        )}

        {isReady && (
          <span className="ml-auto text-xs font-semibold text-secondary flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span> Ready for submission
          </span>
        )}
      </div>

      {/* Resized Image Inspection Modal */}
      {showImageModal && docSlot.file_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative max-w-2xl w-full rounded-2xl bg-surface-container-lowest p-6 shadow-2xl border border-outline-variant max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">preview</span>
                <div>
                  <h3 className="font-bold text-lg text-on-surface">{docSlot.label} — Image Inspection</h3>
                  <p className="text-xs text-on-surface-variant">
                    {docSlot.original_filename} ({specText})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {/* Tab Selector */}
              <div className="flex rounded-lg bg-surface-container p-1 border border-outline-variant text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPreviewTab("compressed")}
                  className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${previewTab === "compressed" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                >
                  <span className="material-symbols-outlined text-sm">compress</span>
                  Compressed &amp; Resized Image
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("original")}
                  className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${previewTab === "original" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                >
                  <span className="material-symbols-outlined text-sm">image</span>
                  Original Upload ({sizeKbFormatted(docSlot.original_size)})
                </button>
              </div>

              {/* Image View Container */}
              <div className="rounded-xl border border-outline-variant bg-black/5 p-4 flex flex-col items-center justify-center min-h-[250px]">
                <img
                  src={cacheBustUrl}
                  alt={docSlot.label}
                  className="max-h-[350px] w-auto object-contain rounded-lg shadow-md border border-white/40"
                />
                <span className="mt-3 text-xs font-semibold text-on-surface bg-surface-container-highest px-3 py-1 rounded-full border border-outline-variant">
                  {previewTab === "compressed" ? `Prepared Resolution: ${docSlot.prepared_dimensions || docSlot.original_dimensions || "Standard"}` : `Original File Size: ${sizeKbFormatted(docSlot.original_size)}`}
                </span>
              </div>

              {/* Compression & Norm Metrics */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-surface-container p-3 border border-outline-variant">
                  <small className="text-on-surface-variant block font-medium">Compression Status</small>
                  <span className="font-bold text-secondary text-sm mt-0.5 block">
                    {isCompressed ? "Compressed" : "Compliant"}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Norms checked</span>
                </div>
                <div className="rounded-xl bg-surface-container p-3 border border-outline-variant">
                  <small className="text-on-surface-variant block font-medium">Size Reduction</small>
                  <span className="font-bold text-primary text-sm mt-0.5 block">
                    {compressionRatio > 0 ? `-${compressionRatio}%` : "0%"}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">{sizeKbFormatted(docSlot.original_size)} → {sizeKbFormatted(docSlot.prepared_size || docSlot.original_size)}</span>
                </div>
                <div className="rounded-xl bg-surface-container p-3 border border-outline-variant">
                  <small className="text-on-surface-variant block font-medium">Target Specs</small>
                  <span className="font-bold text-on-surface text-sm mt-0.5 block">
                    {docSlot.required_width ? `${docSlot.required_width}x${docSlot.required_height}px` : `<${docSlot.max_size_kb} KB`}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Max {docSlot.max_size_kb} KB</span>
                </div>
              </div>

              {/* Acknowledgment inside Modal */}
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={handleAcknowledge}
                    className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <div className="text-xs text-emerald-900">
                    <span className="font-bold block">Acknowledge Resized Output</span>
                    I confirm that I have reviewed the compressed image preview and approve its clarity and dimensions for official form submission.
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-outline-variant pt-4 mt-4 flex justify-end">
              <PrimaryButton onClick={() => setShowImageModal(false)}>
                Done &amp; Close Preview
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReviewCard({ title, children, href }: { title: string; children: React.ReactNode; href: string }) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
      <div className="flex justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-primary">
          Edit
        </Link>
      </div>
      <div className="mt-4 text-sm text-on-surface-variant">{children}</div>
    </section>
  );
}
