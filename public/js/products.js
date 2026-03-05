document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('products-grid');
  const filtersContainer = document.getElementById('category-filters');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  let allProducts = [];
  let activeCategory = null;

  // ─── Load products ───
  async function loadProducts(search = '', category = '') {
    grid.innerHTML = Array(6).fill('<div class="skeleton skeleton-card"></div>').join('');

    try {
      let url = '/api/products?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (category) url += `category=${encodeURIComponent(category)}`;

      allProducts = await apiFetch(url);
      renderProducts(allProducts);
    } catch (err) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
          </svg>
          <h2>Failed to load products</h2>
          <p>${err.message}</p>
        </div>
      `;
    }
  }

  // ─── Render products ───
  function renderProducts(products) {
    if (products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
          <h2>No products found</h2>
          <p>Try adjusting your search or filter</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = products.map((p, i) => {
      let stockClass = 'card-stock';
      let stockText = `${p.stock} in stock`;
      if (p.stock === 0) { stockClass += ' out'; stockText = 'Out of stock'; }
      else if (p.stock < 10) { stockClass += ' low'; stockText = `Only ${p.stock} left`; }

      return `
        <div class="product-card fade-in-up" style="animation-delay: ${i * 0.05}s" data-product-id="${p.id}">
          <div class="card-image-wrapper">
            <img src="${p.image_url}" alt="${p.name}" class="card-image" loading="lazy">
            <span class="card-category">${p.category}</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">${p.name}</h3>
            <p class="card-description">${p.description}</p>
            <div class="card-footer">
              <span class="card-price">${formatPrice(p.price)}</span>
              <span class="${stockClass}">${stockText}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers via event delegation
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      if (card) {
        const id = card.dataset.productId;
        window.location.href = `/product.html?id=${id}`;
      }
    });
  }

  // ─── Load categories ───
  async function loadCategories() {
    try {
      const categories = await apiFetch('/api/products/categories');
      filtersContainer.innerHTML = `
        <button class="category-pill active" data-category="">All</button>
        ${categories.map(c => `<button class="category-pill" data-category="${c}">${c}</button>`).join('')}
      `;

      filtersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-pill')) {
          filtersContainer.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
          e.target.classList.add('active');
          activeCategory = e.target.dataset.category;
          loadProducts(searchInput.value, activeCategory);
        }
      });
    } catch (e) {
      // silently fail
    }
  }

  // ─── Search ───
  searchBtn?.addEventListener('click', () => {
    loadProducts(searchInput.value, activeCategory);
  });

  searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loadProducts(searchInput.value, activeCategory);
    }
  });

  // ─── Init ───
  await loadCategories();
  await loadProducts();
});
