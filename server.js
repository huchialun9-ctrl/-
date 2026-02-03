const express = require('express');
const path = require('path');
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();

const app = express();

// 靜態檔案支援
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Session 設定
app.use(session({
    secret: process.env.SESSION_SECRET || 'yuka-secure-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, sameSite: 'none', maxAge: 24 * 60 * 60 * 1000 }
}));

// API：獲取用戶資訊 (解決前端 JSON 解析錯誤)
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

// API：提供模擬功能列表
app.get('/api/benefits', (req, res) => {
    res.json([
        { id: 'custom_role', name: '身份組自定義', icon: '🎨', description: '自選顏色與名稱' },
        { id: 'art_wall', name: '藝術牆展示', icon: '🖼️', description: '展示您的精彩瞬間' }
    ]);
});

// Discord 登入與 Callback
app.get('/auth/discord', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(url);
});

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
        res.redirect('/?login=success');
    } catch (err) {
        res.redirect('/?error=oauth_failed');
    }
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = app;
