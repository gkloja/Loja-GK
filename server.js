import express from "express";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// 🚫 BLOQUEAR URLs inválidas (resolves the “login() download”)
app.use((req, res, next) => {
  if (req.url.includes("(") || req.url.includes(")")) {
    return res.status(404).send("Recurso inválido.");
  }
  next();
});

const BASE = "http://br2.bronxyshost.com:4009";

app.use(async (req, res) => {
  try {
    const targetUrl = BASE + req.url;

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

    if (!["GET", "HEAD"].includes(req.method)) {
      if (req.is("application/json")) {
        options.body = JSON.stringify(req.body);
      } else {
        options.body = new URLSearchParams(req.body).toString();
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      }
    }

    const response = await fetch(targetUrl, options);

    const setCookie = response.headers.raw()["set-cookie"];
    if (setCookie) {
      setCookie.forEach((cookie) => res.append("Set-Cookie", cookie));
    }

    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    if (contentType && contentType.includes("text/html")) {
      const html = await response.text();
      return res.send(html);
    }

    const buffer = await response.buffer();
    return res.send(buffer);

  } catch (err) {
    console.error("PROXY ERRO:", err);
    res.status(500).send("Erro ao carregar através do proxy.");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log("Proxy rodando na porta " + port)
);
