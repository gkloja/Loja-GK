import express from "express";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import useragent from "express-useragent";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();

// ================================
// CONFIGURAÇÕES
// ================================
const PORT = process.env.PORT || 3000;
const MASK = "https://fabibot.onrender.com";
const BASE = "http://br2.bronxyshost.com:4009";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(useragent.express());
app.use(bodyParser.urlencoded({ extended: true }));

// ================================
// RATE LIMIT
// ================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Muitas requisições, tente mais tarde."
});
app.use(apiLimiter);

// ================================
// SEO
// ================================
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`
User-agent: *
Allow: /

Sitemap: ${MASK}/sitemap.xml
  `);
});

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");
  res.send(`
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${MASK}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${MASK}/assistir</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
  `);
});

// ================================
// PÁGINAS FIXAS
// ================================
app.get("/", (req, res) => {
  res.send(`<h1>FabiBot Online</h1><p>Servidor ativo com máscara Render.</p>`);
});

app.get("/assistir", (req, res) => {
  res.send(`<h1>Player carregado</h1><p>Use POST /assistir para tocar canais.</p>`);
});

// ================================
// PROXY UNIVERSAL - CORAÇÃO DA MÁSCARA
// ================================
app.use(async (req, res) => {
  try {
    const destino = BASE + req.originalUrl;

    console.log("Proxy →", destino);

    const proxied = await fetch(destino, {
      method: req.method,
      headers: {
        ...req.headers,
        host: "br2.bronxyshost.com",
        origin: BASE,
        referer: BASE
      },
      body:
        ["GET", "HEAD"].includes(req.method)
          ? null
          : req.is("application/json")
            ? JSON.stringify(req.body)
            : req.body,
      signal: AbortSignal.timeout(0) // sem timeout do render
    });

    // Copiar headers do servidor original
    proxied.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Stream direto (importante para IPTV)
    return proxied.body.pipe(res);

  } catch (err) {
    console.error("Erro no proxy:", err);

    res.status(503).send(`
      <h1>503 - Serviço Temporariamente Indisponível</h1>
      <p>Não foi possível conectar ao servidor principal.</p>
    `);
  }
});

// ================================
// START
// ================================
app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});