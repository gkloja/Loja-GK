import express from "express";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const BASE = "http://br2.bronxyshost.com:4009"; // 🌐 seu site real

app.use(async (req, res) => {
  try {
    const targetUrl = BASE + req.url;

    // --- Enviar headers originais ---
    const headers = {
      ...req.headers,
      host: "br2.bronxyshost.com:4009",
      cookie: req.headers.cookie || "",
    };

    const options = {
      method: req.method,
      headers,
      redirect: "manual",
    };

    // Enviar body em POST, PUT, PATCH etc
    if (req.method !== "GET" && req.method !== "HEAD") {
      options.body = req.rawBody || JSON.stringify(req.body);
    }

    // --- Faz a request para o site original ---
    const response = await fetch(targetUrl, options);

    // --- Repassar cookies para o usuário ---
    const setCookie = response.headers.raw()["set-cookie"];
    if (setCookie) {
      setCookie.forEach((cookie) => {
        res.append("Set-Cookie", cookie);
      });
    }

    // Tipo da resposta
    const contentType = response.headers.get("content-type");
    if (contentType) res.set("Content-Type", contentType);

    // HTML → envia direto
    if (contentType && contentType.includes("text/html")) {
      let html = await response.text();
      return res.send(html);
    }

    // Outros arquivos
    const buffer = await response.buffer();
    res.send(buffer);

  } catch (err) {
    console.error("PROXY ERRO:", err);
    res.status(500).send("Erro ao carregar através do proxy.");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Proxy rodando na porta " + port));
