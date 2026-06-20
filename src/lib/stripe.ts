import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
});

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  annual: process.env.STRIPE_PRICE_ANNUAL!,
} as const;

export const PLAN_NAMES = {
  [process.env.STRIPE_PRICE_MONTHLY!]: "pro_monthly",
  [process.env.STRIPE_PRICE_ANNUAL!]: "pro_annual",
} as const;

/**
 * Statuses that count as "active Pro" for feature access.
 * trialing = in a free trial, still gets Pro access.
 * past_due = grace period, still gets Pro access temporarily.
 */
export const PRO_ACTIVE_STATUSES = [
  "active",
  "trialing",
  "past_due",
] as const;

export type ProStatus = (typeof PRO_ACTIVE_STATUSES)[number];

export function isProStatus(status: string): boolean {
  return PRO_ACTIVE_STATUSES.includes(status as ProStatus);
}
