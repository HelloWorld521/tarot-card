// 组合文案。traits 数组不区分选择顺序，命中即用其 text。
// 如果三张牌命中了多组（例如同时满足两组双卡组合），按本数组从上到下的顺序取第一条。
// paradox: true 表示「矛盾体」标记（逻辑打架的组合，但照常生成结果）。

export const combos = [
  {
    traits: ['honest', 'gentle'],
    name: '温柔的刀',
    text: '他什么都直说，说完会抱你一下。',
  },
  {
    traits: ['considerate', 'honest'],
    text: '他昨天说你显胖，今天把同款大一号买回来了。',
  },
  {
    traits: ['brave', 'gentle'],
    text: '他替你出头，回头小声问你：我刚才是不是太过分了？',
  },
  {
    traits: ['humorous', 'steady'],
    text: '和他在一起，不会闷，也不会出事。',
  },
  {
    traits: ['devoted', 'free'],
    text: '他说他不属于任何人。也从不让你一个人回家。',
    paradox: true,
  },
  {
    traits: ['generous', 'steady'],
    text: '他请客从不看价格，自己穿三年前的鞋。',
    paradox: true,
  },
  {
    traits: ['independent', 'romantic'],
    text: '他半夜说走就走，也从不带你。',
  },
  {
    traits: ['ambitious', 'gentle'],
    text: '他很忙，但你说难受的那天，他把会议推了。',
  },
  {
    traits: ['romantic', 'steady'],
    text: '一年只有两次惊喜，但每次都记得你三个月前随口提过的事。',
  },
  {
    traits: ['humorous', 'devoted'],
    text: '他逗笑所有人，只在你面前安静。',
  },
];
