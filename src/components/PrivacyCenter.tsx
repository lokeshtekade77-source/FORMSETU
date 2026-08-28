"use client";
import React, { useState } from "react";

export interface ConsentLog {
  id: string;
  applicationName: string;
  fieldsShared: string[];
  timestamp: string;
  status: "active" | "revoked";
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

const DEFAULT_CONSENTS: ConsentLog[] = [
  {
    id: "c1",
    applicationName: "UPSC Civil Services Examination 2026",
    fieldsShared: ["Full Name", "Father Name", "DOB", "Permanent Address", "Graduation"],
    timestamp: "2026-08-28 10:15 AM",
    status: "active"
  },
  {
    id: "c2",
    applicationName: "PM Higher Education Scholarship Grant 2025",
    fieldsShared: ["Full Name", "Aadhaar Number", "Bank Account No", "IFSC Code"],
    timestamp: "2026-08-20 02:30 PM",
    status: "active"
  }
];

const DEFAULT_ACTIVITIES: ActivityLog[] = [
  { id: "a1", action: "Data Auto-Filled", details: "Mapped 14 fields into UPSC Application", timestamp: "2026-08-28 10:15 AM" },
  { id: "a2", action: "Document Auto-Prepared", details: "Passport photo cropped to 350x450px (38 KB)", timestamp: "2026-08-28 10:14 AM" },
  { id: "a3", action: "Conflict Resolved", details: "Selected Nagpur over Pune for District field", timestamp: "2026-08-28 10:12 AM" }
];

export function PrivacyCenter() {
  const [consents, setConsents] = useState<ConsentLog[]>(DEFAULT_CONSENTS);
  const [activities] = useState<ActivityLog[]>(DEFAULT_ACTIVITIES);

  const toggleConsent = (id: string) => {
    setConsents((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === "active" ? "revoked" : "active" } : c
      )
    );
  };

  const exportDataJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ consents, activities }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `FormSetu_User_Profile_Export_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const wipeData = () => {
    if (confirm("Are you sure you want to wipe all local profile fields and consent logs? This action cannot be undone.")) {
      localStorage.clear();
      setConsents([]);
      alert("Local profile and consent data wiped successfully.");
    }
  };

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-5">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">verified_user</span>
            Privacy & Consent Center
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Full control over your data reuse consent, activity audit timeline, and profile export/wipe options.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportDataJson}
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-sm">download</span> Export JSON
          </button>
          <button
            onClick={wipeData}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
          >
            <span className="material-symbols-outlined text-sm">delete_forever</span> Wipe All
          </button>
        </div>
      </div>

      {/* Active Consents */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">assignment_turned_in</span>
          Data Sharing Consents Log
        </h3>
        <p className="text-xs text-on-surface-variant">Every time FormSetu fills an application, a consent record is created.</p>

        <div className="mt-4 grid gap-3">
          {consents.map((consent) => (
            <div
              key={consent.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-on-surface">{consent.applicationName}</h4>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      consent.status === "active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {consent.status.toUpperCase()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Fields Shared: {consent.fieldsShared.join(", ")}
                </p>
                <span className="mt-1 text-[10px] text-on-surface-variant/70 block">
                  Granted on {consent.timestamp}
                </span>
              </div>

              <button
                onClick={() => toggleConsent(consent.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  consent.status === "active"
                    ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {consent.status === "active" ? "Revoke Consent" : "Re-Enable Consent"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="mt-8 border-t border-outline-variant pt-6">
        <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          Chronological Activity Audit Log
        </h3>
        <div className="mt-4 space-y-3">
          {activities.map((act) => (
            <div key={act.id} className="flex items-start gap-3 rounded-lg bg-surface-container-low p-3 text-xs">
              <span className="material-symbols-outlined text-primary mt-0.5">info</span>
              <div>
                <span className="font-bold text-on-surface">{act.action}</span>: {act.details}
                <span className="text-[10px] text-on-surface-variant block mt-0.5">{act.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
