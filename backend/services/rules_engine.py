CITY_DOMAIN = {
    "amsterdam": "amsterdam.nl",
    "阿姆斯特丹": "amsterdam.nl",
    "rotterdam": "rotterdam.nl",
    "鹿特丹": "rotterdam.nl",
    "den haag": "denhaag.nl",
    "denhaag": "denhaag.nl",
    "the hague": "denhaag.nl",
    "海牙": "denhaag.nl",
    "utrecht": "utrecht.nl",
    "乌得勒支": "utrecht.nl",
    "eindhoven": "eindhoven.nl",
    "埃因霍温": "eindhoven.nl",
}
DEFAULT_CITY_DOMAIN = "ondernemersplein.kvk.nl"


def _gemeente_link(city: str) -> str:
    domain = CITY_DOMAIN.get(city.strip().lower(), DEFAULT_CITY_DOMAIN)
    return f"https://www.{domain}"


def generate_roadmap(
    shop_type: str,
    city: str,
    company_type: str,
    sells_food_beverage: bool,
    sells_alcohol: bool,
    has_staff: bool,
    needs_renovation: bool,
) -> list[dict]:
    """Deterministic compliance checklist. No LLM involved — every step here maps to a
    real Dutch government process, so accuracy matters more than coverage/flexibility."""
    gemeente_link = _gemeente_link(city)
    steps: list[dict] = []

    steps.append(
        {
            "step_key": "kvk_registration",
            "title": "注册 KVK（商会注册）",
            "category": "公司注册",
            "materials": "护照/身份证件、营业地址证明、公司名称、公司类型（BV/Eenmanszaak）",
            "official_link": "https://www.kvk.nl/inschrijven-en-wijzigen/inschrijven-handelsregister/",
            "estimated_days": "1-2 周（线上预约 + 现场登记）",
            "note": f"公司类型为「{company_type}」时所需材料略有不同，BV 需额外提供公证设立文书",
            "priority": "high",
        }
    )
    steps.append(
        {
            "step_key": "vat_registration",
            "title": "申请 VAT 号（增值税号）",
            "category": "税务",
            "materials": "KVK 注册号",
            "official_link": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/",
            "estimated_days": "1-2 周（KVK 注册后税务局自动分配，需确认收到确认信）",
            "note": "",
            "priority": "high",
        }
    )

    if sells_food_beverage:
        steps.append(
            {
                "step_key": "food_registration",
                "title": "食品经营登记（NVWA）",
                "category": "食品安全",
                "materials": "经营场所平面图、HACCP 食品安全计划",
                "official_link": "https://www.nvwa.nl/onderwerpen/nieuw-bedrijf-starten",
                "estimated_days": "2-4 周",
                "note": "须在开业前完成登记，涉及食品的经营场所未登记即营业存在罚款风险",
                "priority": "high",
            }
        )

    if sells_alcohol:
        steps.append(
            {
                "step_key": "alcohol_license",
                "title": "酒类经营许可证（Drank- en Horecawet vergunning）",
                "category": "政府许可",
                "materials": "无犯罪记录声明（VOG）、场所平面图、经营者社会行为审查资料",
                "official_link": gemeente_link,
                "estimated_days": "4-8 周",
                "note": "需通过 Bibob 资金来源审查，审批周期较长，建议尽早向所在市政厅提交申请",
                "priority": "high",
            }
        )

    if shop_type in ("horeca", "餐饮"):
        steps.append(
            {
                "step_key": "exploitation_permit",
                "title": "经营许可证（Exploitatievergunning）",
                "category": "政府许可",
                "materials": "场所安全评估、噪音/油烟评估报告",
                "official_link": gemeente_link,
                "estimated_days": "4-8 周",
                "note": "餐饮类营业场所通常需要，建议在签约装修前向市政厅确认具体要求",
                "priority": "high",
            }
        )

    if has_staff:
        steps.append(
            {
                "step_key": "employer_registration",
                "title": "雇主登记（工资税 Loonheffingen）",
                "category": "雇佣",
                "materials": "员工劳动合同模板、payroll 系统或记账代理",
                "official_link": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/personeel_en_loon/",
                "estimated_days": "2-3 周",
                "note": "需在首位员工入职前完成雇主登记并开始代扣代缴工资税",
                "priority": "high",
            }
        )

    if needs_renovation:
        steps.append(
            {
                "step_key": "building_permit",
                "title": "建筑/装修许可证（Omgevingsvergunning）",
                "category": "建筑合规",
                "materials": "装修设计图纸、结构评估（如涉及承重改动）",
                "official_link": "https://www.omgevingsloket.nl/",
                "estimated_days": "4-8 周（部分简单装修可走快速通道）",
                "note": "涉及外观、结构或用途变更的装修通常需要审批，未批先装可能面临强制恢复原状",
                "priority": "high",
            }
        )

    steps.append(
        {
            "step_key": "waste_contract",
            "title": "商业垃圾处理合同",
            "category": "运营合规",
            "materials": "营业地址",
            "official_link": "https://ondernemersplein.kvk.nl/bedrijfsafval-regelen/",
            "estimated_days": "1 周",
            "note": "各市政厅对商业垃圾处理商和分类要求不同，需与当地服务商单独签约",
            "priority": "medium",
        }
    )
    steps.append(
        {
            "step_key": "liability_insurance",
            "title": "保险建议（责任险/财产险）",
            "category": "保险",
            "materials": "",
            "official_link": "https://ondernemersplein.kvk.nl/verzekeringen-voor-uw-bedrijf/",
            "estimated_days": "1 周",
            "note": "建议投保企业责任险（bedrijfsaansprakelijkheidsverzekering），有员工时另需考虑雇主责任险",
            "priority": "medium",
        }
    )

    for i, step in enumerate(steps):
        step["sort_order"] = i

    return steps
