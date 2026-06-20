# 真耶穌教會石牌教會｜獨立網站雛形

這是一份可直接放到 GitHub Pages 的靜態網站版本。

## 檔案結構

```txt
shipai-church-site/
├── index.html
├── truth.html
├── assets/
│   ├── styles.css
│   └── app.js
└── README.md
```

## 頁面內容

- `index.html`：首頁
  - Hero 區
  - 我要去教會：聯絡資訊 + Google 地圖
  - 最新消息
  - 三張卡片：每日讀經、講道連結、真理造就班
  - 社群連結 CTA
  - Footer
- `truth.html`：真理造就班獨立分頁
  - 本週課程更新
  - 十大信條整理
  - 回到教會與講道入口

## 動態內容

### 每日讀經

首頁的「每日讀經」卡片會使用 Blogger JSONP 自動抓最新一篇文章：

```js
https://tjcshipaiandtianmu.blogspot.com/feeds/posts/default?alt=json-in-script&max-results=1
```

### YouTube 最新影片

首頁的「講道連結」使用 YouTube uploads playlist 嵌入：

```txt
https://www.youtube.com/embed/videoseries?list=UUk8zggAqSLPpgpTlR75Ju6w
```

石牌教會 YouTube Channel ID：

```txt
UCk8zggAqSLPpgpTlR75Ju6w
```

Uploads playlist ID：

```txt
UUk8zggAqSLPpgpTlR75Ju6w
```

## GitHub Pages 部署

1. 在 GitHub 建立新 repository，例如：`shipai-church-site`
2. 把本資料夾內的所有檔案上傳到 repo 根目錄
3. 到 repo 的 `Settings` → `Pages`
4. Source 選 `Deploy from a branch`
5. Branch 選 `main`，資料夾選 `/root`
6. 等待 GitHub Pages 完成部署

## 後續可擴充

- 最新消息改成 `news.json` 或串 Google Sheet
- 真理造就班每週更新改成後台 CMS
- 加入教會照片、聚會安排表、兒教與團契頁面
- 加上自訂網域，例如 `shipai.tjchurch.org.tw`
