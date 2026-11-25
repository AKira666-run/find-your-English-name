/* =========================================================
   Find Your English Name · 页面切换、答题流程与结果页
   状态（名字偏好 / 每题答案 / 当前题号）存在 sessionStorage，
   键名 fyn_state，刷新页面可恢复。
   ========================================================= */

(function () {
  'use strict';

  var STORAGE_KEY = 'fyn_state';
  var TOTAL = QUESTIONS.length;     // 题目数量，跟着题库走
  var ECHO_DELAY = 300;             // 选中后停顿多久进入下一题（毫秒）
  var LOADING_TIME = 1500;          // 过渡页停留时长（毫秒）

  /* ---------- 1. 状态 ---------- */

  function emptyAnswers() {
    var arr = [];
    for (var i = 0; i < TOTAL; i++) arr.push(null);
    return arr;
  }

  function defaultState() {
    return { pref: 'all', answers: emptyAnswers(), index: 0 };
  }

  function loadState() {
    var state = defaultState();
    var raw = null;

    try {
      raw = window.sessionStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return state;                       // 浏览器禁用存储时，用默认状态继续
    }
    if (!raw) return state;

    var saved;
    try {
      saved = JSON.parse(raw);
    } catch (err) {
      return state;
    }
    if (!saved || typeof saved !== 'object') return state;

    if (saved.pref === 'male' || saved.pref === 'female' || saved.pref === 'all') {
      state.pref = saved.pref;
    }
    if (Object.prototype.toString.call(saved.answers) === '[object Array]') {
      for (var i = 0; i < TOTAL; i++) {
        var v = saved.answers[i];
        if (typeof v === 'string') state.answers[i] = v;
      }
    }
    if (typeof saved.index === 'number' && saved.index >= 0 && saved.index < TOTAL) {
      state.index = Math.floor(saved.index);
    }
    return state;
  }

  function saveState() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* 存储不可用时静默跳过，页面照常能用 */
    }
  }

  var state = loadState();
  var lastResult = null;    // 本次结果，第 6 步「保存图片 / 复制」会用到

  /* ---------- 2. 页面切换 ---------- */

  var screens = {
    home: document.getElementById('screen-home'),
    quiz: document.getElementById('screen-quiz'),
    loading: document.getElementById('screen-loading'),
    result: document.getElementById('screen-result')
  };

  function showScreen(name) {
    for (var key in screens) {
      if (Object.prototype.hasOwnProperty.call(screens, key)) {
        screens[key].hidden = key !== name;
      }
    }
    window.scrollTo(0, 0);
  }

  /* ---------- 3. 轻提示（第 6 步复制 / 保存图片时用到） ---------- */

  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2400);
  }

  /* ---------- 4. 首页：名字偏好 ---------- */

  var chips = document.querySelectorAll('.chip');

  function renderPref() {
    for (var i = 0; i < chips.length; i++) {
      var on = chips[i].getAttribute('data-pref') === state.pref;
      chips[i].classList.toggle('is-selected', on);
      chips[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  for (var c = 0; c < chips.length; c++) {
    chips[c].addEventListener('click', function () {
      state.pref = this.getAttribute('data-pref');
      saveState();
      renderPref();
    });
  }

  /* ---------- 5. 答题页 ---------- */

  var quizCounter = document.getElementById('quiz-counter');
  var progressEl = document.getElementById('progress');
  var progressFill = document.getElementById('progress-fill');
  var questionEl = document.getElementById('question-text');
  var optionsEl = document.getElementById('options');
  var backBtn = document.getElementById('back-btn');

  var locked = false;   // 选中后的短暂锁，防止连点跳题

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function renderQuestion() {
    var q = QUESTIONS[state.index];
    var chosen = state.answers[state.index];

    quizCounter.textContent = 'QUESTION ' + pad2(state.index + 1) + ' / ' + pad2(TOTAL);
    questionEl.textContent = q.text;

    progressFill.style.width = ((state.index + 1) / TOTAL * 100) + '%';
    progressEl.setAttribute('aria-valuemax', String(TOTAL));
    progressEl.setAttribute('aria-valuenow', String(state.index + 1));

    backBtn.hidden = state.index === 0;   // 第 1 题不显示"上一题"

    optionsEl.innerHTML = '';
    for (var i = 0; i < q.options.length; i++) {
      var opt = q.options[i];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option' + (chosen === opt.id ? ' is-selected' : '');
      btn.setAttribute('data-choice', opt.id);
      btn.textContent = opt.text;
      btn.addEventListener('click', onChoose(opt.id));
      optionsEl.appendChild(btn);
    }

    questionEl.focus({ preventScroll: true });
    saveState();
  }

  function onChoose(choiceId) {
    return function () {
      if (locked) return;
      locked = true;

      state.answers[state.index] = choiceId;
      saveState();

      // 立刻高亮，让点击有反馈
      var btns = optionsEl.querySelectorAll('.option');
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle('is-selected', btns[i].getAttribute('data-choice') === choiceId);
      }

      window.setTimeout(function () {
        if (state.index < TOTAL - 1) {
          state.index += 1;
          saveState();
          locked = false;
          renderQuestion();
        } else {
          finishQuiz();
        }
      }, ECHO_DELAY);
    };
  }

  function finishQuiz() {
    saveState();
    showScreen('loading');

    window.setTimeout(function () {
      renderResult();
      showScreen('result');
      locked = false;
    }, LOADING_TIME);
  }

  backBtn.addEventListener('click', function () {
    if (locked || state.index === 0) return;
    state.index -= 1;
    saveState();
    renderQuestion();
  });

  /* ---------- 6. 结果页 ---------- */

  var el = {
    screen: screens.result,
    name: document.getElementById('result-name'),
    pron: document.getElementById('result-pron'),
    tags: document.getElementById('result-tags'),
    keywords: document.getElementById('result-keywords'),
    meaning: document.getElementById('result-meaning'),
    origin: document.getElementById('result-origin'),
    note: document.getElementById('result-note'),
    about: document.getElementById('result-about'),
    whyLabel: document.getElementById('result-why-label'),
    why: document.getElementById('result-why'),
    also: document.getElementById('result-also')
  };

  /* 专属分析：四段拼接，全部由分数与维度决定，不使用随机数 */
  function buildAnalysis(profile, name) {
    var order = profile.order;
    var raw = profile.raw;
    var r1 = raw[order[0]];
    var r2 = raw[order[1]];
    var r3 = raw[order[2]];

    // 三段各取一种写法；编号由 8 维分数推导，同样的答案永远同一段文字
    var v1 = (r1 * 7 + r2 * 3) % 3;
    var v2 = (r2 * 5 + r3 * 2) % 3;
    var v3 = (r1 * 3 + r2 * 5 + r3 * 7) % 3;
    if (v3 === v1) v3 = (v3 + 1) % 3;        // 第一段与第三段不能是同一写法

    var copy = ANALYSIS_COPY;
    var part1 = copy[order[0]].overall[v1];      // 整体气质（主维度）
    var part2 = copy[order[1]].contact[v2];      // 人际特点（第 2 维度）
    var part3 = copy[order[0]].life[v3];         // 面对生活（主维度，另一种写法）
    // 第四段用名字的气质描述衔接（不重复 WHY 卡片里的 reason）
    var part4 = '所以 ' + name.name + ' 落在你身上并不意外——' + name.vibe + '这就是你给人的感觉。';

    return part1 + part2 + part3 + part4;
  }

  function kwPill(text, cls) {
    var span = document.createElement('span');
    span.className = cls;
    span.textContent = text;
    return span;
  }

  /* 数据里用直引号，显示时换成中文引号，排版更像杂志 */
  function styleText(s) {
    return String(s).replace(/"([^"]{1,60})"/g, '“$1”');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
    });
  }

  /* 希伯来语等从右往左的文字夹在中文里会被打乱顺序，包一层 bdi 做隔离；
     同时去掉希伯来语的注音符号（niqqud），避免小点在中文行里错位 */
  function richText(s) {
    return escapeHtml(styleText(s))
      .replace(/[\u0591-\u05C7]/g, '')
      .replace(/([\u0590-\u05FF]+)/g, '<bdi dir="rtl">$1</bdi>');
  }

  function renderAlso(names) {
    el.also.innerHTML = '';
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      var card = document.createElement('div');
      card.className = 'also-card';

      var nameEl = document.createElement('p');
      nameEl.className = 'also-name';
      nameEl.textContent = n.name;

      var kwEl = document.createElement('p');
      kwEl.className = 'also-kw';
      for (var k = 0; k < n.keywords.length; k++) {
        if (k) kwEl.appendChild(document.createTextNode(' · '));
        var kwSpan = document.createElement('span');
        kwSpan.textContent = n.keywords[k];
        kwEl.appendChild(kwSpan);
      }

      var lineEl = document.createElement('p');
      lineEl.className = 'also-line';
      lineEl.textContent = styleText(n.vibe);

      card.appendChild(nameEl);
      card.appendChild(kwEl);
      card.appendChild(lineEl);
      el.also.appendChild(card);
    }
  }

  function renderResult() {
    var profile = Scoring.buildProfile(state.answers);
    var matched = Scoring.match(profile, NAMES, state.pref);
    if (!matched.main) return;                 // 数据缺失时不动页面

    var name = matched.main;

    /* 主题色：按用户主维度切换 */
    var themeClass = 'theme-' + profile.order[0];
    el.screen.className = 'screen screen--result ' + themeClass;

    el.name.textContent = name.name;
    el.pron.textContent = name.pronunciation_zh;
    el.tags.textContent = DIMENSION_LABELS[profile.order[0]] + ' × ' + DIMENSION_LABELS[profile.order[1]];

    el.keywords.innerHTML = '';
    for (var i = 0; i < name.keywords.length; i++) {
      el.keywords.appendChild(kwPill(name.keywords[i], 'kw'));
    }

    el.meaning.innerHTML = '含义：' + richText(name.meaning);
    el.origin.innerHTML = '来源：' + richText(name.origin);

    if (name.note) {
      el.note.hidden = false;
      el.note.innerHTML = '说明：' + richText(name.note);
    } else {
      el.note.hidden = true;
      el.note.innerHTML = '';
    }

    var analysis = buildAnalysis(profile, name);
    el.about.textContent = styleText(analysis);
    el.whyLabel.textContent = 'WHY ' + name.name.toUpperCase();
    el.why.textContent = styleText(name.reason);

    renderAlso(matched.alternates);

    lastResult = {
      profile: profile,
      name: name,
      alternates: matched.alternates,
      analysis: analysis,
      tags: el.tags.textContent
    };

    return lastResult;
  }

  /* ---------- 7. 保存图片 / 复制文字 / 分享 ---------- */

  var saveBtn = document.getElementById('save-btn');
  var copyBtn = document.getElementById('copy-btn');
  var shareBtn = document.getElementById('share-btn');
  var overlay = document.getElementById('img-overlay');
  var overlayImg = document.getElementById('img-overlay-img');

  function cardPayload() {
    if (!lastResult) return null;
    return {
      name: lastResult.name,
      theme: lastResult.profile.order[0],
      tags: lastResult.tags,
      analysis: lastResult.analysis
    };
  }

  function buildShareText() {
    var r = lastResult;
    return '我在 Find Your English Name 测出的英文名是：' + r.name.name +
      '（' + r.name.pronunciation_zh + '）\n' +
      '人格标签：' + r.tags + '\n' +
      '关键词：' + r.name.keywords.join(' · ') + '\n' +
      '一句话：' + r.name.tagline + '\n' +
      '你也来测测：' + window.location.href;
  }

  /* 复制：优先 clipboard API，失败时用隐藏 textarea + execCommand 兜底 */
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return Promise.reject(new Error('clipboard unavailable'));
  }

  function showOverlay(canvas) {
    overlayImg.src = canvas.toDataURL('image/png');
    overlay.hidden = false;
  }

  function hideOverlay() {
    overlay.hidden = true;
    overlayImg.removeAttribute('src');
  }

  document.getElementById('img-overlay-close').addEventListener('click', hideOverlay);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) hideOverlay();
  });

  saveBtn.addEventListener('click', function () {
    var payload = cardPayload();
    if (!payload) return;

    ShareCard.render(payload).then(function (canvas) {
      var ua = navigator.userAgent;
      var isWeChat = /MicroMessenger/i.test(ua);
      var isIOS = /iPad|iPhone|iPod/.test(ua);
      var canDownload = 'download' in document.createElement('a');
      if (isWeChat || isIOS || !canDownload) {
        showOverlay(canvas);            // 微信 / iOS：弹图，提示长按保存
        return;
      }
      return ShareCard.download(canvas, payload).then(function () {
        toast('图片已开始下载');
      });
    }).catch(function () {
      toast('生成图片失败，请再试一次');
    });
  });

  copyBtn.addEventListener('click', function () {
    if (!lastResult) return;
    var text = buildShareText();
    copyText(text).then(function () {
      toast('已复制');
    }).catch(function () {
      if (legacyCopy(text)) toast('已复制');
      else toast('复制失败，请手动选择文字');
    });
  });

  /* 不支持系统分享的浏览器直接隐藏「分享」按钮 */
  if (!navigator.share) {
    shareBtn.hidden = true;
    var secondary = document.querySelector('.result-secondary');
    if (secondary) secondary.classList.add('is-single');
  }

  shareBtn.addEventListener('click', function () {
    var payload = cardPayload();
    if (!payload || !navigator.share) return;

    ShareCard.render(payload).then(function (canvas) {
      return ShareCard.toBlob(canvas).then(function (blob) {
        var file = new File([blob], ShareCard.fileName(payload), { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          return navigator.share({
            files: [file],
            title: 'Find Your English Name',
            text: buildShareText()
          });
        }
        return navigator.share({
          title: 'Find Your English Name',
          text: buildShareText(),
          url: window.location.href
        });
      });
    }).catch(function (err) {
      if (err && err.name === 'AbortError') return;   // 用户自己取消，不提示
      toast('分享没成功，可以改用「保存结果图片」');
    });
  });

  /* ---------- 8. 开始测试 / 重新测试 ---------- */

  document.getElementById('start-btn').addEventListener('click', function () {
    saveState();
    showScreen('quiz');
    renderQuestion();
  });

  document.getElementById('restart-btn').addEventListener('click', function () {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* 忽略 */
    }
    state = defaultState();
    lastResult = null;
    locked = false;
    renderPref();
    hideOverlay();
    showScreen('home');
  });

  /* ---------- 9. 初始化 ---------- */

  renderPref();

  var answered = 0;
  for (var a = 0; a < TOTAL; a++) {
    if (state.answers[a]) answered += 1;
  }

  if (answered === TOTAL) {
    renderResult();          // 答完 10 题后刷新：直接回到结果页，结果恒定
    showScreen('result');
  } else if (answered > 0 || state.index > 0) {
    showScreen('quiz');      // 刷新后回到之前的答题位置
    renderQuestion();
  } else {
    showScreen('home');
  }
})();
