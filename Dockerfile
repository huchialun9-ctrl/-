# 使用官方 Node.js 18 映像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製應用程序代碼
COPY . .

# 創建上傳目錄
RUN mkdir -p uploads

# 設置權限
RUN chown -R node:node /app
USER node

# 暴露端口
EXPOSE 3000

# 設置環境變數
ENV NODE_ENV=production

# 啟動應用程序
CMD ["npm", "start"]