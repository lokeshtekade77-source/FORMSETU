import React from "react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface">
      {/* Header Navigation */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-6 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-on-primary font-extrabold text-lg shadow">F</span>
          <span className="text-xl font-extrabold tracking-tight text-primary">FormSetu</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs font-bold">
          <Link href="/applications" className="text-on-surface-variant hover:text-primary transition flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg text-primary">apps</span> Start Application
          </Link>
          <Link href="/vault" className="text-on-surface-variant hover:text-primary transition flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg text-primary">inventory_2</span> Information Vault
          </Link>
          <Link href="/documents" className="text-on-surface-variant hover:text-primary transition flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg text-primary">auto_fix</span> Doc Prep Engine
          </Link>
          <Link href="/privacy" className="text-on-surface-variant hover:text-primary transition flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg text-primary">verified_user</span> Privacy Center
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-1.5 text-xs font-bold text-on-primary-container shadow-sm">
              <span className="material-symbols-outlined text-base">bolt</span> Intelligent Civic Form Automation Platform
            </span>

            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight text-on-surface">
              Apply Smarter to Public Services — Fill Once, Auto-Adapt Everywhere.
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-on-surface-variant max-w-2xl font-medium">
              FormSetu fetches and auto-populates your personal, educational, and banking data from previous applications or external files using AI hybrid field mapping — and automatically center-crops, resizes, and compresses your document uploads locally to satisfy strict portal rules.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/applications"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-xs font-bold text-on-primary shadow-lg hover:bg-primary-hover transition"
              >
                Start Application <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
              <Link
                href="/documents"
                className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-3.5 text-xs font-bold text-on-surface hover:bg-surface-container transition shadow-sm"
              >
                Auto-Crop &amp; Compress Document <span className="material-symbols-outlined text-base text-primary">auto_fix</span>
              </Link>
            </div>
          </div>

          {/* Right Live Real-Time Dashboard Card */}
          <div className="lg:col-span-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">Live Real-Time Workflow</span>
                <h3 className="text-lg font-bold text-on-surface">National Scholarship 2026</h3>
              </div>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-3 py-1 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span> 100% Ready
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-surface-container p-3 text-xs">
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary">psychology</span> 1. AI Field Mapping
                </span>
                <span className="font-bold text-emerald-600">23 fields matched (99%)</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface-container p-3 text-xs">
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-amber-600">call_split</span> 2. Conflict Resolution
                </span>
                <span className="font-bold text-amber-600">1 choice selected</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface-container p-3 text-xs">
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary">auto_fix</span> 3. Photo Compression
                </span>
                <span className="font-bold text-primary">4.2 MB → 47 KB (350x450px)</span>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary-container/20 p-4 text-center">
              <span className="text-2xl font-black text-primary">11.5 Minutes</span>
              <span className="text-xs text-on-surface-variant block font-semibold mt-0.5">Estimated time saved per application</span>
            </div>
          </div>
        </div>

        {/* 3 Core Features Grid */}
        <div className="mt-20 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-md space-y-3">
            <span className="material-symbols-outlined text-3xl text-primary">psychology</span>
            <h3 className="text-lg font-bold text-on-surface">AI Hybrid Field Mapping</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Matches target form fields with external uploaded files using exact, synonym dictionary, token overlap, and Levenshtein similarity scoring.
            </p>
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-md space-y-3">
            <span className="material-symbols-outlined text-3xl text-secondary">auto_fix</span>
            <h3 className="text-lg font-bold text-on-surface">Browser-Local File Preparation</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Center-crops to aspect ratio, resizes dimensions, and iteratively compresses JPEG image files to satisfy portal limits (e.g. &lt; 50 KB).
            </p>
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-md space-y-3">
            <span className="material-symbols-outlined text-3xl text-emerald-600">verified_user</span>
            <h3 className="text-lg font-bold text-on-surface">Full Privacy &amp; Consent Log</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Zero cloud image uploads. Records consent log per reuse event, activity timeline, JSON profile exports, and instant profile data wipe.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-outline-variant px-6 py-6 text-center text-xs text-on-surface-variant">
        FormSetu — Unified Civic Application &amp; Document Preparation Suite. Built with Next.js 15, React 19, TypeScript &amp; HTML5 Canvas API.
      </footer>
    </div>
  );
}
