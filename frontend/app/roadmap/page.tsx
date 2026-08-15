"use client";

import { useEffect, useState } from "react";
import { ApiError, RoadmapOut, RoadmapStepOut, createRoadmap, getRoadmap, updateRoadmapStep } from "@/lib/api";

const SHOP_TYPES = [
  { value: "horeca", label: "餐饮 / 火锅 / 中餐 / 咖啡厅" },
  { value: "bubble_tea", label: "奶茶 / 饮品店" },
  { value: "retail", label: "零售店" },
  { value: "beauty", label: "美容店" },
  { value: "other", label: "其他" },
];

const CITIES = ["阿姆斯特丹", "鹿特丹", "海牙", "乌得勒支", "埃因霍温", "其他城市"];

const COMPANY_TYPES = [
  { value: "eenmanszaak", label: "Eenmanszaak（个体经营）" },
  { value: "bv", label: "BV（有限责任公司）" },
  { value: "vof", label: "VOF（普通合伙）" },
];

const STATUS_LABEL: Record<string, string> = {
  not_started: "未开始",
  in_progress: "进行中",
  done: "已完成",
};

const PRIORITY_LABEL: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const STORAGE_KEY = "dbn_roadmap_id";

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
  const [shopType, setShopType] = useState("horeca");
  const [city, setCity] = useState("阿姆斯特丹");
  const [companyType, setCompanyType] = useState("eenmanszaak");
  const [sellsFoodBeverage, setSellsFoodBeverage] = useState(true);
  const [sellsAlcohol, setSellsAlcohol] = useState(false);
  const [hasStaff, setHasStaff] = useState(true);
  const [needsRenovation, setNeedsRenovation] = useState(true);

  const [roadmap, setRoadmap] = useState<RoadmapOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId) return;
    getRoadmap(savedId)
      .then(setRoadmap)
      .catch(() => localStorage.removeItem(STORAGE_KEY));
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem("dbn_user_id");
      const res = await createRoadmap({
        shop_type: shopType,
        city,
        company_type: companyType,
        sells_food_beverage: sellsFoodBeverage,
        sells_alcohol: sellsAlcohol,
        has_staff: hasStaff,
        needs_renovation: needsRenovation,
        user_id: userId,
      });
      setRoadmap(res);
      localStorage.setItem(STORAGE_KEY, res.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
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
  }

  const doneCount = roadmap?.steps.filter((s) => s.status === "done").length ?? 0;
  const totalCount = roadmap?.steps.length ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-navy-900 mb-2">开店合规路线图</h1>
      <p className="text-sm text-slate-500 mb-6">
        回答几个问题，2 分钟内获得一份个性化、可执行的开店合规清单——基于规则引擎生成，不依赖 AI 生成，结果确定可靠。
      </p>

      {!roadmap && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-slate-600 mb-1">店铺类型</label>
            <select value={shopType} onChange={(e) => setShopType(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
              {SHOP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">所在城市</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">公司类型</label>
            <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
              {COMPANY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 grid sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={sellsFoodBeverage} onChange={(e) => setSellsFoodBeverage(e.target.checked)} />
              是否涉及食品饮料
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={sellsAlcohol} onChange={(e) => setSellsAlcohol(e.target.checked)} />
              是否售卖酒精
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={hasStaff} onChange={(e) => setHasStaff(e.target.checked)} />
              是否雇佣员工
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={needsRenovation} onChange={(e) => setNeedsRenovation(e.target.checked)} />
              是否需要装修
            </label>
          </div>

          <div className="md:col-span-2 pt-2">
            <button onClick={handleGenerate} disabled={loading} className="bg-navy-900 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50">
              {loading ? "生成中…" : "生成合规路线图"}
            </button>
          </div>
        </div>
      )}

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      {roadmap && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-600">
              进度 <span className="font-semibold text-navy-900">{doneCount}/{totalCount}</span> 已完成
            </div>
            <button onClick={handleReset} className="text-xs text-navy-700 hover:underline">
              重新填写问卷
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto mb-8">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">办理事项</th>
                  <th className="text-left px-4 py-2 font-medium">所需材料</th>
                  <th className="text-left px-4 py-2 font-medium">官方链接</th>
                  <th className="text-left px-4 py-2 font-medium">预计时间</th>
                  <th className="text-left px-4 py-2 font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                {roadmap.steps.map((step) => (
                  <tr key={step.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-navy-900 whitespace-nowrap">{step.title}</td>
                    <td className="px-4 py-3 text-slate-600">{step.materials || "—"}</td>
                    <td className="px-4 py-3">
                      {step.official_link ? (
                        <a href={step.official_link} target="_blank" rel="noreferrer" className="text-navy-700 hover:underline">
                          官方链接 ↗
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

          <h2 className="font-semibold text-navy-900 mb-3">动态 Todo List</h2>
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
                  <div className="text-xs text-slate-500">{step.category} · 优先级 {PRIORITY_LABEL[step.priority] || step.priority}</div>
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
                  <span className="text-xs font-medium text-amber-700">截止日期临近</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
