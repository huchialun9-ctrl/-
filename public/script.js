let currentUser = null;
let currentGuild = null;
let isOwner = false;

// DOM 元素
const loginSection = document.getElementById('loginSection');
const userSection = document.getElementById('userSection');
const roleSection = document.getElementById('roleSection');
const artworkUpload = document.getElementById('artworkUpload');
const notification = document.getElementById('notification');

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkLoginStatus();
});

function setupEventListeners() {
    document.getElementById('discordLoginBtn').onclick = () => window.location.href = '/auth/discord';
    document.getElementById('logoutBtn').onclick = () => window.location.href = '/auth/logout';
    
    // 手動登入切換
    document.getElementById('manualLoginToggle').onclick = () => {
        const form = document.getElementById('loginForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    };

    // 顏色選擇器同步
    const colorPicker = document.getElementById('roleColor');
    const colorHex = document.getElementById('colorHex');
    if (colorPicker && colorHex) {
        colorPicker.oninput = function() { colorHex.value = this.value.toUpperCase(); };
        colorHex.oninput = function() { if (/^#[0-9A-F]{6}$/i.test(this.value)) colorPicker.value = this.value; };
    }

    // 關閉通知
    document.getElementById('closeNotification').onclick = () => notification.style.display = 'none';
}

async function checkLoginStatus() {
    try {
        const res = await fetch('/api/user');
        if (!res.ok) throw new Error('Not logged in');
        const user = await res.json();
        handleLoginSuccess(user);
    } catch (err) {
        console.log("訪客模式");
    }
}

function handleLoginSuccess(user) {
    currentUser = user;
    isOwner = user.isOwner;

    // UI 切換：藏起登入區，打開儀表板
    loginSection.style.display = 'none';
    userSection.style.display = 'block';
    roleSection.style.display = 'block';
    if (document.getElementById('benefitsSection')) document.getElementById('benefitsSection').style.display = 'block';

    document.getElementById('userName').innerText = user.username;
    document.getElementById('userStatus').innerText = "🎨 歡迎使用自定義中心";
    
    if (user.avatar) {
        document.querySelector('.user-avatar').innerHTML = 
            `<img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" style="width:100%; border-radius:50%">`;
    }

    if (isOwner && artworkUpload) artworkUpload.style.display = 'block';
}

function showNotification(msg, type = 'success') {
    document.getElementById('notificationText').innerText = msg;
    notification.className = `notification ${type}`;
    notification.style.display = 'flex';
    setTimeout(() => notification.style.display = 'none', 3000);
}
