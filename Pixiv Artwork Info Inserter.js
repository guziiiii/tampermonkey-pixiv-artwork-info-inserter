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
    #pixiv-info-inserter.pii-dragging * {
      pointer-events: none !important;
    }

    #pixiv-info-inserter .pii-btn-fab {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 22px;
      background: #3578C0;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.3);
      box-shadow: 0 4px 16px rgba(53,120,192,0.3);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      white-space: nowrap;
      cursor: pointer;
      transition: box-shadow 0.25s ease, transform 0.15s ease;
    }
    #pixiv-info-inserter .pii-btn-fab:hover {
      box-shadow: 0 6px 22px rgba(53,120,192,0.5);
      transform: scale(1.04);
    }
    [data-theme="dark"] #pixiv-info-inserter .pii-btn-fab {
      background: linear-gradient(135deg, #3578C0, #2A5FA0);
    }

    #pixiv-info-inserter .pii-panel {
      display: none;
      width: 280px;
      max-height: calc(100vh - 140px);
      overflow-y: auto;
      padding: 0;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-radius: 14px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #fff;
      font-size: 14px;
      line-height: 1.7;
      cursor: auto;
    }
    [data-theme="dark"] #pixiv-info-inserter .pii-panel {
      background: rgba(15, 15, 30, 0.95);
      border-color: rgba(255, 255, 255, 0.08);
    }

    #pixiv-info-inserter .pii-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.15);
      cursor: move;
      background: linear-gradient(135deg, #3578C0, #2A5FA0);
      border-radius: 14px 14px 0 0;
    }
    [data-theme="dark"] #pixiv-info-inserter .pii-header {
      background: linear-gradient(135deg, #2E6BBA, #2050A0);
      border-bottom-color: rgba(255,255,255,0.06);
    }
    #pixiv-info-inserter .pii-header-title {
      font-weight: 600;
      font-size: 13px;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    #pixiv-info-inserter .pii-header-close {
      cursor: pointer;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,0.18);
      color: #fff;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    }
    #pixiv-info-inserter .pii-header-close:hover {
      background: rgba(255, 80, 80, 0.5);
    }

    #pixiv-info-inserter .pii-body { padding: 14px; }

    #pixiv-info-inserter .pii-line {
      cursor: pointer;
      margin-bottom: 6px;
      padding: 6px 10px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.88);
      color: #1f1f1f;
      font-weight: 500;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.25s ease;
      position: relative;
    }
    [data-theme="dark"] #pixiv-info-inserter .pii-line {
      background: rgba(35, 35, 55, 0.9);
      color: #e0e0e0;
    }
    #pixiv-info-inserter .pii-line:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    #pixiv-info-inserter .pii-line.flash {
      background: rgba(80, 255, 180, 0.3) !important;
      color: #3AFFCE !important;
    }

    #pixiv-info-inserter .pii-toast {
      position: absolute;
      top: -24px;
      left: 50%;
      transform: translateX(-50%);
      padding: 3px 10px;
      font-size: 12px;
      color: #fff;
      background: rgba(0, 200, 100, 0.95);
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      opacity: 0;
      transition: opacity 0.3s ease;
      white-space: nowrap;
      pointer-events: none;
    }

    #pixiv-info-inserter .pii-group {
      background: linear-gradient(145deg, rgba(53,120,192,0.10), rgba(42,95,160,0.08));
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 14px;
    }
    [data-theme="dark"] #pixiv-info-inserter .pii-group {
      background: linear-gradient(145deg, rgba(42,100,170,0.12), rgba(30,78,145,0.08));
    }

    #pixiv-info-inserter .pii-btn-group {
      background: linear-gradient(145deg, rgba(53,120,192,0.08), rgba(45,105,172,0.05));
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    [data-theme="dark"] #pixiv-info-inserter .pii-btn-group {
      background: linear-gradient(145deg, rgba(42,100,170,0.10), rgba(30,78,145,0.06));
    }
    #pixiv-info-inserter .pii-btn {
      padding: 8px 16px;
      border-radius: 6px;
      background: rgba(53,120,192,0.6);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.3);
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 13px;
    }
    #pixiv-info-inserter .pii-btn:hover {
      background: rgba(53,120,192,0.35);
    }

    #pixiv-info-inserter .pii-copy-all {
      cursor: pointer;
      margin-top: 8px;
      padding: 6px 10px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.88);
      color: #1f1f1f;
      font-weight: 500;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.25s ease;
      position: relative;
    }
    [data-theme="dark"] #pixiv-info-inserter .pii-copy-all {
      background: rgba(35, 35, 55, 0.9);
      color: #e0e0e0;
    }
  `);