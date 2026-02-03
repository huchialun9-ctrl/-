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
    checkLoginStatus();
});

// 設定事件監聽器
function setupEventListeners() {
    // Discord OAuth2 登入按鈕
    document.getElementById('discordLoginBtn').addEventListener('click', handleDiscordLogin);
    
    // 手動登入切換
    document.getElementById('manualLoginToggle').addEventListener('click', toggleManualLogin);
    
    // 登入表單
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // 登出按鈕
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // 身份組表單
    document.getElementById('roleForm').addEventListener('submit', handleCreateRole);
    
    // 藝術牆表單
    document.getElementById('artworkForm').addEventListener('submit', handleArtworkUpload);
    
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
    
    // 模態框
    const modal = document.getElementById('imageModal');
    const modalClose = document.getElementById('modalClose');
    
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
    }
    
    // 顏色選擇器同步
    const colorPicker = document.getElementById('roleColor');
    const colorHex = document.getElementById('colorHex');
    
    if (colorPicker && colorHex) {
        colorPicker.addEventListener('input', function() {
            colorHex.value = this.value.toUpperCase();
        });
        colorHex.addEventListener('input', function() {
            if (isValidHexColor(this.value)) {
                colorPicker.value = this.value;
            }
        });
    }
    
    // 預設顏色按鈕
    document.querySelectorAll('.color-preset').forEach(button => {
        button.addEventListener('click', function() {
            const color = this.dataset.color;
            if (colorPicker) colorPicker.value = color;
            if (colorHex) colorHex.value = color;
        });
    });
    
    // 通知關閉按鈕
    const closeNotif = document.getElementById('closeNotification');
    if (closeNotif) closeNotif.addEventListener('click', hideNotification);
}

// 檢查登入狀態
async function checkLoginStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const loginStatus = urlParams.get('login');
    const error = urlParams.get('error');
    
    if (loginStatus === 'success') {
        showNotification('🎉 Discord 登入成功！', 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
        showNotification('登入失敗: ' + error, 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            const userData = await response.json();
            handleOAuthLogin(userData);
        }
    } catch (error) {
        console.log('用戶未登入');
    }
}

// Discord OAuth2 登入
function handleDiscordLogin() {
    window.location.href = '/auth/discord';
}

// 處理OAuth登入成功
async function handleOAuthLogin(userData) {
    currentUser = userData;
    isOwner = userData.isOwner || false;
    
    displayUserInfo(currentUser);
    
    if (isOwner) {
        document.getElementById('artworkUpload').style.display = 'block';
    }

    // 這裡可以根據 userData 判斷加成狀態，目前先預設顯示
    showBenefitsSection();
    showRoleSection();
    loadUserRoles();
}

// 顯示用戶資訊
function displayUserInfo(user) {
    if (userNameDisplay) userNameDisplay.textContent = user.username;
    loginSection.style.display = 'none';
    userSection.style.display = 'block';
}

// 載入福利列表 (範例資料)
async function loadBenefits() {
    availableBenefits = [
        { id: 'custom_role', name: '自定義身份組', icon: '🎨', description: '獲得獨一無二的顏色與名稱' },
        { id: 'art_wall', name: '藝術牆權限', icon: '🖼️', description: '在伺服器首頁展示您的創作' }
    ];
}

// 顯示福利區域
function showBenefitsSection() {
    const benefitsGrid = document.getElementById('benefitsGrid');
    if (!benefitsGrid) return;
    benefitsGrid.innerHTML = '';
    
    availableBenefits.forEach(benefit => {
        const card = document.createElement('div');
        card.className = 'benefit-card';
        card.innerHTML = `<h4>${benefit.icon} ${benefit.name}</h4><p>${benefit.description}</p>`;
        benefitsGrid.appendChild(card);
    });
    benefitsSection.style.display = 'block';
}

function showRoleSection() { roleSection.style.display = 'block'; }
function showArtworkSection() { artworkSection.style.display = 'block'; }

// 登出
async function handleLogout() {
    window.location.href = '/auth/logout';
}

// 通用工具
function showLoading(show) { if (loading) loading.style.display = show ? 'flex' : 'none'; }
function showNotification(msg, type) {
    const text = document.getElementById('notificationText');
    if (text) text.textContent = msg;
    notification.className = `notification ${type}`;
    notification.style.display = 'flex';
    setTimeout(hideNotification, 3000);
}
function hideNotification() { notification.style.display = 'none'; }
function isValidHexColor(hex) { return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex); }
function toggleManualLogin() {
    const form = document.getElementById('loginForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// 藝術牆 (此部分需配合後端資料庫，目前設為空載入)
async function loadArtwork() {
    const grid = document.getElementById('galleryGrid');
    if (grid) grid.innerHTML = '<p>作品載入中...</p>';
}

// 其餘 handle 函數可根據實際 API 需求繼續擴充...
