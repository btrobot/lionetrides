# 国内 vs 国外 Docker 部署环境差异分析

> 文档版本: v1.0
> 适用范围: LionetRides 项目 Docker 构建与部署

---

## 一、包管理器镜像 (最直接影响)

| 环节 | 国内 | 国外 | 说明 |
|------|------|------|------|
| **npm/pnpm registry** | 腾讯云/淘宝镜像 (快 5-10x) | 官方 registry.npmjs.org (快) | 国内直连官方源极慢(经常超时)；国外用国内镜像反而绕路 |
| **apt (Debian 包)** | 中科大/清华镜像 | 官方 deb.debian.org | 同上 |
| **Docker Hub pull** | 需要加速器/镜像 | 官方 Hub 直连 | 国内无加速则 `FROM node:...` 可慢 5-10 倍 |

**实测参考**：
- 国内直连 npm 官方源: `pnpm install` 约 180-300s，经常超时
- 国内腾讯云镜像: `pnpm install` 约 15-30s
- 国外官方源: `pnpm install` 约 10-25s
- 国外用国内镜像: 增加 50-100ms 延迟，慢但可用

---

## 二、基础镜像获取

```
国内:
  → 无加速器: 5-10 MB/s, node:24 约 2-3 分钟
  → 有加速器: 10-30 MB/s, 约 30-60 秒

国外 (GitHub Actions / AWS / 海外 VPS):
  → Docker Hub 直连: 20-50 MB/s, 约 20-30 秒
```

---

## 三、外部 API 可达性

| 服务 | 国内 | 国外 | 影响范围 |
|------|------|------|----------|
| Google Fonts / reCAPTCHA | ❌ 被墙，需代理 | ✅ 直连 | 前端资源加载 |
| OpenAI / Stripe | ❌ 需专线或代理 | ✅ 直连 | 支付/AI 功能 |
| 国内 CDN (阿里云OSS/腾讯云COS) | ✅ 极快 | ❌ 跨境延迟高 | 静态资源分发 |
| GitHub (raw.githubusercontent.com) | ⚠️ 间歇性不可达 | ✅ 快 | CI/CD 触发 |
| Cloudflare | ✅ 可用 (免费套餐) | ✅ 快 | CDN / 反向代理 |

---

## 四、Docker 构建缓存策略

```
国内 (自建 CI / 临时构建机):
  → 构建机可能被回收，缓存不持久
  → 建议: 多阶段构建 + 固定缓存层顺序

国外 (GitHub Actions):
  → 支持 Docker Layer Caching (DLC)
  → 支持 Actions Cache 持久化 (~5GB 免费)
  → 构建速度更稳定
```

---

## 五、域名与合规

| 维度 | 国内 | 国外 |
|------|------|------|
| **ICP 备案** | 必须，否则域名无法解析 | 不需要 |
| **SSL 证书** | 通过云厂商或 certbot | 同 |
| **Caddy 反向代理** | 需备案域名 | 无此限制 |
| **数据合规** | 用户数据需境内存储 | GDPR / CCPA 等 |
| **数据库连接** | 跨地域连接延迟高 | 同区域低延迟 |

---

## 六、网络延迟对比

```
国内服务器 → 国内镜像:     <5ms   (同城)
国内服务器 → 国内镜像:     <30ms  (跨省)
国内服务器 → npm 官方源:   200-500ms (跨境，经常丢包)
国内服务器 → GitHub:       100-300ms (间歇性不可达)

国外服务器 → npm 官方源:    <50ms
国外服务器 → 国内镜像:     150-300ms
国外服务器 → GitHub:        <20ms
```

---

## 七、解决方案演进

### v1 — 硬编码 (当前)
```dockerfile
ENV COREPACK_REGISTRY=https://mirrors.cloud.tencent.com/npm
RUN sed -i 's|deb.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list.d/debian.sources
```
**问题**：固定国内镜像，国外部署反而变慢

### v2 — 构建参数化 (推荐过渡方案)
```bash
# 国内构建
docker build --build-arg DEPLOY_REGION=cn ...

# 国外构建
docker build --build-arg DEPLOY_REGION=global ...
```
**优点**：明确可控，CI/CD 中按需传参
**缺点**：需要 CI/CD 知道该传什么值

### v3 — 自动检测 (当前实现)
```dockerfile
# 构建时自动检测环境，智能选择镜像源
RUN detect-mirror.sh
```
**优点**：零配置，自适应
**缺点**：检测增加少量构建时间 (~3s)

---

## 八、推荐部署架构

```
国内用户 ←→ 国内 CDN ←→ 国内服务器 (118.25.141.153)
                              ↓
                          PostgreSQL (本地 / 阿里云RDS)

国外用户 ←→ Cloudflare CDN ←→ 国外服务器 (可选)
                              ↓
                          PostgreSQL (AWS RDS / 自建)

CI/CD:
  GitHub Actions (国外) → 构建镜像 → push 到镜像仓库
                            ↓
  国内服务器 pull 镜像 → 国内部署
  国外服务器 pull 镜像 → 国外部署 (可选)
```

---

## 九、关键决策清单

| 决策项 | 建议 | 理由 |
|--------|------|------|
| 镜像源选择策略 | 自动检测 + 参数化回退 | 零配置，兼容两地 |
| 国内 registry | 腾讯云 npm `mirrors.cloud.tencent.com/npm` | 稳定，速度快 |
| 国内 apt 镜像 | 中科大 `mirrors.ustc.edu.cn` | 国内高校首选，延迟低 |
| Docker Hub 加速 | 国内构建机配置 daemon 镜像 | 需要运维侧配合 |
| 外部 API 代理 | 国内服务器部署代理服务 | 解决 Google/OpenAI 等不可达 |
| 构建机 | 国内自建 / GitHub Actions 双轨 | 按需选择 |