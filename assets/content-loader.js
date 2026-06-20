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

function toParagraphs(value) {
  return String(value || '')
    .split(/\n{2,}|\r?\n/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => `<p>${escapeHtml(part)}</p>`)
    .join('');
}

function getSlug(item) {
  return item.slug || item.number || item.title || '';
}

function normalizeSearch(value) {
  return String(value || '').toLowerCase();
}

function itemMatches(item, query) {
  if (!query) return true;
  return normalizeSearch([
    item.number,
    item.date,
    item.originalDate,
    item.originalDateText,
    item.title,
    item.subtitle,
    item.author,
    item.family,
    item.excerpt,
    item.content,
    item.status
  ].join(' ')).includes(query);
}

function renderDetail(target, item, type) {
  if (!target || !item) return;
  const meta = type === 'testimony'
    ? [item.originalDate || item.date, item.author, item.family].filter(Boolean)
    : [item.number, item.date, item.subtitle].filter(Boolean);
  const image = item.image
    ? `<figure class="blog-figure"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.title)}"></figure>`
    : '';
  const source = item.sourceUrl
    ? `<a class="card-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">查看原始來源 →</a>`
    : '';
  target.innerHTML = `
    <article class="detail-article">
      <div class="meta">${meta.map(value => `<span>${escapeHtml(value)}</span>`).join('')}</div>
      <h3>${escapeHtml(item.title)}</h3>
      ${image}
      <p class="lead">${escapeHtml(item.excerpt)}</p>
      <div class="content">${toParagraphs(item.content)}</div>
      ${item.originalDateText ? `<p class="source-note">原始日期文字：${escapeHtml(item.originalDateText)}</p>` : ''}
      ${source}
    </article>
  `;
  target.hidden = false;
}

async function renderNewsList() {
  const target = document.getElementById('news-list');
  if (!target) return;
  try {
    const data = await loadJson('data/news.json');
    target.innerHTML = data.items.map(item => `
      <a class="news-item" href="${escapeHtml(item.url)}">
        <span class="date">${escapeHtml(item.date)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.excerpt)}</span>
      </a>
    `).join('');
  } catch (error) {
    target.innerHTML = '<p class="notice-panel">目前無法讀取最新消息，請稍後再試。</p>';
  }
}

async function renderTruthBlog() {
  const target = document.getElementById('truth-blog-list');
  if (!target) return;
  const detail = document.getElementById('truth-detail');
  const search = document.getElementById('truth-search');
  try {
    const data = await loadJson('data/truth.json');
    const renderList = () => {
      const query = normalizeSearch(search?.value || '');
      const items = data.items.filter(item => itemMatches(item, query));
      target.innerHTML = items.map(item => `
      <article class="blog-card">
        <div class="meta"><span>${escapeHtml(item.number)}</span><span>${escapeHtml(item.date)}</span></div>
        <h3>${escapeHtml(item.title)}</h3>
        <p><strong>${escapeHtml(item.subtitle)}</strong></p>
        <p>${escapeHtml(item.excerpt)}</p>
        <div class="content">${toParagraphs(item.content)}</div>
        <a class="card-link" href="truth.html#${encodeURIComponent(getSlug(item))}">閱讀與分享 →</a>
      </article>
      `).join('') || '<p class="notice-panel">沒有符合搜尋條件的課程。</p>';
    };
    const currentSlug = decodeURIComponent(location.hash.replace(/^#/, ''));
    const selected = data.items.find(item => getSlug(item) === currentSlug);
    if (selected) renderDetail(detail, selected, 'truth');
    renderList();
    search?.addEventListener('input', renderList);
  } catch (error) {
    target.innerHTML = '<p class="notice-panel">目前無法讀取真理造就班資料，請稍後再試。</p>';
  }
}

async function renderTestimonyBlog() {
  const target = document.getElementById('testimony-blog-list');
  if (!target) return;
  const detail = document.getElementById('testimony-detail');
  const search = document.getElementById('testimony-search');
  try {
    const data = await loadJson('data/testimonies.json');
    const renderList = () => {
      const query = normalizeSearch(search?.value || '');
      const items = data.items.filter(item => itemMatches(item, query));
      target.innerHTML = items.map(item => `
        <article class="blog-card">
          ${item.image ? `<img class="card-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.title)}">` : ''}
          <div class="meta"><span>${escapeHtml(item.originalDate || item.date)}</span><span>${escapeHtml(item.author || item.status)}</span></div>
          <h3>${escapeHtml(item.title)}</h3>
          <p><strong>${escapeHtml(item.family)}</strong></p>
          <p>${escapeHtml(item.excerpt)}</p>
          <div class="content">${toParagraphs(item.content)}</div>
          <a class="card-link" href="testimonies.html#${encodeURIComponent(getSlug(item))}">閱讀與分享 →</a>
        </article>
      `).join('') || '<p class="notice-panel">沒有符合搜尋條件的見證。</p>';
    };
    const currentSlug = decodeURIComponent(location.hash.replace(/^#/, ''));
    const selected = data.items.find(item => getSlug(item) === currentSlug);
    if (selected) renderDetail(detail, selected, 'testimony');
    renderList();
    search?.addEventListener('input', renderList);
  } catch (error) {
    target.innerHTML = '<p class="notice-panel">目前無法讀取家族見證資料，請稍後再試。</p>';
  }
}

renderNewsList();
renderTruthBlog();
renderTestimonyBlog();
