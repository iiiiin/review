# 1) 빌드 스테이지: pnpm + Vite
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .

# 🔥 Jenkins에서 설정한 환경변수를 빌드 시점에 받아옵니다
ARG VITE_API_BASE_URL

# 🔥 ARG로 받은 값을 ENV로 설정 (Vite 빌드 과정에서 사용됨)
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm run build

# 2) 배포 스테이지: Nginx
FROM nginx:1.25-alpine

RUN rm -f /etc/nginx/conf.d/*.conf

ARG ENV=test
COPY docker/nginx/${ENV}.conf /etc/nginx/conf.d/default.conf

# 2-3) 정적 파일 복사
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx","-g","daemon off;"]
