const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || "Request failed. Please try again shortly.");
  }

  return res.json() as Promise<T>;
}

export interface MessageOut {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatResponse {
  conversation_id: string;
  user_id: string;
  reply: MessageOut;
  sources: string[];
}

export function sendChatMessage(message: string, conversationId: string | null, userId: string | null) {
  return request<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, conversation_id: conversationId, user_id: userId }),
  });
}

export interface CostBreakdownItem {
  label: string;
  monthly_eur?: number;
  one_time_eur?: number;
  note: string;
}

export interface CostCalculatorResponse {
  industry: string;
  city: string;
  budget_eur: number;
  one_time_total_eur: number;
  monthly_total_eur: number;
  breakdown: CostBreakdownItem[];
  risks: string[];
  budget_verdict: string;
}

export function runCalculator(payload: {
  industry: string;
  city: string;
  budget_eur: number;
  size_sqm?: number;
  staff_count?: number;
}) {
  return request<CostCalculatorResponse>("/api/calculator", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ReportOut {
  id: string;
  industry: string;
  city: string;
  budget_eur: number;
  title: string;
  content_markdown: string;
  created_at: string;
}

export function createReport(payload: { industry: string; city: string; budget_eur: number; notes?: string; user_id?: string | null }) {
  return request<ReportOut>("/api/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface DocumentOut {
  id: string;
  filename: string;
  category: string;
  chunk_count: number;
  created_at: string;
}

export async function adminListDocuments(adminToken: string) {
  return request<DocumentOut[]>("/api/admin/documents", {
    headers: { "X-Admin-Token": adminToken },
  });
}

export async function adminUploadDocument(adminToken: string, category: string, file: File) {
  const formData = new FormData();
  formData.append("category", category);
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/admin/documents/upload`, {
    method: "POST",
    headers: { "X-Admin-Token": adminToken },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || "Upload failed");
  }
  return res.json() as Promise<DocumentOut>;
}

export async function adminDeleteDocument(adminToken: string, documentId: string) {
  return request(`/api/admin/documents/${documentId}`, {
    method: "DELETE",
    headers: { "X-Admin-Token": adminToken },
  });
}

export interface ConversationOut {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  messages: MessageOut[];
}

export async function adminListConversations(adminToken: string) {
  return request<ConversationOut[]>("/api/admin/conversations", {
    headers: { "X-Admin-Token": adminToken },
  });
}

export async function adminListReports(adminToken: string) {
  return request<ReportOut[]>("/api/admin/reports", {
    headers: { "X-Admin-Token": adminToken },
  });
}

export interface RoadmapStepOut {
  id: string;
  step_key: string;
  title: string;
  category: string;
  materials: string;
  official_link: string;
  estimated_days: string;
  note: string;
  priority: string;
  status: "not_started" | "in_progress" | "done";
  due_date: string | null;
  sort_order: number;
}

export interface RoadmapOut {
  id: string;
  shop_type: string;
  city: string;
  company_type: string;
  sells_food_beverage: boolean;
  sells_alcohol: boolean;
  has_staff: boolean;
  needs_renovation: boolean;
  created_at: string;
  steps: RoadmapStepOut[];
}

export function createRoadmap(payload: {
  shop_type: string;
  city: string;
  company_type: string;
  sells_food_beverage: boolean;
  sells_alcohol: boolean;
  has_staff: boolean;
  needs_renovation: boolean;
  user_id?: string | null;
}) {
  return request<RoadmapOut>("/api/roadmap", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getRoadmap(profileId: string) {
  return request<RoadmapOut>(`/api/roadmap/${profileId}`);
}

export function updateRoadmapStep(stepId: string, payload: { status?: string; due_date?: string | null }) {
  return request<RoadmapStepOut>(`/api/roadmap/steps/${stepId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
