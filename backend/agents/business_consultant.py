from rag.vector_store import query_knowledge_base
from services.llm_client import chat_completion

SYSTEM_PROMPT = """你是"荷兰开店通"平台的荷兰商业顾问 Agent。

你的用户是希望在荷兰开店或将品牌带入荷兰市场的中国创业者。

你的任务：
1. 分析创业项目可行性
2. 解释荷兰商业规则（公司注册、许可、税务、移民身份）
3. 提供成本估算的方向性建议
4. 识别潜在风险，尤其是中国创业者容易忽视的本地化陷阱
5. 给出清晰可执行的下一步行动方案

回答要求：
- 使用中文回答
- 内容要实用、具体，面向真实的创业决策，避免空泛的套话
- 涉及税率、费用等具体数字时，如果不确定当年最新数值，要明确提示"具体数值请以官方最新公布为准"，不要编造虚假的精确数字
- 如果提供的参考资料中出现了具体的案例、法规或数据，优先结合这些资料回答，并可以自然地提及信息来源（如"根据平台案例库"）
- 如果用户的问题涉及移民身份、法律或税务的最终决定，提醒用户在正式行动前咨询持牌律师/会计师核实，但仍要先给出你自己的实用分析和建议，不要用免责声明代替回答
"""


def build_context_block(hits: list[dict]) -> str:
    if not hits:
        return ""
    parts = []
    for hit in hits:
        parts.append(f"[来源: {hit['category']}/{hit['filename']}]\n{hit['content']}")
    return "\n\n---\n\n".join(parts)


def answer_with_rag(user_message: str, history: list[dict]) -> tuple[str, list[str]]:
    hits = query_knowledge_base(user_message, k=4)
    context_block = build_context_block(hits)

    if context_block:
        augmented_message = (
            f"以下是平台知识库中检索到的可能相关资料：\n\n{context_block}\n\n"
            f"---\n\n请结合以上资料（如果相关）回答用户的问题：\n{user_message}"
        )
    else:
        augmented_message = user_message

    reply = chat_completion(SYSTEM_PROMPT, history, augmented_message)
    sources = sorted({f"{hit['category']}/{hit['filename']}" for hit in hits})
    return reply, sources
