# Pixiv Artwork Info Inserter

一个 Tampermonkey 用户脚本，在 Pixiv 作品详情页以**可拖拽悬浮面板**显示作品信息（标题、PID、作者名、UID），默认收起为小按钮不遮挡内容，点击展开查看完整信息，支持点击复制与一键跳转 ExHentai 搜索。

## 功能

- **可拖拽悬浮**：默认收起为 📋 PIXIV 小按钮，点击展开完整面板，可任意拖动定位，位置自动记忆
- **信息展示**：作品名、PID、作者名、作者 UID（自动清理国际化后缀）
- **点击复制**：点击任意信息行复制对应值，底栏一键复制所有信息
- **跳转搜索**：以作者 UID 或作者名在 ExHentai 中搜索
- **SPA 支持**：Pixiv 单页应用路由切换时自动更新面板内容
- **深色模式**：自动适配 Pixiv 的暗色主题（`data-theme="dark"`）
- **Pixiv 风格配色**：柔和蓝色系（#3578C0），不刺眼

## 安装

1. 确保浏览器已安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 打开 [Pixiv Artwork Info Inserter.js](https://raw.githubusercontent.com/guziiiii/tampermonkey-pixiv-artwork-info-inserter/main/Pixiv%20Artwork%20Info%20Inserter.js)
3. Tampermonkey 会自动识别并提示安装

## 使用

访问任意 Pixiv 作品详情页（`https://www.pixiv.net/artworks/*`），页面右上角会出现 📋 PIXIV 按钮：

- **点击按钮**：展开信息面板
- **拖动按钮/面板头部**：移动面板到任意位置
- **点击 ✕**：收起面板回到按钮状态

## 更新日志

详见 [CHANGELOG.md](./CHANGELOG.md)

## 许可

MIT