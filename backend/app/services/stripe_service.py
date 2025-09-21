import stripe
from typing import Dict, Any, Optional
from ..core.config import settings
from ..models.organization import Organization, SubscriptionTier
from sqlalchemy.ext.asyncio import AsyncSession

# Initialize Stripe
stripe.api_key = settings.stripe_secret_key

class StripeService:
    """Service for handling Stripe payments and subscriptions"""

    # Stripe Price IDs (set these in your Stripe dashboard)
    PRICE_IDS = {
        SubscriptionTier.PROFESSIONAL: "price_professional_monthly",  # Replace with actual price ID
        SubscriptionTier.ENTERPRISE: "price_enterprise_monthly",      # Replace with actual price ID
    }

    @staticmethod
    async def create_customer(organization: Organization, email: str, name: str) -> str:
        """Create a Stripe customer for an organization"""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={
                    'organization_id': str(organization.id),
                    'organization_slug': organization.slug
                }
            )
            return customer.id
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to create Stripe customer: {str(e)}")

    @staticmethod
    async def create_checkout_session(
        organization: Organization,
        tier: SubscriptionTier,
        success_url: str,
        cancel_url: str
    ) -> Dict[str, Any]:
        """Create a Stripe checkout session for subscription"""
        try:
            price_id = StripeService.PRICE_IDS.get(tier)
            if not price_id:
                raise ValueError(f"No price ID configured for tier: {tier}")

            # Create customer if doesn't exist
            if not organization.stripe_customer_id:
                # You'll need to get the user email from somewhere
                customer_id = await StripeService.create_customer(
                    organization,
                    "admin@example.com",  # Replace with actual admin email
                    organization.name
                )
                organization.stripe_customer_id = customer_id

            session = stripe.checkout.Session.create(
                customer=organization.stripe_customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'organization_id': str(organization.id),
                    'tier': tier.value
                }
            )

            return {
                'checkout_url': session.url,
                'session_id': session.id
            }

        except stripe.error.StripeError as e:
            raise Exception(f"Failed to create checkout session: {str(e)}")

    @staticmethod
    async def create_portal_session(organization: Organization, return_url: str) -> str:
        """Create a Stripe customer portal session"""
        try:
            if not organization.stripe_customer_id:
                raise ValueError("Organization has no Stripe customer ID")

            session = stripe.billing_portal.Session.create(
                customer=organization.stripe_customer_id,
                return_url=return_url,
            )

            return session.url

        except stripe.error.StripeError as e:
            raise Exception(f"Failed to create portal session: {str(e)}")

    @staticmethod
    async def handle_webhook_event(event: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Stripe webhook events"""
        event_type = event['type']
        data = event['data']['object']

        try:
            if event_type == 'checkout.session.completed':
                # Handle successful checkout
                return await StripeService._handle_checkout_completed(data)

            elif event_type == 'customer.subscription.updated':
                # Handle subscription updates
                return await StripeService._handle_subscription_updated(data)

            elif event_type == 'customer.subscription.deleted':
                # Handle subscription cancellation
                return await StripeService._handle_subscription_deleted(data)

            elif event_type == 'invoice.payment_failed':
                # Handle failed payments
                return await StripeService._handle_payment_failed(data)

            return {'status': 'ignored', 'event_type': event_type}

        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    @staticmethod
    async def _handle_checkout_completed(session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle completed checkout session"""
        organization_id = session_data['metadata'].get('organization_id')
        subscription_id = session_data['subscription']

        if not organization_id:
            raise ValueError("No organization_id in checkout session metadata")

        # Update organization with subscription details
        # You'll need to implement this database update
        return {
            'status': 'success',
            'action': 'subscription_activated',
            'organization_id': organization_id,
            'subscription_id': subscription_id
        }

    @staticmethod
    async def _handle_subscription_updated(subscription_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle subscription updates"""
        customer_id = subscription_data['customer']
        subscription_id = subscription_data['id']
        status = subscription_data['status']
        current_period_end = subscription_data['current_period_end']

        return {
            'status': 'success',
            'action': 'subscription_updated',
            'customer_id': customer_id,
            'subscription_id': subscription_id,
            'subscription_status': status,
            'current_period_end': current_period_end
        }

    @staticmethod
    async def _handle_subscription_deleted(subscription_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle subscription cancellation"""
        customer_id = subscription_data['customer']
        subscription_id = subscription_data['id']

        return {
            'status': 'success',
            'action': 'subscription_cancelled',
            'customer_id': customer_id,
            'subscription_id': subscription_id
        }

    @staticmethod
    async def _handle_payment_failed(invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle failed payment"""
        customer_id = invoice_data['customer']
        subscription_id = invoice_data['subscription']

        return {
            'status': 'success',
            'action': 'payment_failed',
            'customer_id': customer_id,
            'subscription_id': subscription_id
        }

    @staticmethod
    async def get_subscription_details(subscription_id: str) -> Dict[str, Any]:
        """Get subscription details from Stripe"""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)

            return {
                'id': subscription.id,
                'status': subscription.status,
                'current_period_end': subscription.current_period_end,
                'cancel_at_period_end': subscription.cancel_at_period_end,
                'plan': {
                    'id': subscription.items.data[0].price.id,
                    'amount': subscription.items.data[0].price.unit_amount,
                    'currency': subscription.items.data[0].price.currency,
                    'interval': subscription.items.data[0].price.recurring.interval
                }
            }

        except stripe.error.StripeError as e:
            raise Exception(f"Failed to get subscription details: {str(e)}")

    @staticmethod
    def verify_webhook_signature(payload: bytes, signature: str) -> bool:
        """Verify Stripe webhook signature"""
        try:
            stripe.Webhook.construct_event(
                payload,
                signature,
                settings.stripe_webhook_secret
            )
            return True
        except (ValueError, stripe.error.SignatureVerificationError):
            return False