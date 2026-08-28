"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  api,
  AppOut,
  DocumentRequirementOut,
  FieldValueOut,
  PreviousAppOut,
  ImportRecordOut,
  ConflictOut,
  AppDocumentOut,
  ValidationOut,
  ProgressOut,
  SignatureComplianceOut,
  ApiError
} from "@/lib/api";

const SESSION_STORAGE_KEY = "formsetu_session_id";

export interface DemoContextType {
  sessionId: string | null;
  applicationId: string | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  application: AppOut | null;
  requirements: DocumentRequirementOut[];
  fields: FieldValueOut[];
  previousApps: PreviousAppOut[];
  selectedPreviousId: string | null;
  imports: ImportRecordOut[];
  conflicts: ConflictOut[];
  documents: AppDocumentOut[];
  validation: ValidationOut | null;
  declarationAccepted: boolean;
  isCompleted: boolean;
  progress: ProgressOut | null;

  // Actions
  setActiveApp: (appId: string, sessId: string) => Promise<void>;
  selectPreviousApp: (prevId: string) => Promise<void>;
  smartImport: (previousApplicationId?: string) => Promise<void>;
  autoFetch: (previousApplicationId?: string) => Promise<void>;
  makeImportDecision: (importId: string, importFieldId: string, decision: "use" | "edit" | "reject", value?: string) => Promise<void>;
  verifyField: (fieldId: string) => Promise<void>;
  updateField: (fieldId: string, value: string) => Promise<void>;
  resolveConflict: (conflictId: string, resolution: "previous" | "current" | "custom", value?: string) => Promise<void>;
  uploadDocument: (requirementId: string, file: File) => Promise<void>;
  prepareDocument: (documentId: string) => Promise<void>;
  acknowledgeCompression: (documentId: string) => Promise<void>;
  removeDocument: (documentId: string) => Promise<void>;
  analyzeSignature: (documentId: string) => Promise<SignatureComplianceOut | null>;
  saveDeclaration: (accepted: boolean) => Promise<void>;
  completeDemo: () => Promise<boolean>;
  reset: () => Promise<void>;
  clearFields: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  clearError: () => void;
}


const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [application, setApplication] = useState<AppOut | null>(null);
  const [requirements, setRequirements] = useState<DocumentRequirementOut[]>([]);
  const [fields, setFields] = useState<FieldValueOut[]>([]);
  const [previousApps, setPreviousApps] = useState<PreviousAppOut[]>([]);
  const [selectedPreviousId, setSelectedPreviousId] = useState<string | null>(null);
  const [imports, setImports] = useState<ImportRecordOut[]>([]);
  const [conflicts, setConflicts] = useState<ConflictOut[]>([]);
  const [documents, setDocuments] = useState<AppDocumentOut[]>([]);
  const [validation, setValidation] = useState<ValidationOut | null>(null);
  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressOut | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadApplicationData = useCallback(async (appId: string, sessId: string) => {
    try {
      const [appData, reqsData, fieldsData, prevAppsData, importsData, conflictsData, docsData, valData, progressData] =
        await Promise.all([
          api.getApplication(appId),
          api.getRequirements(appId),
          api.getFields(appId),
          api.getPreviousApplications(sessId),
          api.getImports(appId),
          api.getConflicts(appId),
          api.getApplicationDocuments(appId),
          api.getApplicationValidation(appId),
          api.getProgress(appId).catch(() => null)
        ]);

      setApplication(appData);
      setRequirements(reqsData);
      setFields(fieldsData);
      setPreviousApps(prevAppsData);
      setImports(importsData);
      setConflicts(conflictsData);
      setDocuments(docsData);
      setValidation(valData);
      setProgress(progressData);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("formsetu_active_app_id", appId);
        sessionStorage.setItem(SESSION_STORAGE_KEY, sessId);
      }

      setIsCompleted(appData.status === "ready");

      if (importsData.length > 0) {
        setSelectedPreviousId(importsData[0].previous_application_id || importsData[0].id);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        try {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("formsetu_active_app_id");
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
          const newSess = await api.createSession();
          if (newSess.id && newSess.application?.id) {
            setSessionId(newSess.id);
            setApplicationId(newSess.application.id);
            const [appData, reqsData, fieldsData, prevAppsData, importsData, conflictsData, docsData, valData, progressData] =
              await Promise.all([
                api.getApplication(newSess.application.id),
                api.getRequirements(newSess.application.id),
                api.getFields(newSess.application.id),
                api.getPreviousApplications(newSess.id),
                api.getImports(newSess.application.id),
                api.getConflicts(newSess.application.id),
                api.getApplicationDocuments(newSess.application.id),
                api.getApplicationValidation(newSess.application.id),
                api.getProgress(newSess.application.id).catch(() => null)
              ]);
            setApplication(appData);
            setRequirements(reqsData);
            setFields(fieldsData);
            setPreviousApps(prevAppsData);
            setImports(importsData);
            setConflicts(conflictsData);
            setDocuments(docsData);
            setValidation(valData);
            setProgress(progressData);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("formsetu_active_app_id", newSess.application.id);
              sessionStorage.setItem(SESSION_STORAGE_KEY, newSess.id);
            }
            return;
          }
        } catch {
          setError("Failed to initialize demo session. Please try again.");
          return;
        }
      }
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load application data from backend.");
      }
    }
  }, []);

  const setActiveApp = useCallback(async (appId: string, sessId: string) => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(SESSION_STORAGE_KEY, sessId);
        sessionStorage.setItem("formsetu_active_app_id", appId);
      }
      setSessionId(sessId);
      setApplicationId(appId);
      await loadApplicationData(appId, sessId);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to activate application.");
    } finally {
      setLoading(false);
    }
  }, [loadApplicationData]);

  const bootstrapSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let activeSessionId: string | null = null;
      let activeAppId: string | null = null;

      let targetAppId: string | null = null;
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        targetAppId = params.get("appId") || sessionStorage.getItem("formsetu_active_app_id") || sessionStorage.getItem("formsetu_test_app_id");
      }

      if (targetAppId) {
        try {
          const app = await api.getApplication(targetAppId);
          if (app) {
            activeAppId = app.id;
            activeSessionId = app.session_id;
            if (typeof window !== "undefined") {
              sessionStorage.setItem(SESSION_STORAGE_KEY, activeSessionId);
              sessionStorage.setItem("formsetu_active_app_id", activeAppId);
            }
          }
        } catch {
          // If specific targetAppId lookup fails, fall through to session lookup
        }
      }

      if (!activeSessionId || !activeAppId) {
        let storedId = typeof window !== "undefined" ? sessionStorage.getItem(SESSION_STORAGE_KEY) : null;
        if (storedId) {
          try {
            const sess = await api.getSession(storedId);
            if (sess && sess.applications && sess.applications.length > 0) {
              activeSessionId = sess.id;
              let storedAppId = typeof window !== "undefined" ? sessionStorage.getItem("formsetu_active_app_id") : null;
              let found = storedAppId ? sess.applications.find(a => a.id === storedAppId) : null;
              activeAppId = found ? found.id : sess.applications[sess.applications.length - 1].id;
            }
          } catch {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      }

      if (!activeSessionId || !activeAppId) {
        const newSess = await api.createSession();
        activeSessionId = newSess.id;
        activeAppId = newSess.application?.id || null;
        if (typeof window !== "undefined" && activeSessionId && activeAppId) {
          sessionStorage.setItem(SESSION_STORAGE_KEY, activeSessionId);
          sessionStorage.setItem("formsetu_active_app_id", activeAppId);
        }
      }

      setSessionId(activeSessionId);
      setApplicationId(activeAppId);

      if (activeAppId && activeSessionId) {
        await loadApplicationData(activeAppId, activeSessionId);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("FormSetu service is unavailable. Please start the backend and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [loadApplicationData]);


  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  const refresh = useCallback(async () => {
    if (applicationId && sessionId) {
      await loadApplicationData(applicationId, sessionId);
    }
  }, [applicationId, sessionId, loadApplicationData]);

  const selectPreviousApp = useCallback(async (prevId: string) => {
    if (!applicationId) return;
    setSaving(true);
    setError(null);
    try {
      await api.createImport(applicationId, prevId);
      setSelectedPreviousId(prevId);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Your changes couldn't be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [applicationId, refresh]);

  const smartImport = useCallback(async (previousApplicationId?: string) => {
    if (!applicationId) return;
    setSaving(true);
    setError(null);
    try {
      await api.smartImport(applicationId, previousApplicationId);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to execute smart import analysis.");
    } finally {
      setSaving(false);
    }
  }, [applicationId, refresh]);

  const autoFetch = useCallback(async (previousApplicationId?: string) => {
    if (!applicationId) return;
    setSaving(true);
    setError(null);
    try {
      await api.autoFetch(applicationId, previousApplicationId);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to auto-fetch data.");
    } finally {
      setSaving(false);
    }
  }, [applicationId, refresh]);

  const makeImportDecision = useCallback(async (
    importId: string,
    importFieldId: string,
    decision: "use" | "edit" | "reject",
    value?: string
  ) => {
    setSaving(true);
    setError(null);
    try {
      await api.setImportFieldDecision(importId, importFieldId, decision, value);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Your changes couldn't be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const verifyField = useCallback(async (fieldId: string) => {
    if (!applicationId) return;
    setSaving(true);
    setError(null);
    try {
      await api.verifyField(applicationId, fieldId);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Your changes couldn't be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [applicationId, refresh]);

  const updateField = useCallback(async (fieldId: string, value: string) => {
    if (!applicationId) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateField(applicationId, fieldId, value);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Your changes couldn't be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [applicationId, refresh]);

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: "previous" | "current" | "custom",
    value?: string
  ) => {
    setSaving(true);
    setError(null);
    try {
      await api.resolveConflict(conflictId, resolution, value);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Your changes couldn't be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const uploadDocument = useCallback(async (requirementId: string, file: File) => {
    if (!applicationId) return;
    setSaving(true);
    setError(null);
    try {
      await api.uploadDocument(applicationId, requirementId, file);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to upload document. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [applicationId, refresh]);

  const prepareDocument = useCallback(async (documentId: string) => {
    setSaving(true);
    setError(null);
    try {
      await api.prepareDocument(documentId);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Document preparation failed. Please check requirements.");
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const acknowledgeCompression = useCallback(async (documentId: string) => {
    setSaving(true);
    setError(null);
    try {
      await api.acknowledgeCompression(documentId);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to acknowledge compression.");
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const removeDocument = useCallback(async (documentId: string) => {
    setSaving(true);
    setError(null);
    try {
      await api.deleteDocument(documentId);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to remove document.");
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const saveDeclaration = useCallback(async (accepted: boolean) => {
    if (!applicationId) return;
    setSaving(true);
    setError(null);
    try {
      await api.saveDeclaration(applicationId, accepted);
      setDeclarationAccepted(accepted);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Your changes couldn't be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [applicationId, refresh]);

  const completeDemo = useCallback(async (): Promise<boolean> => {
    if (!applicationId) return false;
    setSaving(true);
    setError(null);
    try {
      const res = await api.completeDemo(applicationId);
      if (res.status === "ready") {
        setIsCompleted(true);
        await refresh();
        return true;
      }
      return false;
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Could not complete application demo. Please review requirements and conflicts.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [applicationId, refresh]);

  const reset = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.resetSession(sessionId);
      const newSessionId = res.id;
      const newAppId = res.application?.id || null;

      if (typeof window !== "undefined" && newSessionId) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
      }

      setSessionId(newSessionId);
      setApplicationId(newAppId);
      setSelectedPreviousId(null);
      setDeclarationAccepted(false);
      setIsCompleted(false);

      if (newAppId && newSessionId) {
        await loadApplicationData(newAppId, newSessionId);
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to reset demo session.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, loadApplicationData]);

  const clearFields = useCallback(async () => {
    if (!applicationId) return;
    setSaving(true);
    setError(null);
    try {
      await api.clearFields(applicationId);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to clear form fields.");
    } finally {
      setSaving(false);
    }
  }, [applicationId, refresh]);

  const analyzeSignature = useCallback(async (documentId: string): Promise<SignatureComplianceOut | null> => {

    setSaving(true);
    setError(null);
    try {
      const res = await api.analyzeSignature(documentId);
      await refresh();
      return res;
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Signature analysis failed.");
      return null;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const refreshProgress = useCallback(async () => {
    if (!applicationId) return;
    try {
      const p = await api.getProgress(applicationId);
      setProgress(p);
    } catch {
      // ignore non-critical progress refresh failure
    }
  }, [applicationId]);

  const value = useMemo<DemoContextType>(

    () => ({
      sessionId,
      applicationId,
      loading,
      saving,
      error,
      application,
      requirements,
      fields,
      previousApps,
      selectedPreviousId,
      imports,
      conflicts,
      documents,
      validation,
      declarationAccepted,
      isCompleted,
      progress,
      setActiveApp,
      selectPreviousApp,
      smartImport,
      autoFetch,
      makeImportDecision,
      verifyField,
      updateField,
      resolveConflict,
      uploadDocument,
      prepareDocument,
      acknowledgeCompression,
      removeDocument,
      analyzeSignature,
      saveDeclaration,
      completeDemo,
      reset,
      clearFields,
      refresh,
      refreshProgress,
      clearError
    }),
    [
      sessionId,
      applicationId,
      loading,
      saving,
      error,
      application,
      requirements,
      fields,
      previousApps,
      selectedPreviousId,
      imports,
      conflicts,
      documents,
      validation,
      declarationAccepted,
      isCompleted,
      progress,
      setActiveApp,
      selectPreviousApp,

      smartImport,
      autoFetch,
      makeImportDecision,
      verifyField,
      updateField,
      resolveConflict,
      uploadDocument,
      prepareDocument,
      acknowledgeCompression,
      removeDocument,
      analyzeSignature,
      saveDeclaration,
      completeDemo,
      reset,
      clearFields,
      refresh,
      refreshProgress,
      clearError
    ]
  );


  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error("DemoProvider missing");
  return context;
};
