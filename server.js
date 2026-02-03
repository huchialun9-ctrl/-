const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 中間件設定
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(bodyParser.json());

// Session 設定 (修正 Vercel 上的 MemoryStore 警告)
app.use(session({
    secret: process.env.SESSION_SECRET || 'fish-cafe-default-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // Vercel 強制要求 HTTPS
        sameSite: 'none'
    }
}));

// Discord OAuth2 設定
const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI } = process.env;

// 1. 登入路由
app.get('/auth/discord', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(url);
});

// 2. 回傳處理 (Callback)
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
        console.error(err.response?.data || err.message);
        res.redirect('/?error=auth_failed');
    }
});

// 3. 取得用戶資訊 API
app.get('/api/user', (req, res) => {
    res.json(req.session.user || { error: '未登入' });
});

// 啟動 (Vercel 需要導出 app)
module.exports = app;
app.listen(port, () => console.log(`Server running on port ${port}`));
