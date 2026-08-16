import json
import re

from services.llm_client import chat_completion

VALID_SHOP_TYPES = {"horeca", "bubble_tea", "retail", "beauty", "other"}
VALID_COMPANY_TYPES = {"eenmanszaak", "bv", "vof"}
FIELD_ORDER = [
    "shop_type",
    "city",
    "company_type",
    "sells_food_beverage",
    "sells_alcohol",
    "has_staff",
    "needs_renovation",
]

SYSTEM_PROMPT = """You are a friendly intake assistant for the "Dutch Business Navigator" compliance roadmap tool.

Your only job is to collect exactly these 7 fields from the user through natural conversation, asking about
one or two at a time (never dump all 7 questions on the user at once):

- shop_type: must be exactly one of "horeca" (restaurant/cafe/hotpot), "bubble_tea", "retail", "beauty", "other"
- city: the Dutch city they plan to open in (free text, e.g. "Amsterdam")
- company_type: must be exactly one of "eenmanszaak" (sole proprietorship), "bv" (private limited company), "vof" (general partnership) — if the user doesn't know, briefly explain the difference in one sentence and suggest "eenmanszaak" as the common default for a first-time solo founder
- sells_food_beverage: true/false — will they sell food or drinks
- sells_alcohol: true/false — will they sell alcohol
- has_staff: true/false — will they hire employees
- needs_renovation: true/false — will the space need renovation before opening

Rules:
- Map casual answers to the exact enum values yourself (e.g. "coffee shop" -> horeca, "just me, no employees" -> has_staff: false, "yes we'll sell beer" -> sells_alcohol: true AND sells_food_beverage: true)
- Never ask about a field that's already in "Known fields so far" below
- Keep replies short and conversational, one short paragraph or less
- Once ALL 7 fields are known (from this conversation or already known), set "done": true, write a brief closing reply confirming you have what you need, and include all 7 fields in "fields"
- You MUST respond with ONLY a single JSON object, no markdown code fences, no extra text, in exactly this shape:
{"reply": "<your message to the user>", "fields": {<any newly confirmed fields as key/value pairs, using the exact field names and value types above>}, "done": <true or false>}
"""


def _known_fields_block(known: dict) -> str:
    known = {k: v for k, v in known.items() if v is not None}
    if not known:
        return "Known fields so far: (none yet)"
    return f"Known fields so far: {json.dumps(known)}"


def _extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in model output")
    return json.loads(match.group(0))


def _coerce_fields(raw_fields: dict, known: dict) -> dict:
    merged = dict(known)
    for key in FIELD_ORDER:
        if key not in raw_fields or raw_fields[key] is None:
            continue
        value = raw_fields[key]
        if key == "shop_type":
            if isinstance(value, str) and value.strip().lower() in VALID_SHOP_TYPES:
                merged[key] = value.strip().lower()
        elif key == "company_type":
            if isinstance(value, str) and value.strip().lower() in VALID_COMPANY_TYPES:
                merged[key] = value.strip().lower()
        elif key == "city":
            if isinstance(value, str) and value.strip():
                merged[key] = value.strip()
        else:
            if isinstance(value, bool):
                merged[key] = value
    return merged


def run_intake_step(user_message: str, history: list[dict], known_fields: dict) -> dict:
    known_fields = {k: v for k, v in known_fields.items() if v is not None}
    augmented_message = f"{_known_fields_block(known_fields)}\n\nUser: {user_message}"

    raw_reply = chat_completion(SYSTEM_PROMPT, history, augmented_message)

    try:
        parsed = _extract_json(raw_reply)
    except (ValueError, json.JSONDecodeError):
        return {
            "reply": raw_reply.strip() or "Sorry, could you rephrase that?",
            "fields": known_fields,
            "done": False,
        }

    merged_fields = _coerce_fields(parsed.get("fields") or {}, known_fields)
    all_known = all(merged_fields.get(k) is not None for k in FIELD_ORDER)

    return {
        "reply": parsed.get("reply") or "",
        "fields": merged_fields,
        "done": bool(parsed.get("done")) and all_known,
    }
