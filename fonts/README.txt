字体文件夹（Playfair Display）

一、这个文件夹放什么
放 3 个 woff2 文件，文件名必须完全一致（大小写也要一致）：

  PlayfairDisplay-Regular.woff2     常规体（首页大字 A、小标签用）
  PlayfairDisplay-SemiBold.woff2    半粗体（结果页大名字用）
  PlayfairDisplay-Italic.woff2      斜体（分享卡片上的那句话用）

二、去哪里下载
推荐用 google-webfonts-helper（专门提供 woff2 的免费网站，国内一般能打开）：

  1. 打开 https://gwfh.mranftl.com/fonts/playfair-display
  2. 在 "Select styles" 里勾选：
       regular 400
       semibold 600
       italic 400
  3. 在 "Select charsets" 里只勾 "latin"（英文名只用拉丁字母，文件最小最快）
  4. 点 "Download files"（.zip）
  5. 解压后，把里面的 .woff2 文件按下面的对应关系改名，放进本文件夹：

       playfair-display-v37-latin-regular.woff2   →  PlayfairDisplay-Regular.woff2
       playfair-display-v37-latin-600.woff2       →  PlayfairDisplay-SemiBold.woff2
       playfair-display-v37-latin-italic.woff2    →  PlayfairDisplay-Italic.woff2

  （文件名里的 v37 之类的版本号可能不同，认准 regular / 600 / italic 就行。）

三、备用下载方式
  fonts.google.com/specimen/Playfair+Display → "Get font" → "Download all"
  解压后拿到的是 .ttf 静态字体，需要再用 https://gwfh.mranftl.com 或
  https://transfonter.org 转成 woff2，命名同上。

四、如果暂时没有这些文件
完全不影响使用：css/style.css 里已经写好备用字体
（Georgia / Times New Roman / serif），页面照常显示，功能不受影响。
补齐之后刷新页面，英文名会自动变成 Playfair Display 的效果。
