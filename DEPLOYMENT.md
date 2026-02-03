# Discord 加成成員福利中心 - 部署指南

## 🚀 部署選項

### 1. Vercel 部署 (推薦)

Vercel 是最簡單的部署方式，支持自動部署和環境變數管理。

#### 步驟：
1. **安裝 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登入 Vercel**
   ```bash
   vercel login
   ```

3. **部署項目**
   ```bash
   vercel --prod
   ```

4. **設置環境變數**
   在 Vercel Dashboard 中設置以下環境變數：
   - `DISCORD_BOT_TOKEN`: 你的 Discord Bot Token
   - `DISCORD_CLIENT_ID`: 1468065912451239978
   - `DISCORD_CLIENT_SECRET`: MJqI9aHD5Bbt_x9S_yjInGQQ33hirOow
   - `DISCORD_GUILD_ID`: 你的伺服器 ID
   - `OWNER_USER_ID`: 你的用戶 ID
   - `SESSION_SECRET`: 隨機生成的密鑰
   - `DISCORD_REDIRECT_URI`: https://你的域名.vercel.app/auth/discord/callback

### 2. Netlify 部署

#### 步驟：
1. **安裝 Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **登入 Netlify**
   ```bash
   netlify login
   ```

3. **部署項目**
   ```bash
   netlify deploy --prod
   ```

4. **設置環境變數**
   在 Netlify Dashboard 中設置相同的環境變數。

### 3. Railway 部署

1. 前往 [Railway.app](https://railway.app)
2. 連接你的 GitHub 倉庫
3. 設置環境變數
4. 自動部署

### 4. Render 部署

1. 前往 [Render.com](https://render.com)
2. 創建新的 Web Service
3. 連接 GitHub 倉庫
4. 設置環境變數
5. 部署

### 5. Docker 部署

#### 本地 Docker：
```bash
# 構建映像
docker build -t discord-boost-benefits .

# 運行容器
docker run -p 3000:3000 --env-file .env discord-boost-benefits
```

#### Docker Compose：
```bash
docker-compose up -d
```

### 6. VPS 部署 (Ubuntu/CentOS)

#### 安裝 Node.js：
```bash
# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### 部署步驟：
```bash
# 克隆項目
git clone <your-repo-url>
cd discord-boost-benefits

# 安裝依賴
npm install

# 設置環境變數
cp .env.example .env
nano .env  # 編輯環境變數

# 安裝 PM2
npm install -g pm2

# 啟動應用
pm2 start server.js --name "discord-app"
pm2 startup
pm2 save
```

## 🔧 環境變數配置

無論使用哪種部署方式，都需要設置以下環境變數：

```env
# Discord 配置
DISCORD_BOT_TOKEN=你的_bot_token
DISCORD_CLIENT_ID=1468065912451239978
DISCORD_CLIENT_SECRET=MJqI9aHD5Bbt_x9S_yjInGQQ33hirOow
DISCORD_GUILD_ID=你的_伺服器_id
OWNER_USER_ID=你的_用戶_id

# 應用配置
PORT=3000
SESSION_SECRET=隨機生成的長密鑰
NODE_ENV=production

# OAuth2 重定向 URI
DISCORD_REDIRECT_URI=https://你的域名/auth/discord/callback
```

## 🌐 域名配置

### Discord Developer Portal 設置：
1. 前往 [Discord Developer Portal](https://discord.com/developers/applications)
2. 選擇你的應用程序 (ID: 1468065912451239978)
3. 在 OAuth2 > General 中添加重定向 URI：
   - 開發環境：`http://localhost:3000/auth/discord/callback`
   - 生產環境：`https://你的域名/auth/discord/callback`

### 自定義域名：
大多數平台都支持自定義域名：
- **Vercel**: 在項目設置中添加域名
- **Netlify**: 在域名管理中添加域名
- **Railway**: 在設置中配置自定義域名

## 📊 監控和日誌

### Vercel：
- 在 Dashboard 中查看函數日誌
- 使用 Vercel Analytics

### Railway：
- 內建日誌查看器
- 資源使用監控

### VPS 部署：
```bash
# PM2 日誌
pm2 logs discord-app

# PM2 監控
pm2 monit

# 系統資源
htop
```

## 🔒 安全考慮

1. **環境變數安全**：
   - 永遠不要在代碼中硬編碼密鑰
   - 使用強隨機密鑰作為 SESSION_SECRET

2. **HTTPS**：
   - 生產環境必須使用 HTTPS
   - 大多數平台自動提供 SSL 證書

3. **CORS 配置**：
   - 在生產環境中限制 CORS 來源

4. **文件上傳安全**：
   - 已實現文件類型和大小限制
   - 考慮使用雲存儲服務 (AWS S3, Cloudinary)

## 🚨 故障排除

### 常見問題：

1. **Bot 無法連接**：
   - 檢查 DISCORD_BOT_TOKEN 是否正確
   - 確認 Bot 已邀請到伺服器

2. **OAuth2 失敗**：
   - 檢查重定向 URI 是否匹配
   - 確認 CLIENT_SECRET 正確

3. **文件上傳失敗**：
   - 檢查 uploads 目錄權限
   - 考慮使用雲存儲

4. **Session 問題**：
   - 確保 SESSION_SECRET 已設置
   - 檢查 cookie 設置

## 📈 性能優化

1. **CDN**：
   - 使用 CDN 加速靜態資源
   - Vercel 和 Netlify 自動提供

2. **緩存**：
   - 實現 Redis 緩存 (可選)
   - 設置適當的 HTTP 緩存頭

3. **數據庫**：
   - 考慮使用數據庫替代內存存儲
   - MongoDB Atlas 或 PostgreSQL

## 🎯 推薦部署方案

### 個人項目：
- **Vercel** (免費額度充足)
- **Railway** (簡單易用)

### 商業項目：
- **VPS** + **Docker** (完全控制)
- **AWS** / **Google Cloud** (企業級)

### 快速測試：
- **Replit** (在線開發環境)
- **CodeSandbox** (快速原型)

選擇最適合你需求和技術水平的部署方式！