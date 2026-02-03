const express = require('express');
const path = require('path');
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();

const app = express();

// 1. 靜態檔案支援 (解決排版混亂)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 2. Session 設定
app.use(session({
    secret: process.env.SESSION_SECRET || 'fish-cafe-secure-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, sameSite: 'none' }
}));

// 3. API：獲取用戶資料 (解決 Unexpected token 錯誤)
app.get('/api/user', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            ...req.session.user,
            isOwner: req.session.user.id === process.env.OWNER_USER_ID
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// 4. 首頁路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 5. Discord 登入
app.get('/auth/discord', (req, res) => {
    const { DISCORD_CLIENT_ID, DISCORD_REDIRECT_URI } = process.env;
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(url);
});

// 6. Callback 處理
app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
        });

        req.session.user = userRes.data;
        res.redirect('/'); 
    } catch (err) {
        res.send("登入失敗，請確認 Vercel 環境變數中的 Redirect URI 是否與 Discord 後台一致。");
    }
});

// 7. 登出
app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = app;
