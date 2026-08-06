// Mobile menu
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.nav');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
}

// Blogger latest post via JSONP. Works on GitHub Pages without a backend.
(function loadLatestBloggerPost(){
  const summary = document.getElementById('latest-blog-summary');
  const link = document.getElementById('latest-blog-link');
  if (!summary || !link) return;

  window.handleShipaiBlogFeed = function(data){
    try {
      const entry = data.feed.entry && data.feed.entry[0];
      if (!entry) return;

      const title = entry.title.$t;
      const href = entry.link.find(item => item.rel === 'alternate')?.href || 'https://tjcshipaiandtianmu.blogspot.com/';
      const published = new Date(entry.published.$t).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      summary.innerHTML = `<strong>${title}</strong><br><span class="date">${published}</span><br>點擊可閱讀最新完整內容。`;
      link.href = href;
    } catch (error) {
      summary.textContent = '目前無法自動讀取最新文章，請點擊進入每日讀經心得網站。';
    }
  };

  const script = document.createElement('script');
  script.src = 'https://tjcshipaiandtianmu.blogspot.com/feeds/posts/default?alt=json-in-script&max-results=1&callback=handleShipaiBlogFeed';
  script.onerror = function(){
    summary.textContent = '目前無法自動讀取最新文章，請點擊進入每日讀經心得網站。';
  };
  document.body.appendChild(script);
})();

// Homepage weekly livestream. Taiwan time decides the weekly Wednesday, Friday and Saturday notice.
(function loadShipaiLivestream(){
  const frame = document.getElementById('shipai-live-frame');
  const status = document.getElementById('shipai-live-status');
  if (!frame || !status) return;

  const taipeiNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  const liveDays = [3, 5, 6];
  const isLiveDay = liveDays.includes(taipeiNow.getDay());
  frame.src = 'https://www.youtube.com/embed/live_stream?channel=UCk8zggAqSLPpgpTlR75Ju6w&autoplay=0';
  status.textContent = isLiveDay
    ? '今天是固定直播日；開播後可直接在此觀看。'
    : '固定直播日為每週三、週五、週六；最新直播會自動顯示於此。';
})();
