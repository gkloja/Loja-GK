import express from "express";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const BASE = "http://br2.bronxyshost.com:4009";
const MASK = "https://fabibot.onrender.com";

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

app.listen(process.env.PORT || 3000);
