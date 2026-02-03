const express = require('express');
const path = require('path');
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();

const app = express();

// 關鍵對齊 1：讓伺服器讀取 public 資料夾 (解決沒排版問題)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'fish-cafe-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, sameSite: 'none' }
}));

// 關鍵對齊 2：首頁路由指向 public 裡的 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Discord 登入跳轉
app.get('/auth/discord', (req, res) => {
    const { DISCORD_CLIENT_ID, DISCORD_REDIRECT_URI } = process.env;
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(url);
});

// Callback 處理 (拿到資料後回傳首頁)
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
        res.redirect('/?login=success'); // 登入後跳回首頁
    } catch (err) {
        res.send("登入失敗，請檢查環境變數設定。");
    }
});

// 提供用戶資料 API (給 script.js 呼叫)
app.get('/api/user', (req, res) => {
    res.json(req.session.user || { error: '未登入' });
});

module.exports = app;
