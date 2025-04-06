const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Website Flow Analyzer is live. Use POST /analyze with { "url": "https://example.com" }');
});

app.post('/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const visited = new Set();
    const flow = {};
    const queue = [url];
    const maxPages = 10;

    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    while (queue.length > 0 && visited.size < maxPages) {
      const currentUrl = queue.shift();
      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      try {
        await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const links = await page.$$eval('a[href]', anchors =>
          anchors.map(a => a.href).filter(href => href.startsWith(location.origin))
        );
        flow[currentUrl] = links;
        links.forEach(link => {
          if (!visited.has(link)) queue.push(link);
        });
      } catch (err) {
        flow[currentUrl] = [];
      }
    }

    await browser.close();

    res.json({
      url,
      pages: visited.size,
      flow
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
