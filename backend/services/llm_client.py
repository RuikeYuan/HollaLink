from config import get_settings

settings = get_settings()


class LLMNotConfiguredError(RuntimeError):
    pass


def _gemini_client():
    if not settings.gemini_api_key:
        raise LLMNotConfiguredError("GEMINI_API_KEY 未配置，请在 .env 中设置后重启服务。")
    from google import genai

    return genai.Client(api_key=settings.gemini_api_key)


def _openai_compatible_client(api_key: str, base_url: str | None = None):
    from openai import OpenAI

    return OpenAI(api_key=api_key, base_url=base_url)


def chat_completion(system_prompt: str, history: list[dict], user_message: str) -> str:
    """history: list of {"role": "user"|"assistant", "content": str}"""
    provider = settings.llm_provider.lower()

    if provider == "gemini":
        client = _gemini_client()
        contents = []
        for turn in history:
            role = "user" if turn["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": turn["content"]}]})
        contents.append({"role": "user", "parts": [{"text": user_message}]})

        response = client.models.generate_content(
            model=settings.gemini_chat_model,
            contents=contents,
            config={"system_instruction": system_prompt},
        )
        return response.text or ""

    if provider in ("openai", "groq"):
        if provider == "openai":
            if not settings.openai_api_key:
                raise LLMNotConfiguredError("OPENAI_API_KEY 未配置，请在 .env 中设置后重启服务。")
            client = _openai_compatible_client(settings.openai_api_key)
            model = settings.openai_chat_model
        else:
            if not settings.groq_api_key:
                raise LLMNotConfiguredError("GROQ_API_KEY 未配置，请在 .env 中设置后重启服务。")
            client = _openai_compatible_client(settings.groq_api_key, base_url="https://api.groq.com/openai/v1")
            model = settings.groq_chat_model

        messages = [{"role": "system", "content": system_prompt}]
        for turn in history:
            messages.append({"role": turn["role"], "content": turn["content"]})
        messages.append({"role": "user", "content": user_message})

        completion = client.chat.completions.create(model=model, messages=messages)
        return completion.choices[0].message.content or ""

    raise LLMNotConfiguredError(f"未知的 LLM_PROVIDER: {provider}")


def embed_text(text: str) -> list[float]:
    if settings.gemini_api_key:
        client = _gemini_client()
        result = client.models.embed_content(model=settings.gemini_embedding_model, contents=text)
        return list(result.embeddings[0].values)

    if settings.openai_api_key:
        client = _openai_compatible_client(settings.openai_api_key)
        result = client.embeddings.create(model="text-embedding-3-small", input=text)
        return list(result.data[0].embedding)

    raise LLMNotConfiguredError("未配置任何支持 embedding 的 API Key（GEMINI_API_KEY 或 OPENAI_API_KEY）。")
