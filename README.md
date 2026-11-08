# 恋人 · 卡

一个纯前端的塔罗小游戏：为「恋人」选三张品质牌，翻面看见每一样好背后的代价，把生成的卡存进通讯录。

## 运行

在项目目录执行：

```bash
python3 -m http.server 8000
```

然后打开 <http://localhost:8000>。

ES module 在 `file://` 下会被浏览器的 CORS 策略拦截，所以请不要直接双击 `index.html`。

## 目录

```
index.html          页面骨架
styles.css          塔罗视觉、翻面、发牌与通讯录样式
game.js             主流程、翻面、结果生成（含四维得分）、通讯录、localStorage
share.js            分享卡 Canvas 绘制（1080×1440 PNG 导出，只露总分）
qr.js               最小 QR 编码器（byte 模式、版本 1–3、纠错 M）
data/traits.js      16 张品质卡的身份、四维分数与场景引用（id / sceneId / axes）
data/scenes.js      16 组场景文案（正面场景、代价短标签、背面场景）
data/combos.js      专属组合文案（以及「矛盾体」标记）
data/config.js      全部界面文案、兜底句式、弱维台词、得分锚点、关系与存储键
```

## 文档

- [AGENTS.md](AGENTS.md)：项目约束与记录规范。
- [docs/00-brief.md](docs/00-brief.md)：项目说明与成功标准。
- [docs/01-decisions.md](docs/01-decisions.md)：关键决定与放弃项。
- [docs/02-feature-map.md](docs/02-feature-map.md)：功能地图——界面主线、功能与代码位置对照、改动速查。
- [docs/03-versions/v0.1.md](docs/03-versions/v0.1.md)、[v0.2.md](docs/03-versions/v0.2.md)、[v0.3.md](docs/03-versions/v0.3.md)：版本记录。
- [CHANGELOG.md](CHANGELOG.md)：按时间倒序的一行摘要。

## 改哪里

- **改场景文案 / 加一张卡的场景**：`data/scenes.js`。每张卡的正反面是 `frontScene` / `backScene`，代价短标签是 `costLabel`。
- **加卡 / 改卡 / 调平衡**：`data/traits.js`。卡片只保留 `id`、`name`、`sceneId`、四维分数 `axes`（`-3 ~ 3`）和 `relations`；新增卡要同时在 `scenes.js` 补同名场景条目。
- **加专属组合**：`data/combos.js`。`traits` 不区分选择顺序；如果三张牌同时命中多组，会在命中项里随机取一条，数组顺序不影响结果。
- **改界面文字 / 兜底模板 / 弱维台词 / 得分锚点 / 关系**：`data/config.js`，不需要改 `game.js`。调卡牌数值只改 `traits.js`，但改完必须重跑 560 种组合并同步锚点 51/71。

通讯录存在浏览器 `localStorage` 的 `tarot-lover-cards-v1` 键里，是一个对象数组；没有得分字段的历史卡片仍会正常显示，只是不显示得分。
