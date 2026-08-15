import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class RoadmapProfile(Base):
    __tablename__ = "roadmap_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    shop_type: Mapped[str] = mapped_column(String(50))
    city: Mapped[str] = mapped_column(String(100))
    company_type: Mapped[str] = mapped_column(String(50))
    sells_food_beverage: Mapped[bool] = mapped_column(Boolean, default=False)
    sells_alcohol: Mapped[bool] = mapped_column(Boolean, default=False)
    has_staff: Mapped[bool] = mapped_column(Boolean, default=False)
    needs_renovation: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    steps: Mapped[list["RoadmapStep"]] = relationship(
        "RoadmapStep", back_populates="profile", cascade="all, delete-orphan", order_by="RoadmapStep.sort_order"
    )


class RoadmapStep(Base):
    __tablename__ = "roadmap_steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id: Mapped[str] = mapped_column(String(36), ForeignKey("roadmap_profiles.id"), nullable=False)
    step_key: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(100))
    materials: Mapped[str] = mapped_column(Text, default="")
    official_link: Mapped[str] = mapped_column(String(255), default="")
    estimated_days: Mapped[str] = mapped_column(String(50), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    status: Mapped[str] = mapped_column(String(20), default="not_started")
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    profile: Mapped["RoadmapProfile"] = relationship("RoadmapProfile", back_populates="steps")
