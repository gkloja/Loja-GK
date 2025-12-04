import express from "express";
import session from "express-session";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import moment from "moment-timezone";
import flash from "connect-flash";

const app = express();

// ==========================
// CONFIGURAÇÕES BASE
// ==========================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(process.cwd(), "public")));

app.use(
  session({
    secret: "sama-bank-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 dia logado
  })
);

app.use(flash());

// Middleware para repassar flash messages ao EJS
app.use((req, res, next) => {
  res.locals.error_msg = req.flash("error_msg");
  res.locals.success_msg = req.flash("success_msg");
  next();
});

// ==========================
// 🔐 ROTA DE LOGIN COMPLETA
// ==========================
app.post("/users/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const filePathr = path.join(process.cwd(), "registro.json");
    const filePathAcessos = path.join(process.cwd(), "acessos2.json");

    if (!fs.existsSync(filePathr)) {
      req.flash("error_msg", "Nenhum usuário registrado ainda!");
      return res.redirect("/externo/login");
    }

    let registros = JSON.parse(fs.readFileSync(filePathr, "utf8"));

    let usuario = registros.find(
      (user) => user.nome === username && user.id === password
    );

    if (!usuario) {
      req.flash("error_msg", "Nome de usuário ou senha (ID) inválidos!");
      return res.redirect("/externo/login");
    }

    // Salva sessão 🔥
    req.session.user = {
      nome: usuario.nome,
      numero: usuario.numero,
      grupo: usuario.grupo,
      dinheiro: usuario.dinheiro,
      id: usuario.id,
    };

    // Registra o acesso
    const horario = moment.tz("America/Sao_Paulo").format("HH:mm:ss");
    const data = moment.tz("America/Sao_Paulo").format("DD/MM/YYYY");

    const novoAcesso = {
      nome: usuario.nome,
      senha: usuario.id,
      data,
      horario,
    };

    let acessos = [];
    if (fs.existsSync(filePathAcessos)) {
      try {
        acessos = JSON.parse(fs.readFileSync(filePathAcessos, "utf8"));
        if (!Array.isArray(acessos)) acessos = [];
      } catch {
        acessos = [];
      }
    }

    acessos.push(novoAcesso);
    fs.writeFileSync(filePathAcessos, JSON.stringify(acessos, null, 2));

    // Salvar sessão antes de redirecionar
    req.session.save(() => {
      req.flash("success_msg", "Login bem-sucedido!");
      return res.redirect("/externo");
    });
  } catch (err) {
    console.error("Erro ao processar login:", err);
    req.flash("error_msg", "Erro ao processar o login!");
    return res.redirect("/externo/login");
  }
});

// =====================================
// 🌐 PROXY SOMENTE PARA GET
// =====================================
const BASE_URL = "http://br2.bronxyshost.com:4009";

app.use("/externo", async (req, res, next) => {
  if (req.method !== "GET") return next(); // evita quebrar POST

  try {
    const targetUrl = BASE_URL + req.url.replace("/externo", "");
    const response = await fetch(targetUrl);

    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    if (contentType.includes("text/html")) {
      const html = await response.text();

      // Injeta sessão no HTML se quiser (opcional)
      res.send(html);
      return;
    }

    const buffer = await response.buffer();
    res.send(buffer);
  } catch (err) {
    console.error("PROXY ERRO:", err);
    res.status(500).send("Erro ao carregar através do proxy.");
  }
});

// ==========================
// SERVER ON
// ==========================
const port = 3000;
app.listen(port, () => console.log("Rodando na porta " + port));
