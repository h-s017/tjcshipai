# 本機 Claude（搭配 Claude in Chrome）見證搬運操作模板

使用情境：在本機 `C:\Users\pysta\OneDrive\文件\TJC SHIPAI` 專案，搭配已登入 Facebook 的 Chrome 分頁，用 Claude in Chrome 逐篇擷取貼文內容並寫回 `data/testimonies.json`。

## 每批開始前

1. 確認 Chrome 已登入 Facebook，且能正常打開社團貼文。
2. 開啟 `data/testimony-directory.tsv`，找出狀態仍是「已建立目錄，全文與圖片待匯入」的項目，依 `directoryOrder` 由前往後挑 5~10 篇。
3. 開啟 `data/testimonies.json`，找到對應 `slug` 的條目，確認目前欄位（避免覆蓋已有的 `content`/`image`）。

## 單篇擷取 Prompt 模板（貼給本機 Claude）

```
請用 Claude in Chrome 打開這個連結：<TinyURL>
這是 Facebook 社團「石牌四十，堅若磐石」裡的一篇見證貼文。

請執行：
1. 如果內文被折疊，點擊「查看更多」展開完整全文。
2. 擷取以下資訊：
   - 完整貼文全文（保留原始分段，用 \n\n 分隔）
   - 發文作者
   - 原始發文日期（用滑鼠停在日期上看 tooltip，或檢查可讀的完整日期文字；如果只看到模糊的「3小時前」之類相對時間，請改用貼文網址或其他可靠方式確認絕對日期；無法確認就回報「無法確認」，不要猜測）
   - 貼文中屬於本篇的圖片網址（不要抓取留言區或側邊欄的圖片）
   - 貼文的實際 Facebook permalink（如果跟 TinyURL 不同）

3. 把結果用以下格式回報給我：
標題：
作者：
原始日期：
全文：
圖片網址（每行一個）：
Permalink：
```

## 寫回 data/testimonies.json 時的欄位對應

- `content`：全文，段落間用 `\n\n`
- `excerpt`：全文前 1~2 句的簡短摘要
- `originalDate` / `date`：確認到的日期（格式 YYYY-MM-DD），若無法確認維持 `"待確認"`
- `originalDateText`：若日期確認，填寫人工可讀說明（例如「依貼文時間戳記確認」）；若未確認維持原文字
- `image`：下載圖片後存到 `assets/uploads/testimony-<作者羅馬拼音>-01.jpg`，此欄填相對路徑
- `imageAlt`：簡短描述圖片內容
- `status`：
  - 全文+日期都確認 → `已匯入展開全文，日期已確認`
  - 全文確認但日期未確認 → `已匯入展開全文，日期待確認`
  - 仍只有摘要 → `已匯入可見摘要，全文待校對`
- `sourceUrl`：保留原 TinyURL，不要覆蓋；如有確認到的 permalink 可另加欄位（例如 `permalinkUrl`），不要取代 `sourceUrl`

## 每批完成後驗證

```powershell
# JSON 語法與筆數
$data = Get-Content -Raw -Encoding UTF8 data\testimonies.json | ConvertFrom-Json
$data.items.Count
$data.items | Group-Object status | Select-Object Count, Name

# JS 語法
& 'C:\Users\pysta\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check assets\content-loader.js

# git 檢查
git diff --check
git status --short
```

本機靜態預覽：開 `http://127.0.0.1:4173/testimonies.html`，確認卡片數仍為 61、搜尋正常、圖片無破圖。

## Commit & Push

```powershell
git add data/testimonies.json assets/uploads/*
git commit -m "Import family testimony batch <directoryOrder 範圍>"
git push origin main
```

推送後檢查：
- https://h-s017.github.io/tjcshipai/data/testimonies.json
- https://h-s017.github.io/tjcshipai/testimonies.html
