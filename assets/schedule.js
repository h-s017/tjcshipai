(() => {
  const SHEET_ID = '1v5f3u7T6WJdnyNquAHzpJmtDCVfqmUd4l-j72Ah0Kcw';
  const ORIGINAL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/htmlview`;

  const iframe = document.getElementById('schedule-frame');
  const monthLabel = document.getElementById('schedule-month');
  const openLink = document.getElementById('schedule-open-link');
  const status = document.getElementById('schedule-status');

  if (!iframe || !monthLabel || !openLink || !status) return;

  function taipeiNowParts() {
    const parts = new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).formatToParts(new Date());

    const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day)
    };
  }

  function monthKey(year, month) {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  function fallbackUrl(month) {
    const sheetName = `${month}月`;
    const params = new URLSearchParams({
      tqx: 'out:html',
      sheet: sheetName
    });
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?${params.toString()}`;
  }

  async function load() {
    const now = taipeiNowParts();
    const currentMonthKey = monthKey(now.year, now.month);
    let scheduleUrl = fallbackUrl(now.month);
    let resolvedSheetName = `${now.month}月`;
    let source = 'browser-fallback';

    try {
      const response = await fetch(`data/current-schedule.json?v=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data.month === currentMonthKey && data.url) {
        scheduleUrl = data.url;
        resolvedSheetName = data.sheetName || resolvedSheetName;
        source = data.source || 'github-action';
      }
    } catch (error) {
      console.warn('Monthly schedule metadata unavailable; using browser fallback.', error);
    }

    monthLabel.textContent = `${now.year} 年 ${now.month} 月安排表`;
    iframe.src = scheduleUrl;
    openLink.href = scheduleUrl;
    openLink.dataset.originalUrl = ORIGINAL_URL;
    status.textContent = source === 'github-action'
      ? `已自動對應「${resolvedSheetName}」分頁。`
      : `目前依月份自動嘗試「${resolvedSheetName}」分頁。`;
  }

  load();
})();
