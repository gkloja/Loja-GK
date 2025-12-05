import express from "express";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const BASE = "http://br2.bronxyshost.com:4009";
const MASK = "https://fabibot.onrender.com";

// ===== ROTA ESPECIAL PARA /alterar-foto =====
// Esta rota APENAS ENCAMINHA para o backend original

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
