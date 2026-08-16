"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  FileText,
  Lock,
  LogIn,
  MessagesSquare,
  Trash2,
  Upload,
} from "lucide-react";
import {
  ApiError,
  ConversationOut,
  DocumentOut,
  ReportOut,
  adminDeleteDocument,
  adminListConversations,
  adminListDocuments,
  adminListReports,
  adminUploadDocument,
} from "@/lib/api";

const CATEGORIES = [
  { value: "business", label: "Business basics" },
  { value: "horeca", label: "Hospitality industry" },
  { value: "tax", label: "Tax" },
  { value: "immigration", label: "Business/startup visas" },
  { value: "location", label: "City analysis" },
  { value: "cases", label: "Case studies" },
];

type Tab = "documents" | "conversations" | "reports";

const TABS: { key: Tab; label: string; icon: typeof FileText }[] = [
  { key: "documents", label: "Knowledge base documents", icon: FileText },
  { key: "conversations", label: "User consultations", icon: MessagesSquare },
  { key: "reports", label: "Generated reports", icon: ClipboardList },
];

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("documents");
  const [error, setError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [conversations, setConversations] = useState<ConversationOut[]>([]);
  const [reports, setReports] = useState<ReportOut[]>([]);

  const [uploadCategory, setUploadCategory] = useState("business");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("dbn_admin_token");
    if (saved) {
      setToken(saved);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) loadTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, tab]);

  async function loadTab(t: Tab) {
    setError(null);
    try {
      if (t === "documents") setDocuments(await adminListDocuments(token));
      if (t === "conversations") setConversations(await adminListConversations(token));
      if (t === "reports") setReports(await adminListReports(token));
    } catch (e) {
      handleAuthError(e);
    }
  }

  function handleAuthError(e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      setAuthed(false);
      sessionStorage.removeItem("dbn_admin_token");
      setError("Invalid admin credentials — please sign in again");
    } else {
      setError(e instanceof ApiError ? e.message : "Request failed");
    }
  }

  function handleLogin() {
    sessionStorage.setItem("dbn_admin_token", token);
    setAuthed(true);
  }

  async function handleUpload() {
    if (!uploadFile) return;
    setUploading(true);
    setError(null);
    try {
      await adminUploadDocument(token, uploadCategory, uploadFile);
      setUploadFile(null);
      await loadTab("documents");
    } catch (e) {
      handleAuthError(e);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await adminDeleteDocument(token, id);
      await loadTab("documents");
    } catch (e) {
      handleAuthError(e);
    }
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-4 py-24">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-7">
          <div className="w-11 h-11 rounded-xl bg-navy-900 text-white flex items-center justify-center mb-4">
            <Lock size={19} />
          </div>
          <h1 className="text-lg font-bold text-navy-900 mb-1">Admin Sign In</h1>
          <p className="text-xs text-slate-500 mb-4">Enter the shared admin token to access the dashboard.</p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Admin token (ADMIN_TOKEN from .env)"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-navy-700"
          />
          <button onClick={handleLogin} className="w-full inline-flex items-center justify-center gap-2 bg-navy-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-navy-800 transition-colors">
            <LogIn size={15} /> Sign in
          </button>
          {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-navy-900 mb-5 tracking-tight">Admin</h1>

      <div className="flex gap-1 border-b border-slate-200 mb-6 text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 pb-2.5 px-3 -mb-px border-b-2 transition-colors ${
              tab === t.key ? "border-navy-900 text-navy-900 font-medium" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      {tab === "documents" && (
        <div>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-6 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Category</label>
              <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">File (PDF / TXT / Markdown)</label>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </div>
            <button onClick={handleUpload} disabled={!uploadFile || uploading} className="inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-navy-800 disabled:opacity-50 transition-colors">
              <Upload size={14} /> {uploading ? "Uploading…" : "Upload to knowledge base"}
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-2.5">Filename</th>
                  <th className="text-left px-4 py-2.5">Category</th>
                  <th className="text-left px-4 py-2.5">Chunks</th>
                  <th className="text-left px-4 py-2.5">Uploaded</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-navy-900">{d.filename}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
                        {d.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 tabular-nums">{d.chunk_count}</td>
                    <td className="px-4 py-2.5 text-slate-400">{new Date(d.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => handleDelete(d.id)} aria-label="Delete" className="text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No documents yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "conversations" && (
        <div className="space-y-3">
          {conversations.map((c) => (
            <details key={c.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <summary className="cursor-pointer font-medium text-navy-900 text-sm">
                {c.title} <span className="text-slate-400 font-normal">· {new Date(c.created_at).toLocaleString()} · {c.messages.length} messages</span>
              </summary>
              <div className="mt-3 space-y-2">
                {c.messages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <span className={`font-medium ${m.role === "user" ? "text-navy-800" : "text-emerald-700"}`}>
                      {m.role === "user" ? "User" : "AI"}:
                    </span>
                    <span className="text-slate-700 whitespace-pre-wrap"> {m.content}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
          {conversations.length === 0 && <div className="text-slate-400 text-sm text-center py-8">No consultations yet</div>}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-3">
          {reports.map((r) => (
            <details key={r.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <summary className="cursor-pointer font-medium text-navy-900 text-sm">
                {r.title} <span className="text-slate-400 font-normal">· €{r.budget_eur.toLocaleString()} · {new Date(r.created_at).toLocaleString()}</span>
              </summary>
              <pre className="mt-3 text-xs whitespace-pre-wrap text-slate-600">{r.content_markdown}</pre>
            </details>
          ))}
          {reports.length === 0 && <div className="text-slate-400 text-sm text-center py-8">No reports yet</div>}
        </div>
      )}
    </div>
  );
}
