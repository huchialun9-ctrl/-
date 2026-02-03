const express = require('express');
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Discord Bot 設定
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

// 中間件
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.DISCORD_REDIRECT_URI?.replace('/auth/discord/callback', ''), 'https://discord.com']
        : ['http://localhost:3000', 'https://discord.com'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session 設定
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// 確保上傳目錄存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 設定 multer 用於文件上傳
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'artwork-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB 限制
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允許上傳圖片文件 (JPEG, PNG, GIF, WebP)'));
        }
    }
});

// 藝術牆數據存儲 (實際項目中應使用數據庫)
let artworkData = [];

// 檢查是否為站主的中間件
function checkOwnerPermission(req, res, next) {
    const { userId } = req.body || req.query;
    const ownerId = process.env.OWNER_USER_ID;
    
    if (!ownerId) {
        return res.status(500).json({ error: '未設定站主 ID' });
    }
    
    if (userId !== ownerId) {
        return res.status(403).json({ error: '只有站主可以管理藝術牆' });
    }
    
    next();
}

// Discord Bot 登入
client.login(process.env.DISCORD_BOT_TOKEN);

client.once('ready', () => {
    console.log(`✅ Discord Bot 已登入: ${client.user.tag}`);
});

// Discord OAuth2 設定
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback';

// OAuth2 相關路由
app.get('/auth/discord', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(discordAuthUrl);
});

app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        return res.redirect('/?error=no_code');
    }
    
    try {
        // 交換 access token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: DISCORD_REDIRECT_URI
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        const { access_token } = tokenResponse.data;
        
        // 獲取用戶信息
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        
        // 獲取用戶的伺服器列表
        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        
        // 存儲用戶信息到 session
        req.session.user = {
            id: userResponse.data.id,
            username: userResponse.data.username,
            discriminator: userResponse.data.discriminator,
            avatar: userResponse.data.avatar,
            guilds: guildsResponse.data
        };
        
        res.redirect('/?login=success');
        
    } catch (error) {
        console.error('Discord OAuth2 錯誤:', error.response?.data || error.message);
        res.redirect('/?error=oauth_failed');
    }
});

// 登出路由
app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// 獲取當前用戶信息
app.get('/api/user', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: '未登入' });
    }
    
    res.json(req.session.user);
});

// API 路由
app.get('/api/guilds/:guildId/members/:userId', async (req, res) => {
    try {
        const { guildId, userId } = req.params;
        const guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
            return res.status(404).json({ error: '找不到伺服器' });
        }

        const member = await guild.members.fetch(userId);
        
        if (!member) {
            return res.status(404).json({ error: '找不到成員' });
        }

        // 檢查是否為加成成員
        const isBooster = member.premiumSince !== null;
        
        res.json({
            id: member.id,
            username: member.user.username,
            displayName: member.displayName,
            isBooster,
            roles: member.roles.cache.map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor
            }))
        });
    } catch (error) {
        console.error('獲取成員資訊錯誤:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

// 創建自定義身份組
app.post('/api/guilds/:guildId/roles/create', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { userId, roleName, color, benefits } = req.body;
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: '找不到伺服器' });
        }

        const member = await guild.members.fetch(userId);
        if (!member || !member.premiumSince) {
            return res.status(403).json({ error: '只有加成成員可以創建自定義身份組' });
        }

        // 創建身份組
        const role = await guild.roles.create({
            name: roleName,
            color: color,
            reason: `加成成員 ${member.displayName} 的自定義身份組`
        });

        // 給成員添加身份組
        await member.roles.add(role);

        res.json({
            success: true,
            role: {
                id: role.id,
                name: role.name,
                color: role.hexColor
            }
        });
    } catch (error) {
        console.error('創建身份組錯誤:', error);
        res.status(500).json({ error: '創建身份組失敗' });
    }
});

// 更新身份組顏色
app.put('/api/guilds/:guildId/roles/:roleId/color', async (req, res) => {
    try {
        const { guildId, roleId } = req.params;
        const { userId, color } = req.body;
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: '找不到伺服器' });
        }

        const member = await guild.members.fetch(userId);
        if (!member || !member.premiumSince) {
            return res.status(403).json({ error: '只有加成成員可以修改身份組顏色' });
        }

        const role = guild.roles.cache.get(roleId);
        if (!role) {
            return res.status(404).json({ error: '找不到身份組' });
        }

        // 檢查成員是否擁有此身份組
        if (!member.roles.cache.has(roleId)) {
            return res.status(403).json({ error: '您沒有權限修改此身份組' });
        }

        await role.setColor(color);

        res.json({
            success: true,
            role: {
                id: role.id,
                name: role.name,
                color: role.hexColor
            }
        });
    } catch (error) {
        console.error('更新身份組顏色錯誤:', error);
        res.status(500).json({ error: '更新顏色失敗' });
    }
});

// 獲取可用福利
app.get('/api/benefits', (req, res) => {
    const benefits = [
        {
            id: 'custom_role',
            name: '自定義身份組',
            description: '創建專屬的身份組名稱和顏色',
            icon: '🎨',
            category: 'role'
        },
        {
            id: 'priority_support',
            name: '優先客服支援',
            description: '享受優先的客服回應',
            icon: '⚡',
            category: 'support'
        },
        {
            id: 'exclusive_channels',
            name: '專屬頻道權限',
            description: '進入加成成員專屬頻道',
            icon: '🔒',
            category: 'access'
        },
        {
            id: 'custom_emoji',
            name: '自定義表情符號',
            description: '上傳個人專屬表情符號',
            icon: '😀',
            category: 'emoji'
        },
        {
            id: 'voice_priority',
            name: '語音頻道優先權',
            description: '語音頻道連接優先權',
            icon: '🎤',
            category: 'voice'
        }
    ];
    
    res.json(benefits);
});

// 藝術牆 API 路由

// 獲取所有藝術作品
app.get('/api/artwork', (req, res) => {
    res.json(artworkData);
});

// 上傳藝術作品 (只有站主可以)
app.post('/api/artwork/upload', upload.single('artwork'), checkOwnerPermission, (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '請選擇要上傳的文件' });
        }

        const { title, description } = req.body;
        
        const artwork = {
            id: Date.now().toString(),
            title: title || '無標題',
            description: description || '',
            filename: req.file.filename,
            originalName: req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            uploadedAt: new Date().toISOString(),
            fileSize: req.file.size,
            mimeType: req.file.mimetype
        };

        artworkData.unshift(artwork); // 新的作品放在前面
        
        res.json({
            success: true,
            artwork: artwork
        });
    } catch (error) {
        console.error('上傳藝術作品錯誤:', error);
        res.status(500).json({ error: '上傳失敗' });
    }
});

// 刪除藝術作品 (只有站主可以)
app.delete('/api/artwork/:id', checkOwnerPermission, (req, res) => {
    try {
        const { id } = req.params;
        const artworkIndex = artworkData.findIndex(art => art.id === id);
        
        if (artworkIndex === -1) {
            return res.status(404).json({ error: '找不到該藝術作品' });
        }

        const artwork = artworkData[artworkIndex];
        
        // 刪除文件
        const filePath = path.join(__dirname, 'uploads', artwork.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // 從數據中移除
        artworkData.splice(artworkIndex, 1);
        
        res.json({ success: true });
    } catch (error) {
        console.error('刪除藝術作品錯誤:', error);
        res.status(500).json({ error: '刪除失敗' });
    }
});

// 更新藝術作品信息 (只有站主可以)
app.put('/api/artwork/:id', checkOwnerPermission, (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        
        const artwork = artworkData.find(art => art.id === id);
        
        if (!artwork) {
            return res.status(404).json({ error: '找不到該藝術作品' });
        }

        artwork.title = title || artwork.title;
        artwork.description = description || artwork.description;
        artwork.updatedAt = new Date().toISOString();
        
        res.json({
            success: true,
            artwork: artwork
        });
    } catch (error) {
        console.error('更新藝術作品錯誤:', error);
        res.status(500).json({ error: '更新失敗' });
    }
});

// 檢查用戶是否為站主
app.get('/api/check-owner/:userId', (req, res) => {
    const { userId } = req.params;
    const ownerId = process.env.OWNER_USER_ID;
    
    res.json({
        isOwner: userId === ownerId
    });
});

app.listen(port, () => {
    console.log(`🚀 伺服器運行在 http://localhost:${port}`);
});