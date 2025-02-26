# 个性化深度研究

[English](README.md) | [中文](README_zh.md)

这个仓库是 [deep-research-web-ui](https://github.com/AnotiaWang/deep-research-web-ui) 的一个分支，集成了 Mem0 的个性化记忆以及其他一些改进。

功能：

- 🔍 **个性化**：利用 Mem0 的个性化记忆来增强 AI 驱动的在线探索过程，确保研究过程符合您的独特见解和经验。
- 🕙 **实时反馈**：实时流式传输 AI 响应，并在 UI 中反映结果。
- 🌳 **搜索可视化**：通过树状结构展示研究过程，支持多语言搜索。
- 📄 **导出为 PDF**：将最终研究报告导出为 Markdown 或 PDF 格式。
- 🐳 **Docker 支持**：通过一条命令在您的环境中部署。
- 🔒 **安全**：所有配置、API 请求等都保留在本地浏览器中。

如果您喜欢这个项目，请给它一个 🌟 星标！

## 如何使用

在线演示：<a href="https://deep-research.mem0.ai" target="_blank">https://deep-research.mem0.ai</a>

### 自托管

一键部署到 [EdgeOne Pages](https://edgeone.ai/products/pages):

[![Deploy with EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?from=github&template=https://github.com/mem0ai/personalized-deep-research&from=github)

使用预构建的 Docker 镜像：

```bash
docker run -p 3000:3000 --name personalized-deep-research -d mem0ai/personalized-deep-research:latest
```

使用自构建的 Docker 镜像：

```
git clone https://github.com/mem0ai/personalized-deep-research
cd personalized-deep-research
docker build -t personalized-deep-research .
docker run -p 3000:3000 --name personalized-deep-research -d personalized-deep-research
```

## 开发

### 设置

确保安装依赖项：

```bash
pnpm install
```

## 开发服务器

在 `http://localhost:3000` 启动开发服务器：

```bash
pnpm dev
```

## 生产

为生产环境构建应用：

如果您想部署 SSR 应用：

```bash
pnpm build
```

如果您想部署静态的 SSG 应用：

```bash
pnpm generate
```

本地预览生产构建：

```bash
pnpm preview
```

更多部署信息，请查看 [部署文档](https://nuxt.com/docs/getting-started/deployment)。

## 许可证

MIT
