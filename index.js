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
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    const links = await page.$$eval("a", (as) =>
      as
        .map((a) => a.href)
        .filter((href) => href && href.startsWith("http"))
    );

    await browser.close();

    const filteredLinks = Array.from(new Set(links)).filter((href) =>
      href.startsWith(baseUrl)
    );

    flow[url] = filteredLinks;

    for (const link of filteredLinks) {
      await crawl(link, depth - 1, baseUrl, flow);
    }
  } catch (err) {
    console.error(`Error crawling ${url}:`, err.message);
  }

  return flow;
}

app.post("/analyze", async (req, res) => {
  visited.clear();
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({
      error: "A valid URL is required (must start with http or https)"
    });
  }

  try {
    const flow = await crawl(url, 2);
    res.json({
      url,
      pages: Object.keys(flow).length,
      flow
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
