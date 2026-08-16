import Link from "next/link";
import { ArrowRight, Building2, Compass, FileBarChart, MapPin, MessageSquareText, ShieldQuestion, Sparkles, Store } from "lucide-react";

const SERVICES = [
  {
    title: "Compliance Roadmap",
    desc: "Answer a few questions and get a personalized compliance checklist in 2 minutes (rule-engine generated, not AI-generated, so the result is deterministic and reliable), with progress tracking for every step.",
    href: "/roadmap",
    cta: "Generate roadmap",
    icon: Compass,
  },
  {
    title: "AI Business Advisor",
    desc: "Enter your industry, city, and budget to get real-time project analysis, cost direction, and risk flags.",
    href: "/chat",
    cta: "Start consultation",
    icon: MessageSquareText,
  },
  {
    title: "Investment Report",
    desc: "Generate a structured business analysis report: project overview, market analysis, investment budget, risk analysis, path to launch, and recommendations.",
    href: "/report",
    cta: "Generate report",
    icon: FileBarChart,
  },
];

const PAIN_POINTS = [
  { q: "What kind of store is profitable to open in the Netherlands?", a: "Directional analysis based on city, population, spending power, and competitive landscape.", icon: Store },
  { q: "Amsterdam or Rotterdam — which is the better fit?", a: "City comparison based on customer base, rent range, competitive density, and permit approval style.", icon: MapPin },
  { q: "Can I buy this business as a going concern?", a: "Identify zoning use (bestemmingsplan), lease risk, permit status, and renovation red flags.", icon: Building2 },
  { q: "Is the process of opening a store complicated?", a: "End-to-end guidance covering company registration, tax, food permits, hiring staff, and government approvals.", icon: ShieldQuestion },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-xs font-medium text-slate-200 mb-6">
            <Sparkles size={12} /> AI-assisted, rule-engine verified
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight leading-tight">
            The launchpad for entrepreneurs<br className="hidden md:block" /> entering the Dutch market
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto mb-9 text-base leading-relaxed">
            AI consultation + local business knowledge base + expert services, helping you go from idea to evaluation to opening day.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/chat" className="inline-flex items-center gap-2 bg-white text-navy-900 font-semibold px-6 py-3 rounded-full hover:bg-slate-100 transition-colors">
              Start consultation <ArrowRight size={16} />
            </Link>
            <Link href="/report" className="inline-flex items-center gap-2 border border-white/30 px-6 py-3 rounded-full hover:bg-white/10 transition-colors">
              Generate investment report
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-xl font-bold text-navy-900 mb-6">Core products</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {SERVICES.map((s) => (
            <div
              key={s.href}
              className="group border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-navy-900/5 text-navy-800 flex items-center justify-center mb-4 group-hover:bg-navy-900 group-hover:text-white transition-colors">
                <s.icon size={19} />
              </div>
              <h3 className="font-semibold text-navy-900 mb-2">{s.title}</h3>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">{s.desc}</p>
              <Link href={s.href} className="inline-flex items-center gap-1 text-navy-700 font-medium text-sm hover:underline">
                {s.cta} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-xl font-bold text-navy-900 mb-6">Problems we solve</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {PAIN_POINTS.map((p) => (
              <div key={p.q} className="flex gap-4 p-5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-white border border-slate-200 text-navy-800 flex items-center justify-center">
                  <p.icon size={16} />
                </div>
                <div>
                  <p className="font-semibold text-navy-900 mb-1">"{p.q}"</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{p.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
