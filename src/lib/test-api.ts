import { api, ApiError } from "./api";

export interface TestApplicationCreateOut {
  id: string;
  status: string;
  created_at: string;
}

export interface TestApplicationUploadOut {
  id: string;
  status: string;
  original_filename: string;
}

export interface ConfidenceSummary {
  title_confidence: "high" | "medium" | "low";
  fields_confidence: "high" | "medium" | "low";
  documents_confidence: "high" | "medium" | "low";
  photo_confidence: "high" | "medium" | "low";
  declaration_confidence: "high" | "medium" | "low";
  unconfident_notes?: string[];
}

export interface TestApplicationAnalysisOut {
  id: string;
  title: string;
  status: string;
  sections: Array<{
    slug: string;
    title: string;
    description: string;
    fields: Array<{
      key: string;
      label: string;
      field_type: string;
      required: boolean;
    }>;
  }>;
  documents: Array<{
    document_type: string;
    label: string;
    required: boolean;
    allowed_formats: string[];
    max_size_kb: number;
    required_width?: number | null;
    required_height?: number | null;
    description?: string;
  }>;
  photo_rules: {
    allowed_formats?: string[];
    max_size_kb?: number;
    min_size_kb?: number;
    required_width?: number;
    required_height?: number;
    background?: string;
    face_orientation?: string;
    body_framing_percent?: number;
    face_required?: boolean;
    gaze_required?: boolean;
    plain_background?: boolean;
  };
  declarations: string[];
  confidence_summary: ConfidenceSummary;
}

export interface TestApplicationRequirementsUpdateIn {
  title?: string;
  sections?: TestApplicationAnalysisOut["sections"];
  documents?: TestApplicationAnalysisOut["documents"];
  photo_rules?: TestApplicationAnalysisOut["photo_rules"];
  declarations?: string[];
}

export interface TestApplicationStartOut {
  id: string;
  application_id: string;
  status: string;
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



async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  
  const headers: Record<string, string> = {
    ...((options.body instanceof FormData ? {} : { "Content-Type": "application/json" })),
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let msg = `Request failed with status ${res.status}`;
      try {
        const err = await res.json();
        if (err?.detail?.error?.message) msg = err.detail.error.message;
        else if (typeof err?.detail === "string") msg = err.detail;
      } catch {}
      throw new ApiError(res.status, msg);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, "FormSetu service is unavailable. Please check that backend server is running.", "NETWORK_ERROR");
  }
}


export const testApi = {
  createSession: (sessionId?: string) =>
    req<TestApplicationCreateOut>("/api/test-applications", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId })
    }),

  uploadForm: (testId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return req<TestApplicationUploadOut>(`/api/test-applications/${testId}/upload-form`, {
      method: "POST",
      body: formData
    });
  },

  getAnalysis: (testId: string) =>
    req<TestApplicationAnalysisOut>(`/api/test-applications/${testId}/analysis`),

  updateRequirements: (testId: string, data: TestApplicationRequirementsUpdateIn) =>
    req<TestApplicationAnalysisOut>(`/api/test-applications/${testId}/requirements`, {
      method: "POST",
      body: JSON.stringify(data)
    }),

  startWorkflow: (testId: string) =>
    req<TestApplicationStartOut>(`/api/test-applications/${testId}/start`, {
      method: "POST"
    }),

  deleteSession: (testId: string) =>
    req<{ status: string; id: string }>(`/api/test-applications/${testId}`, {
      method: "DELETE"
    })
};
