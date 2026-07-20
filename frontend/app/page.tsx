import Link from "next/link";

const SERVICES = [
  {
    title: "AI 开店顾问",
    desc: "输入行业、城市、预算，实时获得项目分析、成本方向和风险提示。",
    href: "/chat",
    cta: "开始咨询",
  },
  {
    title: "开店投资报告",
    desc: "生成结构化商业分析报告：项目概况、市场分析、投资预算、风险分析、开店路线、建议。",
    href: "/report",
    cta: "生成报告",
  },
];

const PAIN_POINTS = [
  { q: "在荷兰开什么店赚钱？", a: "结合城市、人口、消费能力与竞争情况给出方向性分析。" },
  { q: "阿姆斯特丹和鹿特丹哪个适合？", a: "基于客群、租金区间、竞争密度和许可审批风格的城市对比。" },
  { q: "这个店转让能买吗？", a: "识别房屋用途（bestemmingsplan）、租赁风险、许可证与装修改造隐患。" },
  { q: "开店流程复杂吗？", a: "覆盖公司注册、税务、食品许可、雇佣员工、政府审批全流程指导。" },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">中国创业者进入荷兰市场的第一站</h1>
          <p className="text-slate-300 max-w-2xl mx-auto mb-8">
            AI 咨询 + 本地商业知识库 + 人工顾问服务，帮助你完成从想法、评估、开店到营业的全过程。
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/chat" className="bg-white text-navy-900 font-semibold px-6 py-3 rounded-md hover:bg-slate-100">
              开始咨询
            </Link>
            <Link href="/report" className="border border-white/40 px-6 py-3 rounded-md hover:bg-white/10">
              生成投资报告
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-xl font-bold text-navy-900 mb-6">核心产品</h2>
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
          <h2 className="text-xl font-bold text-navy-900 mb-6">我们解决这些问题</h2>
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
