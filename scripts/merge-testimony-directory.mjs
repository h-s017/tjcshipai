import { readFile, writeFile } from 'node:fs/promises';

const jsonPath = new URL('../data/testimonies.json', import.meta.url);
const directoryPath = new URL('../data/testimony-directory.tsv', import.meta.url);
const data = JSON.parse(await readFile(jsonPath, 'utf8'));
const rows = (await readFile(directoryPath, 'utf8'))
  .trim()
  .split(/\r?\n/)
  .map((line, index) => {
    const [title, author, sourceUrl] = line.split('\t');
    return { title, author, sourceUrl, directoryOrder: index + 1 };
  });

const existing = new Map(data.items.map((item) => [`${item.title}\t${item.author}`, item]));
const existingByAuthor = new Map(data.items.map((item) => [item.author, item]));
const knownImages = new Map([
  ['邱詩琴', 'assets/uploads/testimony-qiu-shi-qin-01.jpg'],
]);
data.items = rows.map((row) => {
  const item = existing.get(`${row.title}\t${row.author}`) || existingByAuthor.get(row.author);
  if (item) {
    return {
      ...item,
      title: row.title,
      sourceUrl: row.sourceUrl,
      directoryOrder: row.directoryOrder,
      image: item.image || knownImages.get(row.author),
    };
  }

  return {
    slug: `family-testimony-${String(row.directoryOrder).padStart(2, '0')}`,
    date: '待確認',
    originalDate: '待確認',
    originalDateText: '待開啟 Facebook 原貼文確認。',
    title: row.title,
    author: row.author,
    family: row.author,
    excerpt: '文章已列入石牌四十週年家族信仰見證目錄，全文與圖片整理中。',
    content: '文章已列入石牌四十週年家族信仰見證目錄，請先由原文連結閱讀；全文、原始建立日期與圖片將於原貼文校對後補入。',
    status: '已建立目錄，全文與圖片待匯入',
    sourceUrl: row.sourceUrl,
    directoryOrder: row.directoryOrder,
  };
});
data.directoryCount = rows.length;
data.directoryTag = '#TJCSP40家族信仰見證';
data.intro = `石牌教會四十週年家族信仰見證共 ${rows.length} 篇，可依標題、作者與內文搜尋。每篇保留原文連結，全文、原始日期與圖片依原貼文持續校對。`;
data.updatedAt = new Date().toISOString().slice(0, 10);

await writeFile(jsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`Merged ${rows.length} directory entries (${existing.size} existing articles checked).`);
