# Image production: một container Express phục vụ cả API lẫn giao diện đã build (dist/).
# Dùng bởi Jenkinsfile và docker-compose.prod.yml (xem docs/DEPLOY.md).

# Stage 1: kiểm tra kiểu và build giao diện
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Lỗi TypeScript làm hỏng bản build, nên lỗi được chặn ngay ở đây thay vì lúc chạy
RUN npm run lint && npm run build

# Stage 2: chạy ứng dụng
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
# Máy chủ chạy mã TypeScript trực tiếp qua tsx (giống "npm start"), nên giữ lại tsx
RUN npm ci --omit=dev && npm install --no-save tsx@4.23.15 && npm cache clean --force

COPY server ./server
COPY shared ./shared
COPY database ./database
COPY tsconfig.json ./
COPY --from=build /app/dist ./dist

# Ảnh sản phẩm tải lên từ trang quản trị; được gắn volume để không mất khi cập nhật image
RUN mkdir -p server/uploads && chown -R node:node server/uploads
USER node

EXPOSE 4000
CMD ["node", "node_modules/tsx/dist/cli.mjs", "server/index.ts"]
