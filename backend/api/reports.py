from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.deps import require_admin
from database import get_db
from models.report import Report
from schemas.report import ReportOut, ReportRequest
from services.llm_client import LLMNotConfiguredError
from services.report_generator import generate_report

router = APIRouter(prefix="/api", tags=["reports"])


@router.post("/reports", response_model=ReportOut)
def create_report(payload: ReportRequest, db: Session = Depends(get_db)):
    try:
        markdown, cost_data = generate_report(payload.industry, payload.city, payload.budget_eur, payload.notes)
    except LLMNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    report = Report(
        user_id=payload.user_id,
        industry=payload.industry,
        city=payload.city,
        budget_eur=payload.budget_eur,
        title=f"{payload.city} · {cost_data['industry']} 创业分析报告",
        content_markdown=markdown,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/reports/{report_id}", response_model=ReportOut)
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")
    return report


@router.get("/admin/reports", response_model=list[ReportOut], dependencies=[Depends(require_admin)])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.created_at.desc()).all()
