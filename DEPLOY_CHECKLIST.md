# 🚀 部署檢查清單

## ✅ 部署前準備

### 1. Discord 設置
- [ ] 已獲取 Discord Bot Token
- [ ] Bot 已邀請到伺服器並有適當權限
- [ ] 已獲取伺服器 ID 和你的用戶 ID
- [ ] 在 Discord Developer Portal 設置 OAuth2 重定向 URI

### 2. 環境變數準備
- [ ] `DISCORD_BOT_TOKEN`: ________________
- [ ] `DISCORD_CLIENT_ID`: 1468065912451239978 ✓
- [ ] `DISCORD_CLIENT_SECRET`: MJqI9aHD5Bbt_x9S_yjInGQQ33hirOow ✓
- [ ] `DISCORD_GUILD_ID`: ________________
- [ ] `OWNER_USER_ID`: ________________
- [ ] `SESSION_SECRET`: ________________ (隨機生成)
- [ ] `DISCORD_REDIRECT_URI`: ________________

## 🌐 快速部署選項

### 選項 1: Vercel (推薦 - 免費)
```bash
npm install -g vercel
vercel login
vercel --prod
```
- [ ] 在 Vercel Dashboard 設置環境變數
- [ ] 測試網站功能

### 選項 2: Railway (簡單)
1. [ ] 前往 https://railway.app
2. [ ] 連接 GitHub 倉庫
3. [ ] 設置環境變數
4. [ ] 部署

### 選項 3: Netlify
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### 選項 4: 使用部署腳本
```bash
./deploy.sh
```

## 🔧 部署後設置

### Discord Developer Portal
- [ ] 添加生產環境重定向 URI: `https://你的域名/auth/discord/callback`
- [ ] 測試 OAuth2 流程

### 功能測試
- [ ] Discord OAuth2 登入
- [ ] 手動 ID 登入
- [ ] 加成成員檢測
- [ ] 身份組創建 (如果是加成成員)
- [ ] 藝術牆瀏覽
- [ ] 藝術牆上傳 (如果是站主)

## 🚨 常見問題

### Bot 無法連接
- 檢查 `DISCORD_BOT_TOKEN` 是否正確
- 確認 Bot 已邀請到伺服器

### OAuth2 失敗
- 檢查重定向 URI 是否匹配
- 確認 `DISCORD_CLIENT_SECRET` 正確

### 文件上傳失敗
- 檢查平台是否支持文件上傳
- 考慮使用雲存儲服務

## 📱 測試用戶流程

### 一般用戶
1. [ ] 訪問網站
2. [ ] 點擊 "使用 Discord 登入"
3. [ ] 完成 Discord 授權
4. [ ] 查看用戶信息
5. [ ] 瀏覽藝術牆

### 加成成員
1. [ ] 完成一般用戶流程
2. [ ] 看到加成成員狀態
3. [ ] 訪問福利選擇
4. [ ] 創建自定義身份組
5. [ ] 修改身份組顏色

### 站主
1. [ ] 完成加成成員流程
2. [ ] 看到藝術牆上傳區域
3. [ ] 上傳圖片/GIF
4. [ ] 編輯作品信息
5. [ ] 刪除作品

## 🎯 部署成功指標

- [ ] 網站可正常訪問
- [ ] Discord OAuth2 登入正常
- [ ] 用戶信息正確顯示
- [ ] 加成狀態檢測正常
- [ ] 身份組功能正常 (加成成員)
- [ ] 藝術牆功能正常 (站主)
- [ ] 響應式設計在手機上正常
- [ ] 所有按鈕和動畫正常

## 📞 需要幫助？

如果遇到問題：
1. 檢查瀏覽器控制台錯誤
2. 檢查平台部署日誌
3. 確認所有環境變數設置正確
4. 測試 Discord Developer Portal 設置

---

**記住**: 部署後記得在 Discord Developer Portal 更新重定向 URI！