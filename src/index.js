const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="sl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hello from Claude Code</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          text-align: center;
          background: white;
          padding: 3rem;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        h1 {
          color: #333;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Hello from Claude Code on Android! 🚀</h1>
        <p>Spletna aplikacija uspešno teče na portu ${PORT}</p>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`🚀 Strežnik teče na http://localhost:${PORT}`);
  console.log(`Pritisnite CTRL+C za ustavitev strežnika`);
});
