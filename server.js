import express from "express";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const BASE = "http://br2.bronxyshost.com:4009";
const MASK = "https://fabibot.onrender.com";

// Configuração do multer para arquivos temporários
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'temp_uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Rota específica para upload de fotos
app.post("/alterar-foto", upload.single('fotoFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: "Nenhuma imagem enviada" 
      });
    }

    console.log("Upload recebido:", req.file.filename);
    
    // Criar FormData para enviar ao backend
    const FormData = await import('form-data');
    const form = new FormData.default();
    
    // Ler o arquivo e adicionar ao form
    const fileStream = fs.createReadStream(req.file.path);
    form.append('fotoFile', fileStream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Adicionar cookies da sessão
    const cookies = req.headers.cookie || '';
    
    // Enviar para o backend real
    const backendResponse = await fetch(BASE + "/alterar-foto", {
      method: "POST",
      headers: {
        "Cookie": cookies,
        ...form.getHeaders()
      },
      body: form
    });

    // Limpar arquivo temporário
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Erro ao limpar arquivo temporário:", err);
    });

    // Obter resposta
    const contentType = backendResponse.headers.get("content-type");
    let responseData;
    
    if (contentType && contentType.includes("application/json")) {
      responseData = await backendResponse.json();
    } else {
      const text = await backendResponse.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = { sucesso: false, mensagem: text || "Erro no servidor" };
      }
    }

    // Manter cookies do backend
    const setCookie = backendResponse.headers.raw()["set-cookie"];
    if (setCookie) {
      setCookie.forEach((c) => {
        res.append("Set-Cookie", c);
      });
    }

    // Retornar resposta
    res.status(backendResponse.status).json(responseData);

  } catch (error) {
    console.error("Erro no upload:", error);
    
    // Limpar arquivo temporário em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }
    
    res.status(500).json({ 
      sucesso: false, 
      mensagem: "Erro ao processar a imagem" 
    });
  }
});

// Rota específica para a API de músicas
app.post("/play", async (req, res) => {
  try {
    const targetUrl = BASE + "/play";
    
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Samá-Music-Player/1.0"
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error("Music API error:", error);
    res.status(500).json({ error: "Falha na API de músicas" });
  }
});

// Middleware para outras rotas
app.use(async (req, res) => {
  try {
    // Ignorar rotas que já foram tratadas
    if (req.path === '/alterar-foto' || req.path === '/play') {
      return res.status(404).send("Rota já tratada");
    }

    const targetUrl = BASE + req.url;

    const newHeaders = { ...req.headers };
    delete newHeaders["content-length"];
    delete newHeaders["host"];
    delete newHeaders["connection"];

    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const ct = req.headers["content-type"] || "";

      if (ct.includes("application/json")) {
        body = JSON.stringify(req.body);
        newHeaders["Content-Type"] = "application/json";
      } else {
        body = new URLSearchParams(req.body).toString();
        newHeaders["Content-Type"] =
          "application/x-www-form-urlencoded;charset=UTF-8";
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: newHeaders,
      body,
      redirect: "manual",
    });

    const loc = response.headers.get("location");
    if (loc) {
      let redirectTo = loc;
      if (redirectTo.startsWith("/")) redirectTo = MASK + redirectTo;
      else redirectTo = redirectTo.replace(BASE, MASK);

      res.setHeader("Location", redirectTo);
      return res.status(response.status).send();
    }

    const setCookie = response.headers.raw()["set-cookie"];
    if (setCookie) setCookie.forEach((c) => res.append("Set-Cookie", c));

    const type = response.headers.get("content-type");
    if (type) res.setHeader("Content-Type", type);

    if (type && type.includes("text/html")) {
      return res.send(await response.text());
    }

    return res.send(await response.buffer());
  } catch (e) {
    console.error("PROXY ERROR:", e);
    res.status(500).send("Erro no proxy.");
  }
});

// Limpeza periódica de arquivos temporários
setInterval(() => {
  const tempDir = path.join(__dirname, 'temp_uploads');
  if (fs.existsSync(tempDir)) {
    fs.readdir(tempDir, (err, files) => {
      if (err) return;
      const now = Date.now();
      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          // Deletar arquivos com mais de 1 hora
          if (now - stats.mtimeMs > 60 * 60 * 1000) {
            fs.unlink(filePath, () => {});
          }
        });
      });
    });
  }
}, 30 * 60 * 1000); // A cada 30 minutos

app.listen(process.env.PORT || 3000);
