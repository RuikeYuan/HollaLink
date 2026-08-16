"use client";

import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  IntakeFields,
  RoadmapOut,
  RoadmapStepOut,
  createRoadmap,
  getRoadmap,
  sendRoadmapIntake,
  updateRoadmapStep,
} from "@/lib/api";

const SHOP_TYPES = [
  { value: "horeca", label: "Restaurant / Hotpot / Chinese food / Café" },
  { value: "bubble_tea", label: "Bubble tea / Beverage shop" },
  { value: "retail", label: "Retail store" },
  { value: "beauty", label: "Beauty salon" },
  { value: "other", label: "Other" },
];

const CITIES = ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Other city"];

const COMPANY_TYPES = [
  { value: "eenmanszaak", label: "Eenmanszaak (Sole proprietorship)" },
  { value: "bv", label: "BV (Private limited company)" },
  { value: "vof", label: "VOF (General partnership)" },
];

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

const PRIORITY_LABEL: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const EMPTY_FIELDS: IntakeFields = {
  shop_type: null,
  city: null,
  company_type: null,
  sells_food_beverage: null,
  sells_alcohol: null,
  has_staff: null,
  needs_renovation: null,
};

const STORAGE_KEY = "dbn_roadmap_id";

interface IntakeMessage {
  role: "user" | "assistant";
  content: string;
}

function dueDateTone(dueDate: string | null, status: string): string {
  if (!dueDate || status === "done") return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "bg-red-50 border-red-200";
  if (diffDays <= 7) return "bg-amber-50 border-amber-200";
  return "";
}

export default function RoadmapPage() {
  const [inputMode, setInputMode] = useState<"chat" | "form">("chat");

  // Chat intake state
  const [intakeMessages, setIntakeMessages] = useState<IntakeMessage[]>([
    { role: "assistant", content: "Hi! I'll ask a few quick questions to build your compliance roadmap. First — what kind of shop are you opening (e.g. a restaurant, a bubble tea shop, a retail store)?" },
  ]);
  const [intakeInput, setIntakeInput] = useState("");
  const [intakeFields, setIntakeFields] = useState<IntakeFields>(EMPTY_FIELDS);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Form intake state (fallback)
  const [shopType, setShopType] = useState("horeca");
  const [city, setCity] = useState("Amsterdam");
  const [companyType, setCompanyType] = useState("eenmanszaak");
  const [sellsFoodBeverage, setSellsFoodBeverage] = useState(true);
  const [sellsAlcohol, setSellsAlcohol] = useState(false);
  const [hasStaff, setHasStaff] = useState(true);
  const [needsRenovation, setNeedsRenovation] = useState(true);

  const [roadmap, setRoadmap] = useState<RoadmapOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "timeline">("list");

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId) return;
    getRoadmap(savedId)
      .then(setRoadmap)
      .catch(() => localStorage.removeItem(STORAGE_KEY));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [intakeMessages]);

  async function submitRoadmap(fields: {
    shop_type: string;
    city: string;
    company_type: string;
    sells_food_beverage: boolean;
    sells_alcohol: boolean;
    has_staff: boolean;
    needs_renovation: boolean;
  }) {
    setLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem("dbn_user_id");
      const res = await createRoadmap({ ...fields, user_id: userId });
      setRoadmap(res);
      localStorage.setItem(STORAGE_KEY, res.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to generate the roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleIntakeSend() {
    const message = intakeInput.trim();
    if (!message || intakeLoading) return;

    const nextMessages: IntakeMessage[] = [...intakeMessages, { role: "user", content: message }];
    setIntakeMessages(nextMessages);
    setIntakeInput("");
    setIntakeLoading(true);
    setIntakeError(null);

    try {
      const res = await sendRoadmapIntake({
        message,
        history: intakeMessages,
        known_fields: intakeFields,
      });
      setIntakeFields(res.fields);
      setIntakeMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);

      if (res.done) {
        await submitRoadmap({
          shop_type: res.fields.shop_type!,
          city: res.fields.city!,
          company_type: res.fields.company_type!,
          sells_food_beverage: !!res.fields.sells_food_beverage,
          sells_alcohol: !!res.fields.sells_alcohol,
          has_staff: !!res.fields.has_staff,
          needs_renovation: !!res.fields.needs_renovation,
        });
      }
    } catch (e) {
      setIntakeError(e instanceof ApiError ? e.message : "Network error. Please try again shortly.");
    } finally {
      setIntakeLoading(false);
    }
  }

  async function handleFormGenerate() {
    await submitRoadmap({
      shop_type: shopType,
      city,
      company_type: companyType,
      sells_food_beverage: sellsFoodBeverage,
      sells_alcohol: sellsAlcohol,
      has_staff: hasStaff,
      needs_renovation: needsRenovation,
    });
  }

  async function handleStepUpdate(step: RoadmapStepOut, patch: { status?: string; due_date?: string | null }) {
    if (!roadmap) return;
    const updated = await updateRoadmapStep(step.id, patch);
    setRoadmap({
      ...roadmap,
      steps: roadmap.steps.map((s) => (s.id === step.id ? updated : s)),
    });
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY);
    setRoadmap(null);
    setIntakeMessages([
      { role: "assistant", content: "Hi! I'll ask a few quick questions to build your compliance roadmap. First — what kind of shop are you opening (e.g. a restaurant, a bubble tea shop, a retail store)?" },
    ]);
    setIntakeFields(EMPTY_FIELDS);
  }

  const doneCount = roadmap?.steps.filter((s) => s.status === "done").length ?? 0;
  const totalCount = roadmap?.steps.length ?? 0;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-navy-900 mb-2">Compliance Roadmap</h1>
      <p className="text-sm text-slate-500 mb-6">
        Answer a few questions and get a personalized, actionable compliance checklist in under 2 minutes. The
        questions can be collected by chat, but the roadmap itself is generated by a rule engine, not an AI model —
        so the result is deterministic and reliable.
      </p>

      {!roadmap && inputMode === "chat" && (
        <div className="bg-white border border-slate-200 rounded-lg mb-6 flex flex-col h-[480px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {intakeMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                    m.role === "user" ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {intakeLoading && <div className="text-sm text-slate-400">Thinking…</div>}
            {intakeError && <div className="text-sm text-red-600">{intakeError}</div>}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-slate-200 p-3 flex gap-2">
            <input
              value={intakeInput}
              onChange={(e) => setIntakeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleIntakeSend()}
              placeholder="Type your answer…"
              className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
            />
            <button
              onClick={handleIntakeSend}
              disabled={intakeLoading || loading}
              className="bg-navy-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
            >
              {loading ? "Generating…" : "Send"}
            </button>
          </div>
        </div>
      )}

      {!roadmap && inputMode === "chat" && (
        <button onClick={() => setInputMode("form")} className="text-xs text-navy-700 hover:underline mb-6 block">
          Prefer a quick form instead? →
        </button>
      )}

      {!roadmap && inputMode === "form" && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Shop type</label>
            <select value={shopType} onChange={(e) => setShopType(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
              {SHOP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Company type</label>
            <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
              {COMPANY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 grid sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={sellsFoodBeverage} onChange={(e) => setSellsFoodBeverage(e.target.checked)} />
              Selling food or beverages
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={sellsAlcohol} onChange={(e) => setSellsAlcohol(e.target.checked)} />
              Selling alcohol
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={hasStaff} onChange={(e) => setHasStaff(e.target.checked)} />
              Hiring staff
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={needsRenovation} onChange={(e) => setNeedsRenovation(e.target.checked)} />
              Needs renovation
            </label>
          </div>

          <div className="md:col-span-2 pt-2 flex items-center gap-4">
            <button onClick={handleFormGenerate} disabled={loading} className="bg-navy-900 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50">
              {loading ? "Generating…" : "Generate compliance roadmap"}
            </button>
            <button onClick={() => setInputMode("chat")} className="text-xs text-navy-700 hover:underline">
              ← Back to chat
            </button>
          </div>
        </div>
      )}

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      {roadmap && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600">
              Progress <span className="font-semibold text-navy-900">{doneCount}/{totalCount}</span> completed
            </div>
            <button onClick={handleReset} className="text-xs text-navy-700 hover:underline">
              Fill out the questionnaire again
            </button>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
            <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="flex gap-4 border-b border-slate-200 mb-4 text-sm">
            <button
              onClick={() => setView("list")}
              className={`pb-2 px-1 ${view === "list" ? "border-b-2 border-navy-900 text-navy-900 font-medium" : "text-slate-500"}`}
            >
              Checklist
            </button>
            <button
              onClick={() => setView("timeline")}
              className={`pb-2 px-1 ${view === "timeline" ? "border-b-2 border-navy-900 text-navy-900 font-medium" : "text-slate-500"}`}
            >
              Timeline
            </button>
          </div>

          {view === "list" && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">#</th>
                    <th className="text-left px-4 py-2 font-medium">Task</th>
                    <th className="text-left px-4 py-2 font-medium">Required documents</th>
                    <th className="text-left px-4 py-2 font-medium">Official link</th>
                    <th className="text-left px-4 py-2 font-medium">Estimated time</th>
                    <th className="text-left px-4 py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {roadmap.steps.map((step, i) => (
                    <tr key={step.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-400">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-navy-900 whitespace-nowrap">{step.title}</td>
                      <td className="px-4 py-3 text-slate-600">{step.materials || "—"}</td>
                      <td className="px-4 py-3">
                        {step.official_link ? (
                          <a href={step.official_link} target="_blank" rel="noreferrer" className="text-navy-700 hover:underline">
                            Official link ↗
                          </a>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{step.estimated_days}</td>
                      <td className="px-4 py-3 text-slate-500">{step.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === "timeline" && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
              <ol className="relative border-l-2 border-slate-200 ml-3">
                {roadmap.steps.map((step, i) => (
                  <li key={step.id} className="mb-6 ml-6 last:mb-0">
                    <span
                      className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white text-[10px] font-bold text-white ${
                        step.status === "done" ? "bg-emerald-600" : "bg-navy-800"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className={`font-medium ${step.status === "done" ? "text-slate-400 line-through" : "text-navy-900"}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{step.estimated_days}</div>
                    {step.note && <div className="text-xs text-slate-400 mt-1">{step.note}</div>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <h2 className="font-semibold text-navy-900 mb-3">Dynamic Todo List</h2>
          <div className="space-y-2">
            {roadmap.steps.map((step) => (
              <div key={step.id} className={`border rounded-lg p-4 flex flex-wrap items-center gap-3 ${dueDateTone(step.due_date, step.status) || "border-slate-200 bg-white"}`}>
                <input
                  type="checkbox"
                  checked={step.status === "done"}
                  onChange={(e) => handleStepUpdate(step, { status: e.target.checked ? "done" : "not_started" })}
                  className="w-4 h-4"
                />
                <div className="flex-1 min-w-[180px]">
                  <div className={`font-medium ${step.status === "done" ? "text-slate-400 line-through" : "text-navy-900"}`}>{step.title}</div>
                  <div className="text-xs text-slate-500">{step.category} · Priority: {PRIORITY_LABEL[step.priority] || step.priority}</div>
                </div>
                <select
                  value={step.status}
                  onChange={(e) => handleStepUpdate(step, { status: e.target.value })}
                  className="border border-slate-300 rounded-md px-2 py-1 text-xs"
                >
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={step.due_date || ""}
                  onChange={(e) => handleStepUpdate(step, { due_date: e.target.value || null })}
                  className="border border-slate-300 rounded-md px-2 py-1 text-xs"
                />
                {step.due_date && step.status !== "done" && dueDateTone(step.due_date, step.status) && (
                  <span className="text-xs font-medium text-amber-700">Due date approaching</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
