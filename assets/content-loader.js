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
    item.title,
    item.subtitle,
    item.author,
    item.excerpt,
    item.content
  ].join(' ')).includes(query);
}

function renderDetail(target, item, type) {
  if (!target || !item) return;
  const meta = type === 'testimony'
    ? [item.author].filter(Boolean)
    : [item.number, item.date, item.subtitle].filter(Boolean);
  const image = item.image
    ? `<figure class="blog-figure"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.title)}"></figure>`
    : '';
  const source = item.sourceUrl
    ? `<a class="card-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">查看原始來源 →</a>`
    : '';
  const backLink = type === 'testimony'
    ? '<a class="detail-back-link" href="testimonies.html#testimonies">← 返回見證清單</a>'
    : '';
  target.innerHTML = `
    <article class="detail-article" id="${escapeHtml(getSlug(item))}">
      ${backLink}
      <div class="meta">${meta.map(value => `<span>${escapeHtml(value)}</span>`).join('')}</div>
      <h3>${escapeHtml(item.title)}</h3>
      ${image}
      <p class="lead">${escapeHtml(item.excerpt)}</p>
      <div class="content">${toParagraphs(item.content)}</div>
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

async function renderTestimonyBlog() {
  const target = document.getElementById('testimony-blog-list');
  if (!target) return;
  const detail = document.getElementById('testimony-detail');
  const search = document.getElementById('testimony-search');
  const toolbar = search?.closest('.content-toolbar');
  try {
    const data = await loadJson('data/testimonies.json');
    const setListVisibility = visible => {
      target.hidden = !visible;
      if (toolbar) toolbar.hidden = !visible;
    };
    const renderList = () => {
      const query = normalizeSearch(search?.value || '');
      const items = data.items.filter(item => itemMatches(item, query));
      target.innerHTML = items.length ? `
        <ol class="testimony-list">
          ${items.map((item, index) => `
            <li>
              <a class="testimony-list-link" href="testimonies.html#${encodeURIComponent(getSlug(item))}">
                <span class="testimony-list-number">${String(item.directoryOrder || index + 1).padStart(2, '0')}</span>
                <span class="testimony-list-copy">
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${escapeHtml(item.author || '')}</span>
                </span>
                <span class="testimony-list-action">閱讀全文 →</span>
              </a>
            </li>
          `).join('')}
        </ol>
      ` : '<p class="notice-panel">沒有符合搜尋條件的見證。</p>';
    };
    const showSelected = () => {
      const currentSlug = decodeURIComponent(location.hash.replace(/^#/, ''));
      const selected = data.items.find(item => getSlug(item) === currentSlug);
      if (selected) {
        renderDetail(detail, selected, 'testimony');
        setListVisibility(false);
        requestAnimationFrame(() => detail?.scrollIntoView({ block: 'start' }));
      } else {
        if (detail) {
          detail.hidden = true;
          detail.innerHTML = '';
        }
        setListVisibility(true);
      }
    };
    renderList();
    showSelected();
    search?.addEventListener('input', renderList);
    window.addEventListener('hashchange', showSelected);
  } catch (error) {
    target.innerHTML = '<p class="notice-panel">目前無法讀取生命見證資料，請稍後再試。</p>';
  }
}

renderNewsList();
renderTestimonyBlog();
