"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Building2,
  Hammer,
  ListChecks,
  Milestone,
  Receipt,
  Send,
  ShieldCheck,
  Trash2,
  Umbrella,
  User,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import DatePicker from "@/components/DatePicker";
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

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  medium: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  low: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

const PRIORITY_LABEL: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const STEP_ICON: Record<string, typeof Building2> = {
  kvk_registration: Building2,
  vat_registration: Receipt,
  food_registration: UtensilsCrossed,
  alcohol_license: Wine,
  exploitation_permit: ShieldCheck,
  employer_registration: User,
  building_permit: Hammer,
  waste_contract: Trash2,
  liability_insurance: Umbrella,
};

function StepIcon({ stepKey, className }: { stepKey: string; className?: string }) {
  const Icon = STEP_ICON[stepKey] ?? ShieldCheck;
  return <Icon className={className} />;
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${PRIORITY_STYLE[priority] || PRIORITY_STYLE.low}`}>
      {PRIORITY_LABEL[priority] || priority}
    </span>
  );
}

const EMPTY_FIELDS: IntakeFields = {
  shop_type: null,
  city: null,
  company_type: null,
  sells_food_beverage: null,
  sells_alcohol: null,
  has_staff: null,
  needs_renovation: null,
};

const GREETING = "Hi! I'll ask a few quick questions to build your compliance roadmap. First — what kind of shop are you opening (e.g. a restaurant, a bubble tea shop, a retail store)?";

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
  const [intakeMessages, setIntakeMessages] = useState<IntakeMessage[]>([{ role: "assistant", content: GREETING }]);
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

    setIntakeMessages((prev) => [...prev, { role: "user", content: message }]);
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
    setIntakeMessages([{ role: "assistant", content: GREETING }]);
    setIntakeFields(EMPTY_FIELDS);
  }

  const doneCount = roadmap?.steps.filter((s) => s.status === "done").length ?? 0;
  const totalCount = roadmap?.steps.length ?? 0;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy-900 mb-2 tracking-tight">Compliance Roadmap</h1>
      <p className="text-sm text-slate-500 mb-8 max-w-2xl leading-relaxed">
        Answer a few questions and get a personalized, actionable compliance checklist in under 2 minutes. The
        questions can be collected by chat, but the roadmap itself is generated by a rule engine, not an AI model —
        so the result is deterministic and reliable.
      </p>

      {!roadmap && inputMode === "chat" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-4 flex flex-col h-[480px] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {intakeMessages.map((m, i) => (
              <div key={i} className={`flex items-start gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    m.role === "user" ? "bg-slate-200 text-slate-600" : "bg-navy-900 text-white"
                  }`}
                >
                  {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-navy-900 text-white rounded-tr-sm"
                      : "bg-slate-100 text-slate-800 rounded-tl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {intakeLoading && (
              <div className="flex items-center gap-2.5">
                <div className="shrink-0 w-7 h-7 rounded-full bg-navy-900 text-white flex items-center justify-center">
                  <Bot size={14} />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-2.5 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                </div>
              </div>
            )}
            {intakeError && <div className="text-sm text-red-600">{intakeError}</div>}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-slate-200 p-3 flex gap-2 bg-slate-50/50">
            <input
              value={intakeInput}
              onChange={(e) => setIntakeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleIntakeSend()}
              placeholder="Type your answer…"
              className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 bg-white"
            />
            <button
              onClick={handleIntakeSend}
              disabled={intakeLoading || loading}
              aria-label="Send"
              className="w-9 h-9 shrink-0 flex items-center justify-center bg-navy-900 text-white rounded-full hover:bg-navy-800 disabled:opacity-50 transition-colors"
            >
              <Send size={15} />
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
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 grid md:grid-cols-2 gap-4 mb-6">
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-slate-500">Your progress</div>
                <div className="text-lg font-semibold text-navy-900">
                  {doneCount} <span className="text-slate-400 font-normal">/ {totalCount} steps completed</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-navy-900 tabular-nums">{progressPct}%</div>
                <button onClick={handleReset} className="text-xs text-navy-700 hover:underline">
                  Start over
                </button>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex gap-1 border-b border-slate-200 mb-4 text-sm">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 pb-2.5 px-3 -mb-px border-b-2 transition-colors ${
                view === "list" ? "border-navy-900 text-navy-900 font-medium" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <ListChecks size={15} /> Checklist
            </button>
            <button
              onClick={() => setView("timeline")}
              className={`flex items-center gap-1.5 pb-2.5 px-3 -mb-px border-b-2 transition-colors ${
                view === "timeline" ? "border-navy-900 text-navy-900 font-medium" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Milestone size={15} /> Timeline
            </button>
          </div>

          {view === "list" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium w-10">#</th>
                    <th className="text-left px-4 py-2.5 font-medium">Task</th>
                    <th className="text-left px-4 py-2.5 font-medium">Required documents</th>
                    <th className="text-left px-4 py-2.5 font-medium">Official link</th>
                    <th className="text-left px-4 py-2.5 font-medium">Estimated time</th>
                    <th className="text-left px-4 py-2.5 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {roadmap.steps.map((step, i) => (
                    <tr key={step.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className="shrink-0 w-7 h-7 rounded-lg bg-navy-900/5 text-navy-800 flex items-center justify-center">
                            <StepIcon stepKey={step.step_key} className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <div className="font-medium text-navy-900">{step.title}</div>
                            <div className="mt-0.5"><PriorityBadge priority={step.priority} /></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{step.materials || "—"}</td>
                      <td className="px-4 py-3">
                        {step.official_link ? (
                          <a href={step.official_link} target="_blank" rel="noreferrer" className="text-navy-700 hover:underline whitespace-nowrap">
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
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-8">
              <ol className="relative">
                {roadmap.steps.map((step, i) => (
                  <li key={step.id} className="relative pl-11 pb-7 last:pb-0">
                    {i < roadmap.steps.length - 1 && (
                      <span className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200" />
                    )}
                    <span
                      className={`absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full ${
                        step.status === "done" ? "bg-emerald-600" : "bg-navy-900"
                      } text-white`}
                    >
                      <StepIcon stepKey={step.step_key} className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`font-medium ${step.status === "done" ? "text-slate-400 line-through" : "text-navy-900"}`}>
                        {step.title}
                      </div>
                      <PriorityBadge priority={step.priority} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{step.estimated_days}</div>
                    {step.note && <div className="text-xs text-slate-400 mt-1 max-w-xl">{step.note}</div>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <h2 className="font-semibold text-navy-900 mb-3 text-base">Dynamic Todo List</h2>
          <div className="space-y-2">
            {roadmap.steps.map((step) => (
              <div
                key={step.id}
                className={`border rounded-xl p-4 flex flex-wrap items-center gap-3 transition-colors ${
                  dueDateTone(step.due_date, step.status) || "border-slate-200 bg-white"
                }`}
              >
                <label className="relative flex items-center justify-center shrink-0">
                  <input
                    type="checkbox"
                    checked={step.status === "done"}
                    onChange={(e) => handleStepUpdate(step, { status: e.target.checked ? "done" : "not_started" })}
                    className="w-4 h-4 accent-navy-900 cursor-pointer"
                  />
                </label>
                <span className="shrink-0 w-8 h-8 rounded-lg bg-navy-900/5 text-navy-800 flex items-center justify-center">
                  <StepIcon stepKey={step.step_key} className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-[180px]">
                  <div className={`font-medium ${step.status === "done" ? "text-slate-400 line-through" : "text-navy-900"}`}>{step.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{step.category}</span>
                    <PriorityBadge priority={step.priority} />
                  </div>
                </div>
                <select
                  value={step.status}
                  onChange={(e) => handleStepUpdate(step, { status: e.target.value })}
                  className="border border-slate-300 rounded-md px-2 py-1.5 text-xs bg-white"
                >
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <DatePicker
                  value={step.due_date}
                  onChange={(iso) => handleStepUpdate(step, { due_date: iso })}
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
