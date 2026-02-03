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
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // 模態框
    const modal = document.getElementById('imageModal');
    const modalClose = document.getElementById('modalClose');
    
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    
    // 顏色選擇器同步
    const colorPicker = document.getElementById('roleColor');
    const colorHex = document.getElementById('colorHex');
    
    colorPicker.addEventListener('input', function() {
        colorHex.value = this.value.toUpperCase();
    });
    
    colorHex.addEventListener('input', function() {
        if (isValidHexColor(this.value)) {
            colorPicker.value = this.value;
        }
    });
    
    // 預設顏色按鈕
    document.querySelectorAll('.color-preset').forEach(button => {
        button.addEventListener('click', function() {
            const color = this.dataset.color;
            colorPicker.value = color;
            colorHex.value = color;
        });
    });
    
    // 通知關閉按鈕
    document.getElementById('closeNotification').addEventListener('click', hideNotification);
}

// 檢查登入狀態
async function checkLoginStatus() {
    // 檢查URL參數
    const urlParams = new URLSearchParams(window.location.search);
    const loginStatus = urlParams.get('login');
    const error = urlParams.get('error');
    
    if (loginStatus === 'success') {
        showNotification('🎉 Discord 登入成功！', 'success');
        // 清除URL參數
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
        let errorMessage = '登入失敗';
        switch (error) {
            case 'no_code':
                errorMessage = '授權碼缺失，請重新登入';
                break;
            case 'oauth_failed':
                errorMessage = 'Discord 授權失敗，請稍後再試';
                break;
        }
        showNotification(errorMessage, 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // 檢查是否已登入
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            const userData = await response.json();
            await handleOAuthLogin(userData);
        }
    } catch (error) {
        console.log('用戶未登入或session已過期');
    }
}

// Discord OAuth2 登入
function handleDiscordLogin() {
    window.location.href = '/auth/discord';
}

// 處理OAuth登入成功
async function handleOAuthLogin(userData) {
    currentUser = {
        id: userData.id,
        username: userData.username,
        displayName: userData.username,
        discriminator: userData.discriminator,
        avatar: userData.avatar,
        guilds: userData.guilds
    };
    
    // 檢查是否為站主
    await checkOwnerStatus(userData.id);
    
    // 顯示用戶信息
    displayUserInfo(currentUser);
    
    // 如果用戶只在一個伺服器，自動選擇
    if (userData.guilds && userData.guilds.length === 1) {
        currentGuild = userData.guilds[0].id;
        await checkBoosterStatus();
    } else if (userData.guilds && userData.guilds.length > 1) {
        // 顯示伺服器選擇器
        showGuildSelector(userData.guilds);
    }
}

// 顯示伺服器選擇器
function showGuildSelector(guilds) {
    const userCard = document.querySelector('.user-card');
    
    const guildSelector = document.createElement('div');
    guildSelector.className = 'guild-selector';
    guildSelector.innerHTML = `
        <h4>選擇伺服器</h4>
        <p>請選擇您要使用福利功能的伺服器：</p>
        <div class="guild-list" id="guildList"></div>
    `;
    
    const guildList = guildSelector.querySelector('#guildList');
    
    guilds.forEach(guild => {
        const guildItem = document.createElement('div');
        guildItem.className = 'guild-item';
        guildItem.dataset.guildId = guild.id;
        
        const guildIconUrl = guild.icon ? 
            `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64` : null;
        
        guildItem.innerHTML = `
            <div class="guild-icon">
                ${guildIconUrl ? 
                    `<img src="${guildIconUrl}" alt="${guild.name}" style="width: 100%; height: 100%; border-radius: 50%;">` :
                    guild.name.charAt(0).toUpperCase()
                }
            </div>
            <div class="guild-name">${guild.name}</div>
        `;
        
        guildItem.addEventListener('click', async function() {
            // 移除其他選中狀態
            document.querySelectorAll('.guild-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            // 選中當前項目
            this.classList.add('selected');
            
            currentGuild = guild.id;
            await checkBoosterStatus();
            
            // 隱藏伺服器選擇器
            guildSelector.style.display = 'none';
        });
        
        guildList.appendChild(guildItem);
    });
    
    userCard.appendChild(guildSelector);
}

// 檢查加成狀態
async function checkBoosterStatus() {
    if (!currentUser || !currentGuild) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`/api/guilds/${currentGuild}/members/${currentUser.id}`);
        const data = await response.json();
        
        if (response.ok) {
            currentUser.isBooster = data.isBooster;
            currentUser.roles = data.roles;
            
            // 更新用戶狀態顯示
            document.getElementById('userStatus').textContent = data.isBooster ? 
                '✨ Discord Nitro 加成成員' : '❌ 非加成成員';
            
            if (data.isBooster) {
                showBenefitsSection();
                showRoleSection();
                loadUserRoles();
            } else {
                showNotification('您不是加成成員，無法使用身份組功能', 'warning');
            }
        }
    } catch (error) {
        console.error('檢查加成狀態錯誤:', error);
        showNotification('無法檢查加成狀態，請稍後再試', 'error');
    } finally {
        showLoading(false);
    }
}

// 切換手動登入
function toggleManualLogin() {
    const loginForm = document.getElementById('loginForm');
    const toggleBtn = document.getElementById('manualLoginToggle');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-times"></i> 取消手動輸入';
    } else {
        loginForm.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-keyboard"></i> 手動輸入 ID';
    }
}

// 登出
async function handleLogout() {
    try {
        await fetch('/auth/logout');
        
        // 重置狀態
        currentUser = null;
        currentGuild = null;
        isOwner = false;
        
        // 隱藏所有區域
        userSection.style.display = 'none';
        benefitsSection.style.display = 'none';
        roleSection.style.display = 'none';
        document.getElementById('artworkUpload').style.display = 'none';
        
        // 顯示登入區域
        loginSection.style.display = 'block';
        
        showNotification('已成功登出', 'success');
        
    } catch (error) {
        console.error('登出錯誤:', error);
        showNotification('登出失敗', 'error');
    }
}
async function handleLogin(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value.trim();
    const guildId = document.getElementById('guildId').value.trim();
    
    if (!userId || !guildId) {
        showNotification('請填寫完整的用戶 ID 和伺服器 ID', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`/api/guilds/${guildId}/members/${userId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '獲取用戶資訊失敗');
        }
        
        currentUser = data;
        currentGuild = guildId;
        
        // 檢查是否為站主
        await checkOwnerStatus(userId);
        
        displayUserInfo(data);
        
        if (data.isBooster) {
            showBenefitsSection();
            showRoleSection();
            loadUserRoles();
        } else {
            showNotification('您不是加成成員，無法使用此功能', 'warning');
        }
        
    } catch (error) {
        console.error('登入錯誤:', error);
        showNotification(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 顯示用戶資訊
function displayUserInfo(user) {
    document.getElementById('userName').textContent = user.displayName || user.username;
    document.getElementById('userStatus').textContent = user.isBooster ? 
        '✨ Discord Nitro 加成成員' : '檢查加成狀態中...';
    
    // 顯示用戶頭像
    const userAvatar = document.querySelector('.user-avatar');
    if (user.avatar) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
        userAvatar.innerHTML = `<img src="${avatarUrl}" alt="${user.username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                               <i class="fas fa-user-circle" style="display: none;"></i>`;
    } else {
        userAvatar.innerHTML = '<i class="fas fa-user-circle"></i>';
    }
    
    loginSection.style.display = 'none';
    userSection.style.display = 'block';
}

// 載入福利列表
async function loadBenefits() {
    try {
        const response = await fetch('/api/benefits');
        availableBenefits = await response.json();
    } catch (error) {
        console.error('載入福利列表錯誤:', error);
    }
}

// 顯示福利區域
function showBenefitsSection() {
    const benefitsGrid = document.getElementById('benefitsGrid');
    benefitsGrid.innerHTML = '';
    
    availableBenefits.forEach(benefit => {
        const benefitCard = createBenefitCard(benefit);
        benefitsGrid.appendChild(benefitCard);
    });
    
    benefitsSection.style.display = 'block';
}

// 創建福利卡片
function createBenefitCard(benefit) {
    const card = document.createElement('div');
    card.className = 'benefit-card';
    card.dataset.benefitId = benefit.id;
    
    card.innerHTML = `
        <div class="benefit-header">
            <div class="benefit-icon">${benefit.icon}</div>
            <div class="benefit-title">${benefit.name}</div>
        </div>
        <div class="benefit-description">${benefit.description}</div>
    `;
    
    card.addEventListener('click', function() {
        toggleBenefitSelection(this, benefit);
    });
    
    return card;
}

// 切換福利選擇
function toggleBenefitSelection(card, benefit) {
    card.classList.toggle('selected');
    
    if (card.classList.contains('selected')) {
        showNotification(`已選擇福利: ${benefit.name}`, 'success');
        
        // 如果選擇的是自定義身份組，顯示身份組區域
        if (benefit.id === 'custom_role') {
            showRoleSection();
        }
    } else {
        showNotification(`已取消選擇: ${benefit.name}`, 'warning');
    }
}

// 顯示身份組區域
function showRoleSection() {
    roleSection.style.display = 'block';
}

// 處理創建身份組
async function handleCreateRole(e) {
    e.preventDefault();
    
    const roleName = document.getElementById('roleName').value.trim();
    const roleColor = document.getElementById('roleColor').value;
    
    if (!roleName) {
        showNotification('請輸入身份組名稱', 'error');
        return;
    }
    
    if (roleName.length > 32) {
        showNotification('身份組名稱不能超過 32 個字符', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`/api/guilds/${currentGuild}/roles/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id,
                roleName: roleName,
                color: roleColor,
                benefits: getSelectedBenefits()
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '創建身份組失敗');
        }
        
        showNotification(`成功創建身份組: ${data.role.name}`, 'success');
        
        // 重置表單
        document.getElementById('roleForm').reset();
        document.getElementById('roleColor').value = '#5865F2';
        document.getElementById('colorHex').value = '#5865F2';
        
        // 重新載入用戶身份組
        loadUserRoles();
        
    } catch (error) {
        console.error('創建身份組錯誤:', error);
        showNotification(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 載入用戶身份組
function loadUserRoles() {
    if (!currentUser || !currentUser.roles) return;
    
    const rolesList = document.getElementById('rolesList');
    rolesList.innerHTML = '';
    
    // 過濾掉 @everyone 身份組
    const userRoles = currentUser.roles.filter(role => role.name !== '@everyone');
    
    if (userRoles.length === 0) {
        rolesList.innerHTML = '<p style="text-align: center; color: #666;">您還沒有任何自定義身份組</p>';
        return;
    }
    
    userRoles.forEach(role => {
        const roleItem = createRoleItem(role);
        rolesList.appendChild(roleItem);
    });
}

// 創建身份組項目
function createRoleItem(role) {
    const item = document.createElement('div');
    item.className = 'role-item';
    item.style.borderLeftColor = role.color || '#99AAB5';
    
    item.innerHTML = `
        <div class="role-info">
            <div class="role-color-preview" style="background-color: ${role.color || '#99AAB5'}"></div>
            <div class="role-name">${role.name}</div>
        </div>
        <div class="role-actions">
            <button class="btn btn-secondary btn-small" onclick="editRoleColor('${role.id}', '${role.name}')">
                <i class="fas fa-palette"></i> 修改顏色
            </button>
        </div>
    `;
    
    return item;
}

// 編輯身份組顏色
async function editRoleColor(roleId, roleName) {
    const newColor = prompt(`請輸入 ${roleName} 的新顏色代碼 (例如: #FF5733):`, '#5865F2');
    
    if (!newColor) return;
    
    if (!isValidHexColor(newColor)) {
        showNotification('請輸入有效的顏色代碼 (例如: #FF5733)', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`/api/guilds/${currentGuild}/roles/${roleId}/color`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id,
                color: newColor
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '更新顏色失敗');
        }
        
        showNotification(`成功更新 ${roleName} 的顏色`, 'success');
        
        // 重新載入用戶資訊以更新身份組
        const userResponse = await fetch(`/api/guilds/${currentGuild}/members/${currentUser.id}`);
        const userData = await userResponse.json();
        currentUser = userData;
        loadUserRoles();
        
    } catch (error) {
        console.error('更新身份組顏色錯誤:', error);
        showNotification(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 獲取選中的福利
function getSelectedBenefits() {
    const selectedCards = document.querySelectorAll('.benefit-card.selected');
    return Array.from(selectedCards).map(card => card.dataset.benefitId);
}

// 驗證十六進制顏色代碼
function isValidHexColor(hex) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

// 顯示/隱藏載入動畫
function showLoading(show) {
    loading.style.display = show ? 'flex' : 'none';
}

// 顯示通知
function showNotification(message, type = 'success') {
    const notificationText = document.getElementById('notificationText');
    notificationText.textContent = message;
    
    notification.className = `notification ${type}`;
    notification.style.display = 'flex';
    
    // 3秒後自動隱藏
    setTimeout(hideNotification, 3000);
}

// 隱藏通知
function hideNotification() {
    notification.style.display = 'none';
}

// 全域函數 (供 HTML 調用)
window.editRoleColor = editRoleColor;// 藝術牆相關函數


// 檢查用戶是否為站主
async function checkOwnerStatus(userId) {
    try {
        const response = await fetch(`/api/check-owner/${userId}`);
        const data = await response.json();
        isOwner = data.isOwner;
        
        if (isOwner) {
            document.getElementById('artworkUpload').style.display = 'block';
            showNotification('👑 歡迎站主！您可以管理藝術牆', 'success');
        }
    } catch (error) {
        console.error('檢查站主狀態錯誤:', error);
    }
}

// 顯示藝術牆區域
function showArtworkSection() {
    artworkSection.style.display = 'block';
}

// 載入藝術作品
async function loadArtwork() {
    try {
        const response = await fetch('/api/artwork');
        const artworks = await response.json();
        
        displayArtwork(artworks);
    } catch (error) {
        console.error('載入藝術作品錯誤:', error);
    }
}

// 顯示藝術作品
function displayArtwork(artworks) {
    const galleryGrid = document.getElementById('galleryGrid');
    const emptyGallery = document.getElementById('emptyGallery');
    
    if (artworks.length === 0) {
        galleryGrid.style.display = 'none';
        emptyGallery.style.display = 'block';
        return;
    }
    
    galleryGrid.style.display = 'grid';
    emptyGallery.style.display = 'none';
    galleryGrid.innerHTML = '';
    
    artworks.forEach(artwork => {
        const artworkItem = createArtworkItem(artwork);
        galleryGrid.appendChild(artworkItem);
    });
}

// 創建藝術作品項目
function createArtworkItem(artwork) {
    const item = document.createElement('div');
    item.className = 'artwork-item';
    item.dataset.artworkId = artwork.id;
    
    const uploadDate = new Date(artwork.uploadedAt).toLocaleDateString('zh-TW');
    const featuredUserHtml = artwork.featuredUser ? 
        `<span class="featured-user">@${artwork.featuredUser}</span>` : '';
    
    item.innerHTML = `
        <img src="${artwork.url}" alt="${artwork.title}" class="artwork-image" loading="lazy">
        <div class="artwork-info">
            <div class="artwork-title">${artwork.title}</div>
            <div class="artwork-description">${artwork.description}</div>
            <div class="artwork-meta">
                ${featuredUserHtml}
                <span class="artwork-date">${uploadDate}</span>
            </div>
        </div>
    `;
    
    item.addEventListener('click', () => openModal(artwork));
    
    return item;
}

// 文件拖拽處理
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect({ target: { files } });
    }
}

// 文件選擇處理
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 驗證文件類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('請選擇有效的圖片文件 (JPG, PNG, GIF, WebP)', 'error');
        return;
    }
    
    // 驗證文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('文件大小不能超過 10MB', 'error');
        return;
    }
    
    // 顯示預覽
    showFilePreview(file);
    
    // 顯示詳細信息表單
    document.querySelector('.artwork-details').classList.add('show');
    document.querySelector('#artworkForm button[type="submit"]').disabled = false;
}

// 顯示文件預覽
function showFilePreview(file) {
    const uploadArea = document.getElementById('uploadArea');
    
    // 創建預覽
    const reader = new FileReader();
    reader.onload = function(e) {
        uploadArea.innerHTML = `
            <div class="file-preview">
                <img src="${e.target.result}" alt="預覽" class="preview-image">
                <div class="preview-info">
                    <strong>${file.name}</strong><br>
                    大小: ${(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

// 處理藝術作品上傳
async function handleArtworkUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('artworkFile');
    const title = document.getElementById('artworkTitle').value.trim();
    const description = document.getElementById('artworkDescription').value.trim();
    const featuredUser = document.getElementById('featuredUser').value.trim();
    
    if (!fileInput.files[0]) {
        showNotification('請選擇要上傳的文件', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('artwork', fileInput.files[0]);
    formData.append('title', title || '無標題');
    formData.append('description', description);
    formData.append('featuredUser', featuredUser);
    formData.append('userId', currentUser.id);
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/artwork/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '上傳失敗');
        }
        
        showNotification('🎨 作品上傳成功！', 'success');
        
        // 重置表單
        resetArtworkForm();
        
        // 重新載入藝術作品
        loadArtwork();
        
    } catch (error) {
        console.error('上傳藝術作品錯誤:', error);
        showNotification(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 重置藝術作品表單
function resetArtworkForm() {
    document.getElementById('artworkForm').reset();
    document.querySelector('.artwork-details').classList.remove('show');
    document.querySelector('#artworkForm button[type="submit"]').disabled = true;
    
    // 重置上傳區域
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
        <div class="upload-icon">
            <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <p>拖拽文件到此處或點擊選擇</p>
        <p class="upload-hint">支持 JPG, PNG, GIF, WebP (最大 10MB)</p>
        <input type="file" id="artworkFile" accept="image/*" style="display: none;">
    `;
    
    // 重新綁定事件
    const fileInput = document.getElementById('artworkFile');
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
}

// 打開模態框
function openModal(artwork) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalUser = document.getElementById('modalUser');
    const modalDate = document.getElementById('modalDate');
    const modalActions = document.getElementById('modalActions');
    
    modalImage.src = artwork.url;
    modalTitle.textContent = artwork.title;
    modalDescription.textContent = artwork.description || '沒有描述';
    
    if (artwork.featuredUser) {
        modalUser.innerHTML = `<span class="featured-user">@${artwork.featuredUser}</span>`;
    } else {
        modalUser.textContent = '';
    }
    
    const uploadDate = new Date(artwork.uploadedAt).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    modalDate.textContent = uploadDate;
    
    // 只有站主可以看到編輯和刪除按鈕
    if (isOwner) {
        modalActions.style.display = 'flex';
        currentArtworkId = artwork.id;
    } else {
        modalActions.style.display = 'none';
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 關閉模態框
function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentArtworkId = null;
}

// 編輯藝術作品
function editArtwork() {
    if (!currentArtworkId) return;
    
    const newTitle = prompt('請輸入新標題:');
    if (newTitle === null) return;
    
    const newDescription = prompt('請輸入新描述:');
    if (newDescription === null) return;
    
    updateArtwork(currentArtworkId, newTitle.trim(), newDescription.trim());
}

// 更新藝術作品
async function updateArtwork(artworkId, title, description) {
    showLoading(true);
    
    try {
        const response = await fetch(`/api/artwork/${artworkId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id,
                title,
                description
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '更新失敗');
        }
        
        showNotification('✏️ 作品信息更新成功！', 'success');
        closeModal();
        loadArtwork();
        
    } catch (error) {
        console.error('更新藝術作品錯誤:', error);
        showNotification(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 刪除藝術作品
function deleteArtwork() {
    if (!currentArtworkId) return;
    
    if (!confirm('確定要刪除這個作品嗎？此操作無法撤銷。')) {
        return;
    }
    
    performDeleteArtwork(currentArtworkId);
}

// 執行刪除藝術作品
async function performDeleteArtwork(artworkId) {
    showLoading(true);
    
    try {
        const response = await fetch(`/api/artwork/${artworkId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '刪除失敗');
        }
        
        showNotification('🗑️ 作品已刪除', 'success');
        closeModal();
        loadArtwork();
        
    } catch (error) {
        console.error('刪除藝術作品錯誤:', error);
        showNotification(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 全域函數 (供 HTML 調用)
window.editRoleColor = editRoleColor;
window.editArtwork = editArtwork;
window.deleteArtwork = deleteArtwork;