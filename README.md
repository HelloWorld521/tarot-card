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
game.js             主流程、翻面、结果生成、通讯录、localStorage
data/traits.js      12 张品质卡的文案与四维权重
data/combos.js      专属组合文案（以及「矛盾体」标记）
data/config.js      全部界面文案、兜底句式、弱维台词、关系与存储键
```

## 改哪里

- **改文案 / 加卡 / 调平衡**：`data/traits.js`。文案字段是 `name`、`frontScene`、`costLabel`、`backScene`；四维权重在 `axes`（`-3 ~ 3`）。
- **加专属组合**：`data/combos.js`。`traits` 不区分选择顺序；如果三张牌同时命中多组，按数组从上到下的顺序取第一条。
- **改界面文字 / 兜底模板 / 弱维台词 / 关系**：`data/config.js`，不需要改 `game.js`。

通讯录存在浏览器 `localStorage` 的 `tarot-lover-cards-v1` 键里，是一个对象数组。
