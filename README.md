# 🌐 Website Flow Analyzer API

This is a Node.js API built using Express and Puppeteer that analyzes the internal structure of a given website URL and returns a flow map showing which pages link to which other internal pages. It helps visualize how users might navigate through a site.

---

## 🔧 Features

- 🚀 Analyze and crawl any public website
- 🔗 Map internal page-to-page link structure
- 📊 JSON output with flow relationships
- ⚡️ Limit depth/pages for performance
- 🌍 CORS-enabled for frontend integrations
- 🖼 Optionally extend to flowchart output (Mermaid, SVG, etc.)

---

## 📦 Technologies Used

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Puppeteer](https://pptr.dev/)
- [Render](https://render.com/) or [Railway](https://railway.app/) for deployment

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/website-flow-analyzer.git
cd website-flow-analyzer

### 2. Install dependencies

```bash
npm install

### 3. Start the server

```bash
node index.js
