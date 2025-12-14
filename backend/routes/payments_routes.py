"""
Dodo Payments Integration Routes
Handles checkout sessions, webhooks, and subscription status
"""

import os
import logging
import hmac
import hashlib
import base64
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import uuid
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from dodopayments import DodoPayments

# Database connection
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["Payments"])

# Dodo Payments Configuration
DODO_API_KEY = os.environ.get("DODO_PAYMENTS_API_KEY")
DODO_WEBHOOK_SECRET = os.environ.get("DODO_WEBHOOK_SECRET")
DODO_PRODUCT_ID = os.environ.get("DODO_PRODUCT_ID")

# Initialize Dodo Payments client
dodo_client = None
if DODO_API_KEY:
    dodo_client = DodoPayments(bearer_token=DODO_API_KEY)
    logger.info(f"Dodo Payments client initialized: {DODO_API_KEY[:20]}...")
else:
    logger.warning("DODO_PAYMENTS_API_KEY not configured")


def get_db():
    """Get MongoDB connection"""
    mongo_url = os.environ.get("MONGO_URL")
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get("DB_NAME", "intelliax")
    return client, client[db_name]


# ========== PYDANTIC MODELS ==========

class CreateCheckoutRequest(BaseModel):
    """Request for creating a checkout session"""
    user_id: str = Field(..., description="User ID from Clerk")
    user_email: str = Field(..., description="User email")
    user_name: Optional[str] = Field(None, description="User name")
    return_url: str = Field(..., description="URL to redirect after payment")


class CheckoutResponse(BaseModel):
    """Response from checkout session creation"""
    checkout_url: str
    payment_id: Optional[str] = None
    session_id: Optional[str] = None


class SubscriptionStatus(BaseModel):
    """User subscription status"""
    user_id: str
    is_premium: bool
    payment_id: Optional[str] = None
    purchased_at: Optional[str] = None
    product_id: Optional[str] = None


# ========== HELPER FUNCTIONS ==========


def verify_webhook_signature(payload: bytes, headers: dict) -> bool:
    """Verify Dodo webhook signature using Standard Webhooks spec"""
    if not DODO_WEBHOOK_SECRET:
        logger.warning("Webhook secret not configured, skipping verification")
        return True
    
    webhook_id = headers.get("webhook-id", "")
    webhook_timestamp = headers.get("webhook-timestamp", "")
    webhook_signature = headers.get("webhook-signature", "")
    
    if not all([webhook_id, webhook_timestamp, webhook_signature]):
        logger.error("Missing webhook headers")
        return False
    
    # Create signed payload
    signed_payload = f"{webhook_id}.{webhook_timestamp}.{payload.decode('utf-8')}"
    
    # Get the secret (remove 'whsec_' prefix if present)
    secret = DODO_WEBHOOK_SECRET
    if secret.startswith("whsec_"):
        secret = secret[6:]
    
    # Decode the base64 secret
    try:
        secret_bytes = base64.b64decode(secret)
    except Exception:
        secret_bytes = secret.encode('utf-8')
    
    # Calculate expected signature
    expected_signature = base64.b64encode(
        hmac.new(secret_bytes, signed_payload.encode('utf-8'), hashlib.sha256).digest()
    ).decode('utf-8')
    
    # Check against provided signatures (may have multiple)
    signatures = webhook_signature.split(" ")
    for sig in signatures:
        if sig.startswith("v1,"):
            sig_value = sig[3:]
            if hmac.compare_digest(sig_value, expected_signature):
                return True
    
    return False


# ========== API ENDPOINTS ==========

@router.post("/create-checkout", response_model=Dict[str, Any])
async def create_checkout_session(request: CreateCheckoutRequest):
    """
    Create a Dodo Payments checkout session for premium upgrade.
    """
    try:
        if not dodo_client:
            raise HTTPException(status_code=500, detail="Dodo Payments not configured")
            
        if not DODO_PRODUCT_ID:
            raise HTTPException(status_code=500, detail="Product ID not configured")
        
        # Create checkout session with Dodo Payments using SDK
        payment_create_request = {
            "product_cart": [
                {
                    "product_id": DODO_PRODUCT_ID,
                    "quantity": 1
                }
            ],
            "customer": {
                "email": request.user_email,
                "name": request.user_name or request.user_email.split("@")[0]
            },
            "payment_link": True,
            "return_url": request.return_url,
            "metadata": {
                "user_id": request.user_id
            },
            "billing": {
                "country": "US",  # Default country, will be updated at checkout
                "city": "N/A",
                "state": "N/A",
                "street": "N/A",
                "zipcode": 10001
            }
        }
        
        # Use the SDK to create payment
        result = dodo_client.payments.create(**payment_create_request)
        
        # Store pending payment record
        client, db = get_db()
        payment_record = {
            "id": str(uuid.uuid4()),
            "user_id": request.user_id,
            "user_email": request.user_email,
            "payment_id": result.payment_id if hasattr(result, 'payment_id') else result.id if hasattr(result, 'id') else None,
            "status": "pending",
            "product_id": DODO_PRODUCT_ID,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payments.insert_one(payment_record)
        client.close()
        
        # Extract payment link - try different possible attribute names
        payment_link = None
        if hasattr(result, 'payment_link'):
            payment_link = result.payment_link
        elif hasattr(result, 'checkout_url'):
            payment_link = result.checkout_url
        elif hasattr(result, 'url'):
            payment_link = result.url
        
        payment_id = None
        if hasattr(result, 'payment_id'):
            payment_id = result.payment_id
        elif hasattr(result, 'id'):
            payment_id = result.id
        
        if not payment_link:
            logger.error(f"No payment link in result: {dir(result)}")
            raise HTTPException(status_code=500, detail="Failed to get checkout URL from payment provider")
        
        return {
            "success": True,
            "checkout_url": payment_link,
            "payment_id": payment_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating checkout: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def handle_webhook(request: Request):
    """
    Handle Dodo Payments webhook events.
    """
    try:
        # Get raw body for signature verification
        body = await request.body()
        headers = {
            "webhook-id": request.headers.get("webhook-id", ""),
            "webhook-timestamp": request.headers.get("webhook-timestamp", ""),
            "webhook-signature": request.headers.get("webhook-signature", "")
        }
        
        # Log webhook receipt
        logger.info(f"Webhook received - Headers: {headers}")
        
        # Verify signature (skip if no secret configured for testing)
        if DODO_WEBHOOK_SECRET and not verify_webhook_signature(body, headers):
            logger.error("Invalid webhook signature")
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse payload
        import json
        payload = json.loads(body.decode('utf-8'))
        event_type = payload.get("type", "")
        data = payload.get("data", {})
        
        logger.info(f"Processing webhook event: {event_type} - Data: {data}")
        
        client, db = get_db()
        
        # Handle different event types
        if event_type in ["payment.succeeded", "payment_succeeded", "payment.completed"]:
            payment_id = data.get("payment_id") or data.get("id")
            metadata = data.get("metadata", {})
            user_id = metadata.get("user_id")
            
            logger.info(f"Payment succeeded - Payment ID: {payment_id}, User ID: {user_id}")
            
            if user_id:
                # Update user to premium
                result = await db.user_subscriptions.update_one(
                    {"user_id": user_id},
                    {
                        "$set": {
                            "user_id": user_id,
                            "is_premium": True,
                            "payment_id": payment_id,
                            "product_id": DODO_PRODUCT_ID,
                            "purchased_at": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    },
                    upsert=True
                )
                logger.info(f"User {user_id} upgraded to premium - Result: {result.modified_count} modified, {result.upserted_id} upserted")
            else:
                logger.warning(f"No user_id in metadata for payment {payment_id}")
            
            # Update payment record
            if payment_id:
                await db.payments.update_one(
                    {"payment_id": payment_id},
                    {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}},
                    upsert=True
                )
        
        elif event_type in ["payment.failed", "payment_failed"]:
            payment_id = data.get("payment_id") or data.get("id")
            logger.info(f"Payment failed - Payment ID: {payment_id}")
            if payment_id:
                await db.payments.update_one(
                    {"payment_id": payment_id},
                    {"$set": {"status": "failed", "failed_at": datetime.now(timezone.utc).isoformat()}},
                    upsert=True
                )
        else:
            logger.info(f"Unhandled event type: {event_type}")
        
        client.close()
        
        return {"success": True, "event": event_type, "processed": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{user_id}", response_model=SubscriptionStatus)
async def get_subscription_status(user_id: str):
    """
    Get subscription status for a user.
    """
    try:
        client, db = get_db()
        subscription = await db.user_subscriptions.find_one({"user_id": user_id})
        client.close()
        
        if subscription and subscription.get("is_premium"):
            return SubscriptionStatus(
                user_id=user_id,
                is_premium=True,
                payment_id=subscription.get("payment_id"),
                purchased_at=subscription.get("purchased_at"),
                product_id=subscription.get("product_id")
            )
        
        return SubscriptionStatus(
            user_id=user_id,
            is_premium=False
        )
        
    except Exception as e:
        logger.error(f"Error getting subscription status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-payment/{payment_id}")
async def verify_payment(payment_id: str, user_id: str):
    """
    Manually verify a payment and upgrade user if successful.
    Used as fallback when webhook doesn't fire.
    """
    try:
        if not dodo_client:
            raise HTTPException(status_code=500, detail="Dodo Payments not configured")
            
        # Check payment status with Dodo using SDK
        result = dodo_client.payments.get(payment_id=payment_id)
        
        status = result.status.lower() if hasattr(result, 'status') else ""
        
        if status in ["succeeded", "completed", "paid"]:
            client, db = get_db()
            
            # Upgrade user to premium
            await db.user_subscriptions.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "user_id": user_id,
                        "is_premium": True,
                        "payment_id": payment_id,
                        "product_id": DODO_PRODUCT_ID,
                        "purchased_at": datetime.now(timezone.utc).isoformat(),
                        "verified_manually": True
                    }
                },
                upsert=True
            )
            
            client.close()
            
            return {
                "success": True,
                "is_premium": True,
                "message": "Payment verified and account upgraded"
            }
        
        return {
            "success": False,
            "is_premium": False,
            "status": status,
            "message": "Payment not completed yet"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/product-info")
async def get_product_info():
    """
    Get product information for display on pricing page.
    """
    return {
        "product_id": DODO_PRODUCT_ID,
        "name": "IntelliAX Premium",
        "features": [
            "Unlimited Conversation Flows",
            "Agent Evaluation & Testing",
            "Advanced Analytics Dashboard",
            "Tools & Integrations",
            "Priority Support",
            "Custom Voice Selection"
        ],
        "free_features": [
            "Create Voice Agents",
            "Basic Agent Testing",
            "Knowledge Base (Limited)"
        ]
    }
