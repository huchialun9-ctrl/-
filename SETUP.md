# Discord 加成成員福利中心 - 設置指南

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. Discord 應用程序設置

#### 已配置的信息：
- **Application ID**: `1468065912451239978`
- **Client Secret**: `MJqI9aHD5Bbt_x9S_yjInGQQ33hirOow`

#### 需要你完成的設置：

1. **前往 Discord Developer Portal**
   - 訪問：https://discord.com/developers/applications
   - 選擇你的應用程序 (ID: 1468065912451239978)

2. **設置 OAuth2 重定向 URI**
   - 在左側選單點擊 "OAuth2" > "General"
   - 在 "Redirects" 部分添加：`http://localhost:3000/auth/discord/callback`
   - 點擊 "Save Changes"

3. **創建 Discord Bot**
   - 在左側選單點擊 "Bot"
   - 如果還沒有 Bot，點擊 "Add Bot"
   - 複製 Bot Token

4. **設置 Bot 權限**
   - 在 "Bot" 頁面向下滾動到 "Bot Permissions"
   - 勾選以下權限：
     - ✅ `Manage Roles`
     - ✅ `View Channels`
     - ✅ `Send Messages`
     - ✅ `Read Message History`

### 3. 配置環境變數

編輯 `.env` 文件，填入以下信息：

```env
# 從 Discord Developer Portal > Bot 頁面獲取
DISCORD_BOT_TOKEN=你的_bot_token_這裡

# 你的 Discord 伺服器 ID
DISCORD_GUILD_ID=你的_伺服器_id_這裡

# 你的 Discord 用戶 ID (站主權限)
OWNER_USER_ID=你的_用戶_id_這裡
```

### 4. 獲取 Discord ID 的方法

1. **啟用開發者模式**
   - 打開 Discord
   - 點擊設置 ⚙️ > 高級 > 開發者模式 (開啟)

2. **獲取伺服器 ID**
   - 右鍵點擊伺服器名稱
   - 選擇 "複製伺服器 ID"

3. **獲取用戶 ID**
   - 右鍵點擊你的用戶名
   - 選擇 "複製用戶 ID"

### 5. 邀請 Bot 到伺服器

1. **生成邀請鏈接**
   - 在 Discord Developer Portal > OAuth2 > URL Generator
   - 勾選 Scopes: `bot`
   - 勾選 Bot Permissions: `Manage Roles`, `View Channels`, `Send Messages`
   - 複製生成的 URL

2. **邀請 Bot**
   - 打開生成的 URL
   - 選擇你的伺服器
   - 點擊 "授權"

### 6. 啟動應用程序

```bash
# 開發模式
npm run dev

# 或生產模式
npm start
```

### 7. 訪問網站

打開瀏覽器訪問：http://localhost:3000

## 🎯 功能測試

### 測試 Discord OAuth2 登入
1. 點擊 "使用 Discord 登入" 按鈕
2. 授權應用程序訪問你的 Discord 帳戶
3. 選擇伺服器（如果你在多個伺服器中）

### 測試藝術牆功能（站主）
1. 確保 `OWNER_USER_ID` 設置為你的用戶 ID
2. 登入後應該看到上傳區域
3. 嘗試上傳圖片或 GIF

### 測試身份組功能（加成成員）
1. 確保你在測試伺服器中是 Nitro 加成成員
2. 登入後應該看到身份組創建選項
3. 嘗試創建自定義身份組

## 🔧 故障排除

### Bot 無法連接
- 檢查 `DISCORD_BOT_TOKEN` 是否正確
- 確認 Bot 已被邀請到伺服器
- 檢查 Bot 是否有必要權限

### OAuth2 登入失敗
- 確認重定向 URI 設置正確
- 檢查 `DISCORD_CLIENT_SECRET` 是否正確
- 確保應用程序 ID 匹配

### 無法創建身份組
- 確認 Bot 有 "Manage Roles" 權限
- 檢查 Bot 的身份組位置是否高於要管理的身份組
- 確認用戶是 Nitro 加成成員

### 藝術牆上傳失敗
- 檢查 `uploads` 目錄是否存在且可寫
- 確認文件大小不超過 10MB
- 檢查文件格式是否支持

## 📞 需要幫助？

如果遇到問題，請檢查：
1. 控制台錯誤信息
2. Discord Developer Portal 設置
3. 環境變數配置
4. Bot 權限設置

## 🎉 完成！

設置完成後，你的 Discord 加成成員福利中心就可以正常使用了！