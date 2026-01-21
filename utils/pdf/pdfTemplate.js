export const buildNotesHtmlTemplate = ({ title, subtitle, html }) => `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body{font-family:Arial,sans-serif;padding:40px;color:#111;line-height:1.7;}
    .header{text-align:center;margin-bottom:20px;}
    .title{font-size:24px;font-weight:700;margin:0;}
    .subtitle{font-size:13px;color:#666;margin-top:6px;}
    .divider{height:1px;background:#e5e5e5;margin:18px 0 28px 0;}

    h1{font-size:22px;margin:0 0 10px 0;}
    h2{font-size:18px;margin:18px 0 8px 0;padding-top:10px;border-top:1px solid #eee;}
    h3{font-size:15px;margin:14px 0 6px 0;}
    ul{margin:8px 0 10px 0;padding-left:20px;}
    li{margin-bottom:6px;}
    p{margin:8px 0;}

    .footer{
      position:fixed;bottom:18px;left:40px;right:40px;
      font-size:11px;color:#888;display:flex;justify-content:space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <p class="title">${title || "Document"}</p>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ""}
  </div>
  <div class="divider"></div>

  <div class="content">${html || ""}</div>

  <div class="footer">
    <span>College-Nerd</span>
    <span>${new Date().toLocaleString()}</span>
  </div>
</body>
</html>
`;
