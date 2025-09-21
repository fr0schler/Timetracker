from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ....core.database import get_db
from ....schemas.user import User
from ....schemas.subscription import SubscriptionCreate, SubscriptionResponse, CheckoutSessionResponse
from ....services.stripe_service import StripeService
from ....models.organization import SubscriptionTier
from ..deps import get_current_active_user, get_current_organization
import json

router = APIRouter()


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_active_user),
    organization = Depends(get_current_organization),
    db: AsyncSession = Depends(get_db)
):
    """Create a Stripe checkout session for subscription"""

    # Verify user has permission to manage billing
    if not current_user.is_organization_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners can manage billing"
        )

    try:
        checkout_data = await StripeService.create_checkout_session(
            organization=organization,
            tier=subscription_data.tier,
            success_url=f"{subscription_data.success_url}?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=subscription_data.cancel_url
        )

        return CheckoutSessionResponse(
            checkout_url=checkout_data['checkout_url'],
            session_id=checkout_data['session_id']
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create checkout session: {str(e)}"
        )


@router.post("/portal")
async def create_portal_session(
    return_url: str,
    current_user: User = Depends(get_current_active_user),
    organization = Depends(get_current_organization)
):
    """Create a Stripe customer portal session"""

    # Verify user has permission to manage billing
    if not current_user.is_organization_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners can manage billing"
        )

    try:
        portal_url = await StripeService.create_portal_session(
            organization=organization,
            return_url=return_url
        )

        return {"portal_url": portal_url}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create portal session: {str(e)}"
        )


@router.get("/current", response_model=SubscriptionResponse)
async def get_current_subscription(
    current_user: User = Depends(get_current_active_user),
    organization = Depends(get_current_organization)
):
    """Get current organization subscription details"""

    if not organization.stripe_subscription_id:
        return SubscriptionResponse(
            id=None,
            status="inactive",
            tier=organization.subscription_tier,
            current_period_end=None,
            cancel_at_period_end=False,
            is_active=False
        )

    try:
        subscription_details = await StripeService.get_subscription_details(
            organization.stripe_subscription_id
        )

        return SubscriptionResponse(
            id=subscription_details['id'],
            status=subscription_details['status'],
            tier=organization.subscription_tier,
            current_period_end=subscription_details['current_period_end'],
            cancel_at_period_end=subscription_details['cancel_at_period_end'],
            is_active=subscription_details['status'] == 'active'
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get subscription details: {str(e)}"
        )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Handle Stripe webhook events"""

    payload = await request.body()
    signature = request.headers.get('stripe-signature')

    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature"
        )

    # Verify webhook signature
    if not StripeService.verify_webhook_signature(payload, signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe signature"
        )

    try:
        # Parse webhook event
        event = json.loads(payload)

        # Handle the event
        result = await StripeService.handle_webhook_event(event)

        # TODO: Update database based on webhook result
        # This would involve updating the organization's subscription status

        return {"status": "success", "result": result}

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook handling failed: {str(e)}"
        )


@router.get("/plans")
async def get_subscription_plans():
    """Get available subscription plans"""

    plans = [
        {
            "id": "free",
            "name": "Free",
            "price": 0,
            "currency": "EUR",
            "interval": "month",
            "features": [
                "1 User",
                "3 Projects",
                "Basic Time Tracking",
                "Keyboard Shortcuts"
            ],
            "max_users": 1,
            "max_projects": 3
        },
        {
            "id": "professional",
            "name": "Professional",
            "price": 1200,  # €12.00 in cents
            "currency": "EUR",
            "interval": "month",
            "features": [
                "Up to 10 Users",
                "Unlimited Projects",
                "Advanced Analytics",
                "Hardware Integration",
                "Billing & Invoicing",
                "Email Support"
            ],
            "max_users": 10,
            "max_projects": -1  # Unlimited
        },
        {
            "id": "enterprise",
            "name": "Enterprise",
            "price": 4900,  # €49.00 in cents
            "currency": "EUR",
            "interval": "month",
            "features": [
                "Unlimited Users",
                "Everything in Pro",
                "SSO Integration",
                "Priority Support",
                "Custom Hardware",
                "Custom Integrations"
            ],
            "max_users": -1,  # Unlimited
            "max_projects": -1  # Unlimited
        }
    ]

    return {"plans": plans}