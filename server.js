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
app.post("/alterar-foto", async (req, res) => {
  console.log("📤 Encaminhando upload para backend original...");
  
  try {
    // IMPORTANTE: Pegar todos os headers do cliente
    const headers = {
      "Cookie": req.headers.cookie || "",
      "Content-Type": req.headers["content-type"] || "application/json",
      "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
      "Accept": "application/json",
      "X-Forwarded-For": req.ip,
      "X-Real-IP": req.ip
    };
    
    // Se for JSON (com fotoUrl) - encaminhar como está
    if (req.headers["content-type"]?.includes("application/json")) {
      console.log("📨 Encaminhando JSON para backend original");
      
      const backendResponse = await fetch(BASE + "/alterar-foto", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(req.body)
      });
      
      // Copiar resposta
      const data = await backendResponse.json();
      const setCookie = backendResponse.headers.raw()["set-cookie"];
      
      if (setCookie) {
        setCookie.forEach(cookie => {
          res.append("Set-Cookie", cookie);
        });
      }
      
      console.log(`📥 Resposta do backend original: ${data.sucesso ? '✅' : '❌'}`);
      res.status(backendResponse.status).json(data);
      
    } 
    // Se for multipart/form-data (arquivo) - precisa tratar diferente
    else if (req.headers["content-type"]?.includes("multipart/form-data")) {
      console.log("⚠️ Multipart recebido - encaminhando para backend...");
      
      // Para multipart, precisamos reenviar o stream
      const backendResponse = await fetch(BASE + "/alterar-foto", {
        method: "POST",
        headers: {
          "Cookie": req.headers.cookie || "",
          "User-Agent": req.headers["user-agent"] || "Mozilla/5.0"
          // NÃO definir Content-Type para multipart - fetch faz automaticamente
        },
        body: req // Passar a requisição original
      });
      
      const data = await backendResponse.json();
      const setCookie = backendResponse.headers.raw()["set-cookie"];
      
      if (setCookie) {
        setCookie.forEach(cookie => {
          res.append("Set-Cookie", cookie);
        });
      }
      
      res.status(backendResponse.status).json(data);
    }
    
  } catch (error) {
    console.error("❌ Erro ao encaminhar para backend:", error);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: "Erro ao conectar com o servidor" 
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
