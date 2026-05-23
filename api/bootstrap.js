const { ensureSchema, getSql, json, seed } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const sql = getSql();
    await ensureSchema(sql);
    await seed(sql);

    const [listings, offers, leads] = await Promise.all([
      sql`SELECT * FROM listings ORDER BY featured DESC, reviews DESC, created_at DESC`,
      sql`
        SELECT offers.*, listings.name AS listing_name
        FROM offers
        LEFT JOIN listings ON listings.id = offers.listing_id
        ORDER BY expires_on ASC, offers.created_at DESC
      `,
      sql`
        SELECT leads.*, listings.name AS listing_name
        FROM leads
        LEFT JOIN listings ON listings.id = leads.listing_id
        ORDER BY leads.created_at DESC
      `,
    ]);

    json(res, 200, {
      listings,
      offers,
      leads,
      stats: {
        totalListings: listings.length,
        featuredListings: listings.filter((listing) => listing.featured).length,
        liveOffers: offers.filter((offer) => offer.status === "Live").length,
        openLeads: leads.filter((lead) => lead.status !== "Closed").length,
      },
    });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
};
