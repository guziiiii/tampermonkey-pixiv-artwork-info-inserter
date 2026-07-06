// ==UserScript==
// @name         Pixiv Artwork Info Inserter
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  在 Pixiv 作品详情页以可拖拽悬浮面板显示作品信息（标题/PID/作者/UID），默认收起为小按钮不遮挡内容，点击展开，支持复制与 ExHentai 搜索。
// @author       YourName
// @match        https://www.pixiv.net/artworks/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
  "use strict";

  console.log("[Pixiv Info] Script loaded, v2.5");

  // ===================================================================
  // 1. 🎨 样式（Pixiv 柔和蓝 #3578C0）
  // ===================================================================
  GM_addStyle(`
    #pixiv-info-inserter {
      position: fixed !important;
      z-index: 999999 !important;
      cursor: move !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      top: 90px;
      right: 20px;
    }
    #pixiv-info-inserter.pii-dragging * { pointer-events: none !important; }
    #pixiv-info-inserter .pii-btn-fab {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 8px 14px; border-radius: 22px; background: #3578C0;
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.3);
      box-shadow: 0 4px 16px rgba(53,120,192,0.3); color: #fff;
      font-size: 13px; font-weight: 600; letter-spacing: 0.5px;
      white-space: nowrap; cursor: pointer;
      transition: box-shadow 0.25s ease, transform 0.15s ease;
    }
    #pixiv-info-inserter .pii-btn-fab:hover {
      box-shadow: 0 6px 22px rgba(53,120,192,0.5); transform: scale(1.04);
    }
    [data-theme="dark"] #pixiv-info-inserter .pii-btn-fab {
      background: linear-gradient(135deg, #3578C0, #2A5FA0);
    }
    #pixiv-info-inserter .pii-panel {
      display: none; width: 280px; max-height: calc(100vh - 140px);
      overflow-y: auto; padding: 0; background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      border-radius: 14px; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.25); color: #fff;
      font-size: 14px; line-height: 1.7; cursor: auto;
    }
    [data-theme="dark"] #pixiv-info-inserter .pii-panel {
      background: rgba(15, 15, 30, 0.95); border-color: rgba(255, 255, 255, 0.08);
    }
    #pixiv-info-inserter .pii-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.15);
      cursor: move; background: linear-gradient(135deg, #3578C0, #2A5FA0);
      border-radius: 14px 14px 0 0;
    }
    [data-theme="dark"] #pixiv-info-inserter .pii-header {
      background: linear-gradient(135deg, #2E6BBA, #2050A0);
      border-bottom-color: rgba(255,255,255,0.06);
    }
    #pixiv-info-inserter .pii-header-title { font-weight: 600; font-size: 13px; color: #fff; display: flex; align-items: center; gap: 6px; }
    #pixiv-info-inserter .pii-header-close { cursor: pointer; width: 26px; height: 26px; border-radius: 50%; border: none; background: rgba(255,255,255,0.18); color: #fff; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: background 0.2s ease; }
    #pixiv-info-inserter .pii-header-close:hover { background: rgba(255, 80, 80, 0.5); }
    #pixiv-info-inserter .pii-body { padding: 14px; }
    #pixiv-info-inserter .pii-line { cursor: pointer; margin-bottom: 6px; padding: 6px 10px; border-radius: 6px; background: rgba(255, 255, 255, 0.88); color: #1f1f1f; font-weight: 500; display: flex; justify-content: space-between; align-items: center; transition: all 0.25s ease; position: relative; }
    [data-theme="dark"] #pixiv-info-inserter .pii-line { background: rgba(35, 35, 55, 0.9); color: #e0e0e0; }
    #pixiv-info-inserter .pii-line:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    #pixiv-info-inserter .pii-line.flash { background: rgba(80, 255, 180, 0.3) !important; color: #3AFFCE !important; }
    #pixiv-info-inserter .pii-toast { position: absolute; top: -24px; left: 50%; transform: translateX(-50%); padding: 3px 10px; font-size: 12px; color: #fff; background: rgba(0, 200, 100, 0.95); border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); opacity: 0; transition: opacity 0.3s ease; white-space: nowrap; pointer-events: none; }
    #pixiv-info-inserter .pii-group { background: linear-gradient(145deg, rgba(53,120,192,0.10), rgba(42,95,160,0.08)); border-radius: 10px; padding: 12px 16px; margin-bottom: 14px; }
    [data-theme="dark"] #pixiv-info-inserter .pii-group { background: linear-gradient(145deg, rgba(42,100,170,0.12), rgba(30,78,145,0.08)); }
    #pixiv-info-inserter .pii-btn-group { background: linear-gradient(145deg, rgba(53,120,192,0.08), rgba(45,105,172,0.05)); border-radius: 10px; padding: 12px 16px; display: flex; flex-wrap: wrap; gap: 10px; }
    [data-theme="dark"] #pixiv-info-inserter .pii-btn-group { background: linear-gradient(145deg, rgba(42,100,170,0.10), rgba(30,78,145,0.06)); }
    #pixiv-info-inserter .pii-btn { padding: 8px 16px; border-radius: 6px; background: rgba(53,120,192,0.6); color: #fff; border: 1px solid rgba(255,255,255,0.3); cursor: pointer; transition: all 0.3s ease; font-size: 13px; }
    #pixiv-info-inserter .pii-btn:hover { background: rgba(53,120,192,0.35); }
    #pixiv-info-inserter .pii-copy-all { cursor: pointer; margin-top: 8px; padding: 6px 10px; border-radius: 6px; background: rgba(255, 255, 255, 0.88); color: #1f1f1f; font-weight: 500; display: flex; justify-content: space-between; align-items: center; transition: all 0.25s ease; position: relative; }
    [data-theme="dark"] #pixiv-info-inserter .pii-copy-all { background: rgba(35, 35, 55, 0.9); color: #e0e0e0; }
  `);

  // ===================================================================
  // 2. 📋 剪贴板（三阶回退）
  // ===================================================================
  function copyText(text) {
    if (typeof GM_setClipboard !== "undefined") { GM_setClipboard(text, "text"); }
    else if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).catch(function () {}); }
    else { var ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} document.body.removeChild(ta); }
    console.log("[Pixiv Info] Copied:", text);
  }

  // ===================================================================
  // 3. 🏗️ UI 构建函数
  // ===================================================================
  function showToast(parentEl, message) {
    var toast = document.createElement("div"); toast.className = "pii-toast"; toast.textContent = message;
    parentEl.appendChild(toast);
    requestAnimationFrame(function () { toast.style.opacity = "1"; });
    setTimeout(function () { toast.style.opacity = "0"; setTimeout(function () { if (toast.parentNode) toast.remove(); }, 300); }, 1000);
  }

  function makeLine(label, value) {
    var line = document.createElement("div"); line.className = "pii-line"; line.title = "点击复制 " + label;
    var displayText = Array.isArray(value) ? label + ": " + value.join(", ") : label + ": " + value;
    var textSpan = document.createElement("span"); textSpan.textContent = displayText;
    var iconSpan = document.createElement("span"); iconSpan.textContent = "\uD83D\uDCCB"; iconSpan.style.opacity = "0.7"; iconSpan.style.marginLeft = "10px";
    line.appendChild(textSpan); line.appendChild(iconSpan);
    line.addEventListener("click", function (e) { e.stopPropagation(); var copiedText = Array.isArray(value) ? value.join("\n") : String(value); copyText(copiedText); line.classList.add("flash"); showToast(line, "✔ 已复制"); setTimeout(function () { line.classList.remove("flash"); }, 1200); });
    return line;
  }

  function createCopyAllLine(infoGroup) {
    var line = document.createElement("div"); line.className = "pii-copy-all"; line.title = "点击复制所有信息";
    var textSpan = document.createElement("span"); textSpan.textContent = "一键复制所有信息";
    var iconSpan = document.createElement("span"); iconSpan.textContent = "\uD83D\uDCCB"; iconSpan.style.opacity = "0.7"; iconSpan.style.marginLeft = "10px";
    line.appendChild(textSpan); line.appendChild(iconSpan);
    line.addEventListener("click", function (e) { e.stopPropagation(); var resultLines = []; infoGroup.querySelectorAll(".pii-line").forEach(function (l) { var span = l.querySelector("span"); if (span && span.textContent.indexOf(":") !== -1) { resultLines.push(span.textContent); } }); copyText(resultLines.join("\n")); iconSpan.textContent = "✅"; showToast(line, "✔ 所有信息已复制"); setTimeout(function () { iconSpan.textContent = "\uD83D\uDCCB"; }, 1200); });
    return line;
  }

  function makeButton(text, onClick) {
    var btn = document.createElement("button"); btn.className = "pii-btn"; btn.textContent = text;
    btn.addEventListener("click", function (e) { e.stopPropagation(); onClick(); });
    return btn;
  }

  // ===================================================================
  // 4. 🧬 DOM 数据提取
  // ===================================================================
  function extractData() {
    var pid = window.location.pathname.split("/").pop();
    var title = "未知作品";
    var h1 = document.querySelector("h1");
    if (h1 && h1.textContent && h1.textContent.trim()) { title = h1.textContent.trim(); }
    else { var t = document.title.split(" - "); title = t[0] ? t[0].replace(/^#[^\s]+\s*/, "").trim() : title; }
    var authorName = "未知作者";
    var tParts = document.title.split(" - ");
    if (tParts.length > 1) authorName = tParts[1].trim();
    authorName = authorName.replace(/[的の](插画|动图|漫画|小说|投稿|模写|作品|文章|創作|イラスト|マンガ|うごイラ|絵)$/, "");
    var authorUid = "未知";
    var anchors = document.querySelectorAll("a[href*='/users/']");
    for (var i = 0; i < anchors.length; i++) { var m = anchors[i].getAttribute("href").match(/\/users\/(\d+)/); if (m) { authorUid = m[1]; break; } }
    console.log("[Pixiv Info] DOM extracted:", { title: title, pid: pid, author: authorName, uid: authorUid });
    return { title: title, pid: pid, authorName: authorName, authorUid: authorUid };
  }

  // ===================================================================
  // 5. 🧩 面板构建：收起按钮 / 展开面板
  // ===================================================================
  function buildWidget(data) {
    var widget = document.createElement("div"); widget.id = "pixiv-info-inserter";
    var fab = document.createElement("div"); fab.className = "pii-btn-fab"; fab.innerHTML = "\uD83D\uDCCB PIXIV";
    var panel = document.createElement("div"); panel.className = "pii-panel";
    var header = document.createElement("div"); header.className = "pii-header";
    var headerTitle = document.createElement("span"); headerTitle.className = "pii-header-title"; headerTitle.innerHTML = "\uD83D\uDCCB Pixiv Info";
    var closeBtn = document.createElement("button"); closeBtn.className = "pii-header-close"; closeBtn.innerHTML = "\u2715"; closeBtn.title = "收起面板";
    header.appendChild(headerTitle); header.appendChild(closeBtn);
    var body = document.createElement("div"); body.className = "pii-body";
    var infoGroup = document.createElement("div"); infoGroup.className = "pii-group";
    infoGroup.appendChild(makeLine("作品名称", data.title)); infoGroup.appendChild(makeLine("PID", data.pid));
    infoGroup.appendChild(makeLine("作者名", data.authorName)); infoGroup.appendChild(makeLine("UID", data.authorUid));
    infoGroup.appendChild(createCopyAllLine(infoGroup));
    var buttonGroup = document.createElement("div"); buttonGroup.className = "pii-btn-group";
    buttonGroup.appendChild(makeButton("uid ->", function () { window.open("https://exhentai.org/?f_search=" + encodeURIComponent(data.authorUid), "_blank"); }));
    buttonGroup.appendChild(makeButton("name->", function () { window.open("https://exhentai.org/?f_search=" + encodeURIComponent(data.authorName), "_blank"); }));
    body.appendChild(infoGroup); body.appendChild(buttonGroup); panel.appendChild(header); panel.appendChild(body);
    widget.appendChild(fab); widget.appendChild(panel);
    function expand() { fab.style.display = "none"; panel.style.display = "block"; widget.style.cursor = "auto"; }
    function collapse() { fab.style.display = "flex"; panel.style.display = "none"; widget.style.cursor = "move"; }
    closeBtn.addEventListener("click", function (e) { e.stopPropagation(); collapse(); });
    collapse();
    widget._toggle = function () { if (panel.style.display === "none" || !panel.style.display) { expand(); } else { collapse(); } };
    return widget;
  }

  // ===================================================================
  // 6. 🖱️ 拖拽逻辑
  // ===================================================================
  function setupDrag(widget, fab, header) {
    var savedLeft = parseFloat(GM_getValue("piiLeft", "NaN")), savedTop = parseFloat(GM_getValue("piiTop", "NaN"));
    if (!isNaN(savedLeft) && !isNaN(savedTop)) { widget.style.left = savedLeft + "px"; widget.style.top = savedTop + "px"; widget.style.right = "auto"; }
    var dragState = null;
    function onStart(e) { var target = e.target; if (target.closest && (target.closest(".pii-line") || target.closest(".pii-btn") || target.closest(".pii-header-close") || target.closest(".pii-copy-all"))) { return; } var clientX = e.clientX, clientY = e.clientY; if (e.touches) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } var rect = widget.getBoundingClientRect(); dragState = { startX: clientX, startY: clientY, startLeft: rect.left, startTop: rect.top, moved: false }; widget.classList.add("pii-dragging"); e.preventDefault(); }
    function onMove(e) { if (!dragState) return; var clientX = e.clientX, clientY = e.clientY; if (e.touches) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } var dx = clientX - dragState.startX, dy = clientY - dragState.startY; if (Math.abs(dx) > 3 || Math.abs(dy) > 3) { dragState.moved = true; } if (dragState.moved) { var newLeft = dragState.startLeft + dx, newTop = dragState.startTop + dy; var maxLeft = window.innerWidth - widget.offsetWidth - 10, maxTop = window.innerHeight - widget.offsetHeight - 10; newLeft = Math.max(10, Math.min(newLeft, maxLeft)); newTop = Math.max(10, Math.min(newTop, maxTop)); widget.style.left = newLeft + "px"; widget.style.top = newTop + "px"; widget.style.right = "auto"; } }
    function onEnd() { if (dragState) { widget.classList.remove("pii-dragging"); if (dragState.moved) { var rect = widget.getBoundingClientRect(); GM_setValue("piiLeft", rect.left); GM_setValue("piiTop", rect.top); } if (!dragState.moved) { widget._toggle(); } dragState = null; } }
    fab.addEventListener("mousedown", onStart); fab.addEventListener("touchstart", onStart, { passive: false });
    header.addEventListener("mousedown", onStart); header.addEventListener("touchstart", onStart, { passive: false });
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onMove, { passive: false }); document.addEventListener("touchend", onEnd);
    window.addEventListener("resize", function () { var rect = widget.getBoundingClientRect(); var maxLeft = window.innerWidth - rect.width - 10, maxTop = window.innerHeight - rect.height - 10; if (rect.left > maxLeft) { widget.style.left = maxLeft + "px"; widget.style.right = "auto"; } if (rect.top > maxTop) { widget.style.top = maxTop + "px"; } });
  }

  // ===================================================================
  // 7. 🚀 注入
  // ===================================================================
  function inject() { if (document.getElementById("pixiv-info-inserter")) return true; if (!document.body) return false; var data = extractData(); var widget = buildWidget(data); var fab = widget.querySelector(".pii-btn-fab"), header = widget.querySelector(".pii-header"); document.body.appendChild(widget); setupDrag(widget, fab, header); console.log("[Pixiv Info] Widget appended to body"); return true; }

  // ===================================================================
  // 8. 🔭 启动（轮询 + SPA）
  // ===================================================================
  var _intervalId = null, _injected = false;
  function start() { console.log("[Pixiv Info] Starting..."); if (document.body && inject()) { _injected = true; return; } _intervalId = setInterval(function () { if (_injected) return; if (document.body && inject()) { _injected = true; clearInterval(_intervalId); _intervalId = null; } }, 500); setTimeout(function () { if (!_injected) { console.warn("[Pixiv Info] Giving up after 30s."); if (_intervalId) { clearInterval(_intervalId); _intervalId = null; } } }, 30000); }
  var lastPathname = location.pathname;
  var spaObserver = new MutationObserver(function () { if (location.pathname !== lastPathname) { console.log("[Pixiv Info] SPA route changed:", lastPathname, "->", location.pathname); lastPathname = location.pathname; var old = document.getElementById("pixiv-info-inserter"); if (old) old.remove(); _injected = false; start(); } });
  if (document.body) { spaObserver.observe(document.body, { childList: true, subtree: true }); }
  console.log("[Pixiv Info] v2.5 starting on", location.href);
  start();
})();