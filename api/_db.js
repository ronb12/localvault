const { neon } = require("@neondatabase/serverless");

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  return neon(process.env.DATABASE_URL);
}

async function ensureSchema(sql) {
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
  await sql`
    CREATE TABLE IF NOT EXISTS listings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      neighborhood TEXT NOT NULL,
      booking_url TEXT NOT NULL,
      tier TEXT NOT NULL,
      reviews INTEGER NOT NULL DEFAULT 0,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS offers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT NOT NULL,
      expires_on DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      request_type TEXT NOT NULL,
      contact TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function seed(sql) {
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM listings`;
  if (count > 0) {
    return;
  }

  const listings = await sql`
    INSERT INTO listings (name, category, neighborhood, booking_url, tier, reviews, featured)
    VALUES
      ('Bright Plate Catering', 'Food & Catering', 'Midtown', 'https://brightplate.example', 'Premium', 18, TRUE),
      ('Glow Studio Spa', 'Beauty & Wellness', 'Riverside', 'https://glowspa.example', 'Standard', 12, FALSE),
      ('FixRight Home Services', 'Home Services', 'Old Town', 'https://fixright.example', 'Premium', 9, TRUE)
    RETURNING id, name
  `;

  await sql`
    INSERT INTO offers (listing_id, title, details, status, expires_on)
    VALUES
      (${listings[0].id}, '10 percent off first event menu', 'Applies to bookings over 30 guests.', 'Live', CURRENT_DATE + 10),
      (${listings[1].id}, 'Free add-on mask', 'Bundle with a 60-minute facial service.', 'Live', CURRENT_DATE + 6),
      (${listings[2].id}, 'Weekend emergency callout credit', 'Valid for booked repairs this month.', 'Draft', CURRENT_DATE + 14)
  `;

  await sql`
    INSERT INTO leads (listing_id, customer_name, request_type, contact, status)
    VALUES
      (${listings[0].id}, 'Nia Coleman', 'Event catering quote', 'nia@example.com', 'New'),
      (${listings[2].id}, 'Marcus Lee', 'Same-day repair', 'marcus@example.com', 'Contacted')
  `;
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

module.exports = { ensureSchema, getSql, json, readBody, seed };
