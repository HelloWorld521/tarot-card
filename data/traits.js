// 品质卡数据。这里只放卡的身份、四维与场景引用：
// - id 是品质卡的唯一标识
// - sceneId 指向 data/scenes.js 里的场景条目
// - axes 是四维分数（security 安全感、space 空间、stability 稳定、intensity 强度），-3 ~ 3
// - relations 是这张卡可用的关系，本版全部是 ["lover"]
// 改场景文案去 scenes.js，改组合去 combos.js，三者只靠 id 关联。

export const traits = [
  {
    id: 'honest',
    name: '诚实',
    sceneId: 'honest',
    axes: { security: 2, space: 0, stability: 2, intensity: 1 },
    relations: ['lover'],
  },
  {
    id: 'generous',
    name: '大方',
    sceneId: 'generous',
    axes: { security: 2, space: 1, stability: -1, intensity: 1 },
    relations: ['lover'],
  },
  {
    id: 'brave',
    name: '勇敢',
    sceneId: 'brave',
    axes: { security: 1, space: 2, stability: -2, intensity: 3 },
    relations: ['lover'],
  },
  {
    id: 'gentle',
    name: '温柔',
    sceneId: 'gentle',
    axes: { security: 3, space: -1, stability: 2, intensity: 1 },
    relations: ['lover'],
  },
  {
    id: 'humorous',
    name: '幽默',
    sceneId: 'humorous',
    axes: { security: 1, space: 1, stability: 1, intensity: 2 },
    relations: ['lover'],
  },
  {
    id: 'ambitious',
    name: '上进',
    sceneId: 'ambitious',
    axes: { security: 2, space: -2, stability: 1, intensity: 2 },
    relations: ['lover'],
  },
  {
    id: 'devoted',
    name: '专一',
    sceneId: 'devoted',
    axes: { security: 3, space: -3, stability: 2, intensity: 2 },
    relations: ['lover'],
  },
  {
    id: 'independent',
    name: '独立',
    sceneId: 'independent',
    axes: { security: -1, space: 3, stability: 2, intensity: 0 },
    relations: ['lover'],
  },
  {
    id: 'considerate',
    name: '体贴',
    sceneId: 'considerate',
    axes: { security: 3, space: -2, stability: 1, intensity: 1 },
    relations: ['lover'],
  },
  {
    id: 'romantic',
    name: '浪漫',
    sceneId: 'romantic',
    axes: { security: 0, space: 1, stability: -3, intensity: 3 },
    relations: ['lover'],
  },
  {
    id: 'steady',
    name: '踏实',
    sceneId: 'steady',
    axes: { security: 3, space: 0, stability: 3, intensity: -1 },
    relations: ['lover'],
  },
  {
    id: 'free',
    name: '自由',
    sceneId: 'free',
    axes: { security: -2, space: 3, stability: -1, intensity: 1 },
    relations: ['lover'],
  },
  {
    id: 'repair',
    name: '大度',
    sceneId: 'repair',
    axes: { security: -1, space: 0, stability: 2, intensity: -2 },
    relations: ['lover'],
  },
  {
    id: 'order',
    name: '干净',
    sceneId: 'order',
    axes: { security: 0, space: 1, stability: 2, intensity: -2 },
    relations: ['lover'],
  },
  {
    id: 'money',
    name: '节俭',
    sceneId: 'money',
    axes: { security: 3, space: 0, stability: 1, intensity: -3 },
    relations: ['lover'],
  },
  {
    id: 'direct',
    name: '主动',
    sceneId: 'direct',
    axes: { security: -2, space: 1, stability: 0, intensity: 3 },
    relations: ['lover'],
  },
];
