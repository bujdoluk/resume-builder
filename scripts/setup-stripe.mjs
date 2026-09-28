#!/usr/bin/env node
// Creates the Pro product and prices, then prints the IDs for .env.local. Safe to re-run.
// Usage: node scripts/setup-stripe.mjs
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
