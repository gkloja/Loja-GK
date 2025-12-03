import express from "express";
import fetch from "node-fetch";

const app = express();

app.use(async (req, res) => {
  try {
    const targetUrl = "http://br2.bronxyshost.com:4009/gruposwpp" + req.url;

    const response = await fetch(targetUrl);
    const body = await response.text();

    res.set("Content-Type", response.headers.get("content-type"));
    res.send(body);

  } catch (err) {
    res.status(500).send("Erro ao carregar o site.");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Proxy rodando na porta " + port));
