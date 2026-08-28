export interface AppOut {
  id: string;
  session_id: string;
  application_type_id: string;
  status: string;
  progress: number;
  created_at: string;
}

export interface DemoSessionOut {
  id: string;
  status: string;
  application?: AppOut;
  applications?: AppOut[];
  disclaimer?: string;
  reset?: boolean;
}

export interface DocumentRequirementOut {
  id: string;
  document_type: string;
  label: string;
  required: boolean;
  allowed_formats: string[];
  max_size_kb: number;
  min_size_kb: number | null;
  required_width: number | null;
  required_height: number | null;
  description: string;
}

export interface SectionOut {
  slug: string;
  title: string;
  description: string;
  required: boolean;
}

export interface FieldValueOut {
  id: string;
  field_id: string;
  key: string;
  label: string;
  value: string;
  source: string;
  status: string;
  last_verified: string | null;
  validation_passed?: boolean;
  validation_message?: string;
}

export interface PreviousAppOut {
  id: string;
  title: string;
  year: number;
  status: string;
  field_count: number;
}

export interface PreviousAppDetailOut {
  id: string;
  title: string;
  fields: {
    id: string;
    key: string;
    label: string;
    value: string;
    last_verified: string;
  }[];
}

export interface ImportFieldOut {
  id: string;
  source_field_key: string;
  target_field_key: string;
  source_label?: string | null;
  target_label?: string | null;
  source_value: string;
  target_value?: string | null;
  match_type: string;
  confidence: number;
  reason?: string | null;
  decision: string;
}

export interface ImportRecordOut {
  id: string;
  status: string;
  previous_application_id?: string;
  field_count?: number;
  fields?: ImportFieldOut[];
}

export interface SmartImportOut {
  import_id: string;
  status: string;
  total_found: number;
  exact_count: number;
  semantic_count: number;
  review_count: number;
  automatically_changed_count: number;
  suggestions: ImportFieldOut[];
}

export interface ConflictOut {
  id: string;
  field_key: string;
  previous_value: string;
  current_value: string;
  status: string;
  resolution: string | null;
  resolved_value: string | null;
}

export interface DocumentOut {
  id: string;
  name: string;
  document_type: string;
  status: string;
  original_size?: number;
}

export interface CheckItem {
  name: string;
  passed: boolean;
  actual?: string | number;
  required?: string | number | string[];
  message?: string;
}

export interface AppDocumentOut {
  id: string;
  document_id: string | null;
  document_requirement_id: string;
  document_type: string;
  label: string;
  required: boolean;
  allowed_formats: string[];
  max_size_kb: number;
  required_width: number | null;
  required_height: number | null;
  status: string;
  validation_status: string;
  preparation_status: string;
  original_filename?: string | null;
  original_size?: number | null;
  prepared_size?: number | null;
  original_dimensions?: string | null;
  prepared_dimensions?: string | null;
  file_url?: string | null;
  checks?: CheckItem[];
  photo_compliance?: PhotoComplianceOut | null;
  photo_rules?: Record<string, unknown>;
  is_compressed?: boolean;
  compression_ratio?: number;
  compression_status?: string;
  acknowledged?: boolean;
}

export interface UploadDocumentOut {
  document_id: string;
  name: string;
  document_type: string;
  original_size: number;
  validation_status: string;
  preparation_status: string;
  checks: CheckItem[];
}

export interface DocumentValidationOut {
  document_id: string;
  is_valid: boolean;
  status: string;
  checks: CheckItem[];
}

export interface DocumentPreparationOut {
  document_id: string;
  status: string;
  original_size: number;
  prepared_size: number;
  original_dimensions: string;
  prepared_dimensions: string;
  quality?: number | null;
  is_valid: boolean;
  is_compressed?: boolean;
  compression_ratio?: number;
  compression_status?: string;
  acknowledged?: boolean;
}

export interface PhotoCheckItem {
  name: string;
  status: string; // PASS | WARNING | FAIL | REVIEW | UNSUPPORTED
  message: string;
}

export interface PhotoComplianceOut {
  status: string; // PASS | WARNING | FAIL | REVIEW | UNSUPPORTED
  score: number;
  checks: PhotoCheckItem[];
  requires_new_photo: boolean;
}

export interface ValidationOut {
  application_id: string;
  progress: number;
  valid: boolean;
  unresolved_conflicts: string[];
  invalid_documents?: string[];
}

export interface SignatureCheckItem {
  name: string;
  status: string; // PASS | WARNING | FAIL
  message: string;
}

export interface SignatureComplianceOut {
  document_id: string;
  status: string; // PASS | WARNING | FAIL | REVIEW
  score: number;
  checks: SignatureCheckItem[];
  requires_new_signature: boolean;
}

export interface StepProgressItem {
  key: string;
  label: string;
  status: string; // LOCKED | CURRENT | IN_PROGRESS | COMPLETED | NEEDS_REVIEW | FAILED
}

export interface ProgressOut {
  application_id: string;
  application_mode: string;
  current_step: string;
  progress_percent: number;
  steps: StepProgressItem[];
}

export interface CompletionOut {
  status: string;
  message: string;
  external_submission: boolean;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code: string = "API_ERROR") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const getBaseUrl = (): string => {
  if (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    return "";
  }
  return "http://127.0.0.1:8000";
};



async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  
  const headers: Record<string, string> = {
    ...((options.body instanceof FormData ? {} : { "Content-Type": "application/json" })),
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let code = "API_ERROR";
      let message = `Request failed with status ${res.status}`;
      try {
        const errorBody = await res.json();
        if (errorBody?.detail?.error) {
          code = errorBody.detail.error.code || code;
          message = errorBody.detail.error.message || message;
        } else if (typeof errorBody?.detail === "string") {
          message = errorBody.detail;
        }
      } catch {
        // use default status text if json parsing fails
      }
      throw new ApiError(res.status, message, code);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      0,
      "FormSetu service is unavailable. Please start the backend and try again.",
      "NETWORK_ERROR"
    );
  }
}

export const api = {
  createSession: () => request<DemoSessionOut>("/api/sessions", { method: "POST" }),
  
  getSession: (sessionId: string) => request<DemoSessionOut>(`/api/sessions/${sessionId}`),
  
  resetSession: (sessionId: string) => request<DemoSessionOut>(`/api/sessions/${sessionId}/reset`, { method: "POST" }),
  
  getApplications: (sessionId: string) => request<AppOut[]>(`/api/applications?session_id=${sessionId}`),
  
  getApplication: (applicationId: string) => request<AppOut>(`/api/applications/${applicationId}`),
  
  getRequirements: (applicationId: string) => request<DocumentRequirementOut[]>(`/api/applications/${applicationId}/requirements`),
  
  getSections: (applicationId: string) => request<SectionOut[]>(`/api/applications/${applicationId}/sections`),
  
  getFields: (applicationId: string) => request<FieldValueOut[]>(`/api/applications/${applicationId}/fields`),

  getProgress: (applicationId: string) => request<ProgressOut>(`/api/applications/${applicationId}/progress`),
  
  getPreviousApplications: (sessionId: string) => request<PreviousAppOut[]>(`/api/previous-applications?session_id=${sessionId}`),
  
  getPreviousApplication: (id: string) => request<PreviousAppDetailOut>(`/api/previous-applications/${id}`),
  
  createImport: (applicationId: string, previousApplicationId: string) =>
    request<ImportRecordOut>(`/api/applications/${applicationId}/imports`, {
      method: "POST",
      body: JSON.stringify({ previous_application_id: previousApplicationId })
    }),

  smartImport: (applicationId: string, previousApplicationId?: string, autoApply?: boolean) =>
    request<SmartImportOut>(`/api/applications/${applicationId}/smart-import`, {
      method: "POST",
      body: JSON.stringify({ previous_application_id: previousApplicationId, auto_apply: autoApply })
    }),

  autoFetch: (applicationId: string, previousApplicationId?: string) =>
    request<SmartImportOut>(`/api/applications/${applicationId}/auto-fetch`, {
      method: "POST",
      body: JSON.stringify({ previous_application_id: previousApplicationId, auto_apply: true })
    }),
    
  getImports: (applicationId: string) => request<ImportRecordOut[]>(`/api/applications/${applicationId}/imports`),
  
  setImportFieldDecision: (importId: string, fieldId: string, decision: "use" | "edit" | "reject", value?: string) =>
    request<{ id: string; decision: string; value: string; match_type?: string }>(`/api/imports/${importId}/fields/${fieldId}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision, value })
    }),
    
  verifyField: (applicationId: string, fieldId: string) =>
    request<{ id: string; status: string }>(`/api/applications/${applicationId}/fields/${fieldId}/verify`, { method: "POST" }),
    
  updateField: (applicationId: string, fieldId: string, value: string) =>
    request<{ id: string; value: string; status: string }>(`/api/applications/${applicationId}/fields/${fieldId}/update`, {
      method: "POST",
      body: JSON.stringify({ value })
    }),

  clearFields: (applicationId: string) =>
    request<{ status: string; field_count: number }>(`/api/applications/${applicationId}/clear-fields`, {
      method: "POST"
    }),
    
  getConflicts: (applicationId: string) => request<ConflictOut[]>(`/api/applications/${applicationId}/conflicts`),
  
  resolveConflict: (conflictId: string, resolution: "previous" | "current" | "custom", value?: string) =>
    request<{ id: string; status: string; resolved_value: string }>(`/api/conflicts/${conflictId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ resolution, value })
    }),
    
  getDocuments: (sessionId: string) => request<DocumentOut[]>(`/api/documents?session_id=${sessionId}`),
  
  getApplicationDocuments: (applicationId: string) => request<AppDocumentOut[]>(`/api/applications/${applicationId}/documents`),
  
  uploadDocument: (applicationId: string, documentRequirementId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_requirement_id", documentRequirementId);
    return request<UploadDocumentOut>(`/api/applications/${applicationId}/documents/upload`, {
      method: "POST",
      body: formData
    });
  },

  prepareDocument: (documentId: string) =>
    request<DocumentPreparationOut>(`/api/documents/${documentId}/prepare`, { method: "POST" }),

  acknowledgeCompression: (documentId: string) =>
    request<{ document_id: string; acknowledged: boolean; message: string }>(`/api/documents/${documentId}/acknowledge-compression`, { method: "POST" }),

  deleteDocument: (documentId: string) =>
    request<{ document_id: string; status: string; message: string }>(`/api/documents/${documentId}`, { method: "DELETE" }),

  analyzePhoto: (documentId: string) =>
    request<PhotoComplianceOut>(`/api/documents/${documentId}/photo-analysis`, { method: "POST" }),

  analyzeSignature: (documentId: string) =>
    request<SignatureComplianceOut>(`/api/documents/${documentId}/signature-analysis`, { method: "POST" }),

  getDocumentValidation: (documentId: string) =>
    request<DocumentValidationOut>(`/api/documents/${documentId}/validation`),

  getApplicationValidation: (applicationId: string) => request<ValidationOut>(`/api/applications/${applicationId}/validation`),
  
  saveDeclaration: (applicationId: string, accepted: boolean) =>
    request<{ accepted: boolean }>(`/api/applications/${applicationId}/declaration`, {
      method: "POST",
      body: JSON.stringify({ accepted })
    }),
    
  completeDemo: (applicationId: string) =>
    request<CompletionOut>(`/api/applications/${applicationId}/complete-demo`, { method: "POST" }),

  resetTestApplication: (testId: string) =>
    request<{ status: string; id: string }>(`/api/test-applications/${testId}/reset`, { method: "POST" }),

  deleteTestApplication: (testId: string) =>
    request<{ status: string; id: string }>(`/api/test-applications/${testId}`, { method: "DELETE" })
};

