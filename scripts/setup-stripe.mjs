#!/usr/bin/env node
/**
 * One-time setup script: creates the "QuickResumeBuilder Pro" Stripe
 * Product with a monthly ($19.99) and yearly ($167.99) recurring Price,
 * then prints the Price IDs to paste into .env.local as
 * STRIPE_PRICE_ID_MONTHLY / STRIPE_PRICE_ID_ANNUAL. Safe to re-run — it
 * reuses an existing "QuickResumeBuilder Pro" product/prices instead of
 * creating duplicates.
 *
 * Usage: node scripts/setup-stripe.mjs
 * Requires STRIPE_SECRET_KEY to already be set in .env.local.
 */
import { readFileSync } from "node:fs";
import Stripe from "stripe";

function loadEnvLocal() {
  let contents;
  try {
    contents = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    console.error("Could not read .env.local — copy .env.example first.");
    process.exit(1);
  }
  for (const line of contents.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] ??= match[2];
  }
}

loadEnvLocal();

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is not set in .env.local.");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRODUCT_NAME = "QuickResumeBuilder Pro";

async function findOrCreateProduct() {
  const { data } = await stripe.products.list({ active: true, limit: 100 });
  const existing = data.find((product) => product.name === PRODUCT_NAME);
  if (existing) {
    console.log(`Reusing existing product: ${existing.id}`);
    return existing;
  }
  const product = await stripe.products.create({
    name: PRODUCT_NAME,
    description: "Unlimited saved resumes and cover letters.",
  });
  console.log(`Created product: ${product.id}`);
  return product;
}

async function findOrCreatePrice(productId, { nickname, unitAmount, interval }) {
  const { data } = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const existing = data.find(
    (price) => price.recurring?.interval === interval && price.unit_amount === unitAmount,
  );
  if (existing) {
    console.log(`Reusing existing ${interval}ly price: ${existing.id}`);
    return existing;
  }
  const price = await stripe.prices.create({
    product: productId,
    nickname,
    unit_amount: unitAmount,
    currency: "usd",
    recurring: { interval },
  });
  console.log(`Created ${interval}ly price: ${price.id}`);
  return price;
}

const product = await findOrCreateProduct();
const monthly = await findOrCreatePrice(product.id, {
  nickname: "Pro Monthly",
  unitAmount: 1999,
  interval: "month",
});
const annual = await findOrCreatePrice(product.id, {
  nickname: "Pro Annual",
  unitAmount: 16799,
  interval: "year",
});

console.log("\nAdd these to .env.local:\n");
console.log(`STRIPE_PRICE_ID_MONTHLY=${monthly.id}`);
console.log(`STRIPE_PRICE_ID_ANNUAL=${annual.id}`);
