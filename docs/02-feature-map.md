# 02 · 功能地图

这份文档回答两个问题：玩家从打开页面到离开，能看见哪些界面、点哪里会到哪；以及某个功能到底写在哪个文件、哪个函数、哪几行。

位置引用统一写成 `文件:起始行-结束行`，行号基于 2026-11-08 当前工作树（v0.3）。本文不解释逐行逻辑，只做功能与代码位置的对应。

## 一、总览

### 1.1 文件分工

| 文件 | 管什么 | 关键入口 | 依赖 |
|---|---|---|---|
| `index.html` | 页面骨架：顶栏、7 个 `section.screen`、详情浮层、分享浮层、toast。元素里基本没有文字，文案由 `applyCopy` 注入。 | `index.html:19-136` 屏幕区；`index.html:139-142` 详情浮层；`index.html:144-157` 分享浮层；`index.html:161` 加载 `game.js` | `styles.css`、`game.js` |
| `styles.css` | 全部视觉：塔罗配色、发牌入场、3D 翻面、通讯录叠牌、浮层、移动端与桌面端断点。 | `styles.css:124-135` 屏幕显隐；`styles.css:683-777` 翻面；`styles.css:1029-1176` 叠牌；`styles.css:1491-1575` 分享浮层 | 无 |
| `game.js` | 状态机、建卡主流程、结果计算（组合 / 弱维 / 四维得分）、通讯录、`localStorage`、事件绑定、轻音效、toast。 | `game.js:868-873` 启动段 | `data/config.js`、`data/traits.js`、`data/scenes.js`、`data/combos.js`、`share.js` |
| `share.js` | Canvas 2D 绘制 1080×1440 分享卡，导出 PNG dataURL；只画正面信息与总分。 | `share.js:178-238` `createShareCard` | `data/config.js`、`qr.js` |
| `qr.js` | 自写最小二维码编码器：byte 模式、版本 1–3、纠错等级 M。 | `qr.js:230-324` `qrMatrix` | 无 |
| `data/config.js` | 全部界面文案、关系列表、四维定义、得分锚点、弱维句、兜底模板、存储键、二维码地址。 | `config.js:4-149` | 无 |
| `data/traits.js` | 16 张品质卡的身份、四维分数与场景引用（`id` / `name` / `sceneId` / `axes`）。 | `traits.js:9-121` | 无 |
| `data/scenes.js` | 16 组场景文案：正面场景、代价短标签、背面场景；按场景 id 索引。 | `scenes.js:6-85` | 无 |
| `data/combos.js` | 24 组专属组合文案与「矛盾体」标记；数组顺序不影响结果。 | `combos.js:6-107` | 无 |

依赖方向：

```
index.html
  └─ <script type="module"> game.js
       ├─ data/config.js
       ├─ data/traits.js
       ├─ data/scenes.js
       ├─ data/combos.js
       └─ share.js
            ├─ data/config.js
            └─ qr.js
```

所有数据都是静态 ES module，没有 `fetch`、没有 JSON 文件、没有构建产物。运行时唯一的外部状态是浏览器 `localStorage`。

### 1.2 无构建如何启动

`index.html:161` 用 `<script type="module" src="game.js">` 直接加载模块。浏览器要求模块走 HTTP，所以必须起本地静态服务：

```bash
cd /Users/hujiayu/Code/tarot-card
python3 -m http.server 8000
```

打开 `http://localhost:8000`。直接双击 `index.html` 会因 `file://` 的 CORS 限制而加载失败。部署时同样是把这 9 个文件原样放到静态目录（当前是 GitHub Pages 的 `/tarot-card/` 子路径）。

启动顺序在 `game.js:868-873`：`applyCopy()` → `buildRelations()` → `buildTraitGrid()` → `bindEvents()` → `updateChrome()` → `showScreen('start')`。前三步把文案和两个固定网格写进 DOM，后三步接事件并显示起始页。

### 1.3 用户首次访问的功能主线

```
首次加载
  └─ start 起始页
       │ 点「开始」（先 resetRound，再进关系页）
       ▼
     relation 关系页 ── 只有「恋人」可选，选中后「继续」才亮
       │ 点「继续」
       ▼
     name 名字页 ── 输入非空名字（≤12 字），按钮才亮
       │ 点「继续」或按 Enter
       ▼
     select 选牌页 ── 16 张正面牌，点选/再点取消
       │ 选满 3 张后点「翻面」
       ▼
     reveal 翻面页 ── 三张自动逐张翻开，全部翻完才出现「看结果」
       │ 点「看结果」
       ▼
     result 结果页
       ├─ 点「存入通讯录」 → 存卡并留在结果页（按钮变为「已存入 · 查看通讯录」，再点进通讯录）
       ├─ 点「生成分享卡」 → share-overlay 分享浮层
       └─ 点「重新建一张」 → 回到 relation 关系页
```

通讯录之后：

```
contacts 通讯录
  ├─ 无卡：空状态 +「去抽第一张」 → relation
  ├─ 有卡：点焦点卡 → detail 详情浮层
  │         ├─「收起」/ 点背景 / Esc → 回通讯录
  │         └─「删除这张卡」点两次 → 删除并留在通讯录
  ├─ 多卡时「上一张 / 下一张」循环切换
  └─ 顶栏「返回」→ start；顶栏品牌「恋人 · 卡」→ start
```

结果页与浮层之外，任意界面右上角都有「通讯录」入口；已经保存过结果时，结果页的「已存入 · 查看通讯录」按钮本身就是通讯录入口。

界面与状态一览：

| 用户看到 | DOM 锚点 | 进入方式 | 离开方式 |
|---|---|---|---|
| 起始页 | `#screen-start` / `data-screen="start"` | 首次加载；品牌点击；通讯录「返回」 | 点「开始」 |
| 关系页 | `#screen-relation` | 点「开始」；点「重新建一张」；空通讯录 CTA | 选中关系后点「继续」 |
| 名字页 | `#screen-name` | 关系页点「继续」 | 名字非空后点「继续」/ Enter |
| 选牌页 | `#screen-select` | 名字页点「继续」/ Enter | 选满 3 张后点「翻面」 |
| 翻面页 | `#screen-reveal` | 选牌页点「翻面」 | 翻完点「看结果」 |
| 结果页 | `#screen-result` | 翻面页点「看结果」 | 存入、分享、重新建一张 |
| 通讯录 | `#screen-contacts` | 顶栏「通讯录」；存入后的按钮 | 顶栏「返回」、品牌、点卡进详情 |
| 详情浮层 | `#overlay` + `#detail` | 通讯录点焦点卡 | 收起、点背景、Esc、删除完成 |
| 分享浮层 | `#share-overlay` + `#share-panel` | 结果页「生成分享卡」 | 收起、点背景、Esc |
| 轻提示 | `#toast` | 存入、删除、存储失败时自动出现 | 约 2.2 秒后自动消失 |

还有几个只在瞬间出现、但玩家能感知的状态：

- **第 4 张被拒**：选满 3 张后再点未选中的牌，所有未选中牌抖动，底部出现「只能选三张。」约 1.6 秒（`game.js:304-313`）。
- **翻面进行中**：三张牌依次翻，未翻完前「看结果」按钮保持 `hidden`（`game.js:346-361`）。
- **已存入结果页**：按钮文案从「存入通讯录」变成「已存入 · 查看通讯录」，再点会直接进通讯录（`game.js:536-554`）。
- **删除已武装**：详情里第一次点删除只变文案和样式，第二次点才真删（`game.js:704-724`）。
- **通讯录空 / 有卡**：两种完全不同的 DOM（空状态 vs 叠牌），由 `renderContacts` 分支渲染（`game.js:558-581`）。
- **iOS / 非 iOS**：分享浮层在 iOS 上多一行「长按图片，保存到相册」（`game.js:740-745`、`game.js:758`）。

### 1.4 运行时状态与本地存储

`state` 定义在 `game.js:22-30`：

| 字段 | 含义 | 生命周期 | 是否落盘 |
|---|---|---|---|
| `screen` | 当前屏幕名 | 每次 `showScreen` 更新 | 否 |
| `relation` | 选中的关系 id | 本轮建卡 | 写入结果卡 |
| `name` | 输入的名字（已 trim） | 本轮建卡 | 写入结果卡 |
| `selected` | 已选品质 id 数组 | 本轮建卡 | 写入结果卡 |
| `result` | 当前生成的结果对象（含 `scores`） | 结果页到重新开始 | 存入时写入通讯录 |
| `contacts` | 通讯录数组 | 页面启动时 `loadContacts()` 读入 | 是 |
| `deckIndex` | 通讯录当前焦点卡下标 | 通讯录内切换 | 否 |

模块级还有 `audioCtx`（`game.js:32`）、待执行定时器集合 `timers`（`game.js:33`）、`toastTimer`（`game.js:34`），都不持久化。`showScreen` 会先 `clearTimers()`，所以中途切屏会取消未完成的翻面与拒绝提示定时器（`game.js:220-237`）。

存储：

- 键名：`config.storageKey`，值为 `tarot-lover-cards-v1`（`config.js:5`）。
- 读取：`loadContacts()`（`game.js:129-139`）只接受数组，并过滤掉没有字符串 `name` 或没有数组 `traits` 的脏数据，解析失败返回空数组。它不要求 `scores`，所以旧格式卡片会原样保留。
- 写入：`persist()`（`game.js:141-149`）整体序列化 `state.contacts`；配额不足或被禁用时弹 `toast.noStorage`，不抛错。
- 存进去的卡就是 `computeResult` 返回的对象去掉 `saved` 字段（`game.js:455-468`、`game.js:545-546`）。字段包括 `id`、`name`、`relation`、`traits`、`comboName`、`comboText`、`paradox`、`weak`、`weakText`、`scores`、`createdAt`。
- `scores` 是 `{ total, security, space, stability, intensity }`；旧卡没有这个字段时，结果卡以外的界面不会读取，也不显示得分。
- 没有 `sessionStorage`、Cookie、IndexedDB 或任何后端同步。

## 二、功能分节

### 2.1 起始页与全局顶栏

**是什么**：起始页给出标题、导语与「开始」；顶栏左侧品牌、右侧通讯录入口。顶栏在全部屏幕常驻。

**怎么进入**：首次加载落到这里；任何屏幕点品牌「恋人 · 卡」都回到起始页；通讯录页的顶栏按钮变成「返回」，点了也回起始页。

**位置**：

- 结构：`index.html:14-17`（顶栏）、`index.html:20-34`（起始页）。
- 文案注入：`applyCopy()`（`game.js:151-190`），起始页部分是 `game.js:152-157`。
- 顶栏文字与计数：`updateChrome()`（`game.js:239-249`）；有卡时显示「通讯录 · n」，无卡时显示「通讯录」，通讯录页显示「返回」。
- 点击：`bindEvents()` 内 `game.js:774-786`（开始、通讯录、品牌）。
- 屏幕切换：`showScreen()`（`game.js:220-237`），通过给对应 `.screen` 加 `active` 类实现显隐，同时滚回页顶并处理名字页自动聚焦。

**状态与存储**：只写 `state.screen`。品牌点击只切屏，不重置本轮数据；真正重置由「开始」「重新建一张」和空通讯录 CTA 调用的 `resetRound()` 完成（`game.js:251-263`）。

**依赖数据**：`config.copy.brand`、`copy.start`、`copy.topContacts`、`copy.back`（`config.js:51-62`）。

### 2.2 关系选择

**是什么**：三选一的关系页。本版只有「恋人」可选，「朋友」「同事」是灰态、带「未解锁」、按钮 `disabled`。

**怎么进入**：起始页点「开始」，或结果页点「重新建一张」，或空通讯录点「去抽第一张」。三条路径都先 `resetRound()` 再 `showScreen('relation')`。

**位置**：

- 结构：`index.html:36-48`。
- 列表渲染：`buildRelations()`（`game.js:192-201`），按 `config.relation` 生成按钮，`available: false` 的项加 `locked`、写未解锁提示并禁用。
- 选中与推进：`bindEvents()` 内 `game.js:788-801`；点可用项写 `state.relation`、加 `chosen` 类、解锁「继续」。
- 样式：`styles.css:362-413`。

**状态与存储**：`state.relation`；未选中时「继续」保持 `disabled`。不落盘，直到结果生成时写进卡对象。

**依赖数据**：`config.relation`（`config.js:44-48`，含 `id` / `label` / `available`）、`copy.relation`（`config.js:64-70`）。

**注意**：`data/traits.js` 里每张卡都有 `relations: ['lover']` 字段，但当前代码没有任何地方读取它来过滤卡池；卡池可见性完全由 `config.relation` 的 `available` 控制。

### 2.3 名字输入与头像预览

**是什么**：输入名字，实时生成头像——名字哈希出色相，取首字做字面。

**怎么进入**：关系页选中「恋人」后点「继续」。

**位置**：

- 结构：`index.html:50-78`，输入框 `maxlength="12"`（`index.html:63`）。
- 输入监听：`updateNameField()`（`game.js:270-274`），写入 `state.name`、刷新头像、控制按钮禁用。
- 进入选牌：`goSelect()`（`game.js:276-281`），空名字直接返回。
- 事件：输入 `game.js:803-804`，Enter `game.js:804-806`，按钮 `game.js:808`。
- 头像算法：`hueOf()`（`game.js:62-68`）、`firstChar()`（`game.js:70-72`）、`setAvatar()`（`game.js:78-83`）、列表用 `avatarHtml()`（`game.js:74-76`）。
- 头像样式读取 `--h` 变量：`styles.css:423-461`。

**状态与存储**：`state.name`（trim 后）；不落盘。名字为空时 `#name-next` 禁用。

**依赖数据**：`copy.name`（`config.js:72-78`）。

**注意**：`share.js:18-24` 有一份完全相同的 `hueOf`、`firstChar` 实现，用于分享卡头像。改配色算法必须两边一起改，否则页面与分享图头像颜色不一致。

### 2.4 选牌（16 选 3）

**是什么**：16 张牌正面朝上，只显示罗马数字、品质名、正面场景。点选、再点取消，选满 3 张才能「翻面」，第 4 张会被拒绝。

**怎么进入**：名字页点「继续」或按 Enter。

**位置**：

- 结构：`index.html:80-101`。
- 网格渲染：`buildTraitGrid()`（`game.js:203-218`），只在启动时执行一次；每张卡带 `--deal` 延迟（`index * 0.028s`）用于发牌动画；正面场景通过 `sceneOf(trait.id)` 从 `data/scenes.js` 取。
- 选中态刷新：`renderSelection()`（`game.js:283-302`），更新 `n / 3`、选中类、底部三个菱形点、按钮禁用。
- 拒绝第 4 张：`refuseSelection()`（`game.js:304-313`）。
- 点击与推进：`bindEvents()` 内 `game.js:810-835`。
- 样式：`styles.css:532-625`（卡片）、`styles.css:588-607`（选中）、`styles.css:609-625`（拒绝抖动）。

**状态与存储**：`state.selected`（id 数组）；不落盘。上限读 `config.maxTraits`，当前为 3（`config.js:6`）。

**依赖数据**：`data/traits.js` 的 `id` / `name` / `sceneId`、`data/scenes.js` 的 `frontScene`，以及 `config.cardNumerals`（`config.js:7-10`）。

**硬约束**：选牌网格不读取 `costLabel` 与 `backScene`，也不显示任何代价信息。这是「先选后翻」的实现边界。

卡池与场景行号：

| id | 品质 | 卡数据 | 场景数据 |
|---|---|---|---|
| `honest` | 诚实 | `traits.js:9-15` | `scenes.js:6-10` |
| `generous` | 大方 | `traits.js:16-22` | `scenes.js:11-15` |
| `brave` | 勇敢 | `traits.js:23-29` | `scenes.js:16-20` |
| `gentle` | 温柔 | `traits.js:30-36` | `scenes.js:21-25` |
| `humorous` | 幽默 | `traits.js:37-43` | `scenes.js:26-30` |
| `ambitious` | 上进 | `traits.js:44-50` | `scenes.js:31-35` |
| `devoted` | 专一 | `traits.js:51-57` | `scenes.js:36-40` |
| `independent` | 独立 | `traits.js:58-64` | `scenes.js:41-45` |
| `considerate` | 体贴 | `traits.js:65-71` | `scenes.js:46-50` |
| `romantic` | 浪漫 | `traits.js:72-78` | `scenes.js:51-55` |
| `steady` | 踏实 | `traits.js:79-85` | `scenes.js:56-60` |
| `free` | 自由 | `traits.js:86-92` | `scenes.js:61-65` |
| `repair` | 大度 | `traits.js:93-99` | `scenes.js:66-70` |
| `order` | 干净 | `traits.js:100-106` | `scenes.js:71-75` |
| `money` | 节俭 | `traits.js:107-113` | `scenes.js:76-80` |
| `direct` | 主动 | `traits.js:114-120` | `scenes.js:81-85` |

### 2.5 翻面揭示代价

**是什么**：把所选三张牌逐张翻过来，背面才第一次出现代价大字与背面场景；全部翻完才出现「看结果」。

**怎么进入**：选牌页选满 3 张后点「翻面」。

**位置**：

- 结构：`index.html:103-114`。
- 生成翻转卡：`buildReveal()`（`game.js:315-344`），正面读 `name` / `frontScene`，背面读 `costLabel` / `backScene`，两者通过 `sceneOf(id)` 从 `data/scenes.js` 取；并带 `--deal` 延迟（`index * 0.06s`）。
- 翻面节奏：`startRevealSequence()`（`game.js:346-361`），第 `i` 张在 `500 + i * 680` 毫秒翻，最后一张翻完再等 `1050` 毫秒显示「看结果」。
- 推进：`game.js:837-842`，计算并渲染结果后切到结果页。
- 样式：`styles.css:683-777`，`flipped` 类触发 3D 翻转。

**状态与存储**：读 `state.selected`；不落盘。切屏会 `clearTimers()`，未翻完就离开会终止后续翻面。

**依赖数据**：`traits.js` 的 `name`、`scenes.js` 的 `frontScene` / `costLabel` / `backScene`；`copy.reveal`（`config.js:89-95`）的标题、提示、正面/背面标记、按钮。

### 2.6 结果生成（组合、矛盾体、四维得分、弱维、兜底）

**是什么**：把三张品质合成一张角色卡：名字、头像、三个品质、三个代价、一句组合或兜底文案、一句弱维台词、总分与四维分项，命中矛盾体组合时多一个标记。

**怎么进入**：翻面完成后点「看结果」。

**位置**：

- 计算：`computeResult()`（`game.js:414-469`）。
- 渲染：`renderResult()`（`game.js:496-534`），写入 `#result-sheet`。
- 兜底填充：`fillFallback()`（`game.js:363-370`），代价从 `sceneOf(id)` 读取。
- 得分块：`scoreBlockHtml()`（`game.js:471-494`），新旧卡共用；无 `scores` 时返回空串。
- 结构：`index.html:116-125`；样式：`styles.css:805-1007`。

**组合判定**：

- `pickCombo(ids)`（`game.js:409-413`）先筛出所选三张命中的所有组合，再由 `randomIndex`（`game.js:405-407`）在命中项里随机取一条；不区分选择顺序（`game.js:417`）。数组顺序不再决定结果。
- 当前 24 组都是两卡组合，所以三张牌能凑出三对，可能有 0～3 组命中；只有一条都没命中时才走兜底。
- `paradox: true` 时结果页与分享图显示「矛盾体」（`game.js:426`、`share.js:223`）。
- 没有命中任何组合时，用 `config.fallback` 三句模板拼成组合文案，填入 `{first}` / `{second}` / `{third}` / `{cost2}` / `{cost3}`；兜底模板保持不变。

**四维与得分计算**：

- 四维定义在 `config.axes`（`config.js:14-19`）：`security` / `space` / `stability` / `intensity`；每张卡的四维取值写在 `traits.js` 的 `axes`，范围 -3～3。
- 所选三张的每个维度分别求和（`game.js:431-436`），总和范围 -9～9。
- 原始分：`rawScoreOf()`（`game.js:372-375`）按 `round(((sum + span) / (span × 2)) × 25)` 映射为 0～25，其中 `span = config.axisRange × config.maxTraits = 9`。
- 原始总分：四维原始分相加；当前 16 张卡 560 种组合实测落在 51～71。
- 总分标定：`totalScoreOf()`（`game.js:377-382`）把原始总分按 `rawTotalFloor = 51` → `minTotal = 80`、`rawTotalCeiling = 71` → `maxTotal = 100` 线性拉开，越界钳制；实测最低真出现 80、最高真出现 100。
- 四维分项：`splitTotal()`（`game.js:386-403`）以 20 为底，把总分超出 80 的部分按各维原始分占比分摊，最大余数法保证四项之和严格等于总分（`game.js:438-448`）。
- 边界值只在 `config.axisRange` 与 `config.scoring`（`config.js:26-34`）里改；改 `traits.js` 的 `axes` 后必须重跑 560 种组合并同步 51/71 两个锚点，否则分布会重新偏斜。
- 展示边界：结果页与详情页展示总分 + 四维分项；分享图只画总分，见 2.10。旧卡没有 `scores` 时 `scoreBlockHtml` 返回空串，不显示、不补算。

**弱维计算**：

- 所选三张的每个维度分别求和，取最小值那一维；严格小于才替换，所以并列时保留 `config.axes` 中靠前的维度（`game.js:450-453`）。
- 台词由 `config.weakSentence`（`config.js:20`）替换 `{weak}` 得到。

**状态与存储**：`state.result` 保存完整结果对象（`game.js:455-468`），其中包含 `scores`；此时尚未写入 `localStorage`。

**依赖数据**：`data/combos.js`、`data/scenes.js`、`config.axes`、`config.weakSentence`、`config.fallback`、`config.axisRange`、`config.scoring`、`copy.result`、`copy.paradox`。

**注意**：兜底模板固定使用三张牌（`fillFallback` 直接取 `chosen[2]` 的 `costLabel`）。把 `config.maxTraits` 改成 3 以外的值，必须同时改兜底模板与 `fillFallback`，并同步调整 `scoreSpan`，否则会报错、文案缺项或分数越界。

组合数据行号（`data/combos.js`）：

| 组合 traits | 行号 | 备注 |
|---|---|---|
| `honest` + `gentle` | `combos.js:8-12` | 温柔的刀 |
| `considerate` + `honest` | `combos.js:13-16` | |
| `brave` + `gentle` | `combos.js:17-20` | |
| `humorous` + `steady` | `combos.js:21-24` | |
| `devoted` + `free` | `combos.js:25-29` | `paradox: true` |
| `generous` + `steady` | `combos.js:30-34` | `paradox: true` |
| `independent` + `romantic` | `combos.js:35-38` | |
| `ambitious` + `gentle` | `combos.js:39-42` | |
| `romantic` + `steady` | `combos.js:43-46` | |
| `humorous` + `devoted` | `combos.js:47-50` | |
| `brave` + `free` | `combos.js:51-54` | |
| `independent` + `free` | `combos.js:55-58` | |
| `repair` + `honest` | `combos.js:59-62` | |
| `repair` + `direct` | `combos.js:63-66` | |
| `repair` + `free` | `combos.js:67-70` | |
| `order` + `romantic` | `combos.js:71-74` | |
| `order` + `free` | `combos.js:75-78` | |
| `order` + `repair` | `combos.js:79-82` | |
| `money` + `generous` | `combos.js:83-87` | `paradox: true` |
| `money` + `romantic` | `combos.js:88-91` | |
| `money` + `direct` | `combos.js:92-95` | |
| `direct` + `gentle` | `combos.js:96-99` | |
| `direct` + `devoted` | `combos.js:100-103` | |
| `direct` + `steady` | `combos.js:104-106` | |

### 2.7 存入通讯录

**是什么**：把当前结果卡写进通讯录并持久化；按钮随即变成「已存入 · 查看通讯录」，再点直接进通讯录。

**怎么进入**：结果页点「存入通讯录」。

**位置**：

- `saveResult()`（`game.js:536-554`）。
- 事件绑定：`game.js:844`。
- 结果页按钮文案切换：`game.js:532`、`game.js:551`。

**状态与存储**：`state.contacts.unshift(card)`，`persist()` 写 `localStorage`；`state.result.saved = true`；成功弹 `copy.toast.saved`。重复点击不重复存卡，而是 `openContacts()`。

**依赖数据**：`copy.result.save` / `copy.result.saved`、`copy.toast.saved`。

### 2.8 通讯录（列表、切换、空状态）

**是什么**：已存卡的叠牌视图。最多 3 张虚影 + 一张焦点卡；多卡时可循环切换；点焦点卡进详情；无卡时显示空状态与「去抽第一张」。

**怎么进入**：顶栏「通讯录」；结果页「已存入 · 查看通讯录」。空状态里的「去抽第一张」是通讯录内部的出口，会回到关系页。

**位置**：

- 入口：`openContacts()`（`game.js:265-269`），把 `deckIndex` 归零并切屏。
- 渲染：`renderContacts()`（`game.js:558-645`）；空状态分支 `game.js:563-581`，叠牌分支 `game.js:583-644`。
- 顶栏点击分支：`game.js:779-785`。
- 焦点卡点击（带抽出动画后开详情）：`game.js:622-629`。
- 上一张 / 下一张（取模循环）：`game.js:631-644`。
- 结构：`index.html:127-135`；样式：`styles.css:1009-1237`。

**状态与存储**：读 `state.contacts` 与 `state.deckIndex`；删除会改写 `state.contacts` 并 `persist()`。`deckIndex` 会在渲染时夹到合法范围（`game.js:583`）。

**依赖数据**：`copy.contacts`（`config.js:110-125`）、`relationLabel()`（`game.js:85-87`）用于把关系 id 转成「恋人」。

### 2.9 详情浮层与删除

**是什么**：点开焦点卡后抽出的一张完整角色卡：头像、名字、三个品质、三条代价与背面场景、组合文案、弱维句、总分与四维（仅新卡）、存入日期、删除按钮。删除需要二次确认。

**怎么进入**：通讯录点焦点卡（先播放 280ms 抽出动画，再打开浮层，`game.js:622-629`）。

**位置**：

- 渲染：`renderDetail()`（`game.js:647-702`）。
- 打开 / 关闭：`openDetail()`（`game.js:726-730`）、`closeDetail()`（`game.js:732-736`）。
- 删除：`bindDelete()`（`game.js:704-724`）；第一次点击只改文案为「再点一次删除」并加 `armed` 类，第二次才按 `id` 找到并 `splice`。
- 关闭方式：`game.js:700`（收起按钮）、`game.js:852`（点背景）、`game.js:856-863`（Esc，优先关分享浮层）。
- 结构：`index.html:139-142`；样式：`styles.css:1253-1381`；得分块样式 `styles.css:1367-1374`。

**状态与存储**：读写 `state.contacts`；删除后 `persist()`、修正 `deckIndex`、重渲染列表并弹 `copy.toast.deleted`。浮层打开时给 `body` 加 `no-scroll`，关闭时移除。

**依赖数据**：`copy.contacts`（详情按钮与日期文案）、`copy.result`（品质/代价/组合标签/得分标签）、`copy.paradox`、`data/scenes.js`（代价与背面场景）、已存卡自身的 `comboText` / `comboName` / `paradox` / `weakText` / `scores`。

**旧数据兼容**：历史卡片可能没有 `scores` 字段；`scoreBlockHtml(card.scores)` 会直接返回空串，因此详情页不显示得分，其余字段（品质、代价、组合、弱维、日期）照常渲染。这里不做补算，也不因缺字段报错。

**注意**：详情浮层没有分享入口；分享只能从结果页生成，且只针对 `state.result`，历史卡不能直接生成分享图。

### 2.10 分享图生成与保存

**是什么**：结果页生成一张 1080×1440 竖版 PNG，在浮层里预览，可下载保存；iOS 额外提示长按保存。图上只出现正面信息与总分。

**怎么进入**：结果页点「生成分享卡」（`game.js:845`）。

**位置**：

- 打开 / 关闭：`openShareCard()`（`game.js:747-762`）、`closeShareCard()`（`game.js:764-769`）。
- 绘制入口：`createShareCard(result, traitById)`（`share.js:178-238`）。
- 尺寸与颜色常量：`share.js:8-16`（`WIDTH = 1080`、`HEIGHT = 1440`、`SUPERSAMPLE = 2`、`INK` / `GOLD` / `BG` / `SERIF`）。
- 绘制 helper：`drawSpaced`（`share.js:30-45`）、`drawDiamond`（`share.js:47-55`）、`drawFrame`（`share.js:57-70`）、`drawBackground`（`share.js:72-89`）、`drawAvatar`（`share.js:91-108`）、`drawDivider`（`share.js:110-120`）、`drawParadoxBadge`（`share.js:122-139`）、`drawQr`（`share.js:141-176`）。
- 保存链接：`index.html:153`；文件名在 `game.js:756`；iOS 判定在 `game.js:740-745`，提示文案在 `game.js:758`。
- 浮层样式：`styles.css:1491-1575`；预览图长按菜单 `styles.css:1540-1557`。

**绘制顺序**（`share.js:187-223`）：背景 → 边框 → 顶部小字 → 头像 → 名字 → 分隔线 → 左上角总分（仅当 `result.scores.total` 是数字）→ 三个品质大字（140px，`y = 580 + index * 170`）→ 钩子 → 二维码 → 短网址文字 → 矛盾体标记。

**状态与存储**：只读 `state.result`；每次打开都重新绘制，不缓存图片；返回 `{ width, height, dataUrl }`，写入 `#share-image` 的 `src` 与下载链接的 `href`。关闭时移除 `src`。不写 `localStorage`。

**依赖数据**：`config.copy.share`（`config.js:127-141`，按钮、标题、顶部小字、钩子、总分模板、矛盾体、二维码地址与文字、保存文案、iOS 提示、文件名前缀、预览 alt）、`traits.js` 的 `name`（通过 `traitById` 查）。旧卡没有 `scores` 时直接跳过总分那一行。

**硬约束**：`createShareCard` 只读 `result.name`、`result.traits` 对应的品质名、`result.paradox`、`result.scores.total`；不读四维分项、`costLabel`、`backScene`、`comboText`、弱维句。分享图只露正面是已拍板的硬约束。

**保存方式**：

- 桌面 / Android：点「保存图片」走 `<a download>`，文件名 `lover-card-<名字>.png`（前缀来自 `copy.share.filePrefix`）。
- iOS：显示「长按图片，保存到相册」；图片元素保留长按菜单（`styles.css:1540-1557`）。

### 2.11 二维码

**是什么**：分享卡底部二维码，扫出线上地址；编码器是项目自己写的，不引第三方库。

**怎么进入**：不属于用户主动操作，`createShareCard` 绘制时调用；用户只在分享图里看到它。

**位置**：

- 绘制：`share.js:141-176`（白底 222×222、4 模块静区、按矩阵填深色块；失败时退化为只画网址文字）。
- 编码：`qrMatrix(text)`（`qr.js:230-324`）。
- 容量表 `VERSIONS`：`qr.js:7-12`；Reed-Solomon：`generator`（`qr.js:32-43`）、`reedSolomon`（`qr.js:45-54`）；码字组装 `buildCodewords`（`qr.js:56-85`）；格式信息 `formatBits`（`qr.js:87-94`）；掩码 `MASKS`（`qr.js:96-105`）与罚分 `maskPenalty`（`qr.js:132-209`）。
- 地址与显示文字：`config.copy.share.qrUrl` / `qrText`（`config.js:134-135`）。

**实现边界**：

- byte 模式、版本 1–3 自动选择、纠错等级 M、单块 Reed-Solomon、8 种掩码按罚分择优、15 位 BCH 格式信息。
- 当前地址 `https://helloworld521.github.io/tarot-card` 是 42 字节，正好是版本 3-M 的上限；再长 1 字节就会超出容量，`qrMatrix` 抛错后 `drawQr` 退化为只显示 `qrText` 文字（`share.js:143-156`）。
- 换地址必须同时改 `qrUrl` 与 `qrText`，并确认长度仍在 42 字节内，或扩展 `qr.js` 的版本表。

**状态与存储**：无状态、不落盘；纯函数输入字符串，输出 `{ size, modules }`。

### 2.12 轻音效与轻提示

**是什么**：选牌、取消、翻面时的合成正弦音；存入、删除、存储失败时的底部短提示。

**怎么进入**：交互自然触发。

**位置**：

- 音效：`tick(kind)`（`game.js:99-117`）；调用点 `game.js:352`（翻面，`flip`）、`game.js:826`（选/取消，`pick` / `off`）。WebAudio 不可用或创建失败时静默，不阻塞流程。
- 提示：`toast(message)`（`game.js:119-127`），显示 2200ms；调用点 `game.js:145`（存储失败）、`game.js:553`（存入）、`game.js:722`（删除）。
- 结构：`index.html:159`；样式：`styles.css:1402-1427`。

**状态与存储**：`audioCtx`、`toastTimer` 都是内存态。

**依赖数据**：`copy.toast`（`config.js:143-147`）。

### 2.13 页面样式与响应式

不是独立玩法，但定位界面问题时需要知道：

- 屏幕显隐：`.screen` / `.screen.active`（`styles.css:124-135`），由 `showScreen` 切 `active`。
- 起始页、关系页、名字页：`styles.css:186-503`。
- 选牌与拒绝：`styles.css:506-669`。
- 翻面 3D：`styles.css:671-803`。
- 结果卡：`styles.css:805-1007`。
- 通讯录叠牌与空状态：`styles.css:1009-1237`。
- 详情浮层：`styles.css:1253-1400`。
- toast、按钮变体：`styles.css:206-251`、`styles.css:1383-1427`。
- 分享浮层：`styles.css:1491-1575`。
- 断点：`styles.css:1576`（≥640）、`1587`（≥760）、`1617`（≥900）、`1631`（≤360）、`1652`（减少动态效果）。

布局由 CSS 负责；JS 只负责切屏、加状态类（`selected` / `flipped` / `chosen` / `refuse` / `armed` / `pulling`），不计算尺寸。

## 三、我要改 XX 去哪改

| 想改什么 | 改哪里 | 备注 |
|---|---|---|
| 任意界面文案 | `data/config.js` 的 `copy`（`config.js:50-148`）对应段 | 静态骨架由 `applyCopy`（`game.js:151-190`）注入；列表与结果由各自 render 函数读取；`index.html` 里本身不写文案 |
| 品牌名 / 顶栏 | `copy.brand`、`copy.topContacts`、`copy.back`（`config.js:51-53`） | 顶栏由 `updateChrome`（`game.js:239-249`）刷新 |
| 关系选项 / 解锁状态 | `config.relation`（`config.js:44-48`） | `available: false` 自动变灰并禁用；改文案在 `copy.relation` |
| 加卡 / 改卡 / 删卡 | `data/traits.js:9-120` + `data/scenes.js:6-85` | 卡顺序决定网格顺序与编号；新卡要补 `axes` 与同 id 的 `sceneId` 场景条目；编号读 `config.cardNumerals`（`config.js:7-10`，共 16 个），超出 16 张会回退成阿拉伯数字（`game.js:12-14`、`game.js:208`） |
| 改品质名 | `traits.js` 的 `name` | 选牌页、结果页、通讯录、详情、分享图都读它 |
| 改正面场景 | `scenes.js` 的 `frontScene` | 选牌页只显示编号 + 品质名 + 正面场景（`game.js:203-218`）；分享图不画正反面场景 |
| 改代价 / 背面场景 | `scenes.js` 的 `costLabel` / `backScene` | 只在翻面页、结果页、详情页出现；不要写进分享图 |
| 调四维平衡 | `traits.js` 每张卡的 `axes` + `config.axes`（`config.js:14-19`） | 求和在 `computeResult`（`game.js:431-436`），标定与分摊在 `rawScoreOf` / `totalScoreOf` / `splitTotal`（`game.js:372-403`）；改数值后必须重测 560 种组合并同步 51/71 锚点 |
| 改得分公式边界 | `config.axisRange` / `config.scoring`（`config.js:26-34`） | 默认 `span = 3 × 3 = 9`；原始总分 51→80、71→100，分项以 20 为底分摊；改卡牌 `axes` 后必须重测 560 种组合并同步锚点，同时检查 `rawScoreOf` / `totalScoreOf` / `splitTotal`（`game.js:372-403`） |
| 改弱维台词 | `config.weakSentence`（`config.js:20`）+ `axes[].weak` | 每维一个「怕的东西」，模板只替换 `{weak}` |
| 加 / 改组合文案 | `data/combos.js:6-107` | 数组顺序不影响结果（命中多条时随机取一条）；两卡组合会被任何包含该对子的三张命中；互斥组合加 `paradox: true` |
| 改兜底三句 | `config.fallback`（`config.js:38-42`） | 占位符由 `fillFallback`（`game.js:363-370`）替换；固定三张，改选牌数量要一起改 |
| 改选牌数量 | `config.maxTraits`（`config.js:6`） | 会同时影响计数、菱形点、拒绝逻辑、按钮解锁与得分跨度；兜底模板默认 3 张，改成其他值需同步改 `fillFallback`、模板与 `scoreSpan` |
| 改存储键 | `config.storageKey`（`config.js:5`） | 改键后旧数据不会被读取，没有迁移逻辑；需自行处理旧键 |
| 改头像配色 / 首字 | `game.js:62-83` 与 `share.js:18-28` | 两份算法必须同步；页面用 CSS 变量 `--h`（`styles.css:423-434`） |
| 改分享图版式 | `share.js:178-238` 的绘制顺序 + `share.js:30-176` 的 helper | 尺寸与颜色常量在 `share.js:8-16`；不要读四维分项与代价字段 |
| 改分享图尺寸 / 清晰度 | `share.js:8-10` 的 `WIDTH` / `HEIGHT` / `SUPERSAMPLE` | 内部按 2× 绘制再缩到目标尺寸；浮层预览样式在 `styles.css:1529-1557` |
| 改分享图文字 / 钩子 / 文件名 | `config.copy.share`（`config.js:127-141`） | 文件名在 `game.js:756`；iOS 提示在 `game.js:758` |
| 改分享图总分文案 | `copy.share.score`（`config.js:132`） | 只替换 `{total}`；不要加入四维或代价占位符 |
| 改二维码地址 | `copy.share.qrUrl` + `copy.share.qrText`（`config.js:134-135`） | 当前地址 42 字节，是版本 3-M 上限；更长会退化为文字（`share.js:149-156`） |
| 扩展二维码能力 | `qr.js:7-12` 的 `VERSIONS` 与 `qr.js:230-324` 的 `qrMatrix` | 现在只支持版本 1–3、纠错 M、单块 |
| 改翻面节奏 | `startRevealSequence()`（`game.js:346-361`） | 当前 `500 + i * 680` 毫秒翻一张，最后再等 `1050` 毫秒出按钮 |
| 改发牌 / 入场延迟 | `game.js:207`、`game.js:319` 的 `--deal` | CSS 动画读这个变量，具体动画在 `styles.css` 对应区块 |
| 改音效 | `tick()`（`game.js:99-117`） | 调用点在 `game.js:352` 与 `game.js:826`；失败静默 |
| 改 toast 文案 / 时长 | `copy.toast`（`config.js:143-147`）+ `game.js:125` | 当前 2200ms |
| 改删除确认 | `bindDelete()`（`game.js:704-724`）+ `copy.contacts.deleteConfirm` | 第一次点击只武装，第二次才删 |
| 改详情内容顺序 | `renderDetail()`（`game.js:647-702`） | 结构与得分块拼在 `game.js:676-698` |
| 改视觉 / 响应式 | `styles.css` 对应区块（见 2.13） | 不动 `game.js`；屏幕切换只靠 `.screen.active` |
| 改线上地址 / 部署 | `config.copy.share.qrUrl`、`AGENTS.md` §0 与 §5 | 资源必须保持相对路径，适配 `/tarot-card/` 子路径 |

## 四、术语表

| 术语 | 含义 | 主要位置 |
|---|---|---|
| 品质 / trait | 玩家可选的 16 个性格标签，卡池的基本单位 | `data/traits.js` |
| 场景 / scene | 一张卡正面与背面的具体文案；按场景 id 索引，卡通过 `sceneId` 引用 | `data/scenes.js`、`game.js:17-20` |
| 正面 / `frontScene` | 选卡阶段能看到的「好的一面」场景句 | `scenes.js`、`game.js:203-218` |
| 代价 / `costLabel` | 翻面后才出现的短标签，如「说话难听」 | `scenes.js`、`game.js:315-344` |
| 背面 / `backScene` | 与正面同一场景的另一种走向，翻面后才出现 | `scenes.js`、`game.js:315-344` |
| 组合 / combo | 三张牌命中 `combos` 中某组 `traits` 时替换兜底文案的专属句子 | `data/combos.js`、`game.js:417-429` |
| 矛盾体 / `paradox` | 语义互斥但仍允许成立的组合标记，显示在结果页与分享图右上角 | `combos.js`、`game.js:426`、`share.js:223` |
| 四维 / `axes` | `security` / `space` / `stability` / `intensity`，既算弱维也算得分 | `config.js:14-19`、`traits.js` |
| 单维得分 | 总分按各维原始分占比分摊后的分项，以 20 为底，四项之和严格等于总分 | `game.js:386-403`、`game.js:438-448` |
| 总分 / `scores.total` | 按实际分布标定到 80～100（原始总分 51/71 为锚点）；四维分项由总分按占比分摊，四项之和严格等于总分 | `game.js:414-469`、`game.js:465` |
| 弱维 / `weak` | 三张牌四维求和后最低的一维 | `game.js:450-453` |
| 弱维句 / `weakSentence` | 由弱维替换 `{weak}` 得到的一句台词 | `config.js:20`、`game.js:464` |
| 兜底 / fallback | 没有命中任何组合时使用的三句模板 | `config.js:38-42`、`game.js:363-370` |
| 角色卡 / result | 一次建卡的完整结果对象，含名字、品质、代价、组合、弱维、得分、时间 | `game.js:455-468` |
| 通讯录 / contacts | 已存角色卡的本地数组 | `game.js:22-30`、`game.js:558-645` |
| 焦点卡 / 叠牌 | 通讯录中当前展示的一张卡，最多 3 张虚影 | `game.js:583-644`、`styles.css:1029-1168` |
| 分享卡 / share card | Canvas 绘制的 1080×1440 竖版 PNG | `share.js:178-238` |
| 钩子 / hook | 分享图上唯一一句引导文案，当前是「这三个词，你敢签吗」 | `config.js:131`、`share.js:213` |
| 屏幕 / screen | `section.screen` 对应的一屏，用 `data-screen` 标识 | `index.html:19-136`、`game.js:220-237` |
| 存储键 / `storageKey` | `localStorage` 的键，当前是 `tarot-lover-cards-v1` | `config.js:5`、`game.js:129-149` |
| 超采样 / `SUPERSAMPLE` | 分享卡先按 2× 画再缩小，保证小字与线条清晰 | `share.js:10` |
| QR 版本 / 纠错等级 | 二维码矩阵尺寸与容错能力；本项目只实现版本 1–3、等级 M | `qr.js:5-12` |

## 附录：函数与行号索引

`game.js`：

| 函数 | 行号 | 职责 |
|---|---|---|
| `sceneOf` | `game.js:17-20` | 通过卡的 `sceneId` 合并场景数据 |
| `esc` | `game.js:38-46` | HTML 转义 |
| `later` / `clearTimers` | `game.js:48-60` | 可取消的定时器 |
| `hueOf` / `firstChar` / `avatarHtml` / `setAvatar` | `game.js:62-83` | 头像配色与首字 |
| `relationLabel` | `game.js:85-87` | 关系 id → 中文 |
| `formatDate` | `game.js:89-93` | 详情页日期 |
| `makeId` | `game.js:95-97` | 卡片 id |
| `tick` | `game.js:99-117` | WebAudio 轻音效 |
| `toast` | `game.js:119-127` | 底部提示 |
| `loadContacts` / `persist` | `game.js:129-149` | 本地存储读写 |
| `applyCopy` | `game.js:151-190` | 注入全部静态文案 |
| `buildRelations` | `game.js:192-201` | 关系列表 |
| `buildTraitGrid` | `game.js:203-218` | 16 张选牌网格 |
| `showScreen` | `game.js:220-237` | 屏幕切换 |
| `updateChrome` | `game.js:239-249` | 顶栏计数与返回 |
| `resetRound` | `game.js:251-263` | 重置本轮 |
| `openContacts` | `game.js:265-269` | 打开通讯录 |
| `updateNameField` / `goSelect` | `game.js:270-281` | 名字输入与进入选牌 |
| `renderSelection` / `refuseSelection` | `game.js:283-313` | 选中态与第 4 张拒绝 |
| `buildReveal` / `startRevealSequence` | `game.js:315-361` | 翻面卡与翻面节奏 |
| `fillFallback` | `game.js:363-370` | 兜底模板填充 |
| `rawScoreOf` | `game.js:372-375` | 单维求和 → 0～25 原始分 |
| `totalScoreOf` | `game.js:377-382` | 原始总分 → 80～100（锚点 51/71） |
| `splitTotal` | `game.js:386-403` | 总分按各维占比分摊，最大余数法 |
| `randomIndex` | `game.js:405-407` | 随机入口，便于以后固定种子 |
| `pickCombo` | `game.js:409-413` | 命中组合里随机取一条 |
| `computeResult` | `game.js:414-469` | 组合、四维、得分、弱维 |
| `scoreBlockHtml` | `game.js:471-494` | 总分与四维分项 DOM（旧卡返回空串） |
| `renderResult` | `game.js:496-534` | 结果页渲染 |
| `saveResult` | `game.js:536-554` | 存入通讯录 |
| `renderContacts` | `game.js:558-645` | 通讯录列表 / 空状态 / 切换 |
| `renderDetail` | `game.js:647-702` | 详情浮层内容 |
| `bindDelete` | `game.js:704-724` | 二次确认删除 |
| `openDetail` / `closeDetail` | `game.js:726-736` | 详情浮层开关 |
| `isIOS` | `game.js:740-745` | iOS 保存提示判断 |
| `openShareCard` / `closeShareCard` | `game.js:747-769` | 分享浮层开关 |
| `bindEvents` | `game.js:773-866` | 全部事件绑定 |
| 启动段 | `game.js:868-873` | 初始化调用顺序 |

`share.js`：

| 函数 | 行号 | 职责 |
|---|---|---|
| `hueOf` / `firstChar` | `share.js:18-28` | 与 `game.js` 同步的头像算法 |
| `drawSpaced` | `share.js:30-45` | 逐字绘制并控制字距 |
| `drawDiamond` | `share.js:47-55` | 金色菱形装饰 |
| `drawFrame` | `share.js:57-70` | 双层边框与四角菱形 |
| `drawBackground` | `share.js:72-89` | 底色、径向光、上下压暗 |
| `drawAvatar` | `share.js:91-108` | 分享图头像 |
| `drawDivider` | `share.js:110-120` | 名字下分隔线 |
| `drawParadoxBadge` | `share.js:122-139` | 右上角「矛盾体」 |
| `drawQr` | `share.js:141-176` | 二维码 / 退化文字 |
| `createShareCard` | `share.js:178-238` | 完整绘制与 PNG 导出（含总分） |

`qr.js`：

| 函数 | 行号 | 职责 |
|---|---|---|
| `mul` / `generator` / `reedSolomon` | `qr.js:27-54` | 伽罗瓦域运算与 RS 纠错 |
| `buildCodewords` | `qr.js:56-85` | byte 模式码字与填充 |
| `formatBits` | `qr.js:87-94` | 15 位 BCH 格式信息 |
| `MASKS` | `qr.js:96-105` | 8 种掩码规则 |
| `drawFinder` / `drawAlign` | `qr.js:107-130` | 定位图案与对齐图案 |
| `maskPenalty` | `qr.js:132-209` | 掩码罚分 |
| `placeFormat` | `qr.js:211-228` | 写入格式信息 |
| `qrMatrix` | `qr.js:230-324` | 对外入口：文本 → 矩阵 |
