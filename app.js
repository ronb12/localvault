(() => {
  const key = "localvault-v1";
  const state = JSON.parse(localStorage.getItem(key) || "null") || {
    listings: [
      { id: crypto.randomUUID(), name: "Bright Plate Catering", category: "Food", booking: "brightplate.example", deal: "10% off first event", reviews: 18, featured: true },
      { id: crypto.randomUUID(), name: "Glow Studio Spa", category: "Beauty", booking: "glowspa.example", deal: "Free add-on mask", reviews: 12, featured: false },
    ],
    filter: "All",
  };
  const save = () => localStorage.setItem(key, JSON.stringify(state));

  document.head.insertAdjacentHTML("beforeend", `<style>
    body{margin:0;background:#111514;color:#edf6f2;font:16px/1.45 system-ui,sans-serif}main{max-width:1150px;margin:0 auto;padding:28px 20px 48px}
    .lv-grid,.cards,.list{display:grid;gap:16px}.hero,.card{background:#192120;border:1px solid #35514c;border-radius:20px;padding:20px}
    .cards{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}.item{background:#111917;border-radius:14px;padding:14px;display:grid;gap:5px}.row{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))}
    .actions{display:flex;gap:8px;flex-wrap:wrap}.meta{color:#a8c5bd}.tag{display:inline-block;padding:4px 9px;border-radius:999px;background:#25463f;font-size:12px}
    form{display:grid;gap:10px}input,select,button{font:inherit;padding:11px 12px;border-radius:12px;border:1px solid #4c746b}input,select{background:#0d1312;color:#f4fffb}button{background:#8cf2d2;color:#0d1d18;font-weight:700;cursor:pointer}
    @media (max-width:760px){.row{grid-template-columns:1fr}}
  </style>`);

  const main = document.querySelector("main");

  function filteredListings() {
    return state.filter === "All" ? state.listings : state.listings.filter((listing) => listing.category === state.filter);
  }

  function render() {
    const listings = filteredListings();
    main.innerHTML = `
      <div class="lv-grid">
        <section class="hero">
          <h1>LocalVault</h1>
          <p class="meta">Maintain business listings, promoted deals, and review counts with category filtering and saved local state.</p>
          <div class="actions">
            ${["All", "Food", "Beauty", "Home"].map((category) => `<button type="button" data-filter="${category}">${category}</button>`).join("")}
          </div>
        </section>
        <section class="cards">
          <article class="card">
            <h2>Add Listing</h2>
            <form id="listingForm">
              <input name="name" placeholder="Business name" required>
              <div class="row">
                <select name="category"><option>Food</option><option>Beauty</option><option>Home</option></select>
                <input name="booking" placeholder="Booking link or handle" required>
              </div>
              <input name="deal" placeholder="Featured deal" required>
              <button type="submit">Save Listing</button>
            </form>
          </article>
          <article class="card">
            <h2>Directory</h2>
            <div class="list">
              ${listings.map((listing) => `<div class="item"><b>${listing.name}</b><span>${listing.category}</span><span class="meta">${listing.booking}</span><span class="tag">${listing.deal}</span><div class="actions"><span>${listing.reviews} reviews</span><button data-review="${listing.id}">Add Review</button><button data-feature="${listing.id}">${listing.featured ? "Unfeature" : "Feature"}</button></div></div>`).join("")}
            </div>
          </article>
        </section>
      </div>`;

    document.querySelector("#listingForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      state.listings.unshift({
        id: crypto.randomUUID(),
        name: String(form.get("name")),
        category: String(form.get("category")),
        booking: String(form.get("booking")),
        deal: String(form.get("deal")),
        reviews: 0,
        featured: false,
      });
      save();
      render();
    });

    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        save();
        render();
      });
    });

    document.querySelectorAll("[data-review]").forEach((button) => {
      button.addEventListener("click", () => {
        const listing = state.listings.find((entry) => entry.id === button.dataset.review);
        listing.reviews += 1;
        save();
        render();
      });
    });

    document.querySelectorAll("[data-feature]").forEach((button) => {
      button.addEventListener("click", () => {
        const listing = state.listings.find((entry) => entry.id === button.dataset.feature);
        listing.featured = !listing.featured;
        save();
        render();
      });
    });
  }

  save();
  render();
})();
