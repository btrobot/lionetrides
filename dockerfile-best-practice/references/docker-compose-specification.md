# docker-compose 编排规范

## 基本结构

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        DEPLOY_REGION: auto
    image: ${IMAGE_NAME:-myapp}:latest
    container_name: ${CONTAINER_NAME:-myapp}
    ports:
      - "${APP_PORT:-5000}:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@localhost:5433/myapp
    env_file:
      - .env.local
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped
    networks:
      - app-net

networks:
  app-net:
    driver: bridge
```

## 规范要点

1. **使用环境变量**：端口、镜像名等通过 `${VAR:-default}` 引用
2. **healthcheck**：与 Dockerfile 中保持一致
3. **restart 策略**：生产环境使用 `unless-stopped`
4. **env_file**：敏感信息通过 .env 文件传入
5. **网络隔离**：使用自定义 bridge 网络
6. **容器名**：使用 `${CONTAINER_NAME}` 变量，便于多实例

## 含外部数据库

```yaml
services:
  app:
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

## 含反向代理（Caddy/Traefik）

```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - app

volumes:
  caddy_data:
```
