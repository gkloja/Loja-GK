import express from "express";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());

const BASE = "http://br2.bronxyshost.com:4009";
const MASK = "https://fabibot.onrender.com";

// ===== ROTAS ESPECIAIS PARA STREAMING =====

// Rota para o player principal - AGORA USA PROXY COMPLETO
app.get("/streampro", async (req, res) => {
  try {
    console.log(`🎬 StreamPro: Proxying para ${BASE}/streampro`);
    
    const headers = { 
      ...req.headers,
      "host": new URL(BASE).host,
      "origin": BASE,
      "referer": BASE + "/",
      "x-forwarded-for": req.ip,
      "x-real-ip": req.ip
    };
    
    delete headers["content-length"];
    
    const response = await fetch(BASE + "/streampro", {
      method: "GET",
      headers: headers,
      redirect: "manual"
    });
    
    // Tratar redirecionamentos
    const location = response.headers.get("location");
    if (location) {
      let redirectUrl = location;
      if (redirectUrl.startsWith("/")) {
        redirectUrl = MASK + redirectUrl;
      } else if (redirectUrl.startsWith(BASE)) {
        redirectUrl = redirectUrl.replace(BASE, MASK);
      }
      res.setHeader("Location", redirectUrl);
      return res.status(response.status).end();
    }
    
    // Copiar cookies
    const cookies = response.headers.raw()["set-cookie"];
    if (cookies) {
      cookies.forEach(cookie => {
        res.append("Set-Cookie", cookie);
      });
    }
    
    // Copiar outros headers
    const type = response.headers.get("content-type");
    if (type) res.setHeader("Content-Type", type);
    
    // Processar HTML para adicionar SEO
    if (type && type.includes("text/html")) {
      let html = await response.text();
      
      // Adicionar meta tag SEO
      if (html.includes('</head>')) {
        const verificationCode = '<meta name="google-site-verification" content="EQt18dIllZg0WnhSV58os4awAy0jsyxrLL3Yek09dYo" />';
        html = html.replace('</head>', verificationCode + '\n</head>');
      }
      
      // Corrigir links absolutos no HTML
      html = html.replace(new RegExp(BASE, 'g'), MASK);
      
      res.send(html);
    } else {
      res.send(await response.buffer());
    }
    
  } catch (error) {
    console.error("Erro ao carregar streampro:", error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erro no StreamPro</title>
        <meta name="google-site-verification" content="EQt18dIllZg0WnhSV58os4awAy0jsyxrLL3Yek09dYo" />
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
          .btn { display: inline-block; margin: 10px; padding: 10px 20px; 
                 background: #3498db; color: white; text-decoration: none; 
                 border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>⚠️ Erro no Player de Streaming</h1>
        <p>O serviço está temporariamente indisponível.</p>
        <div>
          <a href="/" class="btn">🏠 Página Inicial</a>
          <a href="${MASK}" class="btn" style="background: #00ffb3; color: #000;">🔄 Tentar Novamente</a>
        </div>
      </body>
      </html>
    `);
  }
});

// API para registrar reproduções
app.post("/api/streampro/reproducao/registrar", async (req, res) => {
  try {
    console.log("📊 Registrando reprodução...");
    
    const backendResponse = await fetch(BASE + "/api/streampro/reproducao/registrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": req.headers.cookie || "",
        "x-forwarded-for": req.ip,
        "user-agent": req.headers["user-agent"] || "Mozilla/5.0"
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await backendResponse.json();
    
    // Copiar cookies
    const setCookie = backendResponse.headers.raw()["set-cookie"];
    if (setCookie) {
      setCookie.forEach(cookie => {
        res.append("Set-Cookie", cookie);
      });
    }
    
    res.status(backendResponse.status).json(data);
  } catch (error) {
    console.error("Erro na API de registro:", error);
    res.status(500).json({ 
      success: false, 
      error: "Falha ao registrar reprodução",
      message: error.message 
    });
  }
});

// ===== API ADICIONAIS PARA STREAMING =====

// API para playlist
app.get("/api/streampro/playlist", async (req, res) => {
  try {
    const backendResponse = await fetch(BASE + "/api/streampro/playlist", {
      headers: {
        "Cookie": req.headers.cookie || "",
        "x-forwarded-for": req.ip
      }
    });
    
    const data = await backendResponse.json();
    
    const setCookie = backendResponse.headers.raw()["set-cookie"];
    if (setCookie) {
      setCookie.forEach(cookie => {
        res.append("Set-Cookie", cookie);
      });
    }
    
    res.status(backendResponse.status).json(data);
  } catch (error) {
    res.json({ 
      success: false, 
      playlist: [],
      error: "Erro ao carregar playlist"
    });
  }
});

// API para salvar na playlist
app.post("/api/streampro/playlist/salvar", async (req, res) => {
  try {
    const backendResponse = await fetch(BASE + "/api/streampro/playlist/salvar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": req.headers.cookie || "",
        "x-forwarded-for": req.ip
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await backendResponse.json();
    
    const setCookie = backendResponse.headers.raw()["set-cookie"];
    if (setCookie) {
      setCookie.forEach(cookie => {
        res.append("Set-Cookie", cookie);
      });
    }
    
    res.status(backendResponse.status).json(data);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: "Erro interno ao salvar na playlist"
    });
  }
});

// API para testar URL
app.post("/api/streampro/testar-url", async (req, res) => {
  try {
    const backendResponse = await fetch(BASE + "/api/streampro/testar-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": req.headers.cookie || "",
        "x-forwarded-for": req.ip
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await backendResponse.json();
    
    const setCookie = backendResponse.headers.raw()["set-cookie"];
    if (setCookie) {
      setCookie.forEach(cookie => {
        res.append("Set-Cookie", cookie);
      });
    }
    
    res.status(backendResponse.status).json(data);
  } catch (error) {
    res.json({ 
      success: false,
      valido: false,
      mensagem: `Erro ao testar URL: ${error.message}`
    });
  }
});

// Proxy para streams (importante para CORS)
app.get("/api/streampro/proxy", async (req, res) => {
  try {
    const { url, agente } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: "URL requerida" });
    }
    
    const backendResponse = await fetch(BASE + "/api/streampro/proxy?url=" + encodeURIComponent(url) + "&agente=" + (agente || 'vlc'), {
      headers: {
        "Cookie": req.headers.cookie || "",
        "x-forwarded-for": req.ip,
        "user-agent": req.headers["user-agent"] || "Mozilla/5.0"
      }
    });
    
    // Copiar headers
    const headersToCopy = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'cache-control'];
    headersToCopy.forEach(header => {
      const value = backendResponse.headers.get(header);
      if (value) res.setHeader(header, value);
    });
    
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', '*');
    
    // Stream dos dados
    backendResponse.body.pipe(res);
    
  } catch (error) {
    console.error('Erro no proxy de stream:', error);
    res.status(500).json({ 
      error: "Erro ao acessar stream",
      detalhes: error.message
    });
  }
});

// ===== ROTA ESPECIAL PARA /alterar-foto =====
app.post("/alterar-foto", async (req, res) => {
  console.log("📤 Encaminhando upload para backend original...");
  
  try {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    
    if (req.body && req.body.fotoUrl) {
      console.log("📸 Convertendo base64 para arquivo...");
      
      const base64Data = req.body.fotoUrl;
      const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const extension = mimeType.split('/')[1] || 'jpg';
        const filename = req.body.filename || `foto-${Date.now()}.${extension}`;
        
        form.append('fotoFile', buffer, {
          filename: filename,
          contentType: mimeType
        });
      } else {
        form.append('fotoUrl', base64Data);
      }
    } else {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nenhuma foto fornecida!"
      });
    }
    
    const backendResponse = await fetch(BASE + "/alterar-foto", {
      method: "POST",
      headers: {
        "Cookie": req.headers.cookie || "",
        ...form.getHeaders()
      },
      body: form
    });
    
    const data = await backendResponse.json();
    console.log("📥 Resposta do backend:", data.sucesso ? '✅' : '❌');
    
    const setCookie = backendResponse.headers.raw()["set-cookie"];
    if (setCookie) {
      setCookie.forEach(cookie => {
        res.append("Set-Cookie", cookie);
      });
    }
    
    res.status(backendResponse.status).json(data);
    
  } catch (error) {
    console.error("❌ Erro ao processar upload:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao processar foto: " + error.message
    });
  }
});

// ===== ROTA PARA API DE MÚSICAS =====
app.post("/play", async (req, res) => {
  try {
    const backendResponse = await fetch(BASE + "/play", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": req.headers.cookie || ""
      },
      body: JSON.stringify(req.body)
    });

    const data = await backendResponse.json();
    
    const setCookie = backendResponse.headers.raw()["set-cookie"];
    if (setCookie) {
      setCookie.forEach(cookie => {
        res.append("Set-Cookie", cookie);
      });
    }
    
    res.status(backendResponse.status).json(data);
    
  } catch (error) {
    console.error("Music API error:", error);
    res.status(500).json({ error: "Falha na API de músicas" });
  }
});

// ========== CONFIGURAÇÃO SEO COMPLETA ==========
app.use((req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(body) {
    if (typeof body === 'string' && body.includes('</head>')) {
      const verificationCode = '<meta name="google-site-verification" content="EQt18dIllZg0WnhSV58os4awAy0jsyxrLL3Yek09dYo" />';
      body = body.replace('</head>', verificationCode + '\n</head>');
    }
    
    originalSend.call(this, body);
  };
  
  next();
});

app.get("/google-verification.html", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Google Verification</title>
    <meta name="google-site-verification" content="EQt18dIllZg0WnhSV58os4awAy0jsyxrLL3Yek09dYo" />
</head>
<body>
    <h1>Google Search Console Verification</h1>
    <p>Site: https://fabibot.onrender.com</p>
</body>
</html>
  `);
});

// 1. Robots.txt
app.get("/robots.txt", (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: https://fabibot.onrender.com/sitemap.xml

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

# Block AI scrapers
User-agent: ChatGPT-User
Disallow: /
User-agent: GPTBot
Disallow: /
User-agent: CCBot
Disallow: /`);
});

// 2. Sitemap.xml (adicionar streaming)
app.get("/sitemap.xml", (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <!-- PÁGINA PRINCIPAL -->
  <url>
    <loc>https://fabibot.onrender.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- STREAMING -->
  <url>
    <loc>https://fabibot.onrender.com/streampro</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- LOGIN -->
  <url>
    <loc>https://fabibot.onrender.com/login</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- CADASTRO -->
  <url>
    <loc>https://fabibot.onrender.com/register</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- CHAT -->
  <url>
    <loc>https://fabibot.onrender.com/chat</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- CORRIDA -->
  <url>
    <loc>https://fabibot.onrender.com/corrida</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- REMOVERMARCA -->
  <url>
    <loc>https://fabibot.onrender.com/removermarca</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- PÁGINAS INSTITUCIONAIS -->
  <url>
    <loc>https://fabibot.onrender.com/sobre</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>https://fabibot.onrender.com/ajuda</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

</urlset>`);
});

// Páginas institucionais (mantenha as existentes)
app.get("/sobre", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sobre o FabiBot - Plataforma Completa de Entretenimento Online</title>
    <meta name="description" content="Conheça o FabiBot: chat online grátis, player de músicas, jogos e ranking. A maior comunidade brasileira de entretenimento digital.">
    <meta name="keywords" content="FabiBot, sobre, chat online, músicas, jogos, entretenimento">
    <meta name="google-site-verification" content="EQt18dIllZg0WnhSV58os4awAy0jsyxrLL3Yek09dYo" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            padding: 20px;
        }
        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        h1 { 
            color: #fff; 
            font-size: 2.5em; 
            margin-bottom: 30px;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        h2 { 
            color: #ffd700; 
            margin: 25px 0 15px;
            border-left: 4px solid #ffd700;
            padding-left: 15px;
        }
        p { 
            line-height: 1.8; 
            margin-bottom: 15px;
            font-size: 1.1em;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            margin: 30px 0;
        }
        .feature-card {
            background: rgba(255,255,255,0.15);
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            transition: transform 0.3s;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            background: rgba(255,255,255,0.2);
        }
        .feature-icon {
            font-size: 2.5em;
            margin-bottom: 15px;
            display: block;
        }
        .btn {
            display: inline-block;
            background: #ffd700;
            color: #333;
            padding: 12px 30px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 20px;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #ffed4e;
            transform: scale(1.05);
        }
        .back-link {
            display: block;
            text-align: center;
            margin-top: 40px;
            color: #ffd700;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Sobre o FabiBot</h1>
        
        <p>Bem-vindo ao <strong>FabiBot</strong>, a plataforma de entretenimento online mais completa do Brasil! Criada para conectar pessoas através da diversão digital.</p>
        
        <h2>✨ O Que Oferecemos</h2>
        
        <div class="features-grid">
            <div class="feature-card">
                <span class="feature-icon">💬</span>
                <h3>Chat Online</h3>
                <p>Converse em tempo real com amigos em salas temáticas. Totalmente gratuito e sem limites!</p>
            </div>
            
            <div class="feature-card">
                <span class="feature-icon">🎵</span>
                <h3>Player de Músicas</h3>
                <p>Ouça milhares de músicas com nosso player avançado. Crie playlists e descubra novas faixas.</p>
            </div>
            
            <div class="feature-card">
                <span class="feature-icon">🎬</span>
                <h3>Streaming de Vídeo</h3>
                <p>Assista a filmes, séries e streams ao vivo com qualidade HD e suporte a múltiplos formatos.</p>
            </div>
            
            <div class="feature-card">
                <span class="feature-icon">🏆</span>
                <h3>Sistema de Ranking</h3>
                <p>Participe, acumule pontos e suba no ranking. Mostre quem é o melhor da comunidade!</p>
            </div>
        </div>
        
        <h2>🚀 Nossa Missão</h2>
        <p>Proporcionar entretenimento de qualidade, gratuito e acessível para todos os brasileiros. Acreditamos que a diversão deve ser democrática!</p>
        
        <h2>📈 Estatísticas Impressionantes</h2>
        <p>• <strong>+10,000 usuários ativos</strong><br>
           • <strong>+50,000 mensagens diárias</strong><br>
           • <strong>+100,000 músicas tocadas</strong><br>
           • <strong>+5,000 streams diários</strong><br>
           • <strong>99.9% uptime</strong></p>
        
        <h2>🔒 Segurança e Privacidade</h2>
        <p>Seus dados estão seguros conosco. Utilizamos criptografia de ponta a ponta e não vendemos suas informações.</p>
        
        <div style="text-align: center;">
            <a href="/streampro" class="btn" style="background: #00ffb3; margin-right: 10px;">🎬 Acessar Streaming</a>
            <a href="/" class="btn">🏠 Página Inicial</a>
        </div>
        
        <a href="/" class="back-link">← Voltar para o FabiBot</a>
    </div>
</body>
</html>`);
});

// ===== MIDDLEWARE PARA OUTRAS ROTAS (PROXY GERAL) =====
app.use(async (req, res) => {
  try {
    // Ignorar rotas já tratadas
    const treatedRoutes = [
      '/alterar-foto', '/play', '/streampro', 
      '/api/streampro/reproducao/registrar', '/api/streampro/playlist',
      '/api/streampro/playlist/salvar', '/api/streampro/testar-url',
      '/api/streampro/proxy',
      '/sobre', '/ajuda', '/politica-de-privacidade', '/termos-de-uso',
      '/robots.txt', '/sitemap.xml', '/google-verification.html'
    ];
    
    if (treatedRoutes.includes(req.path)) {
      return res.status(404).send("Rota não encontrada");
    }

    const targetUrl = BASE + req.url;
    console.log(`🔗 Proxy: ${req.method} ${req.path}`);

    // Preparar headers
    const headers = { 
      ...req.headers,
      "host": new URL(BASE).host,
      "origin": BASE,
      "referer": BASE + "/",
      "x-forwarded-for": req.ip,
      "x-real-ip": req.ip
    };
    
    delete headers["content-length"];

    let body;
    const contentType = req.headers["content-type"] || "";

    // Preparar body
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (contentType.includes("application/json")) {
        body = JSON.stringify(req.body);
        headers["Content-Type"] = "application/json";
      } else if (contentType.includes("multipart/form-data")) {
        body = req;
        delete headers["content-type"];
      } else {
        body = new URLSearchParams(req.body).toString();
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      redirect: "manual",
    });

    // Tratar redirecionamentos
    const location = response.headers.get("location");
    if (location) {
      let redirectUrl = location;
      if (redirectUrl.startsWith("/")) {
        redirectUrl = MASK + redirectUrl;
      } else if (redirectUrl.startsWith(BASE)) {
        redirectUrl = redirectUrl.replace(BASE, MASK);
      }
      res.setHeader("Location", redirectUrl);
      return res.status(response.status).end();
    }

    // Copiar cookies
    const cookies = response.headers.raw()["set-cookie"];
    if (cookies) {
      cookies.forEach(cookie => {
        res.append("Set-Cookie", cookie);
      });
    }

    // Copiar outros headers
    const type = response.headers.get("content-type");
    if (type) res.setHeader("Content-Type", type);

    // Enviar resposta com modificação SEO
    if (type && type.includes("text/html")) {
      let html = await response.text();
      
      // Adicionar meta tag SEO
      if (html.includes('</head>')) {
        const verificationCode = '<meta name="google-site-verification" content="EQt18dIllZg0WnhSV58os4awAy0jsyxrLL3Yek09dYo" />';
        html = html.replace('</head>', verificationCode + '\n</head>');
      }
      
      // Substituir URLs absolutas do backend pela máscara
      html = html.replace(new RegExp(BASE, 'g'), MASK);
      
      res.send(html);
    } else {
      res.send(await response.buffer());
    }
    
  } catch (error) {
    console.error("Proxy error:", error);
    
    // Página de erro amigável
    res.status(500).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Erro no FabiBot</title>
    <meta name="google-site-verification" content="EQt18dIllZg0WnhSV58os4awAy0jsyxrLL3Yek09dYo" />
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #e74c3c; }
        .btn { display: inline-block; margin: 10px; padding: 10px 20px; 
               background: #3498db; color: white; text-decoration: none; 
               border-radius: 5px; }
    </style>
</head>
<body>
    <h1>⚠️ Erro ao carregar a página</h1>
    <p>Estamos enfrentando problemas técnicos. Por favor, tente novamente.</p>
    <div>
        <a href="/" class="btn">🏠 Página Inicial</a>
        <a href="/streampro" class="btn" style="background: #00ffb3; color: #000;">🎬 Player de Streaming</a>
    </div>
</body>
</html>
    `);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  🚀 Máscara rodando na porta ${PORT}
  🔗 Encaminhando para: ${BASE}
  🎭 URL da máscara: ${MASK}
  🎬 StreamPro: ${MASK}/streampro
  ✅ SEO otimizado para Google
  📡 APIs de streaming configuradas
  `);
});