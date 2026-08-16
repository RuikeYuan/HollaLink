"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ApiError, CostCalculatorResponse, ReportOut, createReport, runCalculator } from "@/lib/api";

const INDUSTRIES = [
  { value: "horeca", label: "Restaurant / Hotpot / Chinese food" },
  { value: "bubble_tea", label: "Bubble tea / Beverage shop" },
  { value: "retail", label: "Retail store" },
  { value: "beauty", label: "Beauty salon" },
  { value: "other", label: "Other" },
];

const CITIES = ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Other city"];

export default function ReportPage() {
  const [industry, setIndustry] = useState("horeca");
  const [city, setCity] = useState("Amsterdam");
  const [budget, setBudget] = useState(150000);
  const [notes, setNotes] = useState("");

  const [quickResult, setQuickResult] = useState<CostCalculatorResponse | null>(null);
  const [report, setReport] = useState<ReportOut | null>(null);
  const [loadingQuick, setLoadingQuick] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleQuickCalc() {
    setLoadingQuick(true);
    setError(null);
    try {
      const res = await runCalculator({ industry, city, budget_eur: budget });
      setQuickResult(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Calculation failed");
    } finally {
      setLoadingQuick(false);
    }
  }

  async function handleGenerateReport() {
    setLoadingReport(true);
    setError(null);
    setReport(null);
    try {
      const userId = typeof window !== "undefined" ? localStorage.getItem("dbn_user_id") : null;
      const res = await createReport({ industry, city, budget_eur: budget, notes, user_id: userId });
      setReport(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Report generation failed");
    } finally {
      setLoadingReport(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-navy-900 mb-2">Investment Report</h1>
      <p className="text-sm text-slate-500 mb-6">Fill in the basics, run a quick cost estimate, then generate a full business analysis report.</p>

      <div className="bg-white border border-slate-200 rounded-lg p-6 grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Industry</label>
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
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
          <label className="block text-sm text-slate-600 mb-1">Budget (EUR)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Additional notes (optional)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. already have Dutch residency / planning a franchise brand"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2 flex gap-3 pt-2">
          <button onClick={handleQuickCalc} disabled={loadingQuick} className="border border-navy-800 text-navy-800 px-5 py-2 rounded-md text-sm font-medium hover:bg-navy-50 disabled:opacity-50">
            {loadingQuick ? "Calculating…" : "Quick cost estimate"}
          </button>
          <button onClick={handleGenerateReport} disabled={loadingReport} className="bg-navy-900 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50">
            {loadingReport ? "Generating (may take 10-30s)…" : "Generate full business analysis report"}
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      {quickResult && !report && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-navy-900 mb-3">Quick estimate results</h2>
          <p className="text-sm text-slate-700 mb-3">{quickResult.budget_verdict}</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 rounded-md p-4">
              <div className="text-xs text-slate-500">Total one-time investment</div>
              <div className="text-lg font-bold text-navy-900">€{quickResult.one_time_total_eur.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 rounded-md p-4">
              <div className="text-xs text-slate-500">Total monthly operating cost</div>
              <div className="text-lg font-bold text-navy-900">€{quickResult.monthly_total_eur.toLocaleString()}</div>
            </div>
          </div>
          <ul className="text-sm text-slate-600 space-y-1 mb-4">
            {quickResult.breakdown.map((item, i) => (
              <li key={i}>
                <span className="font-medium text-slate-800">{item.label}</span>{" "}
                {item.one_time_eur ? `one-time €${item.one_time_eur.toLocaleString()} ` : ""}
                {item.monthly_eur ? `monthly €${item.monthly_eur.toLocaleString()} ` : ""}
                {item.note && <span className="text-slate-400">— {item.note}</span>}
              </li>
            ))}
          </ul>
          {quickResult.risks.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1">Risk flags</div>
              <ul className="text-sm text-amber-700 list-disc pl-5 space-y-1">
                {quickResult.risks.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {report && (
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-navy-900">{report.title}</h2>
            <a
              className="text-xs text-navy-700 hover:underline"
              href={`data:text/markdown;charset=utf-8,${encodeURIComponent(report.content_markdown)}`}
              download={`${report.title}.md`}
            >
              Download Markdown
            </a>
          </div>
          <div className="prose-report">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content_markdown}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
