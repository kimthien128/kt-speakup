FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Build ứng dụng thành các tệp tĩnh trong thư mục dist
RUN npm run build

# Cài đặt serve để phục vụ các tệp tĩnh
RUN npm install -g serve

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]