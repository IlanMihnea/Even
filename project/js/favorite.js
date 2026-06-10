// ============================================
// FAVORITE.JS
// ============================================

let allFavs = [];
let activeCat = 'all';

async function loadFavorites() {
  const ids = getFavs();
  document.getElementById('favCount').textContent = `${ids.length} listing${ids.length === 1 ? '' : 's'}`;
  if (ids.length === 0) {
    document.getElementById('favEmpty').style.display = 'flex';
    document.getElementById('favContainer').style.display = 'none';
    return;
  }
  document.getElementById('favEmpty').style.display = 'none';
  document.getElementById('favContainer').style.display = 'block';

  const [rez, com, ter] = await Promise.all([
    getProperties('rezidential').catch(() => []),
    getProperties('comercial').catch(() => []),
    getProperties('terenuri').catch(() => []),
  ]);
  const all = [
    ...rez.map(p => ({ ...p, _cat: 'rezidential' })),
    ...com.map(p => ({ ...p, _cat: 'comercial' })),
    ...ter.map(p => ({ ...p, _cat: 'terenuri' })),
  ];
  const idSet = new Set(ids.map(String));
  allFavs = all.filter(p => idSet.has(String(p.id)));
  renderFavGrid();
}

function renderFavGrid() {
  const grid = document.getElementById('favGrid');
  const filtered = activeCat === 'all'
    ? allFavs
    : allFavs.filter(p => p._cat === activeCat);
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h3>Nimic în această categorie.</h3><p>Schimbă filtrul sau adaugă proprietăți.</p></div>';
    return;
  }
  grid.innerHTML = filtered.map(p => {
    const link = ({
      rezidential: `property-rezidential.html?id=${p.id}`,
      comercial: `property-comercial.html?id=${p.id}`,
      terenuri: `property-teren.html?id=${p.id}`
    })[p._cat];
    if (p._cat === 'rezidential') return renderRezCard(p, link);
    if (p._cat === 'comercial') return renderComCard(p, link);
    if (p._cat === 'terenuri') return renderTerCard(p, link);
    return '';
  }).join('');
  if (typeof applyFavStates === 'function') applyFavStates(grid);
}

function clearAllFavorites() {
  if (!confirm('Ștergi toate favoritele?')) return;
  saveFavs([]);
  loadFavorites();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sp-filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sp-filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCat = btn.dataset.cat;
      renderFavGrid();
    });
  });
  loadFavorites();
});
