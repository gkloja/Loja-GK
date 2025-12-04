import express from "express";
import fetch from "node-fetch";

const app = express();

// Caminho base da API/Servidor que você quer espelhar
const BASE_URL = "http://br2.bronxyshost.com:4009";

app.use(async (req, res) => {
  try {
    // Junta a URL acessada localmente com a URL remota
    const targetUrl = BASE_URL + req.url;

    const response = await fetch(targetUrl);

    // Repassa content-type
    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    // Se for HTML → apenas repassa sem alterar nada
    if (contentType && contentType.includes("text/html")) {
      const html = await response.text();
      res.send(html);
      return;
    }

    // Arquivos binários (imagens, pdf, etc.)
    const buffer = await response.buffer();
    res.send(buffer);

  } catch (err) {
    console.error("PROXY ERRO:", err);
    res.status(500).send("Erro ao carregar através do proxy.");
  }
});

// Porta do servidor
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Proxy rodando na porta " + port));
