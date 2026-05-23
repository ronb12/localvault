const { ensureSchema, getSql, json, readBody, seed } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const payload = await readBody(req);
    if (!payload.listingId || !payload.title || !payload.details || !payload.status || !payload.expiresOn) {
      json(res, 400, { error: "Missing required fields" });
      return;
    }

    const sql = getSql();
    await ensureSchema(sql);
    await seed(sql);

    const [offer] = await sql`
      INSERT INTO offers (listing_id, title, details, status, expires_on)
      VALUES (
        ${payload.listingId},
        ${payload.title},
        ${payload.details},
        ${payload.status},
        ${payload.expiresOn}
      )
      RETURNING *
    `;

    json(res, 201, { offer });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
};
