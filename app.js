(() => {
  const app = document.querySelector("#app");
  const state = { listings: [], offers: [], leads: [], stats: {} };

  function formatDate(value) {
    return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  async function post(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }
    return response.json();
  }

  function renderCollection(items, mapper, emptyText) {
    return items.length ? items.map(mapper).join("") : `<div class="empty">${emptyText}</div>`;
  }

  function bindForms() {
    document.querySelector("#listingForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await post("/api/listings", {
        name: String(form.get("name")),
        category: String(form.get("category")),
        neighborhood: String(form.get("neighborhood")),
        bookingUrl: String(form.get("bookingUrl")),
        tier: String(form.get("tier")),
        featured: String(form.get("featured")) === "yes",
      });
      event.currentTarget.reset();
      await load();
    });

    document.querySelector("#offerForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await post("/api/offers", {
        listingId: String(form.get("listingId")),
        title: String(form.get("title")),
        details: String(form.get("details")),
        status: String(form.get("status")),
        expiresOn: String(form.get("expiresOn")),
      });
      event.currentTarget.reset();
      await load();
    });

    document.querySelector("#leadForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await post("/api/leads", {
        listingId: String(form.get("listingId")),
        customerName: String(form.get("customerName")),
        requestType: String(form.get("requestType")),
        contact: String(form.get("contact")),
        status: String(form.get("status")),
      });
      event.currentTarget.reset();
      await load();
    });
  }

  function render() {
    app.innerHTML = `
      <section class="metrics">
        <article class="metric">
          <span class="muted">Total listings</span>
          <strong>${state.stats.totalListings || 0}</strong>
          <span class="muted">Businesses in directory</span>
        </article>
        <article class="metric">
          <span class="muted">Featured</span>
          <strong>${state.stats.featuredListings || 0}</strong>
          <span class="muted">Premium spots highlighted</span>
        </article>
        <article class="metric">
          <span class="muted">Live offers</span>
          <strong>${state.stats.liveOffers || 0}</strong>
          <span class="muted">Promotions currently running</span>
        </article>
        <article class="metric">
          <span class="muted">Open leads</span>
          <strong>${state.stats.openLeads || 0}</strong>
          <span class="muted">Customer inquiries still active</span>
        </article>
      </section>
      <section class="board">
        <article class="panel">
          <h2>Listings</h2>
          <p class="muted">Add businesses with category, neighborhood, booking link, and tier.</p>
          <form id="listingForm">
            <input name="name" placeholder="Business name" required>
            <div class="row">
              <input name="category" placeholder="Category" required>
              <input name="neighborhood" placeholder="Neighborhood" required>
            </div>
            <input name="bookingUrl" placeholder="Booking URL" required>
            <div class="row">
              <select name="tier">
                <option>Standard</option>
                <option>Premium</option>
                <option>Spotlight</option>
              </select>
              <select name="featured">
                <option value="no">Not featured</option>
                <option value="yes">Featured</option>
              </select>
            </div>
            <button type="submit">Add listing</button>
          </form>
          <div class="collection">
            ${renderCollection(
              state.listings,
              (listing) => `
                <div class="card">
                  <strong>${listing.name}</strong>
                  <span class="chip">${listing.category}</span>
                  <p>${listing.neighborhood} • ${listing.tier}</p>
                  <p>${listing.booking_url}</p>
                  <span class="muted">${listing.reviews} reviews • ${listing.featured ? "Featured" : "Standard placement"}</span>
                </div>
              `,
              "No businesses have been added yet."
            )}
          </div>
        </article>
        <article class="panel">
          <h2>Offers</h2>
          <p class="muted">Publish and track promotional campaigns tied to local listings.</p>
          <form id="offerForm">
            <select name="listingId">
              ${state.listings.map((listing) => `<option value="${listing.id}">${listing.name}</option>`).join("")}
            </select>
            <input name="title" placeholder="Offer title" required>
            <textarea name="details" placeholder="Offer details" required></textarea>
            <div class="row">
              <select name="status">
                <option>Live</option>
                <option>Draft</option>
                <option>Expired</option>
              </select>
              <input name="expiresOn" type="date" required>
            </div>
            <button type="submit">Add offer</button>
          </form>
          <div class="collection">
            ${renderCollection(
              state.offers,
              (offer) => `
                <div class="card">
                  <strong>${offer.title}</strong>
                  <span class="chip">${offer.status}</span>
                  <p>${offer.listing_name || "Listing removed"}</p>
                  <p>${offer.details}</p>
                  <span class="muted">Expires ${formatDate(offer.expires_on)}</span>
                </div>
              `,
              "No offers are active yet."
            )}
          </div>
        </article>
        <article class="panel">
          <h2>Lead Intake</h2>
          <p class="muted">Capture inquiry source, request type, and response status for local leads.</p>
          <form id="leadForm">
            <select name="listingId">
              ${state.listings.map((listing) => `<option value="${listing.id}">${listing.name}</option>`).join("")}
            </select>
            <input name="customerName" placeholder="Customer name" required>
            <div class="row">
              <input name="requestType" placeholder="Request type" required>
              <input name="contact" placeholder="Contact email or phone" required>
            </div>
            <select name="status">
              <option>New</option>
              <option>Contacted</option>
              <option>Qualified</option>
              <option>Closed</option>
            </select>
            <button type="submit">Log lead</button>
          </form>
          <div class="collection">
            ${renderCollection(
              state.leads,
              (lead) => `
                <div class="card">
                  <strong>${lead.customer_name}</strong>
                  <span class="chip">${lead.status}</span>
                  <p>${lead.listing_name || "Listing removed"} • ${lead.request_type}</p>
                  <span class="muted">${lead.contact}</span>
                </div>
              `,
              "No inbound leads have been logged yet."
            )}
          </div>
        </article>
      </section>
    `;

    bindForms();
  }

  async function load() {
    app.innerHTML = '<div class="loading-card">Refreshing local marketplace...</div>';
    const response = await fetch("/api/bootstrap");
    if (!response.ok) {
      throw new Error("Failed to load LocalVault");
    }
    const payload = await response.json();
    state.listings = payload.listings;
    state.offers = payload.offers;
    state.leads = payload.leads;
    state.stats = payload.stats;
    render();
  }

  load().catch((error) => {
    app.innerHTML = `<div class="loading-card">LocalVault could not load: ${error.message}</div>`;
  });
})();
