# 个人作品集

四个独立的前端项目统一构建为一个静态网站：

- `/`：作品集主页（`home/`）
- `/light/`：光的颜色实验室（`light/`）
- `/word-game/`：汉字拼拼乐（`word-game/`）
- `/lunar-theater/`：朔望 · 日地月教学剧场（`lunar-theater/`）

## 本地运行

需要 Node.js。首次运行先安装依赖：

```sh
npm run install:projects
```

运行完整网站：`npm run dev`，打开终端输出的本地地址。只开发主页时运行 `npm run dev:home`；各作品可分别运行 `npm run dev --prefix light`、`npm run dev --prefix word-game` 和 `npm run dev --prefix lunar-theater`。

## 构建与部署

```sh
npm run build
```

将根目录的 `dist/` 作为静态网站发布目录。Cloudflare Pages 中设置构建命令为 `npm run install:projects && npm run build`，输出目录为 `dist`，Node.js 使用 22。四个项目必须在域名根路径部署，主页链接及三个作品的 Vite `base` 都按根路径配置。
