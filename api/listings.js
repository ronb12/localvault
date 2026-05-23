const { ensureSchema, getSql, json, readBody, seed } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const payload = await readBody(req);
    if (!payload.name || !payload.category || !payload.neighborhood || !payload.bookingUrl || !payload.tier) {
      json(res, 400, { error: "Missing required fields" });
      return;
    }

    const sql = getSql();
    await ensureSchema(sql);
    await seed(sql);

    const [listing] = await sql`
      INSERT INTO listings (name, category, neighborhood, booking_url, tier, featured)
      VALUES (
        ${payload.name},
        ${payload.category},
        ${payload.neighborhood},
        ${payload.bookingUrl},
        ${payload.tier},
        ${Boolean(payload.featured)}
      )
      RETURNING *
    `;

    json(res, 201, { listing });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
};
