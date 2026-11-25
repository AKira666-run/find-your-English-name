/* =========================================================
   Find Your English Name · 评分与匹配算法
   ---------------------------------------------------------
   1. 汇总：把 10 道题按维度相加（主维度 +3，副维度 +1）
   2. 归一化：每个维度 ÷ 总分，得到 8 维"人格画像"
   3. 性别过滤：按首页偏好筛选名字池
   4. 主名字：用户"第一维度"那个组里，余弦相似度最高者
      （若该组被性别偏好过滤空了，按维度顺序顺延到下一个还有名字的组）
   5. 备选名：用户第 2、第 3 维度对应名字组里相似度最高者
   6. 平分：先看 Q9、Q10 选的主维度，再按固定顺序
   全程不使用随机数：同样的答案 + 同样的偏好 → 永远同样的结果。
   ========================================================= */

var DIMENSIONS = ['gentle', 'sunny', 'independent', 'elegant', 'free', 'mysterious', 'rational', 'social'];

var DIMENSION_LABELS = {
  gentle: '温柔治愈',
  sunny: '阳光活力',
  independent: '独立清醒',
  elegant: '优雅知性',
  free: '自由浪漫',
  mysterious: '神秘个性',
  rational: '理性沉稳',
  social: '热情社交'
};

var Scoring = (function () {
  'use strict';

  /* ---------- 小工具 ---------- */

  function optionOf(question, optionId) {
    for (var i = 0; i < question.options.length; i++) {
      if (question.options[i].id === optionId) return question.options[i];
    }
    return null;
  }

  function mainDimOfOption(answers, questionIndex) {
    var id = answers[questionIndex];
    if (!id) return null;
    var opt = optionOf(QUESTIONS[questionIndex], id);
    return opt ? opt.main : null;
  }

  /* ---------- 1. 汇总 ---------- */

  function rawScores(answers) {
    var raw = {};
    for (var d = 0; d < DIMENSIONS.length; d++) raw[DIMENSIONS[d]] = 0;

    for (var i = 0; i < QUESTIONS.length; i++) {
      var opt = answers[i] ? optionOf(QUESTIONS[i], answers[i]) : null;
      if (!opt) continue;
      raw[opt.main] += 3;
      raw[opt.sub] += 1;
    }
    return raw;
  }

  /* ---------- 2. 维度排序（含平分规则） ---------- */

  function orderDimensions(raw, answers) {
    var q9Main = mainDimOfOption(answers, 8);    // Q9 价值观题
    var q10Main = mainDimOfOption(answers, 9);   // Q10 价值观题

    function valuePriority(dim) {
      if (dim === q9Main) return 0;
      if (dim === q10Main) return 1;
      return 2;
    }

    var list = DIMENSIONS.slice();
    list.sort(function (a, b) {
      if (raw[a] !== raw[b]) return raw[b] - raw[a];          // 分数高的在前
      var pa = valuePriority(a), pb = valuePriority(b);
      if (pa !== pb) return pa - pb;                          // Q9、Q10 优先
      return DIMENSIONS.indexOf(a) - DIMENSIONS.indexOf(b);   // 固定顺序兜底
    });
    return list;
  }

  function buildProfile(answers) {
    var raw = rawScores(answers);
    var total = 0;
    for (var i = 0; i < DIMENSIONS.length; i++) total += raw[DIMENSIONS[i]];

    var normalized = {};
    for (i = 0; i < DIMENSIONS.length; i++) {
      normalized[DIMENSIONS[i]] = total > 0 ? raw[DIMENSIONS[i]] / total : 0;
    }

    return {
      raw: raw,
      total: total,
      normalized: normalized,
      order: orderDimensions(raw, answers)
    };
  }

  /* ---------- 3. 余弦相似度 ---------- */

  function cosine(a, b) {
    var dot = 0, lenA = 0, lenB = 0;
    for (var i = 0; i < DIMENSIONS.length; i++) {
      var d = DIMENSIONS[i];
      var x = a[d] || 0;
      var y = b[d] || 0;
      dot += x * y;
      lenA += x * x;
      lenB += y * y;
    }
    if (lenA === 0 || lenB === 0) return 0;
    return dot / (Math.sqrt(lenA) * Math.sqrt(lenB));
  }

  function traitsVector(name) {
    var v = {};
    for (var i = 0; i < DIMENSIONS.length; i++) {
      var d = DIMENSIONS[i];
      v[d] = (name.traits && typeof name.traits[d] === 'number') ? name.traits[d] : 0;
    }
    return v;
  }

  /* 名字的主维度 = traits 里权重 3 的那个 */
  function mainDimOfName(name) {
    var best = DIMENSIONS[0], bestVal = -1;
    for (var i = 0; i < DIMENSIONS.length; i++) {
      var d = DIMENSIONS[i];
      var v = (name.traits && name.traits[d]) || 0;
      if (v > bestVal) { bestVal = v; best = d; }
    }
    return best;
  }

  function genderAllowed(name, pref) {
    if (pref === 'male') return name.gender === 'male' || name.gender === 'neutral';
    if (pref === 'female') return name.gender === 'female' || name.gender === 'neutral';
    return true;
  }

  /* ---------- 4. 排序 ---------- */

  /* id 排序用的数值；id 不是数字时排到最后，避免 NaN 干扰排序 */
  function idKey(name) {
    var n = Number(name.id);
    return isNaN(n) ? Infinity : n;
  }

  function rankNames(profile, names) {
    var list = [];
    for (var i = 0; i < names.length; i++) {
      list.push({
        name: names[i],
        similarity: cosine(profile.normalized, traitsVector(names[i]))
      });
    }
    list.sort(function (a, b) {
      if (b.similarity !== a.similarity) return b.similarity - a.similarity;  // 相似度高的在前
      var ia = idKey(a.name.id);
      var ib = idKey(b.name.id);
      if (ia !== ib) return ia - ib;                                           // 并列时 id 小的在前
      return a.name.name < b.name.name ? -1 : 1;
    });
    return list;
  }

  function firstLetter(name) {
    return String(name.name).charAt(0).toUpperCase();
  }

  /* ---------- 5. 备选名 ---------- */

  function pickAlternates(main, ranked, order) {
    var usedIds = {}, usedNames = {}, usedLetters = {};
    usedIds[main.name.id] = true;
    usedNames[main.name.name] = true;
    usedLetters[firstLetter(main.name)] = true;   // 主名字的首字母也算占用

    var targets = [order[1], order[2]];    // 用户的第 2、第 3 维度
    var picks = [];

    function find(constraint) {
      for (var i = 0; i < ranked.length; i++) {
        var item = ranked[i];
        if (usedIds[item.name.id] || usedNames[item.name.name]) continue;
        if (constraint.dim && mainDimOfName(item.name) !== constraint.dim) continue;
        if (constraint.diffLetter && usedLetters[firstLetter(item.name)]) continue;
        return item;
      }
      return null;
    }

    for (var t = 0; t < targets.length; t++) {
      var item =
        find({ dim: targets[t], diffLetter: true }) ||      // 严格：维度对得上，且首字母不重复
        find({ dim: targets[t], diffLetter: false }) ||     // 放宽：首字母可以相同
        find({ dim: null, diffLetter: true }) ||            // 放宽：不限维度
        find({ dim: null, diffLetter: false });             // 全放开，按相似度取
      if (item) {
        picks.push(item);
        usedIds[item.name.id] = true;
        usedNames[item.name.name] = true;
        usedLetters[firstLetter(item.name)] = true;
      }
    }
    return picks;
  }

  /* ---------- 6. 主名字 ---------- */

  /* B 方案：主名字只在用户第一维度的名字组里选，
     这样结果页「名字 + 人格标签」永远对得上。
     若这一组被性别偏好过滤空了，就按维度顺序找下一个还有名字的组。 */
  function pickMain(ranked, order) {
    for (var i = 0; i < order.length; i++) {
      for (var j = 0; j < ranked.length; j++) {
        if (mainDimOfName(ranked[j].name) === order[i]) return ranked[j];
      }
    }
    return ranked[0];   // 理论上不会用到：兜底，保证不返回空
  }

  /* ---------- 7. 主入口 ---------- */

  function match(profile, names, pref) {
    var pool = [];
    for (var i = 0; i < names.length; i++) {
      if (genderAllowed(names[i], pref)) pool.push(names[i]);
    }
    if (pool.length === 0) {
      return { main: null, alternates: [], ranked: [], poolSize: 0 };
    }

    var ranked = rankNames(profile, pool);
    var main = pickMain(ranked, profile.order);
    var alternates = pickAlternates(main, ranked, profile.order);

    var altNames = [];
    for (var k = 0; k < alternates.length; k++) altNames.push(alternates[k].name);

    return { main: main.name, alternates: altNames, ranked: ranked, poolSize: pool.length };
  }

  return {
    rawScores: rawScores,
    buildProfile: buildProfile,
    cosine: cosine,
    rankNames: rankNames,
    mainDimOfName: mainDimOfName,
    genderAllowed: genderAllowed,
    match: match
  };
})();
