const fs = require('fs');
const path = require('path');

const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');

if (fs.existsSync(distIndexPath)) {
  let html = fs.readFileSync(distIndexPath, 'utf8');

  // Replace default viewport with mobile viewport-fit=cover and PWA meta tags
  const pwaMeta = `
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
    <title>UPI Tracker • Expense Management</title>

    <!-- Apple iOS Web App & PWA Meta Tags -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="UPI Tracker" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#07080B" />
    <meta name="description" content="Production-grade cross-platform UPI Expense Tracker with Apple Cupertino Design" />
    <link rel="apple-touch-icon" href="/favicon.ico" />
  `;

  const touchStyle = `
    <style id="expo-reset">
      *, *::before, *::after {
        -webkit-tap-highlight-color: transparent !important;
        -webkit-touch-callout: none;
        box-sizing: border-box;
      }
      html, body {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: #07080B;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif;
        user-select: none;
        -webkit-user-select: none;
        overscroll-behavior: none;
        -webkit-font-smoothing: antialiased;
      }
      input, textarea {
        user-select: text !important;
        -webkit-user-select: text !important;
      }
      #root {
        display: flex;
        height: 100%;
        width: 100%;
        flex: 1;
        overflow: hidden;
      }
      ::-webkit-scrollbar {
        width: 0px;
        height: 0px;
      }
    </style>
  `;

  // Replace standard viewport and style reset
  html = html.replace(/<meta name="viewport"[^>]*>/i, pwaMeta);
  html = html.replace(/<style id="expo-reset">[\s\S]*?<\/style>/i, touchStyle);

  fs.writeFileSync(distIndexPath, html, 'utf8');
  console.log('Successfully injected PWA meta tags & mobile touch styles into dist/index.html');
} else {
  console.warn('dist/index.html not found to inject PWA meta.');
}
