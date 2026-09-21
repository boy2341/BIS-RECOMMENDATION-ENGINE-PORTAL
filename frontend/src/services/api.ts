// src/services/api.ts
// Thin, dependency-free fetch client for the BIS Compliance Engine backend.
// Base URL: http://localhost:8000/api

import type {
  AnalysisResponse,
  ApiErrorShape,
  GenerateSpecificationRequest,
  GenerateSpecificationResponse,
  HealthResponse,
  UploadResponse,
} from "../types/api";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "/api" : "http://127.0.0.1:8000/api");
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Custom error type so callers can distinguish network failure,
 * timeout, and structured backend error responses.
 */
export class ApiError extends Error implements ApiErrorShape {
  status?: number;
  detail?: unknown;

  constructor(message: string, status?: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeoutMessage: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    return await promise;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(onTimeoutMessage, 408);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(
  path: string,
  init: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        `Request to ${path} timed out after ${timeoutMs}ms. Is the backend running at ${BASE_URL}?`,
        408
      );
    }
    throw new ApiError(
      `Could not reach backend at ${BASE_URL}${path}. Confirm the FastAPI service is running locally on port 8000.`,
      undefined,
      err
    );
  }
  clearTimeout(timeoutId);

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const message =
      (payload as { message?: string; detail?: string } | null)?.message ??
      (payload as { message?: string; detail?: string } | null)?.detail ??
      `Request failed with status ${response.status}`;
    throw new ApiError(String(message), response.status, payload);
  }

  return payload as T;
}

// ---------------------------------------------------------------------------
// Public API methods
// ---------------------------------------------------------------------------

/**
 * GET /api/health — lightweight connectivity ping.
 * Callers should treat a thrown ApiError as "backend offline".
 */
export async function checkHealth(): Promise<HealthResponse> {
  return withTimeout(
    request<HealthResponse>("/health", { method: "GET" }, 5_000),
    5_000,
    "Health check timed out."
  );
}

/**
 * POST /api/analyze — run vector similarity + requirement extraction
 * against a plain-text tender/requirement description.
 */
export async function analyzeText(
  text: string,
  top_k: number = 5
): Promise<AnalysisResponse> {
  if (!text || !text.trim()) {
    throw new ApiError("Cannot analyze empty text.", 400);
  }
  return request<AnalysisResponse>("/analyze", {
    method: "POST",
    body: JSON.stringify({ text, top_k }),
  });
}

/**
 * POST /api/upload — upload a tender PDF for text extraction + analysis.
 */
export async function uploadTenderPdf(file: File): Promise<UploadResponse> {
  if (file.type !== "application/pdf") {
    throw new ApiError("Only PDF files are accepted for tender upload.", 400);
  }
  const formData = new FormData();
  formData.append("file", file);

  return request<UploadResponse>(
    "/upload",
    {
      method: "POST",
      body: formData,
    },
    60_000 // PDFs may take longer to parse + embed
  );
}

/**
 * POST /api/specification/generate — produce the grounded GeM technical
 * specification text via the backend's Groq-backed generation pipeline.
 */
export async function generateSpecification(
  payload: GenerateSpecificationRequest
): Promise<GenerateSpecificationResponse> {
  if (!payload.selected_standards.length) {
    throw new ApiError(
      "Select at least one standard before generating a specification.",
      400
    );
  }
  return request<GenerateSpecificationResponse>("/specification/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * GET /api/standards — fetch all BIS standards from the backend knowledge base.
 */
export interface StandardRecord {
  standard_number: string;
  title: string;
  year: string;
  category: string;
  status: string;
  amendment?: string | null;
  scope: string;
  keywords: string[];
  relations: Array<{ standard_number: string; relationship: string }>;
  source_url?: string | null;
}

export interface StandardsListResponse {
  count: number;
  standards: StandardRecord[];
}

export async function fetchAllStandards(): Promise<StandardsListResponse> {
  return request<StandardsListResponse>("/standards", { method: "GET" });
}

/**
 * GET /api/standards/:standard_number — fetch a single standard by its number.
 */
export async function fetchStandard(standardNumber: string): Promise<StandardRecord> {
  return request<StandardRecord>(`/standards/${encodeURIComponent(standardNumber)}`, { method: "GET" });
}

export const api = {
  checkHealth,
  analyzeText,
  uploadTenderPdf,
  generateSpecification,
  fetchAllStandards,
  fetchStandard,
};

export default api;
