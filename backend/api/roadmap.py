from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from api.deps import require_admin
from database import get_db
from models.roadmap import RoadmapProfile, RoadmapStep
from schemas.roadmap import RoadmapOut, RoadmapRequest, RoadmapStepOut, RoadmapStepUpdate
from services.rules_engine import generate_roadmap

router = APIRouter(prefix="/api", tags=["roadmap"])

VALID_STATUSES = {"not_started", "in_progress", "done"}


@router.post("/roadmap", response_model=RoadmapOut)
def create_roadmap(payload: RoadmapRequest, db: Session = Depends(get_db)):
    profile = RoadmapProfile(
        user_id=payload.user_id,
        shop_type=payload.shop_type,
        city=payload.city,
        company_type=payload.company_type,
        sells_food_beverage=payload.sells_food_beverage,
        sells_alcohol=payload.sells_alcohol,
        has_staff=payload.has_staff,
        needs_renovation=payload.needs_renovation,
    )
    db.add(profile)
    db.flush()

    step_dicts = generate_roadmap(
        shop_type=payload.shop_type,
        city=payload.city,
        company_type=payload.company_type,
        sells_food_beverage=payload.sells_food_beverage,
        sells_alcohol=payload.sells_alcohol,
        has_staff=payload.has_staff,
        needs_renovation=payload.needs_renovation,
    )
    for step_data in step_dicts:
        db.add(RoadmapStep(profile_id=profile.id, **step_data))

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/roadmap/{profile_id}", response_model=RoadmapOut)
def get_roadmap(profile_id: str, db: Session = Depends(get_db)):
    profile = (
        db.query(RoadmapProfile)
        .options(joinedload(RoadmapProfile.steps))
        .filter(RoadmapProfile.id == profile_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="未找到该合规路线图")
    return profile


@router.patch("/roadmap/steps/{step_id}", response_model=RoadmapStepOut)
def update_roadmap_step(step_id: str, payload: RoadmapStepUpdate, db: Session = Depends(get_db)):
    step = db.get(RoadmapStep, step_id)
    if not step:
        raise HTTPException(status_code=404, detail="未找到该任务")

    if payload.status is not None:
        if payload.status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"status 必须是 {', '.join(VALID_STATUSES)} 之一")
        step.status = payload.status

    if "due_date" in payload.model_fields_set:
        step.due_date = payload.due_date

    db.commit()
    db.refresh(step)
    return step


@router.get("/admin/roadmaps", response_model=list[RoadmapOut], dependencies=[Depends(require_admin)])
def list_roadmaps(db: Session = Depends(get_db)):
    return (
        db.query(RoadmapProfile)
        .options(joinedload(RoadmapProfile.steps))
        .order_by(RoadmapProfile.created_at.desc())
        .all()
    )
