CITY_RENT_PER_SQM = {
    "amsterdam": 55,
    "rotterdam": 32,
    "den haag": 30,
    "denhaag": 30,
    "the hague": 30,
    "utrecht": 34,
    "eindhoven": 26,
}
DEFAULT_RENT_PER_SQM = 28

INDUSTRY_PROFILES = {
    "horeca": {
        "label": "Restaurant (incl. hotpot / Chinese cuisine)",
        "renovation_per_sqm": (900, 1600),
        "default_size_sqm": 120,
        "default_staff": 6,
        "staff_monthly_cost": 2900,
        "extra_one_time": [("Extraction/food safety/permit package", 15000, "High-fume formats (hotpot/BBQ) can run significantly higher — assess separately")],
        "extra_monthly": [("Food/ingredient cost is a large share of revenue and needs its own revenue-based model", 0)],
        "risks": [
            "Kitchen extraction system (ESP grease filtration) retrofit cost is commonly underestimated — confirm the existing setup's spec before signing",
            "Selling alcohol requires a separate Drank- en Horecawet license and passing a Bibob screening of your funding sources",
            "The hospitality CAO mandates minimum wage and overtime pay — don't estimate staff cost using minimum wage alone",
        ],
    },
    "bubble_tea": {
        "label": "Bubble tea / Beverage shop",
        "renovation_per_sqm": (500, 900),
        "default_size_sqm": 50,
        "default_staff": 3,
        "staff_monthly_cost": 2600,
        "extra_one_time": [("Equipment (tea-making machines/display fridge/POS)", 20000, "")],
        "extra_monthly": [],
        "risks": [
            "Prime locations (near stations/shopping streets) carry a rent premium — check whether foot traffic can cover it",
            "Food safety registration and allergen labelling (dairy, nuts, etc.) still apply — don't skip it just because it's \"only drinks\"",
        ],
    },
    "retail": {
        "label": "Retail store",
        "renovation_per_sqm": (400, 800),
        "default_size_sqm": 90,
        "default_staff": 3,
        "staff_monthly_cost": 2500,
        "extra_one_time": [("Initial inventory purchase", 25000, "")],
        "extra_monthly": [],
        "risks": [
            "Inventory capital tie-up is a common cash-flow risk in retail — plan working capital separately rather than putting it all into renovation",
            "Assess competitive pressure from e-commerce and large chains for brick-and-mortar retail",
        ],
    },
    "beauty": {
        "label": "Beauty salon",
        "renovation_per_sqm": (700, 1200),
        "default_size_sqm": 70,
        "default_staff": 4,
        "staff_monthly_cost": 2700,
        "extra_one_time": [("Professional equipment (beauty devices, etc.)", 18000, "")],
        "extra_monthly": [],
        "risks": [
            "Some beauty treatments (medical-aesthetic adjacent) are subject to additional medical-device/hygiene regulation in the Netherlands — confirm whether extra qualifications are needed",
            "Verify separately whether staff skill certifications (e.g. nail, lash technicians) are recognized in the Netherlands",
        ],
    },
    "other": {
        "label": "Other",
        "renovation_per_sqm": (500, 1000),
        "default_size_sqm": 80,
        "default_staff": 3,
        "staff_monthly_cost": 2600,
        "extra_one_time": [],
        "extra_monthly": [],
        "risks": ["This is a generic industry profile — for a more precise risk picture, follow up with the advisor agent on your specific business"],
    },
}


def _rent_per_sqm(city: str) -> int:
    return CITY_RENT_PER_SQM.get(city.strip().lower(), DEFAULT_RENT_PER_SQM)


def calculate_costs(industry: str, city: str, budget_eur: int, size_sqm: int | None, staff_count: int | None) -> dict:
    profile = INDUSTRY_PROFILES.get(industry.strip().lower(), INDUSTRY_PROFILES["other"])
    size = size_sqm or profile["default_size_sqm"]
    staff = staff_count if staff_count is not None else profile["default_staff"]
    rent_per_sqm = _rent_per_sqm(city)

    monthly_rent = rent_per_sqm * size
    deposit = monthly_rent * 3
    reno_low, reno_high = profile["renovation_per_sqm"]
    renovation_mid = int((reno_low + reno_high) / 2 * size)
    kvk_fee = 80

    breakdown = [
        {"label": "KVK registration fee", "one_time_eur": kvk_fee, "note": "One-time Chamber of Commerce registration fee"},
        {"label": "Deposit (approx. 3 months' rent)", "one_time_eur": int(deposit), "note": f"Estimated at €{rent_per_sqm}/sqm/month"},
        {
            "label": "Renovation",
            "one_time_eur": renovation_mid,
            "note": f"Range roughly €{reno_low}-{reno_high}/sqm — reserve a 20-30% buffer for hidden work (extraction/drainage/fire safety)",
        },
    ]
    for label, amount, note in profile["extra_one_time"]:
        breakdown.append({"label": label, "one_time_eur": amount, "note": note})

    breakdown.append({"label": "Rent", "monthly_eur": int(monthly_rent), "note": f"Estimated at €{rent_per_sqm}/sqm/month"})
    breakdown.append(
        {"label": "Staff cost", "monthly_eur": staff * profile["staff_monthly_cost"], "note": f"Estimated at {staff} staff × approx. €{profile['staff_monthly_cost']}/month (incl. employer social contributions)"}
    )
    breakdown.append({"label": "Utilities/insurance/bookkeeping and other overhead", "monthly_eur": 1200, "note": "Bookkeeping service, insurance, utilities/internet and other fixed overhead"})
    breakdown.append({"label": "Marketing", "monthly_eur": 500, "note": ""})

    one_time_total = sum(item.get("one_time_eur") or 0 for item in breakdown)
    monthly_total = sum(item.get("monthly_eur") or 0 for item in breakdown)

    recommended_buffer = one_time_total + monthly_total * 3
    if budget_eur >= recommended_buffer:
        verdict = (
            f"Your budget of €{budget_eur:,} covers the estimated one-time investment (approx. €{one_time_total:,}) plus a 3-month "
            f"operating buffer (approx. €{monthly_total * 3:,}) — the financial plan looks reasonably solid."
        )
    elif budget_eur >= one_time_total:
        gap = recommended_buffer - budget_eur
        verdict = (
            f"Your budget of €{budget_eur:,} covers the estimated one-time investment (approx. €{one_time_total:,}), but leaves insufficient "
            f"cash-flow buffer for the first 3 months of operation — consider setting aside another €{gap:,} to avoid a cash crunch during "
            f"the initial ramp-up period."
        )
    else:
        gap = one_time_total - budget_eur
        verdict = (
            f"Your budget of €{budget_eur:,} falls short of the estimated one-time investment (approx. €{one_time_total:,}) by roughly "
            f"€{gap:,} — consider a smaller space/lower renovation spec, or re-evaluate whether this format is feasible at this budget."
        )

    return {
        "industry": profile["label"],
        "city": city,
        "budget_eur": budget_eur,
        "one_time_total_eur": one_time_total,
        "monthly_total_eur": monthly_total,
        "breakdown": breakdown,
        "risks": profile["risks"],
        "budget_verdict": verdict,
    }
