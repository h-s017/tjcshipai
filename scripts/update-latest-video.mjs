const channelId = process.env.YOUTUBE_CHANNEL_ID || 'UCk8zggAqSLPpgpTlR75Ju6w';
const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

function decodeXml(value = '') {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function readTag(source, tagName) {
  const escapedName = tagName.replace(':', '\\:');
  const match = source.match(new RegExp(`<${escapedName}>([\\s\\S]*?)<\\/${escapedName}>`));
  return match ? decodeXml(match[1].trim()) : '';
}

const response = await fetch(feedUrl);

if (!response.ok) {
  throw new Error(`YouTube feed request failed: ${response.status} ${response.statusText}`);
}

const feed = await response.text();
const entry = feed.match(/<entry>[\s\S]*?<\/entry>/)?.[0];

if (!entry) {
  throw new Error('YouTube feed did not contain any video entries.');
}

const videoId = readTag(entry, 'yt:videoId');

if (!videoId) {
  throw new Error('Could not find yt:videoId in the latest YouTube feed entry.');
}

const data = {
  videoId,
  title: readTag(entry, 'title'),
  publishedAt: readTag(entry, 'published'),
  updatedAt: new Date().toISOString()
};

process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
