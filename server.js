import express from "express";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const BASE = "http://br2.bronxyshost.com:4009";
const MASK = "https://fabibot.onrender.com";

app.use(async (req, res) => {
  try {
    const targetUrl = BASE + req.url;

    // 🔧 Limpar headers proibidos
    const newHeaders = { ...req.headers };
    delete newHeaders["content-length"];
    delete newHeaders["host"];
    delete newHeaders["connection"];

    // 🔧 Preparar o corpo
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

    // 📌 Reescrever redirecionamentos
    const loc = response.headers.get("location");
    if (loc) {
      let redirectTo = loc;

      if (redirectTo.startsWith("/")) redirectTo = MASK + redirectTo;
      else redirectTo = redirectTo.replace(BASE, MASK);

      res.setHeader("Location", redirectTo);
      return res.status(response.status).send();
    }

    // 🔄 Cookies
    const setCookie = response.headers.raw()["set-cookie"];
    if (setCookie) setCookie.forEach((c) => res.append("Set-Cookie", c));

    // Tipo
    const type = response.headers.get("content-type");
    if (type) res.setHeader("Content-Type", type);

    // HTML → texto
    if (type && type.includes("text/html")) {
      return res.send(await response.text());
    }

    // Outros → buffer
    return res.send(await response.buffer());
  } catch (e) {
    console.error("PROXY ERROR:", e);
    res.status(500).send("Erro no proxy.");
  }
});

app.listen(process.env.PORT || 3000);
