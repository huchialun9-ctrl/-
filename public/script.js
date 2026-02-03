// 全域變數
let currentUser = null;
let currentGuild = null;
let availableBenefits = [];
let isOwner = false;
let currentArtworkId = null;

// DOM 元素
const loginSection = document.getElementById('loginSection');
const userSection = document.getElementById('userSection');
const benefitsSection = document.getElementById('benefitsSection');
const roleSection = document.getElementById('roleSection');
const artworkSection = document.getElementById('artworkSection');
const loading = document.getElementById('loading');
const notification = document.getElementById('notification');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadBenefits();
    loadArtwork();
    showArtworkSection();
    checkLoginStatus(); // 恢復自動檢查狀態
});

// 設定事件監聽器
function setupEventListeners() {
    // Discord OAuth2 登入按鈕
    const discordBtn = document.getElementById('discordLoginBtn');
    if (discordBtn) discordBtn.addEventListener('click', handleDiscordLogin);
    
    // 手動登入切換
    const manualToggle = document.getElementById('manualLoginToggle');
    if (manualToggle) manualToggle.addEventListener('click', toggleManualLogin);
    
    // 登入表單
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    // 登出按鈕
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // 身份組表單
    const roleForm = document.getElementById('roleForm');
    if (roleForm) roleForm.addEventListener('submit', handleCreateRole);
    
    // 藝術牆表單
    const artworkForm = document.getElementById('artworkForm');
    if (artworkForm) artworkForm.addEventListener('submit', handleArtworkUpload);
    
    // 文件上傳區域
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('artworkFile');
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // 模態框關閉
    const modalClose = document.getElementById('modalClose');
    const modal = document.getElementById('imageModal');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }
    
    // 顏色選擇器同步
    const colorPicker = document.getElementById('roleColor');
    const colorHex = document.getElementById('colorHex');
    if (colorPicker && colorHex) {
        colorPicker.addEventListener('input', function() { colorHex.value = this.value.toUpperCase(); });
        colorHex.addEventListener('input', function() {
            if (isValidHexColor(this.value)) { colorPicker.value = this.value; }
        });
    }
    
    // 預設顏色
    document.querySelectorAll('.color-preset').forEach(button => {
        button.addEventListener('click', function() {
            const color = this.dataset.color;
            if (colorPicker) colorPicker.value = color;
            if (colorHex) colorHex.value = color;
        });
    });

    const closeNotif = document.getElementById('closeNotification');
    if (closeNotif) closeNotif.addEventListener('click', hideNotification);
}

// 檢查登入狀態
async function checkLoginStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'success') {
        showNotification('🎉 登入成功！', 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            const userData = await response.json();
            handleOAuthLogin(userData);
        }
    } catch (error) {
        console.log('尚未登入');
    }
}

function handleDiscordLogin() {
    window.location.href = '/auth/discord';
}

async function handleOAuthLogin(userData) {
    currentUser = userData;
    isOwner = userData.isOwner || false;
    displayUserInfo(currentUser);
    
    if (isOwner) {
        const uploadBox = document.getElementById('artworkUpload');
        if (uploadBox) uploadBox.style.display = 'block';
    }

    // 開放所有功能
    showBenefitsSection();
    showRoleSection();
    loadUserRoles();
}

function displayUserInfo(user) {
    const nameTag = document.getElementById('userName');
    const statusTag = document.getElementById('userStatus');
    if (nameTag) nameTag.textContent = user.username;
    if (statusTag) statusTag.textContent = '🎨 歡迎使用自定義功能！';
    
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar && user.id && user.avatar) {
        userAvatar.innerHTML = `<img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128" style="width: 100%; border-radius: 50%;">`;
    }
    
    if (loginSection) loginSection.style.display = 'none';
    if (userSection) userSection.style.display = 'block';
}

// 藝術牆與福利 (範例模擬)
async function loadBenefits() {
    availableBenefits = [
        { id: 'custom_role', name: '自定義身份組', icon: '🎨', description: '自選名稱與顏色' },
        { id: 'art_wall', name: '藝術牆', icon: '🖼️', description: '展示您的作品' }
    ];
}

function showBenefitsSection() {
    const grid = document.getElementById('benefitsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    availableBenefits.forEach(b => {
        const card = document.createElement('div');
        card.className = 'benefit-card';
        card.innerHTML = `<h3>${b.icon} ${b.name}</h3><p>${b.description}</p>`;
        grid.appendChild(card);
    });
    if (benefitsSection) benefitsSection.style.display = 'block';
}

function showRoleSection() { if (roleSection) roleSection.style.display = 'block'; }
function showArtworkSection() { if (artworkSection) artworkSection.style.display = 'block'; }

async function handleLogout() {
    window.location.href = '/auth/logout';
}

// 通用工具函數
function showLoading(show) { if (loading) loading.style.display = show ? 'flex' : 'none'; }
function showNotification(msg, type) {
    const txt = document.getElementById('notificationText');
    if (txt) txt.textContent = msg;
    if (notification) {
        notification.className = `notification ${type}`;
        notification.style.display = 'flex';
        setTimeout(hideNotification, 3000);
    }
}
function hideNotification() { if (notification) notification.style.display = 'none'; }
function isValidHexColor(hex) { return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex); }

function toggleManualLogin() {
    const form = document.getElementById('loginForm');
    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// 藝術牆佔位函數
async function loadArtwork() { console.log("載入藝術牆..."); }
function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('dragover'); }
function handleDragLeave(e) { e.preventDefault(); e.currentTarget.classList.remove('dragover'); }
function handleDrop(e) { e.preventDefault(); }
function handleFileSelect(e) { console.log("檔案已選擇"); }
function handleArtworkUpload(e) { e.preventDefault(); showNotification('功能開發中', 'info'); }
function closeModal() { if (document.getElementById('imageModal')) document.getElementById('imageModal').style.display = 'none'; }
function loadUserRoles() { console.log("載入身份組..."); }
function handleCreateRole(e) { e.preventDefault(); showNotification('建立功能連接中', 'info'); }
function handleLogin(e) { e.preventDefault(); showNotification('手動登入功能維護中', 'info'); }

window.editRoleColor = () => {};
window.editArtwork = () => {};
window.deleteArtwork = () => {};
