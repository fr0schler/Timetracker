from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.organization import SubscriptionTier


class SubscriptionCreate(BaseModel):
    tier: SubscriptionTier
    success_url: str
    cancel_url: str


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str


class SubscriptionResponse(BaseModel):
    id: Optional[str]
    status: str
    tier: SubscriptionTier
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool
    is_active: bool

    class Config:
        from_attributes = True


class SubscriptionPlan(BaseModel):
    id: str
    name: str
    price: int  # Price in cents
    currency: str
    interval: str
    features: list[str]
    max_users: int  # -1 for unlimited
    max_projects: int  # -1 for unlimited