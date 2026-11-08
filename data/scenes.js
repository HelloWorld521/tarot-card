// 场景文案。key 是场景 id，品质卡通过 sceneId 引用这里的条目。
// 改正面场景 / 代价标签 / 背面场景只动这个文件，不需要碰 traits.js。
// 每张卡的 frontScene 与 backScene 必须是同一个具体场景的两种走向。

export const scenes = {
  honest: {
    frontScene: '你问"我是不是变丑了"，他说"是，但我喜欢"。',
    costLabel: '说话难听',
    backScene: '那天他真的只说了"是"。',
  },
  generous: {
    frontScene: '结账时他手一拦："我来。"',
    costLabel: '乱花钱',
    backScene: '月底他问你借两千，说"你反正不用"。',
  },
  brave: {
    frontScene: '地铁上有人推搡老人，他站起来了。',
    costLabel: '不管后果',
    backScene: '辞职去徒步那天，你从朋友圈知道。',
  },
  gentle: {
    frontScene: '你崩溃那次，他什么也没说，只是抱住你。',
    costLabel: '没主见',
    backScene: '问他吃什么，"都行"。问了三年。',
  },
  humorous: {
    frontScene: '你尴尬到想钻地缝，他一句话把全场救回来。',
    costLabel: '什么都能开玩笑',
    backScene: '你哭的那次，他先笑了。',
  },
  ambitious: {
    frontScene: '凌晨一点他还在改方案，说"想给你更好的"。',
    costLabel: '没时间陪你',
    backScene: '纪念日那晚他在开会，让你先吃。',
  },
  devoted: {
    frontScene: '手机壁纸是你，锁屏也是你。',
    costLabel: '容不下别人',
    backScene: '你手机响了一下，他先看了一眼屏幕。',
  },
  independent: {
    frontScene: '他从不为谁改行程，你觉得这很可靠。',
    costLabel: '不需要你',
    backScene: '搬家那天，他一个人搬完了，没叫你。',
  },
  considerate: {
    frontScene: '你还没说冷，外套已经在你肩上了。',
    costLabel: '替你做主',
    backScene: '他替你回绝了朋友的约，"她今天累了"。',
  },
  romantic: {
    frontScene: '凌晨三点他说："我们去海边吧，现在。"',
    costLabel: '大起大落',
    backScene: '凌晨三点他说"分手吧"，五点又说对不起。',
  },
  steady: {
    frontScene: '你住院七天，他每天准点到，一天没缺。',
    costLabel: '无聊可预测',
    backScene: '十年后的今天，还是那家餐厅，同一句"吃什么"。',
  },
  free: {
    frontScene: '他从不说"你必须"。',
    costLabel: '不给承诺',
    backScene: '他也从不说"以后"。',
  },
  repair: {
    frontScene: '吵到摔门，第二天他发来三个字："吃饭了。"',
    costLabel: '不解释',
    backScene: '你等的那句"对不起"始终没来，那三个字像昨晚没发生过。',
  },
  order: {
    frontScene: '你随手把杯子放在桌角，他顺手放回杯垫，把桌面擦了。',
    costLabel: '念三天',
    backScene: '同一只杯子，你随手放在桌角，他念了三天，路过一次说一次。',
  },
  money: {
    frontScene: '你想买束花，他掏出手机算了一遍："少喝两杯咖啡，就够。"',
    costLabel: '先算账',
    backScene: '这次你想买的是花，他算完把花放回架子："这个月不在预算里。"',
  },
  direct: {
    frontScene: '关灯前他忽然凑近："我今天想要。"',
    costLabel: '他说了算',
    backScene: '加班到十一点，你说"我今天想要"，他翻了个身："累了，改天吧。"',
  },
};
