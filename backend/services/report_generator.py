from agents.business_consultant import build_context_block
from rag.vector_store import query_knowledge_base
from services.cost_calculator import calculate_costs
from services.llm_client import chat_completion

REPORT_SYSTEM_PROMPT = """You are the business report writing engine for the "Dutch Business Navigator" platform.

Based on the industry, city, and budget provided by the user, plus the cost estimate data and knowledge-base reference material supplied by the system, generate a structured business analysis report in English.

The report must use Markdown format and include exactly these six top-level headings, in this order, unchanged:

# Project Overview
# Market Analysis
# Investment Budget
# Risk Analysis
# Path to Launch
# Recommendations

Requirements:
- The "Investment Budget" section must fully and clearly present the given cost estimate data (one-time investment, monthly operating cost, and the conclusion on whether the budget is sufficient) — you may add explanation but must not omit these numbers
- The "Risk Analysis" section must draw on real cases and regulatory points from the knowledge-base reference material to give specific, actionable risk warnings, not generic statements
- The "Path to Launch" section must give key steps in chronological order (e.g. company registration, permit applications, signing the lease, renovation, soft opening, etc.)
- Avoid filler and vague language throughout — every section must contain specific, actionable content
- When citing specific tax rates or fee figures whose source is uncertain, note "please verify against the latest official figures"
"""


def generate_report(industry: str, city: str, budget_eur: int, notes: str = "") -> tuple[str, dict]:
    cost_data = calculate_costs(industry, city, budget_eur, size_sqm=None, staff_count=None)

    query = f"{industry} {city} start a business cost risk permit process"
    hits = query_knowledge_base(query, k=6)
    context_block = build_context_block(hits)

    cost_lines = "\n".join(
        f"- {item['label']}: "
        + (f"one-time €{item['one_time_eur']:,} " if item.get("one_time_eur") else "")
        + (f"monthly €{item['monthly_eur']:,} " if item.get("monthly_eur") else "")
        + (item.get("note") or "")
        for item in cost_data["breakdown"]
    )

    user_prompt = f"""Generate a business analysis report for the following venture:

- Industry: {industry}
- City: {city}
- Budget: €{budget_eur:,}
- Additional notes: {notes or "None"}

System cost estimate results (present these fully in the "Investment Budget" section — you may phrase it naturally but must not omit the numbers):
Total one-time investment: approx. €{cost_data['one_time_total_eur']:,}
Total monthly operating cost: approx. €{cost_data['monthly_total_eur']:,}
Budget verdict: {cost_data['budget_verdict']}

Cost breakdown:
{cost_lines}

Identified industry-general risks:
{chr(10).join('- ' + r for r in cost_data['risks'])}

Knowledge-base reference material (use it to enrich the market analysis, regulatory, and risk analysis sections — only use content relevant to this venture):
{context_block or "(No highly relevant material was retrieved this time — base the report on general knowledge of starting a business in the Netherlands)"}
"""

    markdown = chat_completion(REPORT_SYSTEM_PROMPT, [], user_prompt)
    return markdown, cost_data
