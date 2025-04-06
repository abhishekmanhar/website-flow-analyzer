const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const { URL } = require("url");

const app = express();
app.use(cors());
app.use(express.json());

const MAX_PAGES = 10;
const TIMEOUT = 10000;

async function crawl(startUrl) {
  const visited = new Set();
  const flow = {};
  const queue = [startUrl];
  const domain = new URL(startUrl).hostname;

  const browser = await puppeteer.launch({
    headless: "new", // Use the new headless mode
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64)");

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue;

    visited.add(currentUrl);
    flow[currentUrl] = [];

    try {
      await page.goto(currentUrl, { timeout: TIMEOUT, waitUntil: "domcontentloaded" });

      const links = await page.$$eval("a", anchors =>
        anchors.map(a => a.href).filter(h => h.startsWith("http"))
      );

      const internalLinks = links.filter(h => {
        const linkHost = new URL(h).hostname;
        return linkHost === domain;
      });

      for (let link of internalLinks.slice(0, 5)) {
        if (!visited.has(link) && !queue.includes(link)) queue.push(link);
        flow[currentUrl].push(link);
      }
    } catch (err) {
      console.error(`Failed to crawl ${currentUrl}:`, err.message);
    }
  }

  await browser.close();
  return flow;
}

app.post("/analyze", async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const flow = await crawl(url);
    res.json({
      url,
      pages: Object.keys(flow).length,
      flow
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
