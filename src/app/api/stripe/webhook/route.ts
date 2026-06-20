import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { syncSubscriptionStatus } from "@/lib/subscription";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

// Stripe requires raw body for webhook signature verification
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(sub);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId as string);
          await handleSubscriptionChange(sub);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId as string);
          await handleSubscriptionChange(sub);
        }
        break;
      }

      case "customer.created": {
        // Store Stripe customer ID on vendor record when customer is created
        const customer = event.data.object as Stripe.Customer;
        if (customer.metadata?.vendor_id) {
          const supabase = createServiceClient();
          await supabase
            .from("vendors")
            .update({ stripe_customer_id: customer.id })
            .eq("id", customer.metadata.vendor_id);
        }
        break;
      }

      default:
        // Unhandled event — log and return 200 so Stripe doesn't retry
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err);
    // Return 500 so Stripe retries
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price.id ?? "";
  const subAny = sub as any;

  const periodStart = subAny.current_period_start
    ? new Date(subAny.current_period_start * 1000)
    : new Date();
  const periodEnd = subAny.current_period_end
    ? new Date(subAny.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now as fallback

  await syncSubscriptionStatus(
    sub.id,
    sub.status,
    priceId,
    periodStart,
    periodEnd,
    sub.cancel_at_period_end,
    sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    subAny.trial_start ? new Date(subAny.trial_start * 1000) : null,
    subAny.trial_end ? new Date(subAny.trial_end * 1000) : null,
    sub.customer as string,
  );
}
