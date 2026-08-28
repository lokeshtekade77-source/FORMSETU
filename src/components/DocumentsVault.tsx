"use client";
import React, { useState, useRef } from "react";
import { prepareImage, validatePdfFile, verifyFileSignature, PreparedFileResult, PreparedPdfResult } from "@/lib/filePreparationEngine";

export interface DocumentPreset {
  id: string;
  name: string;
  category: "photo" | "signature" | "pdf";
  label: string;
  requiredFormat: string;
  maxSizeKb: number;
  widthPx?: number;
  heightPx?: number;
  aspectRatio?: string;
  description: string;
}

const DOCUMENT_PRESETS: DocumentPreset[] = [
  {
    id: "passport_photo_upsc",
    name: "UPSC / SSC Passport Photo",
    category: "photo",
    label: "Recent Passport Size Photograph",
    requiredFormat: "JPEG",
    maxSizeKb: 50,
    widthPx: 350,
    heightPx: 450,
    aspectRatio: "7:9",
    description: "Standard photo specification for central civil service & SSC recruitment exams."
  },
  {
    id: "signature_standard",
    name: "Applicant Signature",
    category: "signature",
    label: "Official Signature",
    requiredFormat: "JPEG",
    maxSizeKb: 20,
    widthPx: 280,
    heightPx: 120,
    aspectRatio: "7:3",
    description: "Clear black/blue ink signature on plain white background."
  },
  {
    id: "aadhaar_id_card",
    name: "Aadhaar / Identity Proof",
    category: "photo",
    label: "Front & Back ID Scan",
    requiredFormat: "JPEG",
    maxSizeKb: 200,
    widthPx: 1000,
    heightPx: 650,
    aspectRatio: "1.54:1",
    description: "Clear cropped scan of Aadhaar card or Voter ID."
  },
  {
    id: "marksheet_pdf",
    name: "Degree / Marksheet Certificate PDF",
    category: "pdf",
    label: "10th / 12th / Degree Certificate",
    requiredFormat: "PDF",
    maxSizeKb: 1000,
    description: "Consolidated marksheets & certificates in PDF format."
  }
];

export function DocumentsVault() {
  const [selectedPreset, setSelectedPreset] = useState<DocumentPreset>(DOCUMENT_PRESETS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult] = useState<PreparedFileResult | null>(null);
  const [pdfResult, setPdfResult] = useState<PreparedPdfResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProgressMsg("Verifying file header magic bytes...");
    setResult(null);
    setPdfResult(null);

    try {
      const sig = await verifyFileSignature(file);
      if (!sig.isValid) {
        alert(sig.error || "Unsupported file signature");
        setIsProcessing(false);
        return;
      }

      if (sig.mimeType === "application/pdf") {
        setProgressMsg("Validating PDF document & reading metadata...");
        const val = await validatePdfFile(file, { max_size_kb: selectedPreset.maxSizeKb });
        setPdfResult(val);
      } else {
        setProgressMsg("Processing image (cropping, resizing & compressing)...");
        const prepared = await prepareImage(
          file,
          {
            max_size_kb: selectedPreset.maxSizeKb,
            required_width: selectedPreset.widthPx || null,
            required_height: selectedPreset.heightPx || null,
            allowed_formats: [selectedPreset.requiredFormat === "PDF" ? "JPEG" : selectedPreset.requiredFormat]
          },
          (msg) => setProgressMsg(msg)
        );
        setResult(prepared);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process document.";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setResult(null);
    setPdfResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-5">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_fix</span>
            Browser-Local File Preparation Engine
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Auto center-crop, resize, compress images, and validate PDF files locally to satisfy strict portal rules. Zero server upload.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
          <span className="material-symbols-outlined text-sm">shield</span> Magic Bytes Verified
        </span>
      </div>

      {/* Preset Selector */}
      <div>
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          Select Government Portal Specification Preset
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DOCUMENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setSelectedPreset(preset);
                setResult(null);
                setPdfResult(null);
              }}
              className={`flex flex-col text-left rounded-xl border p-4 transition-all ${
                selectedPreset.id === preset.id
                  ? "border-primary bg-primary-container/20 shadow-md"
                  : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container"
              }`}
            >
              <span className="text-sm font-bold text-on-surface">{preset.name}</span>
              <span className="mt-1 text-xs text-on-surface-variant line-clamp-2">{preset.description}</span>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-primary">
                <span className="rounded bg-surface-container px-1.5 py-0.5">&lt; {preset.maxSizeKb} KB</span>
                {preset.widthPx && <span className="rounded bg-surface-container px-1.5 py-0.5">{preset.widthPx}x{preset.heightPx}px</span>}
                <span className="rounded bg-surface-container px-1.5 py-0.5">{preset.requiredFormat}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Universal Upload Dropzone */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-primary bg-primary-container/30 scale-[1.01]"
            : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary/60"
        }`}
      >
        <span className="material-symbols-outlined text-4xl text-primary mb-2">cloud_upload</span>
        <p className="text-base font-bold text-on-surface">
          Drag &amp; Drop your file (JPG, PNG, PDF) here, or <span className="text-primary hover:underline">click to browse</span>
        </p>
        <p className="mt-1.5 text-xs text-on-surface-variant">
          Target rules: <strong className="text-on-surface">{selectedPreset.requiredFormat}</strong> • Max size: <strong className="text-on-surface">{selectedPreset.maxSizeKb} KB</strong>
          {selectedPreset.widthPx ? ` • Target dimensions: ${selectedPreset.widthPx}x${selectedPreset.heightPx}px (${selectedPreset.aspectRatio})` : ""}
        </p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow hover:opacity-90"
        >
          <span className="material-symbols-outlined text-base">upload</span> Upload Document File
        </button>
      </div>

      {/* Processing Spinner */}
      {isProcessing && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-2 text-sm font-semibold text-primary">{progressMsg}</p>
        </div>
      )}

      {/* Image Processing Result Card */}
      {result && (
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-md space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container p-2">
              <img src={result.dataUrl} alt="Prepared document" className="max-h-48 rounded object-contain" />
            </div>

            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Compliant &amp; Prepared
                </span>
                <span className="text-xs text-on-surface-variant font-mono font-bold">
                  {result.reductionPercentage.toFixed(1)}% size reduction
                </span>
              </div>

              <h4 className="text-lg font-bold text-on-surface">{result.file.name}</h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg bg-surface-container p-2.5">
                  <span className="text-on-surface-variant block">Original Size</span>
                  <span className="font-semibold text-on-surface">{(result.originalSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="rounded-lg bg-surface-container p-2.5">
                  <span className="text-on-surface-variant block">Prepared Size</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{(result.processedSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="rounded-lg bg-surface-container p-2.5">
                  <span className="text-on-surface-variant block">Original Dimensions</span>
                  <span className="font-semibold text-on-surface">{result.originalWidth}x{result.originalHeight}px</span>
                </div>
                <div className="rounded-lg bg-surface-container p-2.5">
                  <span className="text-on-surface-variant block">Prepared Dimensions</span>
                  <span className="font-bold text-primary">{result.processedWidth}x{result.processedHeight}px</span>
                </div>
              </div>

              {result.warning && (
                <p className="text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300 p-2.5 rounded-lg border border-amber-200">
                  ⚠️ {result.warning}
                </p>
              )}

              {/* Action Buttons: Download, Replace, Delete */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href={result.dataUrl}
                  download={result.file.name}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-sm">download</span> Download Compressed Image
                </a>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-container px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined text-sm">upload</span> Replace File
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                >
                  <span className="material-symbols-outlined text-sm">delete</span> Delete File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Result Card & Live Viewer */}
      {pdfResult && (
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-4">
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span> PDF Document Signature Verified
              </span>
              <h4 className="mt-2 text-lg font-bold text-on-surface">{pdfResult.file.name}</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                File size: {(pdfResult.originalSize / 1024).toFixed(1)} KB • Header signature: %PDF
              </p>
            </div>

            {/* Action Buttons for PDF: Download, Replace, Delete */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={pdfResult.pdfUrl}
                download={pdfResult.file.name}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow hover:opacity-90"
              >
                <span className="material-symbols-outlined text-sm">download</span> Download PDF
              </a>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-sm">upload</span> Replace
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100"
              >
                <span className="material-symbols-outlined text-sm">delete</span> Delete
              </button>
            </div>
          </div>

          {/* Embedded PDF Live Viewer */}
          <div className="rounded-xl border border-outline-variant overflow-hidden bg-surface-container h-[400px]">
            <iframe
              src={pdfResult.pdfUrl}
              title="PDF Document Preview"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
