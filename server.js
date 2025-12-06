import express from "express";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());

const BASE = "http://br2.bronxyshost.com:4009";
const MASK = "https://fabibot.onrender.com";

// ===== ROTA ESPECIAL PARA /alterar-foto =====
// Esta rota APENAS ENCAMINHA para o backend original

// ADICIONE ISSO NO SEU server.js da máscara (ANTES do proxy geral)

// ========== CONFIGURAÇÃO SEO COMPLETA ==========

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

// 2. Sitemap.xml
app.get("/sitemap.xml", (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  
  <!-- Páginas principais -->
  <url>
    <loc>https://fabibot.onrender.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>https://fabibot.onrender.com/chat</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>https://fabibot.onrender.com/musicas</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>https://fabibot.onrender.com/jogos</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>https://fabibot.onrender.com/ranking</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Páginas institucionais -->
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
    <priority>0.5</priority>
  </url>
  
  <url>
    <loc>https://fabibot.onrender.com/politica-de-privacidade</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>https://fabibot.onrender.com/termos-de-uso</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`);
});

// 3. Página SOBRE
app.get("/sobre", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sobre o FabiBot - Plataforma Completa de Entretenimento Online</title>
    <meta name="description" content="Conheça o FabiBot: chat online grátis, player de músicas, jogos e ranking. A maior comunidade brasileira de entretenimento digital.">
    <meta name="keywords" content="FabiBot, sobre, chat online, músicas, jogos, entretenimento">
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
                <span class="feature-icon">🏆</span>
                <h3>Sistema de Ranking</h3>
                <p>Participe, acumule pontos e suba no ranking. Mostre quem é o melhor da comunidade!</p>
            </div>
            
            <div class="feature-card">
                <span class="feature-icon">🎲</span>
                <h3>Jogos Online</h3>
                <p>Diversos jogos para se divertir sozinho ou com amigos. Novos jogos adicionados toda semana!</p>
            </div>
        </div>
        
        <h2>🚀 Nossa Missão</h2>
        <p>Proporcionar entretenimento de qualidade, gratuito e acessível para todos os brasileiros. Acreditamos que a diversão deve ser democrática!</p>
        
        <h2>📈 Estatísticas Impressionantes</h2>
        <p>• <strong>+10,000 usuários ativos</strong><br>
           • <strong>+50,000 mensagens diárias</strong><br>
           • <strong>+100,000 músicas tocadas</strong><br>
           • <strong>99.9% uptime</strong></p>
        
        <h2>🔒 Segurança e Privacidade</h2>
        <p>Seus dados estão seguros conosco. Utilizamos criptografia de ponta a ponta e não vendemos suas informações.</p>
        
        <div style="text-align: center;">
            <a href="/" class="btn">🎯 Experimente Grátis</a>
        </div>
        
        <a href="/" class="back-link">← Voltar para o FabiBot</a>
    </div>
</body>
</html>`);
});

// 4. Página POLÍTICA DE PRIVACIDADE
app.get("/politica-de-privacidade", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Política de Privacidade - FabiBot</title>
    <meta name="description" content="Política de Privacidade do FabiBot. Saiba como protegemos seus dados e informações pessoais.">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; }
        h1, h2 { color: #667eea; }
        .date { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <h1>🔒 Política de Privacidade do FabiBot</h1>
    <p class="date">Última atualização: 06 de dezembro de 2024</p>
    
    <h2>1. Coleta de Informações</h2>
    <p>Coletamos informações para fornecer e melhorar nossos serviços...</p>
    
    <h2>2. Uso de Dados</h2>
    <p>Utilizamos seus dados para personalizar sua experiência...</p>
    
    <h2>3. Cookies</h2>
    <p>Utilizamos cookies para melhorar a navegação...</p>
    
    <h2>4. Google AdSense</h2>
    <p>Terceiros, incluindo o Google, usam cookies para veicular anúncios...</p>
    
    <p><a href="/">← Voltar ao FabiBot</a></p>
</body>
</html>`);
});

// 5. Página TERMOS DE USO
app.get("/termos-de-uso", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Termos de Uso - FabiBot</title>
    <meta name="description" content="Termos e Condições de Uso do FabiBot. Leia atentamente antes de utilizar nossa plataforma.">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; }
        h1, h2 { color: #667eea; }
    </style>
</head>
<body>
    <h1>📄 Termos de Uso do FabiBot</h1>
    
    <h2>1. Aceitação dos Termos</h2>
    <p>Ao acessar o FabiBot, você concorda com estes termos...</p>
    
    <h2>2. Uso Adequado</h2>
    <p>Você concorda em não usar o serviço para atividades ilegais...</p>
    
    <h2>3. Contas de Usuário</h2>
    <p>Você é responsável por manter sua conta segura...</p>
    
    <p><a href="/">← Voltar ao FabiBot</a></p>
</body>
</html>`);
});

// 6. Página AJUDA/FAQ
app.get("/ajuda", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ajuda do FabiBot - Perguntas Frequentes</title>
    <meta name="description" content="Central de Ajuda do FabiBot. Tire todas suas dúvidas sobre chat, músicas, jogos e mais.">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        .faq-item { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .question { color: #667eea; font-weight: bold; cursor: pointer; }
        .answer { display: none; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>❓ Central de Ajuda - FabiBot</h1>
    
    <div class="faq-item">
        <div class="question" onclick="toggleAnswer(this)">Como usar o chat online?</div>
        <div class="answer">Basta acessar a aba "Chat" e escolher uma sala...</div>
    </div>
    
    <div class="faq-item">
        <div class="question" onclick="toggleAnswer(this)">O player de músicas é gratuito?</div>
        <div class="answer">Sim, totalmente gratuito e sem anúncios...</div>
    </div>
    
    <script>
        function toggleAnswer(element) {
            const answer = element.nextElementSibling;
            answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
        }
    </script>
    
    <p><a href="/">← Voltar ao FabiBot</a></p>
</body>
</html>`);
});

// ===== ROTA ESPECIAL PARA /alterar-foto =====
app.post("/alterar-foto", async (req, res) => {
  console.log("📤 Encaminhando upload para backend original...");
  console.log("Content-Type recebido:", req.headers["content-type"]);
  console.log("Body recebido:", req.body ? "Sim" : "Não");
  
  try {
    // IMPORTANTE: Manter os cookies para sessão
    const headers = {
      "Cookie": req.headers.cookie || "",
      "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
      "Accept": "application/json"
    };
    
    // SEMPRE enviar como multipart/form-data para o backend original
    // pois ele espera upload.single('fotoFile')
    
    // Criar FormData programaticamente
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    
    // Se veio base64 (da máscara)
    if (req.body && req.body.fotoUrl) {
      console.log("📸 Convertendo base64 para arquivo...");
      
      // Extrair tipo MIME e dados da base64
      const base64Data = req.body.fotoUrl;
      const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const extension = mimeType.split('/')[1] || 'jpg';
        const filename = req.body.filename || `foto-${Date.now()}.${extension}`;
        
        // Adicionar ao FormData como arquivo
        form.append('fotoFile', buffer, {
          filename: filename,
          contentType: mimeType
        });
        
        console.log(`📁 Arquivo criado: ${filename} (${buffer.length} bytes)`);
      } else {
        // Se não for base64 válido, tratar como URL
        console.log("📡 Tratando como URL normal...");
        form.append('fotoUrl', base64Data);
      }
    }
    
    // Se veio como multipart (upload direto)
    else if (req.headers["content-type"]?.includes("multipart/form-data")) {
      console.log("📎 Multipart recebido - repassando...");
      // Aqui você precisaria processar o multipart recebido
      // Mas como seu frontend envia JSON, isso provavelmente não será usado
      return res.status(400).json({
        sucesso: false,
        mensagem: "Upload direto de arquivo não suportado pela máscara"
      });
    }
    
    // Se não tem foto
    else {
      console.log("❌ Nenhuma foto fornecida");
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nenhuma foto fornecida!"
      });
    }
    
    // ENVIAR PARA O BACKEND ORIGINAL
    console.log("🚀 Enviando para backend original...");
    
    // Adicionar cabeçalhos do FormData
    const formHeaders = {
      ...headers,
      ...form.getHeaders()
    };
    
    const backendResponse = await fetch(BASE + "/alterar-foto", {
      method: "POST",
      headers: formHeaders,
      body: form
    });
    
    // Processar resposta
    const data = await backendResponse.json();
    console.log("📥 Resposta do backend:", data.sucesso ? '✅' : '❌');
    
    // Copiar cookies de sessão
    const setCookie = backendResponse.headers.raw()["set-cookie"];
    if (setCookie) {
      setCookie.forEach(cookie => {
        res.append("Set-Cookie", cookie);
      });
    }
    
    // Retornar resposta ao cliente
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
        "Accept": "application/json",
        "User-Agent": "Samá-Music-Player/1.0",
        "Cookie": req.headers.cookie || ""
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
    console.error("Music API error:", error);
    res.status(500).json({ error: "Falha na API de músicas" });
  }
});

// ===== MIDDLEWARE PARA OUTRAS ROTAS (PROXY GERAL) =====
app.use(async (req, res) => {
  try {
    // Ignorar rotas que já foram tratadas
    if (req.path === '/alterar-foto' || req.path === '/play') {
      return res.status(404).send("Rota já tratada");
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
        // Para multipart, enviar como stream
        body = req;
        delete headers["content-type"];
      } else {
        body = new URLSearchParams(req.body).toString();
        headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";
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

    // Enviar resposta
    if (type && type.includes("text/html")) {
      res.send(await response.text());
    } else {
      res.send(await response.buffer());
    }
    
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).send("Erro no proxy");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  🚀 Máscara rodando na porta ${PORT}
  🔗 Encaminhando para: ${BASE}
  🎭 URL da máscara: ${MASK}
  ✅ Uploads vão direto para o backend original!
  `);
});
