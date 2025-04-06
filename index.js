const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const { URL } = require("url");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const visited = new Set();

async function crawl(url, depth = 2, base = null, flow = {}) {
  if (depth === 0 || visited.has(url)) return;
  visited.add(url);

  const baseUrl = base || new URL(url).origin;
  flow[url] = [];

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
    );

    await page.setJavaScriptEnabled(true);

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await page.waitForSelector("body", { timeout: 15000 });

    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a"));
      const hrefs = anchors
        .map((a) => a.getAttribute("href"))
        .filter((href) => href && !href.startsWith("#") && !href.startsWith("javascript:"));

      const absoluteLinks = hrefs.map((href) => {
        try {
          return new URL(href, window.location.href).href;
        } catch {
          return null;
        }
      }).filter(Boolean);

      return Array.from(new Set(absoluteLinks));
    });

    await browser.close();

    const filteredLinks = links.filter((href) => href.startsWith(baseUrl));
    flow[url] = filteredLinks;

    for (const link of filteredLinks) {
      await crawl(link, depth - 1, baseUrl, flow);
    }
  } catch (err) {
    console.error(`❌ Error crawling ${url}:`, err.message);
  }

  return flow;
}

app.post("/analyze", async (req, res) => {
  visited.clear();
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({
      error: "A valid URL is required (must start with http or https)",
    });
  }

  try {
    const flow = await crawl(url, 2);
    res.json({
      url,
      pages: Object.keys(flow).length,
      flow,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

app.get("/", (req, res) => {
  res.send("🌐 Website Flow Analyzer API is running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
