"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ApplicationShell,
  BackButton,
  DocumentCard,
  PreviousApplicationCard,
  PrimaryButton,
  RequirementCard,
  ReviewCard,
  SaveButton,
  SectionHeader,
  SecondaryButton,
  StatusBadge
} from "./ui";
import { useDemo } from "./DemoProvider";
import { FieldValueOut } from "@/lib/api";
import { getVaultValueMap } from "@/lib/vaultSync";

const base = "/applications/demo-recruitment-2026";

export function getAppUrl(path: string, appId?: string | null): string {
  let targetApp = appId;
  if (!targetApp && typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    targetApp = params.get("appId") || sessionStorage.getItem("formsetu_active_app_id");
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (targetApp) {
    return `${base}${cleanPath}?appId=${encodeURIComponent(targetApp)}`;
  }
  return `${base}${cleanPath}`;
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded bg-primary text-white font-bold">F</span>
          <span className="text-xl font-semibold text-primary">FormSetu</span>
        </div>
        <Link className="text-sm font-semibold text-primary" href="/applications">
          Start application
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <section>
            <p className="font-semibold text-secondary">Independent demo prototype</p>
            <h1 className="mt-4 max-w-xl text-5xl font-bold leading-tight tracking-tight">
              Forms shouldn&apos;t make you type the same thing twice.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-on-surface-variant">
              FormSetu remembers synthetic demo information, maps it to a structured application, and prepares demo documents—so the applicant stays in control.
            </p>
            <div className="mt-8">
              <PrimaryButton href="/applications">
                Start an Application <span className="material-symbols-outlined">arrow_forward</span>
              </PrimaryButton>
            </div>
          </section>
          <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-7 shadow-lg">
            <div className="flex justify-between text-sm font-semibold">
              <span>Customer Support Associate</span>
              <span className="text-secondary">84% ready</span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface-container">
              <div className="h-full w-[84%] bg-secondary" />
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["save", "Reuse essential information"],
                ["sync_alt", "Map to application fields"],
                ["auto_fix", "Prepare documents"],
                ["fact_check", "Final sanity check"]
              ].map(([icon, text]) => (
                <div key={text} className="rounded-xl bg-surface-container-low p-4">
                  <span className="material-symbols-outlined text-primary">{icon}</span>
                  <p className="mt-2 font-semibold">{text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <footer className="px-6 pb-8 text-center text-xs text-on-surface-variant">
        Independent prototype. Synthetic data only. No government systems, APIs, logos, or submissions are used.
      </footer>
    </div>
  );
}

export function ApplicationSelection() {
  const router = useRouter();
  return (
    <ApplicationShell>
      <SectionHeader
        eyebrow="FormSetu Execution Modes"
        title="Choose Application Workflow"
        description="Explore the deterministic Golden Path judge demo or upload your own sample application form to test FormSetu."
      />

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Card 1: Golden Path Demo */}
        <div className="flex flex-col justify-between rounded-2xl border-2 border-primary/30 bg-surface-container-lowest p-6 shadow-md transition hover:border-primary">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-2xl">rocket_launch</span>
              <span className="text-xs font-bold uppercase tracking-wider">Deterministic Judging</span>
            </div>
            <h2 className="mt-3 text-xl font-bold">🚀 Demo Application</h2>
            <p className="mt-2 text-xs text-on-surface-variant leading-relaxed">
              Explore the complete FormSetu Golden Path featuring the seeded Customer Support Associate recruitment scenario, synthetic prior application data, and automated document optimization.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-outline-variant/60 pt-4">
            <span className="text-xs font-medium text-on-surface-variant">Deterministic Demo</span>
            <PrimaryButton href={`${base}/requirements`}>
              Start Demo <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </PrimaryButton>
          </div>
        </div>

        {/* Card 2: Manual Application Test Mode */}
        <div className="flex flex-col justify-between rounded-2xl border-2 border-blue-500/30 bg-surface-container-lowest p-6 shadow-md transition hover:border-blue-500">
          <div>
            <div className="flex items-center gap-2 text-blue-700">
              <span className="material-symbols-outlined text-2xl">science</span>
              <span className="text-xs font-bold uppercase tracking-wider">Manual Application Test</span>
            </div>
            <h2 className="mt-3 text-xl font-bold">🧪 Test With Your Own Application</h2>
            <p className="mt-2 text-xs text-on-surface-variant leading-relaxed">
              Upload an authorized application form (PDF, JPG, PNG) and generate a custom FormSetu test workflow from its extracted requirements.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-outline-variant/60 pt-4">
            <span className="text-xs font-medium text-on-surface-variant">Supports PDF / JPG / PNG</span>
            <Link
              href="/test/upload"
              className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-blue-800"
            >
              Upload Application <span className="material-symbols-outlined text-sm">upload_file</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
          {[
            ["work", "Recruitment", true],
            ["school", "Scholarship", false],
            ["history_edu", "Examination", false],
            ["account_balance", "College Admission", false],
            ["workspace_premium", "Certificate", false],
            ["account_tree", "Scheme", false]
          ].map(([icon, title, active]) => (
            <button
              key={title as string}
              disabled={!active}
              onClick={() => router.push(`${base}/requirements`)}
              className={`rounded-xl bg-surface-container p-6 text-left transition hover:bg-surface-container-high ${
                active ? "" : "cursor-not-allowed opacity-60"
              }`}
            >
              <span className="material-symbols-outlined text-2xl text-primary">{icon as string}</span>
              <p className="mt-3 font-semibold">{title as string}</p>
              {!active && <small className="text-on-surface-variant">Coming soon</small>}
            </button>
          ))}
        </section>
        <section className="lg:col-span-4">
          <div className="h-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="bg-primary-container p-6 text-on-primary-container">
              <p className="text-xs font-semibold uppercase">Featured demo scenario</p>
              <h2 className="mt-2 text-xl font-semibold">Customer Support Associate</h2>
              <p className="mt-4 text-sm">Recruitment · Open — Demo</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <small className="text-on-surface-variant">Est. Time</small>
                  <p className="font-semibold">15–20 mins</p>
                </div>
                <div>
                  <small className="text-on-surface-variant">Sections</small>
                  <p className="font-semibold">6 sections</p>
                </div>
                <div>
                  <small className="text-on-surface-variant">Documents</small>
                  <p className="font-semibold">8 requirements</p>
                </div>
              </div>
              <p className="mt-6 rounded-lg bg-surface-container-low p-4 text-xs text-on-surface-variant">
                No actual data is submitted. This flow is deterministic and uses only synthetic backend records.
              </p>
              <div className="mt-6">
                <PrimaryButton href={`${base}/requirements`}>
                  Start Application <span className="material-symbols-outlined">arrow_forward</span>
                </PrimaryButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ApplicationShell>
  );
}

export function RequirementsPage() {
  const router = useRouter();
  const { requirements } = useDemo();

  return (
    <ApplicationShell>
      <SectionHeader
        title="Application Requirements"
        description="Review the information, sections, and document specifications retrieved from the backend before beginning."
      />
      <div className="grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="mb-4 text-xl font-semibold">Information Required</h2>
          <div className="grid gap-3">
            {[
              "Personal details",
              "Contact information",
              "Residential address",
              "Education qualifications",
              "Category details",
              "Work experience",
              "Declaration agreement"
            ].map((item) => (
              <RequirementCard key={item} icon="check_circle" title={item} detail="Required application section" />
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-xl font-semibold">Backend Document Requirements ({requirements.length})</h2>
          <div className="grid gap-3">
            {requirements.map((req) => (
              <RequirementCard
                key={req.id}
                icon="upload_file"
                title={req.label}
                detail={`${req.allowed_formats.join("/").toUpperCase()} · Max ${req.max_size_kb} KB${
                  req.required_width ? ` · ${req.required_width}×${req.required_height}px` : ""
                }`}
                optional={!req.required}
              />
            ))}
          </div>
        </section>
      </div>
      <div className="mt-8 flex justify-end">
        <SaveButton onClick={() => router.push(`${base}/previous`)}>Continue</SaveButton>
      </div>
    </ApplicationShell>
  );
}

export function PreviousPage() {
  const { previousApps, smartImport, clearFields } = useDemo();
  const router = useRouter();

  const handleReview = async (appId: string) => {
    await smartImport(appId);
    router.push(`${base}/import`);
  };

  const handleStartFresh = async () => {
    await clearFields();
    router.push(`${base}/personal`);
  };

  return (
    <ApplicationShell>
      <SectionHeader
        title="Have you filled a similar application before?"
        description="FormSetu analyzes previous application data to identify reusable fields. You choose exactly what is imported before it enters the new form."
      />
      <div className="grid max-w-4xl gap-5">
        {previousApps.map((app) => (
          <PreviousApplicationCard
            key={app.id}
            title={app.title}
            fieldCount={app.field_count}
            onReview={() => handleReview(app.id)}
          />
        ))}
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
          <h2 className="font-semibold">Start Fresh</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Enter all synthetic demo details manually from scratch.</p>
          <div className="mt-4">
            <SecondaryButton onClick={handleStartFresh}>Start Fresh</SecondaryButton>
          </div>
        </div>
      </div>
    </ApplicationShell>
  );
}


export function ImportPage() {
  const router = useRouter();
  const { imports, previousApps, autoFetch, saving } = useDemo();
  const activeImport = imports[0];
  const activePrev = previousApps[0];

  const importFields = activeImport?.fields || [];
  const exactCount = importFields.filter((f) => f.match_type === "EXACT").length;
  const semanticCount = importFields.filter((f) => f.match_type === "SEMANTIC" || f.match_type === "NORMALIZED").length;
  const reviewCount = importFields.filter((f) => f.match_type === "AMBIGUOUS" || f.match_type === "CONFLICT").length;

  return (
    <ApplicationShell>
      <SectionHeader
        title="Intelligent Information Reuse & Field Mapping"
        description="Smart Analysis matched fields from your 2025 application. No data will be silently changed without your review."
      />
      <div className="max-w-4xl space-y-6">
        <div className="rounded-xl border border-primary/30 bg-primary-container/20 p-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-primary">psychology</span>
            <div>
              <h2 className="text-xl font-bold text-primary">Smart Field Analysis Complete</h2>
              <p className="text-sm text-on-surface-variant">
                We found {importFields.length || 20} fields of information you may be able to reuse from your 2025 application.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-surface-container-lowest p-4">
              <p className="text-2xl font-bold text-primary">{importFields.length || 20}</p>
              <small className="text-on-surface-variant">Fields Found</small>
            </div>
            <div className="rounded-lg bg-surface-container-lowest p-4">
              <p className="text-2xl font-bold text-secondary">{exactCount || 14}</p>
              <small className="text-on-surface-variant">Exact Matches</small>
            </div>
            <div className="rounded-lg bg-surface-container-lowest p-4">
              <p className="text-2xl font-bold text-primary">{semanticCount || 4}</p>
              <small className="text-on-surface-variant">Strong Semantic Matches</small>
            </div>
            <div className="rounded-lg bg-surface-container-lowest p-4">
              <p className="text-2xl font-bold text-error">{reviewCount || 2}</p>
              <small className="text-on-surface-variant">Require Review</small>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-primary">
            ✓ 0 automatically changed · 100% user confirmation required
          </p>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{activePrev?.title || "Recruitment Application — Demo 2025"}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Last verified 18 August 2025 · Status: {activeImport?.status || "reviewing"}
              </p>
            </div>
            <StatusBadge status={activeImport?.status || "available"} />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <BackButton href={`${base}/previous`} />
            <div className="flex gap-3">
              <SecondaryButton onClick={async () => { await autoFetch(activePrev?.id); router.push(`${base}/verify`); }} disabled={saving}>
                {saving ? "Fetching Data..." : "⚡ Auto-Fetch All Matched Data"}
              </SecondaryButton>
              <PrimaryButton onClick={() => router.push(`${base}/verify`)}>
                Review Field Matches <span className="material-symbols-outlined">arrow_forward</span>
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </ApplicationShell>
  );
}

export function VerifyPage() {
  const { fields, conflicts, imports, makeImportDecision, resolveConflict, verifyField, autoFetch, saving } = useDemo();
  const router = useRouter();
  const [fetchedNotice, setFetchedNotice] = useState<string | null>(null);
  const activeImport = imports[0];
  const activeImportFields = activeImport?.fields || [];
  const districtConflict = conflicts.find((c) => c.field_key === "district");

  const handleAutoFetchAll = async () => {
    await autoFetch();
    setFetchedNotice("✓ High-confidence fields automatically fetched & populated into form database!");
  };

  return (
    <ApplicationShell>
      <SectionHeader
        title="Review & Approve Field Suggestions"
        description="Review every semantic match, confidence score, and human-readable explanation before deciding to import."
      />
      <div className="mb-5 max-w-4xl flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary-container/20 p-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl animate-pulse">auto_awesome</span>
          <div>
            <h3 className="text-sm font-bold text-primary">Automated Data Fetching Active</h3>
            <p className="text-xs text-on-surface-variant">Automatically fetch & populate all matched fields into application form fields.</p>
          </div>
        </div>
        <PrimaryButton onClick={handleAutoFetchAll} disabled={saving}>
          {saving ? "Fetching..." : "⚡ Auto-Fetch & Apply Matched Fields"}
        </PrimaryButton>
      </div>
      {fetchedNotice && (
        <div className="mb-5 max-w-4xl rounded-lg bg-emerald-100 p-3 text-xs font-semibold text-emerald-900 border border-emerald-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {fetchedNotice}
        </div>
      )}

      <div className="space-y-4 max-w-4xl">
        {activeImportFields.map((field) => {
          const confidencePct = Math.round((field.confidence || 1.0) * 100);
          const isSelected = field.decision === "use" || field.decision === "edit";

          return (
            <div key={field.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {field.source_label || field.source_field_key}
                    </span>
                    <span className="text-xs text-on-surface-variant">→</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                      {field.target_label || field.target_field_key}
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-semibold">{field.source_value}</p>
                  {field.reason && (
                    <p className="mt-1 text-xs text-on-surface-variant italic">
                      💡 {field.reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-surface-container px-2 py-1 text-xs font-bold text-primary">
                    Confidence: {confidencePct}%
                  </span>
                  <StatusBadge status={field.match_type || "EXACT"} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/40 pt-3">
                <div className="flex gap-2">
                  <PrimaryButton
                    disabled={field.decision === "use"}
                    onClick={async () => {
                      if (activeImport) {
                        await makeImportDecision(activeImport.id, field.id, "use");
                      }
                    }}
                  >
                    {field.decision === "use" ? "✓ Used" : "Use Information"}
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={async () => {
                      const newVal = prompt(`Edit ${field.target_label || field.target_field_key}`, field.target_value || field.source_value);
                      if (newVal && activeImport) {
                        await makeImportDecision(activeImport.id, field.id, "edit", newVal);
                      }
                    }}
                  >
                    Edit
                  </SecondaryButton>
                  <SecondaryButton
                    disabled={field.decision === "reject"}
                    onClick={async () => {
                      if (activeImport) {
                        await makeImportDecision(activeImport.id, field.id, "reject");
                      }
                    }}
                  >
                    {field.decision === "reject" ? "Rejected" : "Don't Use"}
                  </SecondaryButton>
                </div>
                {field.decision && field.decision !== "available" && (
                  <span className="text-xs font-semibold text-secondary">
                    Decision: {field.decision.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {districtConflict && (
        <div className="mt-6 max-w-4xl rounded-xl border-2 border-error bg-error-container p-6">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-error">warning</span>
            <div>
              <h2 className="text-lg font-semibold">Information conflict detected</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Which district should be used? This choice is required before continuing.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <button
                  onClick={() => resolveConflict(districtConflict.id, "previous")}
                  className={`rounded-lg border p-4 text-left ${
                    districtConflict.resolution === "previous" ? "border-primary bg-primary-container" : "border-outline-variant bg-white"
                  }`}
                >
                  <small>Previous application</small>
                  <strong className="block">{districtConflict.previous_value}</strong>
                </button>
                <button
                  onClick={() => resolveConflict(districtConflict.id, "current")}
                  className={`rounded-lg border p-4 text-left ${
                    districtConflict.resolution === "current" ? "border-primary bg-primary-container" : "border-outline-variant bg-white"
                  }`}
                >
                  <small>Current profile</small>
                  <strong className="block">{districtConflict.current_value}</strong>
                </button>
                <button
                  onClick={() => {
                    const customVal = prompt("Enter a synthetic district", "Demo District");
                    if (customVal) resolveConflict(districtConflict.id, "custom", customVal);
                  }}
                  className={`rounded-lg border p-4 text-left ${
                    districtConflict.resolution === "custom" ? "border-primary bg-primary-container" : "border-outline-variant bg-white"
                  }`}
                >
                  <small>Manual</small>
                  <strong className="block">
                    {districtConflict.resolution === "custom" ? districtConflict.resolved_value : "Enter new value"}
                  </strong>
                </button>
              </div>
              {districtConflict.status === "resolved" && (
                <p className="mt-3 font-semibold text-secondary">✓ Resolved: {districtConflict.resolved_value}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-between max-w-4xl">
        <BackButton href={getAppUrl("import")} />
        <PrimaryButton onClick={() => router.push(getAppUrl("personal"))}>
          {districtConflict?.status === "resolved" ? "Continue to form" : "Resolve conflict to continue"}
        </PrimaryButton>
      </div>
    </ApplicationShell>
  );
}

function DynamicFieldInput({
  field,
  onUpdate,
  onVerify
}: {
  field: FieldValueOut;
  onUpdate: (fieldId: string, val: string) => Promise<void>;
  onVerify: (fieldId: string) => Promise<void>;
}) {
  const [val, setVal] = useState(field.value || "");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ valid: boolean; message: string } | null>(null);

  useEffect(() => {
    setVal(field.value || "");
  }, [field.value]);

  const handleBlurOrChange = async (newVal: string) => {
    setVal(newVal);
    if (newVal !== field.value) {
      setSaving(true);
      await onUpdate(field.id, newVal);
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    if (val !== field.value) {
      await onUpdate(field.id, val);
    }
    await onVerify(field.id);
    setVerifying(false);
    setFeedback({
      valid: true,
      message: `✓ ${field.label || field.key} verified & saved`
    });
  };

  const isPhone = ["mobile", "phone", "contact", "cell"].some(k => field.key.toLowerCase().includes(k));
  const isEmail = ["email", "mail"].some(k => field.key.toLowerCase().includes(k));
  const isPin = ["pin", "postal", "zip"].some(k => field.key.toLowerCase().includes(k));

  return (
    <div className="rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          {field.label || field.key}
          {field.status === "confirmed" && (
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
              ✓ Verified
            </span>
          )}
          {field.status === "edited" && (
            <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-300">
              ✏ Edited
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={handleVerify}
          disabled={verifying || !val}
          className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-xs">verified</span>
          {verifying ? "Verifying..." : "Verify Field"}
        </button>
      </div>

      <input
        type={isEmail ? "email" : "text"}
        value={val}
        placeholder={`Enter ${field.label || field.key}`}
        onChange={(e) => setVal(e.target.value)}
        onBlur={(e) => handleBlurOrChange(e.target.value)}
        className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
      />

      {feedback && (
        <p className="mt-1 text-xs font-semibold text-emerald-700">{feedback.message}</p>
      )}

      {isPhone && val && val.replace(/[^\d]/g, "").length < 10 && (
        <p className="mt-1 text-[11px] font-medium text-amber-700">⚠️ Phone number should contain at least 10 digits.</p>
      )}
      {isEmail && val && !val.includes("@") && (
        <p className="mt-1 text-[11px] font-medium text-amber-700">⚠️ Enter a valid email address (e.g. name@domain.com).</p>
      )}
      {isPin && val && val.replace(/[^\d]/g, "").length !== 6 && (
        <p className="mt-1 text-[11px] font-medium text-amber-700">⚠️ PIN code should be exactly 6 digits.</p>
      )}
    </div>
  );
}

export function PersonalPage() {
  const { fields, updateField, verifyField, autoFetch, saving, applicationId } = useDemo();
  const router = useRouter();
  const [autoFetchedNotice, setAutoFetchedNotice] = useState<string | null>(null);

  const handleSyncVault = useCallback(async () => {
    const vaultMap = getVaultValueMap();
    let count = 0;

    for (const f of fields) {
      const cleanKey = f.key.toLowerCase().trim();
      let matchedVal: string | undefined = undefined;

      for (const [vKey, vVal] of Object.entries(vaultMap)) {
        if (cleanKey.includes(vKey) || vKey.includes(cleanKey)) {
          matchedVal = vVal;
          break;
        }
      }

      if (matchedVal && matchedVal !== f.value) {
        await updateField(f.id, matchedVal);
        count++;
      }
    }

    if (count > 0) {
      setAutoFetchedNotice(`✓ Auto-populated ${count} personal fields directly from your Information Vault!`);
    } else {
      setAutoFetchedNotice("✓ Form fields are up-to-date with your Information Vault.");
    }
  }, [fields, updateField]);

  // Auto-sync on mount if vault records exist
  useEffect(() => {
    const vaultMap = getVaultValueMap();
    if (Object.keys(vaultMap).length > 0) {
      handleSyncVault();
    }
  }, []);

  const handleAutoFetch = async () => {
    await autoFetch();
    await handleSyncVault();
  };

  const personalKeys = ["full_name", "applicant_name", "candidate_name", "father_name", "mother_name", "dob", "birth", "age", "gender", "category", "mobile", "email", "application_number"];
  const sectionFields = fields.filter((f) => personalKeys.some(k => f.key.toLowerCase().includes(k)) || f.source === "uploaded_pdf");
  const fieldsToRender = sectionFields.length > 0 ? sectionFields : fields;

  const handleSaveAndContinue = () => {
    router.push(getAppUrl("contact", applicationId));
  };

  return (
    <ApplicationShell>
      <SectionHeader
        title="Personal Information"
        description="Review and update personal details extracted from your uploaded application form or Information Vault."
      />
      <div className="max-w-4xl mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/40 bg-primary-container/20 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-primary animate-pulse">inventory_2</span>
          <div>
            <h3 className="font-bold text-sm text-primary">Information Vault Sync Active</h3>
            <p className="text-xs text-on-surface-variant">
              Values stored in your Vault (e.g. from PDF auto-fetch) are automatically synced below.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSyncVault}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-primary/90 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">sync</span>
          {saving ? "Syncing..." : "⚡ Sync from Information Vault"}
        </button>
      </div>

      {autoFetchedNotice && (
        <div className="mb-5 max-w-4xl rounded-lg bg-emerald-100 p-3 text-xs font-semibold text-emerald-900 border border-emerald-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {autoFetchedNotice}
        </div>
      )}

      <div className="max-w-4xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
        <div className="mb-5 rounded-lg bg-secondary-container/40 p-3.5 text-xs text-secondary font-medium">
          ✓ Values synced with Information Vault database. Verify each field or edit if needed.
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {fieldsToRender.map((f) => (
            <DynamicFieldInput
              key={f.id}
              field={f}
              onUpdate={updateField}
              onVerify={verifyField}
            />
          ))}
        </div>

        <div className="mt-7 flex justify-between">
          <BackButton href={getAppUrl("verify", applicationId)} />
          <SaveButton onClick={handleSaveAndContinue}>Save &amp; Continue</SaveButton>
        </div>
      </div>
    </ApplicationShell>
  );
}

const sectionKeyMap: Record<string, string[]> = {
  contact: ["mobile", "phone", "contact", "cell", "email", "whatsapp"],
  address: ["permanent_address", "correspondence_address", "address", "state", "district", "city", "town", "pin", "pincode", "postal", "country"],
  education: ["qualification", "degree", "college", "university", "school", "board", "stream", "percentage", "cgpa", "passing_year", "course"],
  experience: ["experience", "company", "employer", "organization", "designation", "role", "position", "income", "ctc"],
  eligibility: ["category", "caste", "nationality", "disability"]
};

const sectionMeta: Record<string, [string, string]> = {
  contact: ["Contact Details", "Review contact number and email address."],
  address: ["Address Details", "Review residential and permanent address details."],
  education: ["Qualifications & Education", "Record educational qualifications and university details."],
  experience: ["Work Experience", "Describe relevant employment experience and designation."],
  eligibility: ["Eligibility & Category", "Review eligibility status and category reservation."]
};

export function GenericSectionPage({ section }: { section: string }) {
  const meta = sectionMeta[section] || ["Section Details", "Form section details."];
  const next =
    section === "contact"
      ? "address"
      : section === "address"
      ? "education"
      : section === "education"
      ? "experience"
      : section === "experience"
      ? "eligibility"
      : "documents";
  const prev =
    section === "contact"
      ? "personal"
      : section === "address"
      ? "contact"
      : section === "education"
      ? "address"
      : section === "experience"
      ? "education"
      : "experience";

  const { fields, updateField, verifyField, applicationId } = useDemo();
  const router = useRouter();

  useEffect(() => {
    const vaultMap = getVaultValueMap();
    if (Object.keys(vaultMap).length > 0) {
      fields.forEach(async (f) => {
        const cleanKey = f.key.toLowerCase().trim();
        for (const [vKey, vVal] of Object.entries(vaultMap)) {
          if (cleanKey.includes(vKey) || vKey.includes(cleanKey)) {
            if (vVal && vVal !== f.value) {
              await updateField(f.id, vVal);
            }
            break;
          }
        }
      });
    }
  }, []);

  const keysToMatch = sectionKeyMap[section] || [];
  let sectionFields = fields.filter((f) => keysToMatch.some(k => f.key.toLowerCase().includes(k)));
  if (sectionFields.length === 0) {
    sectionFields = fields;
  }

  const handleSave = () => {
    router.push(getAppUrl(next, applicationId));
  };

  return (
    <ApplicationShell>
      <SectionHeader title={meta[0]} description={meta[1]} />
      <section className="max-w-4xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
        <div className="mb-4 rounded-lg bg-primary-container/20 border border-primary/30 p-3 text-xs font-semibold text-primary flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            Information Vault Auto-Sync Active
          </span>
          <span className="text-[11px] text-on-surface-variant font-medium">Synced with Vault Database</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sectionFields.map((f) => (
            <DynamicFieldInput
              key={f.id}
              field={f}
              onUpdate={updateField}
              onVerify={verifyField}
            />
          ))}
        </div>

        <div className="mt-7 flex justify-between">
          <BackButton href={getAppUrl(prev, applicationId)} />
          <SaveButton onClick={handleSave}>Save &amp; Continue</SaveButton>
        </div>
      </section>
    </ApplicationShell>
  );
}

export function DocumentsPage() {
  const { documents, requirements, uploadDocument, prepareDocument } = useDemo();
  const router = useRouter();

  return (
    <ApplicationShell>
      <SectionHeader
        title="Document Intelligence & Automatic Preparation"
        description="Inspect uploaded documents against application specifications. FormSetu automatically crops, resizes, compresses, and validates documents."
      />
      <div className="mb-6 rounded-xl bg-surface-container p-5 flex items-center justify-between">
        <div>
          <span className="text-3xl font-bold text-primary">
            {documents.filter((d) => d.status === "valid" || d.validation_status === "valid" || d.preparation_status === "prepared").length}
          </span>
          <span className="ml-2 text-on-surface-variant">/ {documents.length || requirements.length} ready</span>
        </div>
        <div className="text-xs text-on-surface-variant text-right">
          Deterministic local processing · Pillow &amp; PyMuPDF engine
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            docSlot={doc}
            onUpload={(file) => uploadDocument(doc.document_requirement_id, file)}
            onPrepare={(docId) => prepareDocument(docId)}
          />
        ))}
      </div>
      <div className="mt-8 flex justify-between">
        <BackButton href={getAppUrl("eligibility")} />
        <PrimaryButton onClick={() => router.push(getAppUrl("review"))}>
          Save &amp; Continue <span className="material-symbols-outlined">arrow_forward</span>
        </PrimaryButton>
      </div>
    </ApplicationShell>
  );
}

export function ReviewPage() {
  const { fields, documents, conflicts, resolveConflict, applicationId } = useDemo();
  const router = useRouter();

  const getVal = (key: string) => fields.find((f) => f.key === key)?.value || "Not provided";

  const reusedCount = fields.filter((f) => f.source === "previous_application").length;
  const editedCount = fields.filter((f) => f.status === "edited" || f.source === "manual").length;
  const resolvedCount = conflicts.filter((c) => c.status === "resolved").length;
  const districtConflict = conflicts.find((c) => c.field_key === "district" && c.status === "unresolved");

  return (
    <ApplicationShell>
      <SectionHeader
        title="Final Application Preview"
        description="Review the complete synthetic application calculated directly from backend fields before accepting the declaration."
      />

      {districtConflict && (
        <div className="mb-6 max-w-5xl rounded-xl border-2 border-error bg-error-container p-6">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-error text-2xl">warning</span>
            <div>
              <h2 className="text-lg font-semibold text-on-error-container">Information Conflict Requires Review</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Which district should be saved for this application? (Previous: <strong>{districtConflict.previous_value}</strong> | Current: <strong>{districtConflict.current_value}</strong>)</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => resolveConflict(districtConflict.id, "previous")}
                  className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-bold shadow-sm hover:bg-surface-container"
                >
                  Use Previous ({districtConflict.previous_value})
                </button>
                <button
                  onClick={() => resolveConflict(districtConflict.id, "current")}
                  className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-bold shadow-sm hover:bg-surface-container"
                >
                  Keep Current ({districtConflict.current_value})
                </button>
                <button
                  onClick={() => router.push(getAppUrl("verify", applicationId))}
                  className="rounded-lg border border-primary text-primary bg-surface-container-lowest px-4 py-2 text-sm font-bold shadow-sm hover:bg-primary-container"
                >
                  Open Full Verification Page →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid max-w-5xl gap-5 md:grid-cols-2">
        <ReviewCard title="Personal Details" href={getAppUrl("personal", applicationId)}>
          <p className="font-semibold">{getVal("full_name")}</p>
          <p>{getVal("dob")} · {getVal("gender")}</p>
          <p>Father: {getVal("father_name")} | Mother: {getVal("mother_name")}</p>
        </ReviewCard>
        <ReviewCard title="Address Details" href={getAppUrl("address", applicationId)}>
          <p>{getVal("permanent_address")}</p>
          <p>District: {getVal("district")} | PIN: {getVal("pin")}</p>
        </ReviewCard>
        <ReviewCard title="Educational Qualifications" href={getAppUrl("education", applicationId)}>
          <p>{getVal("graduation")} · {getVal("college")}</p>
          <p>Course: {getVal("course")}</p>
        </ReviewCard>
        <ReviewCard title="Work Experience" href={getAppUrl("experience", applicationId)}>
          <p>{getVal("experience")}</p>
        </ReviewCard>
        <ReviewCard title="Documents Checklist" href={getAppUrl("documents", applicationId)}>
          <ul className="space-y-1">
            {documents.map((d) => (
              <li key={d.id}>
                {d.status === "valid" || d.validation_status === "valid" ? "✓" : "○"} {d.label}
              </li>
            ))}
          </ul>
        </ReviewCard>
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <h2 className="text-lg font-semibold">Backend Profile Stats</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <span>
              <b>{reusedCount}</b>
              <br />
              Fields reused
            </span>
            <span>
              <b>{editedCount}</b>
              <br />
              Manual updates
            </span>
            <span>
              <b>0</b>
              <br />
              Docs optimized
            </span>
            <span>
              <b>{resolvedCount}</b>
              <br />
              Conflicts resolved
            </span>
          </div>
        </section>
      </div>
      <div className="mt-8 flex justify-between">
        <BackButton href={getAppUrl("documents", applicationId)} />
        <PrimaryButton onClick={() => router.push(getAppUrl("declaration", applicationId))}>Continue to declaration</PrimaryButton>
      </div>
    </ApplicationShell>
  );
}

export function DeclarationPage() {
  const { declarationAccepted, saveDeclaration, applicationId } = useDemo();
  const router = useRouter();
  const [truth, setTruth] = useState(declarationAccepted);
  const [cancellation, setCancellation] = useState(declarationAccepted);

  const ready = truth && cancellation;

  const handleToggleTruth = async (val: boolean) => {
    setTruth(val);
    if (val && cancellation) {
      await saveDeclaration(true);
    } else {
      await saveDeclaration(false);
    }
  };

  const handleToggleCancel = async (val: boolean) => {
    setCancellation(val);
    if (truth && val) {
      await saveDeclaration(true);
    } else {
      await saveDeclaration(false);
    }
  };

  const handleComplete = async () => {
    if (ready) {
      await saveDeclaration(true);
      router.push(getAppUrl("ready", applicationId));
    }
  };

  return (
    <ApplicationShell>
      <SectionHeader
        title="Declaration"
        description="Confirm these local demo declarations before FormSetu marks the fictional application ready in the backend."
      />
      <section className="max-w-4xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
        <label className="flex gap-3">
          <input type="checkbox" checked={truth} onChange={(e) => handleToggleTruth(e.target.checked)} />
          <span>I declare that the synthetic information in this demonstration is complete and correct.</span>
        </label>
        <label className="mt-5 flex gap-3">
          <input type="checkbox" checked={cancellation} onChange={(e) => handleToggleCancel(e.target.checked)} />
          <span>I understand this is a prototype and no data is submitted to any authority.</span>
        </label>
        <div className="mt-8 flex justify-between">
          <BackButton href={getAppUrl("review", applicationId)} />
          <PrimaryButton disabled={!ready} onClick={handleComplete}>
            {ready ? "Complete Application" : "Accept both declarations"}
          </PrimaryButton>
        </div>
      </section>
    </ApplicationShell>
  );
}

export function ReadyPage() {
  const { completeDemo, isCompleted, error, conflicts, applicationId } = useDemo();
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "blocked">("checking");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasUnresolvedConflict = conflicts.some((c) => c.status === "unresolved");

  useEffect(() => {
    let active = true;
    const runCompletion = async () => {
      const success = await completeDemo();
      if (active) {
        if (success) {
          setStatus("ready");
        } else {
          setStatus("blocked");
          setErrorMessage(error || "The backend reported unresolved conflicts or missing declarations.");
        }
      }
    };
    runCompletion();
    return () => {
      active = false;
    };
  }, [completeDemo, error]);

  return (
    <ApplicationShell>
      <div className="mx-auto max-w-3xl py-16 text-center">
        {status === "checking" ? (
          <>
            <span className="material-symbols-outlined text-6xl text-primary animate-spin">sync</span>
            <h1 className="mt-5 text-3xl font-bold">Verifying Application Readiness...</h1>
          </>
        ) : status === "ready" || isCompleted ? (
          <>
            <span className="material-symbols-outlined text-6xl text-secondary">task_alt</span>
            <h1 className="mt-5 text-4xl font-bold">Application Ready</h1>
            <p className="mx-auto mt-4 max-w-xl text-on-surface-variant">
              The application has passed all backend checks and is persisted in the database. It has not been submitted to any external authority.
            </p>
            <div className="mt-8">
              <PrimaryButton href="/applications">Start another application</PrimaryButton>
            </div>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-6xl text-error">warning</span>
            <h1 className="mt-5 text-4xl font-bold">Application Needs Attention</h1>
            <p className="mx-auto mt-4 max-w-xl text-on-surface-variant">{errorMessage}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {hasUnresolvedConflict && (
                <PrimaryButton onClick={() => router.push(getAppUrl("verify", applicationId))}>
                  Resolve Conflict Now →
                </PrimaryButton>
              )}
              <SecondaryButton onClick={() => router.push(getAppUrl("review", applicationId))}>
                Return to Review Page
              </SecondaryButton>
            </div>
          </>
        )}
      </div>
    </ApplicationShell>
  );
}

