/* =========================================================
   Find Your English Name · 分享卡片
   ---------------------------------------------------------
   画布 1080 × 1440（3:4），用 Canvas 2D 直接绘制，
   不截图、不依赖任何第三方库。
   依赖：scoring.js（DIMENSION_LABELS）、app.js 传入的结果对象
   ========================================================= */

var ShareCard = (function () {
  'use strict';

  var W = 1080;
  var H = 1440;

  var FONT_EN = '"Playfair Display", Georgia, "Times New Roman", serif';
  var FONT_ZH_SERIF = '"Noto Serif SC", "Songti SC", "SimSun", serif';
  var FONT_ZH_SANS = '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';

  /* 与 css/style.css 里的 .theme-* 一致 */
  var THEMES = {
    gentle: ['#F6D9DF', '#FBEBDD'],
    sunny: ['#FBE6B8', '#F9D7C2'],
    independent: ['#D4E4F2', '#E3E6EE'],
    elegant: ['#F6D3DB', '#DDD2F1', '#CFE2F2'],
    free: ['#D4E4F2', '#DCD3EE'],
    mysterious: ['#D9D0E6', '#BDBBD0'],
    rational: ['#DCE5E3', '#E8E4D8'],
    social: ['#F9D9CF', '#F6D3DB']
  };

  var INK = '#3A3340';
  var INK_2 = '#5F5566';

  /* ---------- 工具 ---------- */

  /* 逐字绘制，用来做「大字距」的英文小标签 */
  function drawSpaced(ctx, text, cx, y, spacing) {
    var widths = [];
    var total = 0;
    var i;
    for (i = 0; i < text.length; i++) {
      widths.push(ctx.measureText(text[i]).width);
      total += widths[i] + (i < text.length - 1 ? spacing : 0);
    }
    var x = cx - total / 2;
    for (i = 0; i < text.length; i++) {
      ctx.fillText(text[i], x + widths[i] / 2, y);
      x += widths[i] + spacing;
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth) {
    var lines = [];
    var line = '';
    for (var i = 0; i < text.length; i++) {
      var test = line + text[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = text[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  /* ---------- 绘制 ---------- */

  function draw(ctx, result) {
    var name = result.name;
    var theme = result.theme || 'gentle';
    var colors = THEMES[theme] || THEMES.gentle;

    /* 背景渐变 */
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    if (colors.length === 3) {
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(0.52, colors[1]);
      grad.addColorStop(1, colors[2]);
    } else {
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    /* 外圈细线边框 */
    ctx.save();
    ctx.strokeStyle = 'rgba(58, 51, 64, 0.16)';
    ctx.lineWidth = 2;
    roundRect(ctx, 44, 44, W - 88, H - 88, 40);
    ctx.stroke();
    ctx.restore();

    /* 少量装饰圆点 */
    var dots = [
      [196, 218, 7, 'rgba(255,255,255,0.55)'],
      [872, 300, 10, 'rgba(255,255,255,0.45)'],
      [806, 1122, 6, 'rgba(255,255,255,0.5)'],
      [268, 1218, 5, 'rgba(255,255,255,0.45)']
    ];
    ctx.save();
    for (var d = 0; d < dots.length; d++) {
      ctx.beginPath();
      ctx.fillStyle = dots[d][3];
      ctx.arc(dots[d][0], dots[d][1], dots[d][2], 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    /* 1. 顶部小标签 */
    ctx.fillStyle = INK_2;
    ctx.font = '500 26px ' + FONT_EN;
    drawSpaced(ctx, 'FIND YOUR ENGLISH NAME', W / 2, 150, 11);

    /* 2. YOUR ENGLISH NAME IS */
    ctx.font = '400 24px ' + FONT_EN;
    drawSpaced(ctx, 'YOUR ENGLISH NAME IS', W / 2, 300, 9);

    /* 3. 巨大的英文名（超宽时自动缩小） */
    var size = 250;
    ctx.font = '600 ' + size + 'px ' + FONT_EN;
    while (ctx.measureText(name.name).width > 880 && size > 110) {
      size -= 8;
      ctx.font = '600 ' + size + 'px ' + FONT_EN;
    }
    ctx.fillStyle = INK;
    ctx.fillText(name.name, W / 2, 500);

    /* 4. 中文发音 + 含义 */
    ctx.font = '400 36px ' + FONT_ZH_SANS;
    ctx.fillStyle = '#4B4353';
    ctx.fillText(name.pronunciation_zh + ' · ' + name.meaning, W / 2, 700);

    /* 5. 三个关键词 */
    ctx.font = '400 28px ' + FONT_ZH_SANS;
    ctx.fillStyle = INK_2;
    ctx.fillText(name.keywords.join(' · '), W / 2, 772);

    /* 6. 一句个性描述（斜体衬线） */
    ctx.font = 'italic 400 40px ' + FONT_ZH_SERIF;
    ctx.fillStyle = INK;
    var tagLines = wrapText(ctx, name.tagline, 760);
    var tagY = 880 - (tagLines.length - 1) * 30;
    for (var t = 0; t < tagLines.length; t++) {
      ctx.fillText(tagLines[t], W / 2, tagY + t * 60);
    }

    /* 7. 底部：短横线 + 品牌标识 */
    ctx.save();
    ctx.strokeStyle = 'rgba(58, 51, 64, 0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 60, 1180);
    ctx.lineTo(W / 2 + 60, 1180);
    ctx.stroke();
    ctx.restore();

    ctx.font = '400 27px ' + FONT_ZH_SERIF;
    ctx.fillStyle = INK_2;
    ctx.fillText('测一测，你最适合的英文名', W / 2, 1245);
  }

  /* ---------- 字体就绪 ---------- */

  function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var jobs = [
      document.fonts.load('600 250px "Playfair Display"'),
      document.fonts.load('400 26px "Playfair Display"'),
      document.fonts.load('italic 400 40px "Playfair Display"')
    ];
    var timeout = new Promise(function (resolve) { window.setTimeout(resolve, 1500); });
    /* 字体缺失时 1.5 秒后照常绘制（回退 Georgia / 宋体），不影响出图 */
    return Promise.race([Promise.all(jobs).catch(function () {}), timeout]);
  }

  /* ---------- 对外接口 ---------- */

  function render(result) {
    return ensureFonts().then(function () {
      var canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      var ctx = canvas.getContext('2d');
      draw(ctx, result);
      return canvas;
    });
  }

  function toBlob(canvas) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) { resolve(blob); }, 'image/png');
    });
  }

  function fileName(result) {
    return 'find-your-english-name-' + result.name.name + '.png';
  }

  function download(canvas, result) {
    return toBlob(canvas).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fileName(result);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    });
  }

  return {
    render: render,
    toBlob: toBlob,
    download: download,
    fileName: fileName
  };
})();
