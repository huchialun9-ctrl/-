# Discord 加成成員福利中心

一個專為 Discord Nitro 加成成員打造的福利選擇平台，包含身份組顏色自選和藝術牆功能。

## 功能特色

### 🎨 身份組管理
- 創建自定義身份組
- 自由選擇身份組顏色
- 實時顏色預覽
- 快速顏色選擇器

### 🖼️ 藝術牆
- 站主專屬上傳權限
- 支持照片和 GIF
- 可標註加成成員用戶名
- 拖拽上傳功能
- 圖片預覽和管理

### 🎁 福利系統
- 多種福利選項
- 直觀的卡片式界面
- 加成成員專屬功能

## 安裝步驟

### 1. 克隆項目
```bash
git clone <repository-url>
cd discord-boost-benefits
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 設置環境變數
複製 `.env.example` 為 `.env` 並填入以下信息：

```env
# Discord Bot Token (從 Discord Developer Portal 獲取)
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# Discord Application ID
DISCORD_CLIENT_ID=your_discord_client_id_here

# Discord Client Secret
DISCORD_CLIENT_SECRET=your_discord_client_secret_here

# Server Port
PORT=3000

# Discord Guild ID (你的伺服器ID)
DISCORD_GUILD_ID=your_discord_guild_id_here

# Owner User ID (你的Discord用戶ID，用於藝術牆管理權限)
OWNER_USER_ID=your_discord_user_id_here
```

### 4. 創建 Discord Bot

1. 前往 [Discord Developer Portal](https://discord.com/developers/applications)
2. 創建新應用程序
3. 在 "Bot" 頁面創建 Bot 並獲取 Token
4. 在 "OAuth2" 頁面設置權限：
   - `bot`
   - `Manage Roles`
   - `Read Messages`
   - `Send Messages`

### 5. 邀請 Bot 到伺服器
使用 OAuth2 URL Generator 生成邀請鏈接，確保包含必要權限。

### 6. 啟動服務器
```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

## 使用說明

### 基本使用
1. 打開網站 `http://localhost:3000`
2. 輸入你的 Discord 用戶 ID 和伺服器 ID
3. 登入後即可使用各項功能

### 獲取 Discord ID
1. 在 Discord 中啟用開發者模式（用戶設置 > 高級 > 開發者模式）
2. 右鍵點擊用戶名或伺服器名稱，選擇 "複製 ID"

### 藝術牆管理（僅站主）
1. 登入後會自動檢測站主權限
2. 可以上傳照片和 GIF（最大 10MB）
3. 支持拖拽上傳
4. 可以標註加成成員用戶名
5. 點擊作品可查看詳細信息
6. 站主可以編輯和刪除作品

### 身份組管理（加成成員）
1. 只有 Discord Nitro 加成成員可以使用
2. 創建自定義身份組名稱
3. 選擇喜歡的顏色
4. 修改現有身份組顏色

## 技術架構

### 後端
- **Node.js** + **Express.js**
- **Discord.js** - Discord API 整合
- **Multer** - 文件上傳處理
- **CORS** - 跨域請求支持

### 前端
- **原生 JavaScript** - 無框架依賴
- **CSS Grid** + **Flexbox** - 響應式布局
- **Font Awesome** - 圖標庫
- **拖拽 API** - 文件上傳體驗

### 文件結構
```
discord-boost-benefits/
├── server.js              # 主服務器文件
├── package.json           # 項目配置
├── .env.example          # 環境變數範例
├── public/               # 前端文件
│   ├── index.html        # 主頁面
│   ├── styles.css        # 樣式文件
│   └── script.js         # JavaScript 邏輯
├── uploads/              # 上傳文件存儲（自動創建）
└── README.md            # 說明文件
```

## API 端點

### 用戶相關
- `GET /api/guilds/:guildId/members/:userId` - 獲取成員信息
- `GET /api/check-owner/:userId` - 檢查是否為站主

### 身份組相關
- `POST /api/guilds/:guildId/roles/create` - 創建身份組
- `PUT /api/guilds/:guildId/roles/:roleId/color` - 更新身份組顏色

### 藝術牆相關
- `GET /api/artwork` - 獲取所有藝術作品
- `POST /api/artwork/upload` - 上傳藝術作品（僅站主）
- `PUT /api/artwork/:id` - 更新藝術作品信息（僅站主）
- `DELETE /api/artwork/:id` - 刪除藝術作品（僅站主）

### 福利相關
- `GET /api/benefits` - 獲取可用福利列表

## 安全考慮

1. **權限控制**：藝術牆管理功能僅限站主使用
2. **文件驗證**：嚴格的文件類型和大小限制
3. **輸入驗證**：所有用戶輸入都經過驗證和清理
4. **錯誤處理**：完善的錯誤處理和用戶反饋

## 自定義配置

### 修改福利選項
編輯 `server.js` 中的 `/api/benefits` 路由來添加或修改福利選項。

### 調整文件上傳限制
在 `server.js` 中修改 multer 配置：
```javascript
limits: {
    fileSize: 10 * 1024 * 1024 // 修改文件大小限制
}
```

### 自定義樣式
編輯 `public/styles.css` 來修改網站外觀和主題色彩。

## 故障排除

### 常見問題

1. **Bot 無法連接**
   - 檢查 Bot Token 是否正確
   - 確認 Bot 已被邀請到伺服器
   - 檢查 Bot 權限設置

2. **無法創建身份組**
   - 確認 Bot 有 "Manage Roles" 權限
   - 檢查 Bot 的身份組位置是否高於要管理的身份組

3. **文件上傳失敗**
   - 檢查文件大小是否超過限制
   - 確認文件格式是否支持
   - 檢查服務器磁盤空間

4. **權限問題**
   - 確認 `OWNER_USER_ID` 設置正確
   - 檢查用戶 ID 格式是否正確

## 貢獻

歡迎提交 Issue 和 Pull Request 來改進這個項目！

## 許可證

MIT License - 詳見 LICENSE 文件