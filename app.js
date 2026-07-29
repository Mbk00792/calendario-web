const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const hoje = new Date();
let mesAtual = hoje.getMonth();
let anoAtual = hoje.getFullYear();
let eventos = {}; // { "2026-07-29": [{id, titulo, cor}] }
let dataSelecionada = null;

const PALETA = [
  { nome: "Sálvia", cor: "#6B8F71" },
  { nome: "Ardósia", cor: "#4C6B8A" },
  { nome: "Mostarda", cor: "#D9A441" },
  { nome: "Ameixa", cor: "#8B5A7C" },
  { nome: "Ferrugem", cor: "#C1502E" },
];
let corSelecionada = PALETA[0].cor;

const grid = document.getElementById("grid");
const mesNomeEl = document.getElementById("mes-nome");
const anoNumEl = document.getElementById("ano-num");
const painel = document.getElementById("painel");
const painelData = document.getElementById("painel-data");
const listaEventos = document.getElementById("lista-eventos");
const formEvento = document.getElementById("form-evento");
const inputTitulo = document.getElementById("input-titulo");
const coresPicker = document.getElementById("cores-picker");

function montarSeletorCores() {
  PALETA.forEach(({ nome, cor }) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "cor-swatch";
    swatch.style.background = cor;
    swatch.dataset.cor = cor;
    swatch.setAttribute("role", "radio");
    swatch.setAttribute("aria-label", nome);
    swatch.setAttribute("aria-checked", cor === corSelecionada ? "true" : "false");
    if (cor === corSelecionada) swatch.classList.add("selecionada");

    swatch.addEventListener("click", () => {
      corSelecionada = cor;
      [...coresPicker.children].forEach((el) => {
        el.classList.toggle("selecionada", el.dataset.cor === cor);
        el.setAttribute("aria-checked", el.dataset.cor === cor ? "true" : "false");
      });
    });

    coresPicker.appendChild(swatch);
  });
}

function formatarChave(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

async function carregarEventos() {
  const res = await fetch("/api/events");
  eventos = await res.json();
}

function renderizarCalendario() {
  mesNomeEl.textContent = MESES[mesAtual];
  anoNumEl.textContent = anoAtual;
  grid.innerHTML = "";

  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate();

  for (let i = 0; i < primeiroDia; i++) {
    const vazio = document.createElement("div");
    vazio.className = "dia dia--vazio";
    grid.appendChild(vazio);
  }

  for (let dia = 1; dia <= totalDias; dia++) {
    const chave = formatarChave(anoAtual, mesAtual, dia);
    const celula = document.createElement("div");
    celula.className = "dia";
    celula.textContent = dia;

    const ehHoje =
      dia === hoje.getDate() &&
      mesAtual === hoje.getMonth() &&
      anoAtual === hoje.getFullYear();

    if (ehHoje) celula.classList.add("dia--hoje");

    if (eventos[chave] && eventos[chave].length > 0) {
      const cores = [...new Set(eventos[chave].map((ev) => ev.cor || "#6B8F71"))].slice(0, 3);
      const container = document.createElement("span");
      container.className = "dia__marcadores";
      cores.forEach((cor) => {
        const ponto = document.createElement("span");
        ponto.className = "dia__marcador";
        ponto.style.background = cor;
        container.appendChild(ponto);
      });
      celula.appendChild(container);
    }

    celula.addEventListener("click", () => abrirPainel(chave, dia));
    grid.appendChild(celula);
  }
}

function abrirPainel(chave, dia) {
  dataSelecionada = chave;
  painelData.textContent = `${dia} de ${MESES[mesAtual]}`;
  renderizarListaEventos();
  painel.hidden = false;
  inputTitulo.focus();
}

function renderizarListaEventos() {
  listaEventos.innerHTML = "";
  const lista = eventos[dataSelecionada] || [];

  if (lista.length === 0) {
    const vazio = document.createElement("li");
    vazio.className = "vazio";
    vazio.textContent = "Nenhum evento neste dia.";
    listaEventos.appendChild(vazio);
    return;
  }

  lista.forEach((ev) => {
    const item = document.createElement("li");

    const label = document.createElement("span");
    label.className = "evento__label";

    const ponto = document.createElement("span");
    ponto.className = "evento__ponto";
    ponto.style.background = ev.cor || "#6B8F71";

    const titulo = document.createElement("span");
    titulo.className = "evento__titulo";
    titulo.textContent = ev.titulo;

    label.appendChild(ponto);
    label.appendChild(titulo);

    const btnRemover = document.createElement("button");
    btnRemover.textContent = "×";
    btnRemover.setAttribute("aria-label", `Remover evento ${ev.titulo}`);
    btnRemover.addEventListener("click", () => removerEvento(ev.id));

    item.appendChild(label);
    item.appendChild(btnRemover);
    listaEventos.appendChild(item);
  });
}

async function adicionarEvento(titulo, cor) {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: dataSelecionada, titulo, cor }),
  });
  const novoEvento = await res.json();
  if (!eventos[dataSelecionada]) eventos[dataSelecionada] = [];
  eventos[dataSelecionada].push(novoEvento);
  renderizarListaEventos();
  renderizarCalendario();
}

async function removerEvento(id) {
  await fetch(`/api/events/${dataSelecionada}/${id}`, { method: "DELETE" });
  eventos[dataSelecionada] = eventos[dataSelecionada].filter((ev) => ev.id !== id);
  renderizarListaEventos();
  renderizarCalendario();
}

document.getElementById("btn-prev").addEventListener("click", () => {
  mesAtual--;
  if (mesAtual < 0) {
    mesAtual = 11;
    anoAtual--;
  }
  renderizarCalendario();
});

document.getElementById("btn-next").addEventListener("click", () => {
  mesAtual++;
  if (mesAtual > 11) {
    mesAtual = 0;
    anoAtual++;
  }
  renderizarCalendario();
});

document.getElementById("btn-hoje").addEventListener("click", () => {
  mesAtual = hoje.getMonth();
  anoAtual = hoje.getFullYear();
  renderizarCalendario();
});

function fecharPainel() {
  painel.hidden = true;
}

document.getElementById("btn-fechar").addEventListener("click", fecharPainel);

// Fecha ao clicar fora da caixa (na área escura ao redor)
painel.addEventListener("click", (e) => {
  if (e.target === painel) fecharPainel();
});

// Fecha ao apertar Esc
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !painel.hidden) fecharPainel();
});

formEvento.addEventListener("submit", (e) => {
  e.preventDefault();
  const titulo = inputTitulo.value.trim();
  if (!titulo) return;
  adicionarEvento(titulo, corSelecionada);
  inputTitulo.value = "";
});

(async function iniciar() {
  montarSeletorCores();
  await carregarEventos();
  renderizarCalendario();
})();
