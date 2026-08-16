import Link from "next/link";

const SERVICES = [
  {
    title: "Compliance Roadmap",
    desc: "Answer a few questions and get a personalized compliance checklist in 2 minutes (rule-engine generated, not AI-generated, so the result is deterministic and reliable), with progress tracking for every step.",
    href: "/roadmap",
    cta: "Generate roadmap",
  },
  {
    title: "AI Business Advisor",
    desc: "Enter your industry, city, and budget to get real-time project analysis, cost direction, and risk flags.",
    href: "/chat",
    cta: "Start consultation",
  },
  {
    title: "Investment Report",
    desc: "Generate a structured business analysis report: project overview, market analysis, investment budget, risk analysis, path to launch, and recommendations.",
    href: "/report",
    cta: "Generate report",
  },
];

const PAIN_POINTS = [
  { q: "What kind of store is profitable to open in the Netherlands?", a: "Directional analysis based on city, population, spending power, and competitive landscape." },
  { q: "Amsterdam or Rotterdam — which is the better fit?", a: "City comparison based on customer base, rent range, competitive density, and permit approval style." },
  { q: "Can I buy this business as a going concern?", a: "Identify zoning use (bestemmingsplan), lease risk, permit status, and renovation red flags." },
  { q: "Is the process of opening a store complicated?", a: "End-to-end guidance covering company registration, tax, food permits, hiring staff, and government approvals." },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">The launchpad for entrepreneurs entering the Dutch market</h1>
          <p className="text-slate-300 max-w-2xl mx-auto mb-8">
            AI consultation + local business knowledge base + expert services, helping you go from idea to evaluation to opening day.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/chat" className="bg-white text-navy-900 font-semibold px-6 py-3 rounded-md hover:bg-slate-100">
              Start consultation
            </Link>
            <Link href="/report" className="border border-white/40 px-6 py-3 rounded-md hover:bg-white/10">
              Generate investment report
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-xl font-bold text-navy-900 mb-6">Core products</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {SERVICES.map((s) => (
            <div key={s.href} className="border border-slate-200 rounded-lg p-6 bg-white shadow-sm">
              <h3 className="font-semibold text-navy-900 mb-2">{s.title}</h3>
              <p className="text-slate-600 text-sm mb-4">{s.desc}</p>
              <Link href={s.href} className="text-navy-700 font-medium text-sm hover:underline">
                {s.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <h2 className="text-xl font-bold text-navy-900 mb-6">Problems we solve</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {PAIN_POINTS.map((p) => (
              <div key={p.q} className="p-5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="font-semibold text-navy-900 mb-1">"{p.q}"</p>
                <p className="text-sm text-slate-600">{p.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
