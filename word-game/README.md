# 汉字拼拼乐

面向低龄识字学习的互动游戏原型。当前采用 Vite、TypeScript、PixiJS 和 HTML/CSS UI：

- PixiJS 负责场景背景、层级、粒子和动画。
- HTML/CSS 负责题目、拼字区、地图、反馈弹层和无障碍语义。
- `src/data` 只保存题库和关卡配置。
- `src/scenes` 只负责场景表现，避免答题逻辑与画面耦合。

## 开发

```bash
npm install
npm run dev
```

生产检查和构建：

```bash
npm run check
npm run build
```

## 目录

```text
src/
  data/levels.ts       题库与关卡配置
  scenes/              PixiJS 场景渲染
  main.ts              应用状态与交互编排
  style.css            DOM UI 样式
  types.ts             领域类型
legacy.html            迁移前的单文件版本
```

## 后续迭代顺序

1. 用统一风格的插画纹理替换程序化图形和 Emoji。
2. 将场景动画抽成可取消、可暂停的时间轴。
3. 增加答题记录、学习进度和本地持久化。
4. 为触屏拖拽、键盘操作和读屏补充测试。
5. 为每个关卡增加独立的完成动画和音效配置。
