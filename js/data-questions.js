/* =========================================================
   Find Your English Name · 题库
   题目与选项文字：照搬设计稿原文，不要改动。
   题目里的 \n 只控制断行位置（和效果图一致），不改变任何文字。
   每个选项：main 主维度 +3，sub 副维度 +1。
   维度简称：治=gentle 阳=sunny 独=independent 雅=elegant
             浪=free 秘=mysterious 理=rational 社=social
   （评分与匹配算法在第 3 步实现，本文件只存数据）
   ========================================================= */

var QUESTIONS = [
  {
    id: 1,
    text: '理想周末',
    options: [
      { id: 'A', text: '窝在家煮点好吃的，听一整天歌', main: 'gentle', sub: 'elegant' },
      { id: 'B', text: '一早出门爬山或运动，晒晒太阳', main: 'sunny', sub: 'free' },
      { id: 'C', text: '随便上一班车，去没去过的地方乱逛', main: 'free', sub: 'mysterious' },
      { id: 'D', text: '约朋友来家里办个小聚会', main: 'social', sub: 'sunny' }
    ]
  },
  {
    id: 2,
    text: '聚会上遇到完全陌生的人',
    options: [
      { id: 'A', text: '笑着先打招呼，很快就聊开了', main: 'social', sub: 'sunny' },
      { id: 'B', text: '观察一下，找到合适的话题再开口', main: 'rational', sub: 'elegant' },
      { id: 'C', text: '安静待在旁边，对方需要时再接话', main: 'gentle', sub: 'independent' },
      { id: 'D', text: '不刻意找话题，有缘自然会聊', main: 'independent', sub: 'mysterious' }
    ]
  },
  {
    id: 3,
    text: '什么样的天气，\n最让你觉得自在？',
    options: [
      { id: 'A', text: '雨后的清晨，空气湿润又安静', main: 'gentle', sub: 'elegant' },
      { id: 'B', text: '晴空万里的海边', main: 'sunny', sub: 'free' },
      { id: 'C', text: '起雾的森林，或深夜无人的街', main: 'mysterious', sub: 'independent' },
      { id: 'D', text: '微风吹过的秋日，窗边的位置', main: 'elegant', sub: 'rational' }
    ]
  },
  {
    id: 4,
    text: '选一种配色\n做你的手机壁纸',
    options: [
      { id: 'A', text: '奶油白 + 浅粉', main: 'gentle', sub: 'elegant' },
      { id: 'B', text: '明亮的橙黄', main: 'sunny', sub: 'social' },
      { id: 'C', text: '黑白灰，克制极简', main: 'rational', sub: 'mysterious' },
      { id: 'D', text: '天空蓝渐变晚霞紫', main: 'free', sub: 'gentle' }
    ]
  },
  {
    id: 5,
    text: '计划突然被打乱，\n你的第一反应',
    options: [
      { id: 'A', text: '深呼吸，把问题列出来一步步解决', main: 'rational', sub: 'independent' },
      { id: 'B', text: '先找信任的人聊聊，一起想办法', main: 'social', sub: 'gentle' },
      { id: 'C', text: '相信总有办法，先往前走再说', main: 'sunny', sub: 'free' },
      { id: 'D', text: '自己消化一下，想清楚再行动', main: 'independent', sub: 'mysterious' }
    ]
  },
  {
    id: 6,
    text: '一张机票，你选哪里',
    options: [
      { id: 'A', text: '京都的小巷和安静茶屋', main: 'elegant', sub: 'gentle' },
      { id: 'B', text: '冰岛公路旅行，追极光', main: 'free', sub: 'sunny' },
      { id: 'C', text: '老城的雾夜和旧书店', main: 'mysterious', sub: 'elegant' },
      { id: 'D', text: '热闹城市的音乐节和街头美食', main: 'social', sub: 'sunny' }
    ]
  },
  {
    id: 7,
    text: '朋友最可能这样形容你',
    options: [
      { id: 'A', text: '“和你在一起特别安心”', main: 'gentle', sub: 'social' },
      { id: 'B', text: '“你很有主见”', main: 'independent', sub: 'rational' },
      { id: 'C', text: '“你有点难猜，但很有意思”', main: 'mysterious', sub: 'free' },
      { id: 'D', text: '“你说话做事很有分寸”', main: 'elegant', sub: 'rational' }
    ]
  },
  {
    id: 8,
    text: '你最容易被哪种角色吸引',
    options: [
      { id: 'A', text: '冷静敏锐、能破解谜题的推理者', main: 'rational', sub: 'mysterious' },
      { id: 'B', text: '不走寻常路的独行者', main: 'independent', sub: 'free' },
      { id: 'C', text: '一心追梦的冒险家', main: 'free', sub: 'sunny' },
      { id: 'D', text: '从容优雅、带着故事感的人', main: 'mysterious', sub: 'elegant' }
    ]
  },
  {
    id: 9,
    text: '人生里最不想失去的是',
    options: [
      { id: 'A', text: '与人真诚的连接，被需要', main: 'social', sub: 'gentle' },
      { id: 'B', text: '自由，能选择自己的生活', main: 'free', sub: 'independent' },
      { id: 'C', text: '持续成长，不断变得更好', main: 'elegant', sub: 'rational' },
      { id: 'D', text: '内心的秩序与踏实', main: 'rational', sub: 'independent' }
    ]
  },
  {
    id: 10,
    text: '你希望别人怎么记住你',
    options: [
      { id: 'A', text: '记得我带来的笑声和能量', main: 'sunny', sub: 'social' },
      { id: 'B', text: '记得我是个不被左右的人', main: 'independent', sub: 'rational' },
      { id: 'C', text: '记得我身上说不清的故事感', main: 'mysterious', sub: 'free' },
      { id: 'D', text: '记得我的品位和分寸', main: 'elegant', sub: 'gentle' }
    ]
  }
];
