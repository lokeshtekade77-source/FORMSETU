"use client";
import React, { useState, useRef, useEffect } from "react";
import { parsePdfDocumentToProfile, ExtractedPdfProfile } from "@/lib/pdfParser";
import { getVaultFields, saveVaultFields } from "@/lib/vaultSync";

export interface VaultField {
  id: string;
  category: "personal" | "address" | "education" | "identity" | "banking";
  key: string;
  label: string;
  value: string;
  isSensitive?: boolean;
  lastUpdated: string;
}

export const DEFAULT_EMPTY_VAULT_FIELDS: VaultField[] = [
  { id: "1", category: "personal", key: "fullName", label: "Full Name", value: "", lastUpdated: "Not Set" },
  { id: "2", category: "personal", key: "fatherName", label: "Father's Name", value: "", lastUpdated: "Not Set" },
  { id: "3", category: "personal", key: "motherName", label: "Mother's Name", value: "", lastUpdated: "Not Set" },
  { id: "4", category: "personal", key: "dob", label: "Date of Birth", value: "", lastUpdated: "Not Set" },
  { id: "5", category: "personal", key: "gender", label: "Gender", value: "", lastUpdated: "Not Set" },
  { id: "6", category: "personal", key: "category", label: "Reservation Category", value: "", lastUpdated: "Not Set" },
  { id: "7", category: "address", key: "permanentAddress", label: "Permanent Address", value: "", lastUpdated: "Not Set" },
  { id: "8", category: "address", key: "district", label: "District", value: "", lastUpdated: "Not Set" },
  { id: "9", category: "address", key: "state", label: "State", value: "", lastUpdated: "Not Set" },
  { id: "10", category: "address", key: "pinCode", label: "PIN Code", value: "", lastUpdated: "Not Set" },
  { id: "11", category: "education", key: "degree", label: "Highest Qualification", value: "", lastUpdated: "Not Set" },
  { id: "12", category: "education", key: "college", label: "Institution / College", value: "", lastUpdated: "Not Set" },
  { id: "13", category: "education", key: "passingYear", label: "Year of Passing", value: "", lastUpdated: "Not Set" },
  { id: "14", category: "identity", key: "aadhaar", label: "Aadhaar Number", value: "", isSensitive: true, lastUpdated: "Not Set" },
  { id: "15", category: "identity", key: "pan", label: "PAN Card", value: "", isSensitive: true, lastUpdated: "Not Set" },
  { id: "16", category: "banking", key: "accountNumber", label: "Bank Account No.", value: "", isSensitive: true, lastUpdated: "Not Set" },
  { id: "17", category: "banking", key: "ifsc", label: "IFSC Code", value: "", lastUpdated: "Not Set" },
  { id: "18", category: "banking", key: "bankName", label: "Bank Name", value: "", lastUpdated: "Not Set" }
];

export function InfoVault() {
  const [activeTab, setActiveTab] = useState<VaultField["category"]>("personal");
  const [fields, setFields] = useState<VaultField[]>(DEFAULT_EMPTY_VAULT_FIELDS);
  const [unmaskSet, setUnmaskSet] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [extractedPdfData, setExtractedPdfData] = useState<ExtractedPdfProfile | null>(null);
  const [selectedPdfFields, setSelectedPdfFields] = useState<Record<string, boolean>>({});
  const [editedPdfValues, setEditedPdfValues] = useState<Record<string, string>>({});
  const [pdfSuccessMsg, setPdfSuccessMsg] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Load vault fields from localStorage on mount (or default empty)
  useEffect(() => {
    const saved = getVaultFields();
    if (saved && saved.length > 0 && saved.some((f) => f.value && f.value.trim() !== "")) {
      setFields(saved);
    } else {
      setFields(DEFAULT_EMPTY_VAULT_FIELDS);
    }
  }, []);

  const updateAndSaveFields = (newFields: VaultField[]) => {
    setFields(newFields);
    saveVaultFields(newFields);
  };

  const handleClearVault = () => {
    if (confirm("Are you sure you want to clear all stored vault information?")) {
      updateAndSaveFields(DEFAULT_EMPTY_VAULT_FIELDS);
      setPdfSuccessMsg("Vault cleared. Upload a PDF document to auto-fetch new records.");
    }
  };

  const filteredFields = fields.filter((f) => f.category === activeTab);
  const hasPopulatedFields = fields.some((f) => f.value && f.value.trim() !== "");

  const toggleUnmask = (id: string) => {
    setUnmaskSet((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEdit = (field: VaultField) => {
    setEditingId(field.id);
    setEditValue(field.value);
  };

  const handleSave = (id: string) => {
    const updated = fields.map((f) =>
      f.id === id ? { ...f, value: editValue, lastUpdated: new Date().toISOString().split("T")[0] } : f
    );
    updateAndSaveFields(updated);
    setEditingId(null);
  };

  // PDF Auto-Fetching & Extracted Review Handler
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingPdf(true);
    setPdfSuccessMsg(null);
    setExtractedPdfData(null);

    try {
      const parsed = await parsePdfDocumentToProfile(file);
      setExtractedPdfData(parsed);

      const initialSelected: Record<string, boolean> = {};
      const initialValues: Record<string, string> = {};

      parsed.extractedFields.forEach((field) => {
        initialSelected[field.key] = true;
        initialValues[field.key] = field.value;
      });

      setSelectedPdfFields(initialSelected);
      setEditedPdfValues(initialValues);
    } catch {
      alert("Failed to parse PDF document.");
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Apply selected PDF extracted fields directly into the Vault
  const handleApplyPdfToVault = () => {
    if (!extractedPdfData) return;

    const today = new Date().toISOString().split("T")[0];
    let appliedCount = 0;

    const nextFields = [...fields];

    extractedPdfData.extractedFields.forEach((extracted) => {
      if (selectedPdfFields[extracted.key]) {
        const finalVal = editedPdfValues[extracted.key] || extracted.value;
        const idx = nextFields.findIndex((f) => f.key.toLowerCase() === extracted.key.toLowerCase());

        if (idx >= 0) {
          nextFields[idx] = {
            ...nextFields[idx],
            value: finalVal,
            lastUpdated: today
          };
          appliedCount++;
        }
      }
    });

    updateAndSaveFields(nextFields);
    setPdfSuccessMsg(`✓ Successfully auto-fetched and saved ${appliedCount} profile fields from ${extractedPdfData.fileName} to your Information Vault!`);
    setExtractedPdfData(null);
  };

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-5">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">inventory_2</span>
            Information Vault
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Centralized profile data store. Upload an external PDF to auto-fetch your details or edit fields manually.
          </p>
        </div>

        {/* Action Buttons: Auto-Fetch PDF & Clear Vault */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            ref={pdfInputRef}
            accept=".pdf,.json,.txt"
            onChange={handlePdfUpload}
            className="hidden"
          />
          <button
            onClick={() => pdfInputRef.current?.click()}
            disabled={isExtractingPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow hover:opacity-90 transition"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            {isExtractingPdf ? "Parsing PDF Text..." : "📄 Auto-Fetch Profile Data from External PDF"}
          </button>
          {hasPopulatedFields && (
            <button
              onClick={handleClearVault}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100"
            >
              <span className="material-symbols-outlined text-sm">delete</span> Clear Vault
            </button>
          )}
        </div>
      </div>

      {/* First-Time Empty Banner */}
      {!hasPopulatedFields && !extractedPdfData && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/40 p-4 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-blue-600 animate-pulse">lightbulb</span>
            <div>
              <strong className="block font-bold text-sm">Information Vault is Currently Empty</strong>
              <span className="text-xs text-blue-800 dark:text-blue-300">
                Click <strong>📄 Auto-Fetch Profile Data from External PDF</strong> above to upload your resume or application form PDF. All fields will auto-populate instantly!
              </span>
            </div>
          </div>
          <button
            onClick={() => pdfInputRef.current?.click()}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-blue-700 whitespace-nowrap"
          >
            Upload PDF Now
          </button>
        </div>
      )}

      {/* Success Notification */}
      {pdfSuccessMsg && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {pdfSuccessMsg}
          </div>
          <button onClick={() => setPdfSuccessMsg(null)} className="text-xs underline font-normal">
            Dismiss
          </button>
        </div>
      )}

      {/* Extracted PDF Data Review & Apply Card */}
      {extractedPdfData && (
        <div className="rounded-2xl border-2 border-primary/40 bg-surface-container-lowest p-6 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-4">
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary-container/40 px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span> PDF Extracted Profile Data
              </span>
              <h3 className="mt-2 text-lg font-bold text-on-surface">
                Extracted Fields from {extractedPdfData.fileName} ({extractedPdfData.fileSizeKb} KB)
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Review the parsed applicant data below. Select fields to import into your Information Vault.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyPdfToVault}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow hover:opacity-90"
              >
                <span className="material-symbols-outlined text-sm">task_alt</span>
                Apply Selected Data to Vault ({Object.values(selectedPdfFields).filter(Boolean).length})
              </button>
              <button
                onClick={() => setExtractedPdfData(null)}
                className="rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {extractedPdfData.extractedFields.map((field) => {
              const isChecked = !!selectedPdfFields[field.key];
              const currentVal = editedPdfValues[field.key] ?? field.value;

              return (
                <div
                  key={field.key}
                  className={`rounded-xl border p-3 transition-all ${
                    isChecked
                      ? "border-primary bg-primary-container/10"
                      : "border-outline-variant bg-surface-container-lowest opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setSelectedPdfFields((prev) => ({ ...prev, [field.key]: e.target.checked }))
                        }
                        className="rounded border-primary text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-xs font-bold text-on-surface">{field.label}</span>
                    </label>
                    <span className="text-[10px] text-primary font-mono">{field.key}</span>
                  </div>

                  <div className="mt-2">
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) =>
                        setEditedPdfValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      disabled={!isChecked}
                      className="w-full rounded-lg border border-outline-variant bg-surface px-2.5 py-1 text-xs font-semibold text-on-surface focus:border-primary focus:outline-none disabled:bg-surface-container-low"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-outline-variant pb-3">
        {[
          { id: "personal", label: "Personal", icon: "person" },
          { id: "address", label: "Address", icon: "home" },
          { id: "education", label: "Education", icon: "school" },
          { id: "identity", label: "Identity Proofs", icon: "badge" },
          { id: "banking", label: "Banking & Grants", icon: "account_balance" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as VaultField["category"])}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-primary text-on-primary shadow"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Field List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredFields.map((field) => {
          const isMasked = field.isSensitive && !unmaskSet[field.id];
          const isEditing = editingId === field.id;
          const isEmpty = !field.value || field.value.trim() === "";

          return (
            <div
              key={field.id}
              className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                isEmpty
                  ? "border-dashed border-outline-variant bg-surface-container-lowest/60"
                  : "border-outline-variant bg-surface-container-lowest hover:shadow-md"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    {field.label}
                  </span>
                  <span className="text-[10px] text-on-surface-variant/70">
                    {isEmpty ? "Not set" : `Updated ${field.lastUpdated}`}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-on-surface focus:outline-none"
                    />
                  ) : (
                    <p className={`text-base font-semibold ${isEmpty ? "text-on-surface-variant/50 italic text-sm" : "text-on-surface"}`}>
                      {isEmpty ? "Empty — click edit or auto-fetch PDF" : isMasked ? "•••• •••• ••••" : field.value}
                    </p>
                  )}

                  {field.isSensitive && !isEditing && !isEmpty && (
                    <button
                      onClick={() => toggleUnmask(field.id)}
                      className="ml-2 text-on-surface-variant hover:text-primary"
                      title={isMasked ? "Show Value" : "Hide Value"}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isMasked ? "visibility" : "visibility_off"}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2 border-t border-outline-variant/50 pt-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleSave(field.id)}
                      className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-on-primary"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEdit(field)}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <span className="material-symbols-outlined text-xs">edit</span> {isEmpty ? "+ Add Value" : "Edit"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
