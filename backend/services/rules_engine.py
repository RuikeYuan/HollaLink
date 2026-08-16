# Direct links to each municipality's horeca operating-permit (exploitatievergunning) page,
# which is also where alcohol-license (Alcoholwetvergunning) applications are handled for
# most of these cities. Verified reachable (HTTP 200) as of 2026-08, except Amsterdam and
# Eindhoven, which block automated requests (HTTP 403) but were confirmed via indexed search
# results to be the correct official pages — a browser should load them fine.
CITY_GEMEENTE_LINK = {
    "amsterdam": "https://www.amsterdam.nl/ondernemen/horeca/horecavergunning-aanvragen/",
    "阿姆斯特丹": "https://www.amsterdam.nl/ondernemen/horeca/horecavergunning-aanvragen/",
    "rotterdam": "https://www.rotterdam.nl/exploitatievergunning-aanvragen",
    "鹿特丹": "https://www.rotterdam.nl/exploitatievergunning-aanvragen",
    "den haag": "https://www.denhaag.nl/nl/vergunningen-en-ontheffingen/exploitatievergunning-horeca-aanvragen/",
    "denhaag": "https://www.denhaag.nl/nl/vergunningen-en-ontheffingen/exploitatievergunning-horeca-aanvragen/",
    "the hague": "https://www.denhaag.nl/nl/vergunningen-en-ontheffingen/exploitatievergunning-horeca-aanvragen/",
    "海牙": "https://www.denhaag.nl/nl/vergunningen-en-ontheffingen/exploitatievergunning-horeca-aanvragen/",
    "utrecht": "https://loket.digitaal.utrecht.nl/nl/products/horecavergunning-aanvragen-of-aanpassen",
    "乌得勒支": "https://loket.digitaal.utrecht.nl/nl/products/horecavergunning-aanvragen-of-aanpassen",
    "eindhoven": "https://www.eindhoven.nl/ondernemen/horeca/exploitatievergunning",
    "埃因霍温": "https://www.eindhoven.nl/ondernemen/horeca/exploitatievergunning",
}
# National generic page for any municipality not covered above — explains the exploitatievergunning
# process in general terms and is a safe fallback rather than guessing a city-specific URL pattern.
DEFAULT_GEMEENTE_LINK = "https://ondernemersplein.overheid.nl/wetten-en-regels/exploitatievergunning-horecabedrijf-aanvragen/"


def _gemeente_link(city: str) -> str:
    return CITY_GEMEENTE_LINK.get(city.strip().lower(), DEFAULT_GEMEENTE_LINK)


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
            "title": "Register with the KVK (Chamber of Commerce)",
            "category": "Company registration",
            "materials": "Passport/ID, proof of business address, company name, company type (BV/Eenmanszaak)",
            "official_link": "https://www.kvk.nl/en/registration/new-business/",
            "estimated_days": "1-2 weeks (online appointment + in-person registration)",
            "note": f"Required documents differ slightly for company type \"{company_type}\" — a BV also needs a notarial deed of incorporation",
            "priority": "high",
        }
    )
    steps.append(
        {
            "step_key": "vat_registration",
            "title": "Apply for a VAT number",
            "category": "Tax",
            "materials": "KVK registration number",
            "official_link": "https://www.belastingdienst.nl/wps/wcm/connect/en/business/business",
            "estimated_days": "1-2 weeks (issued automatically after KVK registration — confirm you received the confirmation letter)",
            "note": "",
            "priority": "high",
        }
    )

    if sells_food_beverage:
        steps.append(
            {
                "step_key": "food_registration",
                "title": "Food business registration (NVWA)",
                "category": "Food safety",
                "materials": "Floor plan of the premises, HACCP food safety plan",
                "official_link": "https://www.nvwa.nl/onderwerpen/voedselveiligheid/levensmiddelen-produceren-en-verhandelen/registratie-en-erkenning/registreer-uw-levensmiddelenbedrijf",
                "estimated_days": "2-4 weeks",
                "note": "Must be completed before opening — trading with food without registering carries a real fine risk",
                "priority": "high",
            }
        )

    if sells_alcohol:
        steps.append(
            {
                "step_key": "alcohol_license",
                "title": "Alcohol license (Drank- en Horecawet vergunning)",
                "category": "Government permit",
                "materials": "Certificate of good conduct (VOG), floor plan, background-check documents for the operator",
                "official_link": gemeente_link,
                "estimated_days": "4-8 weeks",
                "note": "Subject to a Bibob screening of your funding sources — approval takes a while, so apply to your municipality early",
                "priority": "high",
            }
        )

    if shop_type in ("horeca", "餐饮"):
        steps.append(
            {
                "step_key": "exploitation_permit",
                "title": "Operating permit (Exploitatievergunning)",
                "category": "Government permit",
                "materials": "Premises safety assessment, noise/odour (extraction) assessment report",
                "official_link": gemeente_link,
                "estimated_days": "4-8 weeks",
                "note": "Usually required for hospitality venues — confirm the exact requirements with your municipality before signing a renovation contract",
                "priority": "high",
            }
        )

    if has_staff:
        steps.append(
            {
                "step_key": "employer_registration",
                "title": "Register as an employer (payroll tax / Loonheffingen)",
                "category": "Employment",
                "materials": "Employment contract template, payroll system or bookkeeping service",
                "official_link": "https://www.belastingdienst.nl/wps/wcm/connect/en/business/business",
                "estimated_days": "2-3 weeks",
                "note": "Must be completed before your first employee starts, so you can withhold and remit payroll tax from day one",
                "priority": "high",
            }
        )

    if needs_renovation:
        steps.append(
            {
                "step_key": "building_permit",
                "title": "Building/renovation permit (Omgevingsvergunning)",
                "category": "Building compliance",
                "materials": "Renovation design drawings, structural assessment (if load-bearing changes are involved)",
                "official_link": "https://www.omgevingsloket.nl/",
                "estimated_days": "4-8 weeks (some minor renovations qualify for a fast-track process)",
                "note": "Changes to the facade, structure, or intended use generally require approval — renovating without one can force you to undo the work",
                "priority": "high",
            }
        )

    steps.append(
        {
            "step_key": "waste_contract",
            "title": "Commercial waste collection contract",
            "category": "Operational compliance",
            "materials": "Business address",
            "official_link": "https://ondernemersplein.kvk.nl/afvalwijzer-voor-bedrijven/",
            "estimated_days": "1 week",
            "note": "Requirements for waste collectors and sorting differ by municipality — arrange this directly with a local provider",
            "priority": "medium",
        }
    )
    steps.append(
        {
            "step_key": "liability_insurance",
            "title": "Insurance (liability / property)",
            "category": "Insurance",
            "materials": "",
            "official_link": "https://ondernemersplein.kvk.nl/soorten-verzekeringen/",
            "estimated_days": "1 week",
            "note": "Business liability insurance (bedrijfsaansprakelijkheidsverzekering) is recommended; if you have staff, also consider employer's liability cover",
            "priority": "medium",
        }
    )

    for i, step in enumerate(steps):
        step["sort_order"] = i

    return steps
