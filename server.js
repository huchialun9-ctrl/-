const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 中間件設定
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

// Session 設定 (修正 Vercel 上的 MemoryStore 警告)
app.use(session({
    secret: process.env.SESSION_SECRET || 'fish-cafe-secure-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // Vercel 環境必須為 true
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'none'
    }
}));

// 從環境變數讀取設定
const { 
    DISCORD_CLIENT_ID, 
    DISCORD_CLIENT_SECRET, 
    DISCORD_REDIRECT_URI,
    OWNER_USER_ID,
    DISCORD_BOT_TOKEN 
} = process.env;

// --- 路由開始 ---

// 1. 首頁 (解決 Cannot GET /)
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>🐟 魚咖招待所後端系統</h1>
            <p>狀態：系統運行中</p>
            <hr>
            <a href="/auth/discord" style="padding: 10px 20px; background: #5865F2; color: white; text-decoration: none; border-radius: 5px;">使用 Discord 登入測試</a>
        </div>
    `);
});

// 2. Discord 登入跳轉
app.get('/auth/discord', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(url);
});

// 3. OAuth2 回傳處理 (Callback)
app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/?error=no_code');

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: DISCORD_REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
        });

        req.session.user = userResponse.data;
        res.redirect('/?login=success');
    } catch (err) {
        console.error('OAuth2 Error:', err.response?.data || err.message);
        res.redirect('/?error=auth_failed');
    }
});

// 4. 獲取用戶資訊 API (檢查是否為站主)
app.get('/api/user', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: '未登入' });
    res.json({
        ...req.session.user,
        isOwner: req.session.user.id === OWNER_USER_ID
    });
});

// 5. 登出
app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// 導出給 Vercel 使用 (重要)
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}
