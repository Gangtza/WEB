# 使用官方的 Node.js 20 Alpine 作為基礎映像 (Alpine版本體積較小)
FROM node:20-alpine

# 在容器中設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
# 這一步是為了利用 Docker 的快取機制，如果這些檔案沒有變更，就不會重新安裝依賴
COPY package*.json ./

# 安裝專案依賴
RUN npm install

# 將專案的所有檔案複製到工作目錄
COPY . .

# 建立上傳資料夾，並確保 node 使用者有權限寫入
# 雖然伺服器也會嘗試建立，但在 Dockerfile 中明確建立是個好習慣
RUN mkdir -p upload && chown -R node:node upload

# 向 Docker 聲明容器在執行時會監聽的網路連接埠
EXPOSE 3000

# 定義容器啟動時要執行的預設指令
CMD [ "node", "server.js" ]
