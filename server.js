const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "events.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Garante que o arquivo de dados existe
function lerEventos() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, "{}");
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function salvarEventos(dados) {
  fs.writeFileSync(DB_PATH, JSON.stringify(dados, null, 2));
}

// GET /api/events -> retorna todos os eventos { "2026-07-29": [{id, titulo}] }
app.get("/api/events", (req, res) => {
  res.json(lerEventos());
});

// POST /api/events  body: { data: "2026-07-29", titulo: "Reunião", cor: "#6B8F71" }
app.post("/api/events", (req, res) => {
  const { data, titulo, cor } = req.body;
  if (!data || !titulo) {
    return res.status(400).json({ erro: "Informe 'data' e 'titulo'." });
  }
  const eventos = lerEventos();
  if (!eventos[data]) eventos[data] = [];
  const novoEvento = { id: Date.now().toString(), titulo, cor: cor || "#6B8F71" };
  eventos[data].push(novoEvento);
  salvarEventos(eventos);
  res.status(201).json(novoEvento);
});

// DELETE /api/events/:data/:id
app.delete("/api/events/:data/:id", (req, res) => {
  const { data, id } = req.params;
  const eventos = lerEventos();
  if (!eventos[data]) return res.status(404).json({ erro: "Data não encontrada." });
  eventos[data] = eventos[data].filter((ev) => ev.id !== id);
  if (eventos[data].length === 0) delete eventos[data];
  salvarEventos(eventos);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Calendário rodando em http://localhost:${PORT}`);
});
