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
        "label": "餐饮（含火锅/中餐）",
        "renovation_per_sqm": (900, 1600),
        "default_size_sqm": 120,
        "default_staff": 6,
        "staff_monthly_cost": 2900,
        "extra_one_time": [("排烟/食品安全/许可专项", 15000, "高油烟业态（火锅/烧烤）成本可能显著更高，务必单独评估")],
        "extra_monthly": [("食材/原材料成本占营收比例较高，需单独按营收模型测算", 0)],
        "risks": [
            "排烟系统（ESP 油烟净化）改造成本常被低估，务必在签约前确认现有设施规格",
            "如涉及酒精饮品销售，需额外申请 Drank- en Horecawet 许可并通过 Bibob 资金来源审查",
            "餐饮行业 CAO 对最低工资和加班费有强制规定，人工成本不能只按最低工资估算",
        ],
    },
    "bubble_tea": {
        "label": "奶茶/饮品店",
        "renovation_per_sqm": (500, 900),
        "default_size_sqm": 50,
        "default_staff": 3,
        "staff_monthly_cost": 2600,
        "extra_one_time": [("设备（制茶设备/展示柜/收银）", 20000, "")],
        "extra_monthly": [],
        "risks": [
            "核心商圈（车站/购物街）租金溢价明显，需评估客流是否能覆盖租金",
            "食品安全登记和过敏原标识（奶制品、坚果等）仍然适用，不能因为'只是饮品'而忽略",
        ],
    },
    "retail": {
        "label": "零售店",
        "renovation_per_sqm": (400, 800),
        "default_size_sqm": 90,
        "default_staff": 3,
        "staff_monthly_cost": 2500,
        "extra_one_time": [("初始库存采购", 25000, "")],
        "extra_monthly": [],
        "risks": [
            "库存资金占用是零售常见的现金流风险，需要单独规划周转资金而非全部投入装修",
            "线下零售需评估电商/大型连锁的同业竞争强度",
        ],
    },
    "beauty": {
        "label": "美容店",
        "renovation_per_sqm": (700, 1200),
        "default_size_sqm": 70,
        "default_staff": 4,
        "staff_monthly_cost": 2700,
        "extra_one_time": [("专业设备（美容仪器等）", 18000, "")],
        "extra_monthly": [],
        "risks": [
            "部分美容项目（医美相关）在荷兰受额外医疗器械/卫生监管，需提前确认是否需要额外资质",
            "员工技能证书（如美甲、美睫）在荷兰是否被认可需要单独核实",
        ],
    },
    "other": {
        "label": "其他业态",
        "renovation_per_sqm": (500, 1000),
        "default_size_sqm": 80,
        "default_staff": 3,
        "staff_monthly_cost": 2600,
        "extra_one_time": [],
        "extra_monthly": [],
        "risks": ["业态较为通用，建议结合具体行业进一步向顾问 Agent 追问细化风险"],
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
        {"label": "KVK 注册费", "one_time_eur": kvk_fee, "note": "商会一次性登记费"},
        {"label": "商铺押金（约 3 个月租金）", "one_time_eur": int(deposit), "note": f"按 €{rent_per_sqm}/平米/月估算"},
        {
            "label": "装修改造",
            "one_time_eur": renovation_mid,
            "note": f"区间约 €{reno_low}-{reno_high}/平米，隐藏工程（排烟/排污/消防）建议预留 20-30% 缓冲",
        },
    ]
    for label, amount, note in profile["extra_one_time"]:
        breakdown.append({"label": label, "one_time_eur": amount, "note": note})

    breakdown.append({"label": "房租", "monthly_eur": int(monthly_rent), "note": f"按 €{rent_per_sqm}/平米/月估算"})
    breakdown.append(
        {"label": "人工成本", "monthly_eur": staff * profile["staff_monthly_cost"], "note": f"按 {staff} 名员工 × 约 €{profile['staff_monthly_cost']}/月（含雇主社保分摊）估算"}
    )
    breakdown.append({"label": "水电/保险/记账等运营开销", "monthly_eur": 1200, "note": "会计/簿记服务、保险、水电网络等固定开销"})
    breakdown.append({"label": "市场营销", "monthly_eur": 500, "note": ""})

    one_time_total = sum(item.get("one_time_eur") or 0 for item in breakdown)
    monthly_total = sum(item.get("monthly_eur") or 0 for item in breakdown)

    recommended_buffer = one_time_total + monthly_total * 3
    if budget_eur >= recommended_buffer:
        verdict = (
            f"预算 €{budget_eur:,} 覆盖了预估一次性投入（约 €{one_time_total:,}）及 3 个月运营缓冲"
            f"（约 €{monthly_total * 3:,}），资金规划相对稳健。"
        )
    elif budget_eur >= one_time_total:
        gap = recommended_buffer - budget_eur
        verdict = (
            f"预算 €{budget_eur:,} 基本覆盖一次性投入（约 €{one_time_total:,}），但用于 3 个月运营缓冲的资金不足，"
            f"建议再准备约 €{gap:,} 作为现金流缓冲，避免开业初期因客流爬坡期资金链紧张。"
        )
    else:
        gap = one_time_total - budget_eur
        verdict = (
            f"预算 €{budget_eur:,} 低于预估一次性投入（约 €{one_time_total:,}），存在约 €{gap:,} 的资金缺口，"
            f"建议缩减面积/装修标准，或重新评估该业态在此预算下的可行性。"
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
