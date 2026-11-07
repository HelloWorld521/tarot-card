// 文案与平衡配置。改界面文案、改兜底句式、改弱维台词都只动这个文件。
// 不需要改 game.js。

export const config = {
  storageKey: 'tarot-lover-cards-v1',
  maxTraits: 3,
  cardNumerals: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'],

  // 四维：求和后最低的一维，决定结果卡的「你最怕的是……」
  axes: [
    { key: 'security', label: '安全感', weak: '被丢下' },
    { key: 'space', label: '空间', weak: '被围住' },
    { key: 'stability', label: '稳定', weak: '一切忽然变卦' },
    { key: 'intensity', label: '强度', weak: '日子淡得像白水' },
  ],
  weakSentence: '你最怕的是{weak}。',

  // 第三层兜底模板：{first} 第一张牌，{second} 第二张牌，{third} 第三张牌，
  // {cost2} / {cost3} 是对应牌的代价大字。
  fallback: [
    '他的底子是{first}。',
    '但{second}的另一面，是{cost2}。',
    '至于{third}，是他只留给你看的软肋——{cost3}。',
  ],

  relation: [
    { id: 'lover', label: '恋人', available: true },
    { id: 'friend', label: '朋友', available: false },
    { id: 'colleague', label: '同事', available: false },
  ],

  copy: {
    brand: '恋人 · 卡',
    topContacts: '通讯录',
    back: '返回',
    paradox: '矛盾体',

    start: {
      eyebrow: '恋人 · 角色卡',
      titleA: '抽三张牌',
      titleB: '认识一个人',
      lead: '你看到的是他最好的那一面。翻过来，才是代价。',
      cta: '开始',
    },

    relation: {
      step: '01 · 关系',
      title: '他和你，是什么关系？',
      hint: '本版只为一个关系做了牌。',
      locked: '未解锁',
      next: '继续',
    },

    name: {
      step: '02 · 名字',
      title: '给他一个名字',
      hint: '名字会变成他的头像。',
      placeholder: '比如：林',
      next: '继续',
    },

    select: {
      step: '03 · 选牌',
      title: '凭直觉，选三张',
      hint: '牌面朝上。你只看得到他的好。',
      count: '{n} / {max}',
      limit: '只能选三张。',
      next: '翻面',
    },

    reveal: {
      title: '牌面之下',
      hint: '每一样好，都有代价。',
      frontMark: '正面',
      backMark: '代价',
      next: '看结果',
    },

    result: {
      kicker: '角色卡 · 恋人',
      traitsLabel: '品质',
      comboLabel: '组合',
      costsLabel: '代价',
      save: '存入通讯录',
      saved: '已存入 · 查看通讯录',
      again: '重新建一张',
    },

    contacts: {
      title: '通讯录',
      count: '{n} 张',
      emptyTitle: '通讯录还是空的',
      emptyText: '抽三张牌，才会有第一个名字。',
      emptyCta: '去抽第一张',
      pullHint: '点开，抽出这一张',
      viewCard: '查看 {name} 的卡',
      prev: '上一张',
      next: '下一张',
      position: '{i} / {n}',
      detailClose: '收起',
      delete: '删除这张卡',
      deleteConfirm: '再点一次删除',
      savedOn: '存入于 {date}',
    },

    share: {
      button: '生成分享卡',
      title: '分享卡',
      kicker: '恋人 · 角色卡',
      hook: '这三个词，你敢签吗',
      paradox: '矛盾体',
      qrUrl: 'https://helloworld521.github.io/tarot-card',
      qrText: 'helloworld521.github.io/tarot-card',
      save: '保存图片',
      iosHint: '长按图片，保存到相册',
      previewAlt: '恋人角色卡分享图',
      filePrefix: 'lover-card-',
      close: '收起',
    },

    toast: {
      saved: '已存入通讯录',
      deleted: '已删除',
      noStorage: '这个浏览器不允许本地存储',
    },
  },
};
