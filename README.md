# Personalized Deep Research

[English](README.md) | [中文](README_zh.md)

This repository is a fork of [deep-research-web-ui](https://github.com/AnotiaWang/deep-research-web-ui), with Mem0's personalized memories and several other improvements.

Features:

- 🔍 **Personalized**: Uses Mem0's personalized memories to enhance AI-driven online exploration with personalized memories, ensuring the research process aligns with your unique insights and experiences.
- 🕙 **Realtime feedback**: Stream AI responses and reflect on the UI in real-time
- 🌳 **Search visualization**: Shows the research process using a tree structure. Supports searching in different languages
- 📄 **Export as PDF**: Export the final research report as Markdown / PDF
- 🐳 **Docker support**: Deploy in your environment in one-line command
- 🔒 **Secure**: Everything (config, API requests, ...) stays in your browser locally

Please give a 🌟 Star if you like this project!

## How to use

Live demo: <a href="https://deep-research.mem0.ai" target="_blank">https://deep-research.mem0.ai</a>

### Self hosted

One-click deploy with [EdgeOne Pages](https://edgeone.ai/products/pages):

[![Deploy with EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?from=github&template=https://github.com/mem0ai/personalized-deep-research&from=github)

Use pre-built Docker image:

```bash
docker run -p 3000:3000 --name personalized-deep-research -d mem0ai/personalized-deep-research:latest
```

Use self-built Docker image:

```
git clone https://github.com/mem0ai/personalized-deep-research
cd personalized-deep-research
docker build -t personalized-deep-research .
docker run -p 3000:3000 --name personalized-deep-research -d personalized-deep-research
```

## Developing

### Setup

Make sure to install dependencies:

```bash
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

If you want to deploy a SSR application:

```bash
pnpm build
```

If you want to deploy a static, SSG application:

```bash
pnpm generate
```

Locally preview production build:

```bash
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## License

MIT
