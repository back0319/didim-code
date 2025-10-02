# Frontend Dockerfile
FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# Next.js 빌드
RUN npm run build

# 포트 노출
EXPOSE 3000

# 환경 변수
ENV NODE_ENV=production

# 앱 실행
CMD ["npm", "start"]