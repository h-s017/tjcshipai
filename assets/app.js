// Mobile menu
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.nav');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
}

// Blogger latest post with an on-page text preview. JSONP works on GitHub Pages without a backend.
(function loadLatestBloggerPost(){
  const summary = document.getElementById('latest-blog-summary');
  const link = document.getElementById('latest-blog-link');
  if (!summary || !link) return;

  window.handleShipaiBlogFeed = function(data){
    try {
      const entry = data.feed.entry && data.feed.entry[0];
      if (!entry) throw new Error('No post');

      const title = entry.title.$t;
      const href = entry.link.find(item => item.rel === 'alternate')?.href || 'https://tjcshipaiandtianmu.blogspot.com/';
      const published = new Date(entry.published.$t).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const sourceHtml = entry.content?.$t || entry.summary?.$t || '';
      const previewBox = document.createElement('div');
      previewBox.innerHTML = sourceHtml;
      const preview = (previewBox.textContent || '').replace(/\s+/g, ' ').trim();
      const excerpt = preview.length > 150 ? preview.slice(0, 150) + '…' : preview;

      summary.replaceChildren();
      const heading = document.createElement('strong');
      heading.textContent = title;
      const date = document.createElement('span');
      date.className = 'date';
      date.textContent = published;
      const excerptNode = document.createElement('p');
      excerptNode.className = 'reading-preview';
      excerptNode.textContent = excerpt || '點擊閱讀最新完整內容。';
      summary.append(heading, document.createElement('br'), date, excerptNode);
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

// During worship time show the live stream; afterward show the channel's newest converted video.
(function loadShipaiGathering(){
  const frame = document.getElementById('shipai-live-frame');
  const status = document.getElementById('shipai-live-status');
  const link = document.getElementById('shipai-gathering-link');
  if (!frame || !status) return;

  const channelId = 'UCk8zggAqSLPpgpTlR75Ju6w';
  const uploadsPlaylist = 'UUk8zggAqSLPpgpTlR75Ju6w';
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const windows = day === 3 || day === 5
    ? [[19 * 60 + 50, 21 * 60]]
    : day === 6
      ? [[9 * 60 + 50, 11 * 60 + 10], [13 * 60 + 20, 14 * 60 + 40]]
      : [];
  const currentWindow = windows.find(([start, end]) => minutes >= start && minutes < end);

  const showLatestRecording = async function(){
    let videoId = 'dmrzvlui9vM';
    try {
      const response = await fetch('data/latest-video.json', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data.videoId) videoId = data.videoId;
      }
    } catch (error) {
      // Keep the known playable video as fallback.
    }
    frame.src = 'https://www.youtube.com/embed/' + encodeURIComponent(videoId) + '?rel=0';
    status.textContent = '目前播放最近一次聚會轉存的影片；每次聚會完成後會自動更新。';
    if (link) {
      link.href = 'https://youtu.be/' + encodeURIComponent(videoId);
      link.textContent = '開啟聚會影片';
    }
  };

  if (currentWindow) {
    frame.src = 'https://www.youtube.com/embed/live_stream?channel=' + channelId + '&autoplay=0';
    status.textContent = '目前為崇拜時間，可直接觀看直播；結束後會自動切換成聚會影片。';
    if (link) {
      link.href = 'https://youtube.com/@TJChurchShipai/live';
      link.textContent = '開啟聚會連結';
    }
    const millisecondsUntilEnd = (currentWindow[1] - minutes) * 60 * 1000 - now.getSeconds() * 1000;
    window.setTimeout(showLatestRecording, Math.max(0, millisecondsUntilEnd) + 120000);
  } else {
    showLatestRecording();
  }
})();
