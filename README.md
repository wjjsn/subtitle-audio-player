# 🎧 Subtitle Audio Player

> 这是一个完全由 AI 生成，仅供个人练习英语听力的项目。

🌐 **在线体验地址**：[https://wjjsn.github.io/subtitle-audio-player/](https://wjjsn.github.io/subtitle-audio-player/)

---

## 🧩 项目简介

这是一个基于 **React + Material UI (MUI)** 开发的纯前端网页应用，  
用于帮助用户练习听力与字幕对照阅读。上传一个包含 `.srt` 字幕文件和音频文件（`.mp3` / `.wav` / `.ogg`）的文件夹或 `.zip` 压缩包，系统会自动识别并生成一个交互式播放器：

- 🎵 根据音频时间自动滚动字幕  
- 🎯 点击任意一句字幕，只播放对应音频片段并自动暂停  
- 🕵️‍♂️ 每个字幕卡片可单独“显示 / 隐藏”文本，适合做听写练习  
- 🗂 支持文件夹或压缩包上传，无需后端服务  

---

## ⚙️ 技术栈

| 技术 | 用途 |
|------|------|
| **React 19 + Vite** | 前端开发框架与构建工具 |
| **Material UI (MUI)** | UI 组件库 |
| **JSZip** | 客户端解压 zip 文件 |
| **pnpm** | 包管理与构建加速工具 |

---

## 🚀 本地运行

```bash
pnpm install
pnpm run dev
