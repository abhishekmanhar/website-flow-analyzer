const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
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

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const baseUrl = base || new URL(url).origin;

    const links = new Set();
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      try {
        const absoluteUrl = new URL(href, url).href;
        if (absoluteUrl.startsWith(baseUrl)) {
          links.add(absoluteUrl);
        }
      } catch (err) {}
    });

    flow[url] = Array.from(links);

    for (const link of links) {
      await crawl(link, depth - 1, baseUrl, flow);
    }
  } catch (err) {
    console.error(`Error fetching ${url}:`, err.message);
  }

  return flow;
}

app.post("/analyze", async (req, res) => {
  visited.clear();
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "A valid URL is required (must start with http or https)" });
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
