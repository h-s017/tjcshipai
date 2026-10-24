# 每日讀經心得｜Android 與 iOS App

此資料夾是獨立 Android/iOS App 原始專案（Expo + React Native WebView），與 GitHub Pages 網站共用即時讀經資料。**一般讀者完全免登入**。App 有原生「分享」功能，可分享目前章節的網址；網站內原本的分享章節功能也保留。

## 本機開發

1. 安裝 Node.js 20+，在此資料夾執行 `npm install`。
2. 執行 `npx expo start`，以 Android/iOS 模擬器測試。
3. 正式發行前，請準備 1024×1024 PNG App 圖示及啟動畫面；目前網站已有不含蝴蝶結的 SVG 圖示，需轉換為 PNG 並配置 app.json。

## Android APK

1. 安裝 EAS CLI：`npm install -g eas-cli`。
2. 開發者登入 Expo：`eas login`（僅建置者需登入；讀者不用）。
3. 初始化：`eas build:configure`。
4. 執行 `eas build --platform android --profile preview` 產生測試 APK。
5. 驗證 Android 返回鍵、章節深連結、原生分享、離線與外部文章連結。

## iPhone App

1. iOS 實機安裝／TestFlight 需要 Apple Developer Program、簽署憑證與裝置或測試發佈權限。
2. `eas build --platform ios --profile production` 建立 iOS 安裝封裝，然後使用 App Store Connect/TestFlight 發佈。
3. 需在 macOS/Xcode 或 EAS 上完成實機測試；此儲存庫尚未產出已簽署 IPA。

## 注意

- 目前是原生容器載入既有公開網站，**不是完整離線原生閱讀器**；網路連線及網站正常運作仍是主要依賴。
- Android/iOS 商店對只有網站包裝的 App 可能要求更多原生功能與審查；目前尚未提交審核。
- 若網站改成自訂網域，需同步更新 `App.js` 的 HOME/ORIGIN，並重新建置。
- App 套件 ID 暫用 `org.tjcshipai.dailybible`，發佈前需確認教會有權使用。
- 網頁章節切換使用 history.replaceState，原生 WebView 的 onNavigationStateChange 未必即時捕捉；分享前應在 Android/iOS 實機驗證章節網址。 
