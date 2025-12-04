import express from "express";
import fetch from "node-fetch";
import path from "path";
import session from "express-session";

const app = express();

// Sessão
app.use(session({
  secret: "supersegredo",
  resave: false,
  saveUninitialized: false
}));

// Permite POST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ----------------------
// 1) ROTAS ORIGINAIS — NÃO PASSAM NO PROXY
// ----------------------
app.post("/users/login", async (req, res) => {
  const { username, password } = req.body;

  // aqui chama seu sistema ORIGINAL de login
  // você mantém exatamente igual ao seu código
  console.log("Login chamado pela máscara!", username);

  // se login ok:
  req.session.user = { username };
  req.session.save(() => {
    res.redirect("/");
  });
});

// outras rotas reais:
app.get("/registro", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "registro.html"));
});

// ----------------------
// 2) PROXY SOMENTE PARA ARQUIVOS /externo
// ----------------------
const BASE = "http://br2.bronxyshost.com:4009";

app.use("/externo", async (req, res) => {
  try {
    const targetUrl = BASE + req.url.replace("/externo", "");
    const response = await fetch(targetUrl);

    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    if (contentType && contentType.includes("text/html")) {
      let html = await response.text();

      // Ajusta caminhos
      html = html.replace(/href="\//g, 'href="/externo/');
      html = html.replace(/src="\//g, 'src="/externo/');

      res.send(html);
      return;
    }

    const buffer = await response.buffer();
    res.send(buffer);

  } catch (err) {
    res.status(500).send("Proxy erro.");
  }
});

// ----------------------
// 3) PUBLIC DO SITE ORIGINAL
// ----------------------
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// ----------------------
app.listen(3000, () => {
  console.log("Rodando na porta 3000");
});
