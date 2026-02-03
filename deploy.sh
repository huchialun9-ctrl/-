#!/bin/bash

echo "🚀 Discord 加成成員福利中心 - 部署腳本"
echo "=================================="

# 檢查是否安裝了必要的工具
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 未安裝，請先安裝 $1"
        exit 1
    fi
}

# 選擇部署平台
echo "請選擇部署平台："
echo "1) Vercel (推薦)"
echo "2) Netlify"
echo "3) Railway"
echo "4) Docker 本地"
echo "5) 取消"

read -p "請輸入選項 (1-5): " choice

case $choice in
    1)
        echo "🔵 準備部署到 Vercel..."
        check_command "vercel"
        
        echo "正在部署到 Vercel..."
        vercel --prod
        
        echo "✅ 部署完成！"
        echo "📝 請記得在 Vercel Dashboard 中設置環境變數："
        echo "   - DISCORD_BOT_TOKEN"
        echo "   - DISCORD_GUILD_ID"
        echo "   - OWNER_USER_ID"
        echo "   - SESSION_SECRET"
        echo "   - DISCORD_REDIRECT_URI"
        ;;
        
    2)
        echo "🟠 準備部署到 Netlify..."
        check_command "netlify"
        
        echo "正在部署到 Netlify..."
        netlify deploy --prod
        
        echo "✅ 部署完成！"
        echo "📝 請記得在 Netlify Dashboard 中設置環境變數"
        ;;
        
    3)
        echo "🟣 準備部署到 Railway..."
        echo "請前往 https://railway.app 手動部署"
        echo "1. 連接 GitHub 倉庫"
        echo "2. 設置環境變數"
        echo "3. 部署"
        ;;
        
    4)
        echo "🐳 準備 Docker 本地部署..."
        check_command "docker"
        
        echo "構建 Docker 映像..."
        docker build -t discord-boost-benefits .
        
        echo "啟動容器..."
        docker run -d -p 3000:3000 --env-file .env --name discord-app discord-boost-benefits
        
        echo "✅ Docker 容器已啟動！"
        echo "🌐 訪問 http://localhost:3000"
        ;;
        
    5)
        echo "❌ 取消部署"
        exit 0
        ;;
        
    *)
        echo "❌ 無效選項"
        exit 1
        ;;
esac

echo ""
echo "🎉 部署完成！"
echo "📋 後續步驟："
echo "1. 在 Discord Developer Portal 設置重定向 URI"
echo "2. 測試 OAuth2 登入功能"
echo "3. 測試藝術牆上傳功能"
echo "4. 邀請 Bot 到你的伺服器"