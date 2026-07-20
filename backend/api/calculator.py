from fastapi import APIRouter

from schemas.calculator import CostCalculatorRequest, CostCalculatorResponse
from services.cost_calculator import calculate_costs

router = APIRouter(prefix="/api", tags=["calculator"])


@router.post("/calculator", response_model=CostCalculatorResponse)
def run_cost_calculator(payload: CostCalculatorRequest):
    result = calculate_costs(
        industry=payload.industry,
        city=payload.city,
        budget_eur=payload.budget_eur,
        size_sqm=payload.size_sqm,
        staff_count=payload.staff_count,
    )
    return result
