from agents.business_consultant import build_context_block
from rag.vector_store import query_knowledge_base
from services.cost_calculator import calculate_costs
from services.llm_client import chat_completion

REPORT_SYSTEM_PROMPT = """你是"荷兰开店通"平台的商业报告撰写引擎。

根据用户提供的行业、城市、预算，以及系统提供的成本测算数据和知识库参考资料，生成一份结构化的中文创业分析报告。

报告必须使用 Markdown 格式，并严格包含以下六个一级标题，顺序不可更改：

# 项目概况
# 市场分析
# 投资预算
# 风险分析
# 开店路线
# 建议

要求：
- "投资预算"部分必须完整、清晰地呈现给定的成本测算数据（一次性投入、月度运营成本、预算是否充足的结论），可以适当补充说明但不能省略这些数字
- "风险分析"部分要结合知识库参考资料中的真实案例和法规要点，给出具体、可执行的风险提示，而不是泛泛而谈
- "开店路线"部分给出按时间顺序的关键步骤（如公司注册、许可申请、签约、装修、试营业等）
- 全文避免空话套话，每个部分都要有具体、可执行的内容
- 涉及具体税率/费用数字时如果来源不确定，要注明"以官方最新数据为准"
"""


def generate_report(industry: str, city: str, budget_eur: int, notes: str = "") -> tuple[str, dict]:
    cost_data = calculate_costs(industry, city, budget_eur, size_sqm=None, staff_count=None)

    query = f"{industry} {city} 开店 成本 风险 许可 流程"
    hits = query_knowledge_base(query, k=6)
    context_block = build_context_block(hits)

    cost_lines = "\n".join(
        f"- {item['label']}: "
        + (f"一次性 €{item['one_time_eur']:,} " if item.get("one_time_eur") else "")
        + (f"月度 €{item['monthly_eur']:,} " if item.get("monthly_eur") else "")
        + (item.get("note") or "")
        for item in cost_data["breakdown"]
    )

    user_prompt = f"""请为以下创业项目生成商业分析报告：

- 行业：{industry}
- 城市：{city}
- 预算：€{budget_eur:,}
- 补充说明：{notes or "无"}

系统成本测算结果（请在"投资预算"部分完整呈现，可适当组织语言但不要遗漏数字）：
一次性投入合计：约 €{cost_data['one_time_total_eur']:,}
月度运营成本合计：约 €{cost_data['monthly_total_eur']:,}
预算结论：{cost_data['budget_verdict']}

成本明细：
{cost_lines}

已识别的行业通用风险：
{chr(10).join('- ' + r for r in cost_data['risks'])}

知识库参考资料（可用于补充市场分析、法规和风险分析部分，仅使用与本项目相关的内容）：
{context_block or "（本次未检索到高度相关的资料，可基于通用荷兰创业知识撰写）"}
"""

    markdown = chat_completion(REPORT_SYSTEM_PROMPT, [], user_prompt)
    return markdown, cost_data
