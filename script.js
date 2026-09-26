/* ============================================================
   DoremiArtz · script
   Lê o conteudo.json e monta a página. Você não precisa mexer
   aqui para trocar textos, preços ou imagens: edite o JSON.
   ============================================================ */

(() => {
  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];
  const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const esc = (texto) =>
    String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const pegar = (obj, caminho) => caminho.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

  const ESTRELA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z"/></svg>';

  const ICONES = {
    telegram: '<path d="M21.5 3.5 2.8 10.7c-.9.4-.9 1.6 0 1.9l4.6 1.6 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.6 3.4c.7.5 1.6.1 1.8-.7L22.9 4.9c.2-1-.6-1.8-1.4-1.4Z"/><path d="m7.4 14.2 10-7.2-7.6 8.4"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".6" fill="currentColor"/>',
    tiktok: '<path d="M14 3v11.8a3.8 3.8 0 1 1-3.8-3.8"/><path d="M14 3c.4 2.8 2.4 4.8 5.5 5"/>',
    padrao: '<path d="M10 14 21 3M15 3h6v6"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>'
  };

  // Quanto da figura cada tamanho mostra (em uma figura de 40 de altura)
  const CORTES = { headshot: 15, halfbody: 26, fullbody: 40 };
  const iconeCorte = (tipo) => {
    const altura = CORTES[String(tipo).toLowerCase().replace(/[\s-]/g, "")];
    if (!altura) return "";
    return `<svg class="icone-corte" viewBox="0 0 24 40" aria-hidden="true">
      <circle class="corpo" cx="12" cy="7" r="4.3"/>
      <path class="corpo" d="M5.5 26V17.5Q5.5 12.6 12 12.6T18.5 17.5V26Z"/>
      <path class="pernas" d="M9 26v12M15 26v12"/>
      <rect class="corte" x="1" y="1" width="22" height="${altura - 2}" rx="2.5"/>
    </svg>`;
  };

  /* ---------------- montagem ---------------- */

  function montar(d) {
    const moeda = d.precos?.moeda || "R$";

    // textos simples
    $$("[data-campo]").forEach((el) => {
      const campo = el.dataset.campo;
      const valor = campo === "nome" ? d.artista?.nome : campo === "descricao" || campo === "detalhe" ? d.artista?.[campo] : pegar(d, campo);
      if (valor != null) el.textContent = valor;
    });

    // status das comissões
    const abertas = !!d.comissoes?.abertas;
    $$("[data-status]").forEach((el) => {
      el.classList.toggle("aberto", abertas);
      $(".status-texto", el).textContent = abertas ? d.comissoes.textoAberto : d.comissoes.textoFechado;
    });
    $("#aviso-fechado").hidden = abertas;

    // nome com letras animadas; a parte depois da 2ª maiúscula fica em destaque
    const nome = d.artista?.nome || "";
    const corte = nome.slice(1).search(/[A-ZÀ-Ý]/) + 1;
    $("#hero-nome").setAttribute("aria-label", nome);
    $(".hero-nome-texto").innerHTML = [...nome]
      .map((letra, i) => `<span class="letra${corte > 0 && i >= corte ? " destaque" : ""}" style="--i:${i}" aria-hidden="true">${letra === " " ? "&nbsp;" : esc(letra)}</span>`)
      .join("");

    const hero = $("#hero-imagem");
    hero.src = d.artista.imagem;
    hero.alt = d.artista.imagemDescricao || "";

    // faixa rolante com estilos e tamanhos
    const palavras = [];
    (d.precos?.estilos || []).forEach((e) => palavras.push(e.nome));
    const tipos = new Set();
    (d.precos?.estilos || []).forEach((e) => (e.itens || []).forEach((i) => tipos.add(i.tipo)));
    palavras.push(...tipos, "Comissões para o mundo todo");
    const metade = Array(3).fill(palavras).flat().map((p) => `<span>${esc(p)} ${ESTRELA}</span>`).join("");
    $("#faixa").innerHTML = metade + metade;

    // galeria
    const obras = d.galeria?.obras || [];
    $("#galeria").innerHTML = obras
      .map(
        (o, i) => `
      <figure class="obra revelar" style="transition-delay:${(i % 2) * 90}ms">
        <button class="obra-botao" type="button" data-grupo="galeria" data-indice="${i}" aria-label="Ampliar: ${esc(o.titulo)}">
          <img src="${esc(o.imagem)}" alt="${esc(o.descricao || o.titulo)}" decoding="async">
        </button>
        <figcaption><span class="obra-titulo">${esc(o.titulo)}</span><span class="obra-tipo">${esc(o.tipo)}</span></figcaption>
      </figure>`
      )
      .join("");
    // artes deitadas ocupam a linha inteira
    $$("#galeria img").forEach((img) => {
      const marcar = () => img.naturalWidth > img.naturalHeight * 1.2 && img.closest(".obra").classList.add("largo");
      img.complete ? marcar() : img.addEventListener("load", marcar, { once: true });
    });

    // vídeo do processo
    if (d.processo?.video) $("#video").src = d.processo.video;
    else $("#processo").hidden = true;

    // legenda dos tamanhos
    $("#legenda").innerHTML = [...tipos].map((t) => `<span>${iconeCorte(t)}${esc(t)}</span>`).join("");

    // preços
    const estilos = d.precos?.estilos || [];
    $("#lista-precos").innerHTML = estilos
      .map((e, i) => {
        const menor = Math.min(...(e.itens || []).map((it) => Number(it.preco)).filter((n) => !isNaN(n)));
        return `
      <article class="plano revelar" style="transition-delay:${i * 110}ms">
        <button class="plano-imagem" type="button" data-grupo="precos" data-indice="${i}" aria-label="Ver tabela de ${esc(e.nome)} em tamanho grande">
          ${isFinite(menor) ? `<span class="plano-desde">a partir de ${esc(moeda)} ${menor}</span>` : ""}
          <img src="${esc(e.imagem)}" alt="Tabela de preços ${esc(e.nome)}" loading="lazy" decoding="async">
        </button>
        <div class="plano-corpo">
          <h3>${esc(e.nome)}</h3>
          <p class="plano-descricao">${esc(e.descricao)}</p>
          <ul class="tabela">
            ${(e.itens || [])
              .map(
                (it) => `<li>${iconeCorte(it.tipo)}<span class="tipo">${esc(it.tipo)}</span><span class="pontilhado"></span><span class="valor"><small>${esc(moeda)}</small>${esc(it.preco)}</span></li>`
              )
              .join("")}
          </ul>
        </div>
      </article>`;
      })
      .join("");

    // avisos
    $("#regras").innerHTML = (d.avisos?.lista || [])
      .map((r) => `<div${r.destaque ? ' class="regra-destaque"' : ""}>${ESTRELA}<dt>${esc(r.titulo)}</dt><dd>${esc(r.texto)}</dd></div>`)
      .join("");
    $("#nao-faco").innerHTML = (d.avisos?.naoFaco || []).map((n) => `<li>${esc(n)}</li>`).join("");
    const adicionais = d.avisos?.adicionais || [];
    $("#adicionais-quadro").hidden = !adicionais.length;
    $("#adicionais").innerHTML = adicionais
      .map((a) => `<li><span>${esc(a.item)}</span><span class="pontilhado"></span><strong>${esc(a.valor)}</strong></li>`)
      .join("");

    // redes
    $("#redes").innerHTML = (d.contato?.redes || [])
      .map((r) => {
        const icone = ICONES[String(r.nome).toLowerCase()] || ICONES.padrao;
        return `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">
          <span class="rede-icone"><svg viewBox="0 0 24 24" aria-hidden="true">${icone}</svg></span>
          <span><span class="rede-nome">${esc(r.nome)}</span><span class="rede-usuario">${esc(r.usuario)}</span></span>
          <span class="rede-seta" aria-hidden="true">↗</span>
        </a></li>`;
      })
      .join("");

    $("#ano").textContent = new Date().getFullYear();

    ativarVisor(d);
    ativarVideo();
    ativarRevelar();
  }

  /* ---------------- visor de imagens ---------------- */

  function ativarVisor(d) {
    const visor = $("#visor");
    const grupos = {
      galeria: (d.galeria?.obras || []).map((o) => ({ src: o.imagem, titulo: o.titulo, alt: o.descricao || o.titulo })),
      precos: (d.precos?.estilos || []).map((e) => ({ src: e.imagem, titulo: e.nome, alt: `Tabela de preços ${e.nome}` }))
    };
    let grupo = [];
    let atual = 0;
    let origem = null;

    const mostrar = (i) => {
      atual = (i + grupo.length) % grupo.length;
      const item = grupo[atual];
      $("#visor-imagem").src = item.src;
      $("#visor-imagem").alt = item.alt;
      $("#visor-titulo").textContent = item.titulo;
      $("#visor-contador").textContent = grupo.length > 1 ? `${atual + 1} / ${grupo.length}` : "";
      $$(".visor-seta", visor).forEach((b) => (b.hidden = grupo.length < 2));
    };

    document.addEventListener("click", (ev) => {
      const alvo = ev.target.closest("[data-grupo]");
      if (!alvo || !visor.showModal) return;
      grupo = grupos[alvo.dataset.grupo] || [];
      origem = alvo;
      mostrar(Number(alvo.dataset.indice));
      visor.showModal();
    });

    visor.addEventListener("click", (ev) => {
      const acao = ev.target.closest("[data-visor]")?.dataset.visor;
      if (acao === "fechar" || ev.target === visor || ev.target.tagName === "FIGURE") visor.close();
      if (acao === "anterior") mostrar(atual - 1);
      if (acao === "proxima") mostrar(atual + 1);
    });
    visor.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowLeft") mostrar(atual - 1);
      if (ev.key === "ArrowRight") mostrar(atual + 1);
    });
    visor.addEventListener("close", () => origem?.focus());

    // deslizar no celular
    let inicioX = null;
    visor.addEventListener("touchstart", (ev) => (inicioX = ev.touches[0].clientX), { passive: true });
    visor.addEventListener("touchend", (ev) => {
      if (inicioX == null) return;
      const dx = ev.changedTouches[0].clientX - inicioX;
      if (Math.abs(dx) > 50 && grupo.length > 1) mostrar(atual + (dx < 0 ? 1 : -1));
      inicioX = null;
    });
  }

  /* ---------------- vídeo ---------------- */

  function ativarVideo() {
    const video = $("#video");
    const botao = $("#video-botao");
    let pausadoPeloUsuario = semMovimento;

    const atualizarBotao = () => {
      botao.textContent = video.paused ? "Reproduzir vídeo" : "Pausar vídeo";
      botao.setAttribute("aria-pressed", String(video.paused));
    };
    video.addEventListener("play", atualizarBotao);
    video.addEventListener("pause", atualizarBotao);
    atualizarBotao();

    botao.addEventListener("click", () => {
      if (video.paused) { pausadoPeloUsuario = false; video.play().catch(() => {}); }
      else { pausadoPeloUsuario = true; video.pause(); }
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting && !pausadoPeloUsuario) video.play().catch(() => {});
          else if (!e.isIntersecting) video.pause();
        },
        { threshold: 0.3 }
      ).observe(video);
    }
  }

  /* ---------------- animações de entrada ---------------- */

  function ativarRevelar() {
    if (semMovimento || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("visto"); obs.unobserve(e.target); }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    $$(".revelar").forEach((el) => obs.observe(el));
    document.documentElement.classList.add("animar");
  }

  /* ---------------- topo, menu ativo, fundo e inclinação ---------------- */

  const topo = $("#topo");
  let pendente = false;
  const aoRolar = () => {
    pendente = false;
    const y = window.scrollY;
    topo.classList.toggle("rolado", y > 20);
    if (!semMovimento) document.documentElement.style.setProperty("--py", `${-((y * 0.12) % 1200)}px`);
  };
  addEventListener("scroll", () => { if (!pendente) { pendente = true; requestAnimationFrame(aoRolar); } }, { passive: true });
  aoRolar();

  if ("IntersectionObserver" in window) {
    const links = $$(".menu a");
    const obsMenu = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === `#${e.target.id}`)));
        }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    $$("main section[id]").forEach((s) => obsMenu.observe(s));
  }

  const arte = $(".hero-arte");
  const quadro = $("#quadro");
  if (!semMovimento && matchMedia("(pointer: fine)").matches) {
    arte.addEventListener("pointermove", (ev) => {
      const r = arte.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width;
      const y = (ev.clientY - r.top) / r.height;
      quadro.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
      quadro.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
      quadro.style.setProperty("--bx", `${x * 100}%`);
      quadro.style.setProperty("--by", `${y * 100}%`);
    });
    arte.addEventListener("pointerleave", () => {
      quadro.style.setProperty("--rx", "0deg");
      quadro.style.setProperty("--ry", "0deg");
    });
  }

  /* ---------------- carregar conteúdo ---------------- */

  fetch("conteudo.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(montar)
    .catch((erro) => {
      console.error("Erro ao carregar conteudo.json:", erro);
      $("#erro").hidden = false;
    });
})();
