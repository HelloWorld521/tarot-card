// 组合文案。每条只引用 data/traits.js 的品质 id，与 data/scenes.js 无关。
// traits 数组不区分选择顺序；三张牌命中多条组合时随机取一条，
// 因此数组顺序不影响结果，下面的排列只为按卡分组阅读。
// paradox: true 表示「矛盾体」标记（真正互斥的搭配，但照常生成结果）。

export const combos = [
  {
    traits: ['honest', 'gentle'],
    name: '温柔的刀',
    text: '他实话实说，说完把你按回怀里——反正你也没地方去。',
  },
  {
    traits: ['considerate', 'honest'],
    text: '他替你挡掉所有麻烦，包括你朋友的约；他说这叫对你好。',
  },
  {
    traits: ['brave', 'gentle'],
    text: '他敢当场掀桌，转头问你要不要先回家；刺激的是他，收拾的是你。',
  },
  {
    traits: ['humorous', 'steady'],
    text: '他能把吵架讲成段子，他能把段子过成日子；一个负责热闹，一个负责收场。',
  },
  {
    traits: ['devoted', 'free'],
    text: '他的世界只有你，你的世界不给他留门。',
    paradox: true,
  },
  {
    traits: ['generous', 'steady'],
    text: '他刷卡不看余额，他记账精确到分；三年过去，存款是零，两个人还在一起。',
    paradox: true,
  },
  {
    traits: ['independent', 'romantic'],
    text: '他半夜说走就走，从不带你；他说这样才浪漫。',
  },
  {
    traits: ['ambitious', 'gentle'],
    text: '他的会议排到月底，你的关心排到凌晨；两个人都觉得自己在付出。',
  },
  {
    traits: ['romantic', 'steady'],
    text: '他负责让日子起浪，他负责把浪按回去；你分不清哪天才算过日子。',
  },
  {
    traits: ['humorous', 'devoted'],
    text: '他在饭桌上逗所有人笑，回家只讲给你一个人听；你笑不出来那天，他还在讲。',
  },
  {
    traits: ['brave', 'free'],
    text: '他辞职去徒步，他搭车去海边；谁也没问下一站，谁也没带上你。',
  },
  {
    traits: ['independent', 'free'],
    text: '两个人都觉得不查手机是尊重；三个月后，谁也不知道对方今晚和谁吃饭。',
  },
  {
    traits: ['repair', 'honest'],
    text: '他吵架时把话说到最狠，吵完一句解释都没有；他说真话，就是不哄人。',
  },
  {
    traits: ['repair', 'direct'],
    text: '吵完架他不解释，关灯后却照常凑过来；你分不清这是和好还是逃避。',
  },
  {
    traits: ['repair', 'free'],
    text: '两个人都能接受散场，吵架后各自消失三天，回来谁也不提。',
  },
  {
    traits: ['order', 'romantic'],
    text: '他把袜子按颜色排好，你半夜拉他去看海；他带上了拖鞋和外套。',
  },
  {
    traits: ['order', 'free'],
    text: '他给每件东西定了位置，你朋友来坐十分钟，他起身把四个杯子放回原位。',
  },
  {
    traits: ['order', 'repair'],
    text: '吵完架他先把地上的碎玻璃扫干净，再坐下来问你到底在气什么。',
  },
  {
    traits: ['money', 'generous'],
    text: '他请客从不看价格，他出门自带水杯；账单最后落在两个人中间。',
    paradox: true,
  },
  {
    traits: ['money', 'romantic'],
    text: '他记得每个打折日，记不住纪念日；你说要浪漫，他问预算多少。',
  },
  {
    traits: ['money', 'direct'],
    text: '他算得出每一笔账，算不出你今晚想要什么；你说想要，他说这个月超支了。',
  },
  {
    traits: ['direct', 'gentle'],
    text: '他开口要，你不好意思拒绝；次数多了，温柔变成了配合。',
  },
  {
    traits: ['direct', 'devoted'],
    text: '他想要你，也想把你锁在身边；热烈和占有只有一线。',
  },
  {
    traits: ['direct', 'steady'],
    text: '他想要的时候很直接，你说累的时候他倒头就睡；稳定得让人心凉。',
  },
];
