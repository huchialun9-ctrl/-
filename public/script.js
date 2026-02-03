// 全域狀態
let currentUser = null;
let isOwner = false;

// DOM 元素
const loginSection = document.getElementById('loginSection');
const userSection = document.getElementById('userSection');
const benefitsSection = document.getElementById('benefitsSection');
const roleSection = document.getElementById('roleSection');
const artworkUpload = document.getElementById('artworkUpload');
const loading = document.getElementById('loading');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    setupListeners();
    checkLoginStatus();
});

function setupListeners() {
    document.getElementById('discordLoginBtn').onclick = () => window.location.href = '/auth/discord';
    document.getElementById('logoutBtn').onclick = () => window.location.href = '/auth/logout';
    document.getElementById('manualLoginToggle').onclick = () => {
        const form = document.getElementById('loginForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    };
    document.getElementById('closeNotification').onclick = () => {
        document.getElementById('notification').style.display = 'none';
    };
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

async function handleLoginSuccess(user) {
    currentUser = user;
    isOwner = user.isOwner;

    // UI 切換
    loginSection.style.display = 'none';
    userSection.style.display = 'block';
    benefitsSection.style.display = 'block';
    roleSection.style.display = 'block';
    
    document.getElementById('userName').innerText = user.username;
    document.getElementById('userStatus').innerText = "🎨 歡迎使用自定義中心";
    
    if (user.id && user.avatar) {
        document.querySelector('.user-avatar').innerHTML = 
            `<img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" style="width:100%; border-radius:50%">`;
    }

    if (isOwner) artworkUpload.style.display = 'block';
    
    loadBenefits();
}

async function loadBenefits() {
    const res = await fetch('/api/benefits');
    const benefits = await res.json();
    const grid = document.getElementById('benefitsGrid');
    grid.innerHTML = benefits.map(b => `
        <div class="benefit-card">
            <div class="benefit-icon">${b.icon}</div>
            <h3>${b.name}</h3>
            <p>${b.description}</p>
        </div>
    `).join('');
}

function showNotification(msg) {
    const n = document.getElementById('notification');
    document.getElementById('notificationText').innerText = msg;
    n.style.display = 'flex';
    setTimeout(() => n.style.display = 'none', 3000);
}
