async function loadJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Cannot load ${path}`);
  return response.json();
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function renderTruthBlog() {
  const target = document.getElementById('truth-blog-list');
  if (!target) return;
  try {
    const data = await loadJson('data/truth.json');
    target.innerHTML = data.items.map(item => `
      <article class="blog-card">
        <div class="meta"><span>${escapeHtml(item.number)}</span><span>${escapeHtml(item.date)}</span></div>
        <h3>${escapeHtml(item.title)}</h3>
        <p><strong>${escapeHtml(item.subtitle)}</strong></p>
        <p>${escapeHtml(item.excerpt)}</p>
        <div class="content"><p>${escapeHtml(item.content)}</p></div>
        <a class="card-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">查看原始課程目錄 →</a>
      </article>
    `).join('');
  } catch (error) {
    target.innerHTML = '<p class="notice-panel">目前無法讀取真理造就班資料，請稍後再試。</p>';
  }
}

async function renderTestimonyBlog() {
  const target = document.getElementById('testimony-blog-list');
  if (!target) return;
  try {
    const data = await loadJson('data/testimonies.json');
    target.innerHTML = data.items.map(item => `
      <article class="blog-card">
        <div class="meta"><span>${escapeHtml(item.date)}</span><span>${escapeHtml(item.status)}</span></div>
        <h3>${escapeHtml(item.title)}</h3>
        <p><strong>${escapeHtml(item.family)}</strong></p>
        <p>${escapeHtml(item.excerpt)}</p>
        <div class="content"><p>${escapeHtml(item.content)}</p></div>
      </article>
    `).join('');
  } catch (error) {
    target.innerHTML = '<p class="notice-panel">目前無法讀取家族見證資料，請稍後再試。</p>';
  }
}

renderTruthBlog();
renderTestimonyBlog();
