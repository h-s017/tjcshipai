# 每日讀經心得｜Android 1.0.0 同工實機驗收

日期：2026-10-25（台灣時間）
驗收來源：專案負責人於對話中回報的 Android 實機測試結果；非自動化裝置測試報告。

## 結果：6/6 通過

- [x] 能成功安裝並開啟 App
- [x] 不需登入即可閱讀
- [x] 66 卷聖經及章節能正常切換
- [x] 三個來源的讀經心得可以開啟
- [x] 分享功能能傳送目前章節連結
- [x] 關閉 App 後重新開啟仍可正常使用

## 測試對應建置

- GitHub Actions run: https://github.com/h-s017/tjcshipai/actions/runs/40115318471
- Artifact: daily-bible-android-debug-apk
- Artifact ID: 12567404483
- 建置 commit: 661b147e057e12c2a01c6259e19fad104ac499ca
- APK 為 Debug 版本；並非正式 Release 簽署版本
- GitHub Artifact 保存期限：2026-11-23 17:22 UTC

## 發佈決策

可開始小範圍同工內部試用；暫不提交 Google Play 或 App Store。請勿將 Debug APK 當成正式公開發行版本。

## 尚待處理

1. 改用固定私有簽署金鑰產生 Release APK，確保日後同一套件可直接升級；簽署金鑰不得提交 GitHub。
2. 測試版本升級、不同 Android 裝置及外部連結異常處理。
3. iPhone 使用 PWA，另行驗證 Safari 加入主畫面及章節分享。
4. 設立長期下載位置，避免 Actions Artifact 到期。
