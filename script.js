/* ============================================================
   DoremiArtz · script
   Lê o conteudo.json (português) e o traducoes.json (inglês e
   espanhol) e monta a página. Para trocar textos, preços ou
   imagens, edite os JSON; aqui não precisa mexer.
   ============================================================ */

(() => {
  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];
  const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mouseFino = matchMedia("(pointer: fine)").matches;

  const esc = (texto) =>
    String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pegar = (obj, caminho) => caminho.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  const normalizar = (t) => String(t ?? "").toLowerCase().replace(/[\s-]/g, "");
  const preencher = (modelo, dados) => String(modelo ?? "").replace(/\{(\w+)\}/g, (_, k) => dados[k] ?? "");

  // junta o conteúdo em português com a tradução; o que não foi traduzido fica em português
  const mesclar = (base, extra) => {
    if (extra == null || extra === "") return base;
    if (Array.isArray(base)) {
      if (!Array.isArray(extra)) return base;
      if (base.every((x) => typeof x !== "object")) return extra.length ? extra : base;
      return base.map((item, i) => mesclar(item, extra[i]));
    }
    if (base && typeof base === "object") {
      const saida = { ...base };
      for (const k of Object.keys(extra)) saida[k] = k in base ? mesclar(base[k], extra[k]) : extra[k];
      return saida;
    }
    return extra;
  };

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
    const altura = CORTES[normalizar(tipo)];
    if (!altura) return "";
    return `<svg class="icone-corte" viewBox="0 0 24 40" aria-hidden="true">
      <circle class="corpo" cx="12" cy="7" r="4.3"/>
      <path class="corpo" d="M5.5 26V17.5Q5.5 12.6 12 12.6T18.5 17.5V26Z"/>
      <path class="pernas" d="M9 26v12M15 26v12"/>
      <rect class="corte" x="1" y="1" width="22" height="${altura - 2}" rx="2.5"/>
    </svg>`;
  };

  /* ---------------- idioma ---------------- */

  let BASE = null;        // conteudo.json
  let TRAD = null;        // traducoes.json
  let idioma = "pt";

  function escolherIdioma() {
    const disponiveis = (TRAD.idiomas || []).map((i) => i.codigo);
    const daUrl = new URLSearchParams(location.search).get("lang");
    if (disponiveis.includes(daUrl)) return daUrl;
    try {
      const salvo = localStorage.getItem("idioma");
      if (disponiveis.includes(salvo)) return salvo;
    } catch {}
    // idioma do navegador (português do Brasil ou de Portugal → pt, espanhol de qualquer país → es...)
    for (const l of navigator.languages || [navigator.language || ""]) {
      const codigo = String(l).toLowerCase().slice(0, 2);
      if (disponiveis.includes(codigo)) return codigo;
    }
    return disponiveis.includes(TRAD.padrao) ? TRAD.padrao : "pt";
  }

  /* ---------------- estimativa de preço ---------------- */

  function estimar(obra) {
    const p = BASE.precos || {};
    if (obra.precoManual) return { manual: obra.precoManual };
    const estilo = (p.estilos || []).find((e) => normalizar(e.nome) === normalizar(obra.estilo));
    const item = estilo?.itens?.find((i) => normalizar(i.tipo) === normalizar(obra.tamanho));
    if (!item) return null;

    const valorBase = Number(item.preco) || 0;
    const extras = Number(obra.personagensExtras) || 0;
    const porcento = Number(p.extras?.personagemExtraPorcento) || 0;
    const valorExtra = Math.round((valorBase * porcento) / 100);
    const fundo = normalizar(obra.background);
    const valorFundo = fundo === "complexo" ? Number(p.extras?.backgroundComplexo) || 0 : fundo === "simples" ? Number(p.extras?.backgroundSimples) || 0 : 0;

    return {
      total: valorBase + valorExtra * extras + valorFundo,
      aPartir: valorFundo > 0, // os fundos são "a partir de"
      partes: [
        { chave: "base", valor: valorBase, rotulo: `${estilo.nome} ${item.tipo}` },
        ...(extras ? [{ chave: "extra", valor: valorExtra * extras, qtd: extras }] : []),
        ...(valorFundo ? [{ chave: fundo, valor: valorFundo }] : [])
      ]
    };
  }

  /* ---------------- montagem ---------------- */

  let jaMontou = false;
  let gruposVisor = { galeria: [], precos: [] };

  function montar() {
    const d = mesclar(BASE, idioma === "pt" ? null : TRAD.conteudo?.[idioma]);
    const t = { ...(TRAD.interface?.pt || {}), ...(TRAD.interface?.[idioma] || {}) };
    const moeda = d.precos?.moeda || "R$";
    const dinheiro = (v) => `${moeda} ${v}`;

    document.documentElement.lang = idioma === "pt" ? "pt-BR" : idioma;

    // textos fixos da interface
    $$("[data-i18n]").forEach((el) => { if (t[el.dataset.i18n] != null) el.textContent = t[el.dataset.i18n]; });
    $$("[data-i18n-aria]").forEach((el) => { if (t[el.dataset.i18nAria]) el.setAttribute("aria-label", t[el.dataset.i18nAria]); });
    $("#moeda-nota").hidden = !t.moeda_nota;
    $("#video-quadro").dataset.rotulo = t.timelapse || "";

    // textos do conteúdo
    $$("[data-campo]").forEach((el) => {
      const campo = el.dataset.campo;
      const valor = campo === "nome" ? d.artista?.nome : pegar(d, campo);
      if (valor != null) el.textContent = valor;
    });

    // seletor de idioma
    const seletor = $("#idioma");
    if (!seletor.options.length) {
      seletor.innerHTML = (TRAD.idiomas || []).map((i) => `<option value="${esc(i.codigo)}" lang="${esc(i.codigo)}" title="${esc(i.nome)}" aria-label="${esc(i.nome)}">${esc(i.sigla || i.codigo.toUpperCase())}</option>`).join("");
    }
    seletor.value = idioma;

    // status das comissões
    const abertas = !!d.comissoes?.abertas;
    $$("[data-status]").forEach((el) => {
      el.classList.toggle("aberto", abertas);
      $(".status-texto", el).textContent = abertas ? d.comissoes.textoAberto : d.comissoes.textoFechado;
    });
    $("#aviso-fechado").hidden = abertas;

    // nome com letras animadas; a parte depois da 2ª maiúscula fica em destaque
    const nome = d.artista?.nome || "";
    if ($("#hero-nome").getAttribute("aria-label") !== nome) {
      const corte = nome.slice(1).search(/[A-ZÀ-Ý]/) + 1;
      $("#hero-nome").setAttribute("aria-label", nome);
      $(".hero-nome-texto").innerHTML = [...nome]
        .map((letra, i) => `<span class="letra${corte > 0 && i >= corte ? " destaque" : ""}" style="--i:${i}" aria-hidden="true">${letra === " " ? "&nbsp;" : esc(letra)}</span>`)
        .join("");
      // mede a largura real do nome para ele sempre caber na coluna
      const medirNome = () => {
        const h1 = $("#hero-nome");
        const fonte = parseFloat(getComputedStyle(h1).fontSize);
        const largura = $(".hero-nome-texto").offsetWidth;
        if (fonte && largura) h1.style.setProperty("--razao", (largura / fonte).toFixed(3));
      };
      medirNome();
      document.fonts?.ready.then(medirNome);
    }

    const hero = $("#hero-imagem");
    if (!hero.getAttribute("src")) hero.src = d.artista.imagem;
    hero.alt = d.artista.imagemDescricao || "";

    // faixa rolante com estilos e tamanhos
    const estilos = d.precos?.estilos || [];
    const tipos = new Set();
    estilos.forEach((e) => (e.itens || []).forEach((i) => tipos.add(i.tipo)));
    const palavras = [...estilos.map((e) => e.nome), ...tipos, t.faixa_mundo];
    const metade = Array(3).fill(palavras).flat().map((p) => `<span>${esc(p)} ${ESTRELA}</span>`).join("");
    $("#faixa").innerHTML = metade + metade;

    // sobre
    const sobre = d.sobre || {};
    $("#sobre").hidden = !sobre.titulo;
    const fotoSobre = $("#sobre-imagem");
    if (sobre.imagem && fotoSobre.getAttribute("src") !== sobre.imagem) fotoSobre.src = sobre.imagem;
    fotoSobre.alt = sobre.imagemDescricao || "";
    $(".sobre-foto").hidden = !sobre.imagem;
    const paragrafos = Array.isArray(sobre.texto) ? sobre.texto : [sobre.texto].filter(Boolean);
    $("#sobre-paragrafos").innerHTML = paragrafos.map((p) => `<p>${esc(p)}</p>`).join("");
    $("#sobre-destaques").innerHTML = (sobre.destaques || []).map((x) => `<li>${ESTRELA}${esc(x)}</li>`).join("");

    // galeria com preço estimado
    const obras = d.galeria?.obras || [];
    const rotuloParte = (parte) =>
      parte.chave === "base" ? parte.rotulo
      : parte.chave === "extra" ? (parte.qtd > 1 ? `${parte.qtd}× ${t.personagem_extra}` : t.personagem_extra)
      : parte.chave === "complexo" ? t.bg_complexo : t.bg_simples;

    $("#galeria").innerHTML = obras
      .map((o, i) => {
        const est = estimar(BASE.galeria.obras[i] || o);
        const tipo = [o.estilo, o.tamanho].filter(Boolean).join(" · ");
        let etiqueta, conta = "";
        if (est?.manual) {
          etiqueta = `<span class="estimativa-rotulo">${esc(t.estimativa)}</span><strong>${esc(est.manual)}</strong>`;
        } else if (est) {
          etiqueta = `<span class="estimativa-rotulo">${esc(t.estimativa)}</span><strong>${est.aPartir ? `<small>${esc(t.a_partir_de)}</small> ` : ""}${esc(dinheiro(est.total))}</strong>`;
          conta = est.partes.map((p) => `<span>${esc(rotuloParte(p))} <b>${esc(dinheiro(p.valor))}</b></span>`).join('<i aria-hidden="true">+</i>');
        } else {
          etiqueta = `<span class="estimativa-rotulo">${esc(t.estimativa)}</span><strong>${esc(t.sob_consulta)}</strong>`;
        }
        return `
      <figure class="obra revelar" style="transition-delay:${(i % 3) * 80}ms">
        <button class="obra-botao" type="button" data-grupo="galeria" data-indice="${i}" data-rotulo="${esc(t.ampliar)}" aria-label="${esc(preencher(t.ampliar_aria, { titulo: o.titulo }))}">
          <img src="${esc(o.imagem)}" alt="${esc(o.descricao || o.titulo)}" decoding="async">
          <span class="obra-preco">${etiqueta}</span>
        </button>
        <figcaption>
          <span class="obra-titulo">${esc(o.titulo)}</span>
          ${tipo ? `<span class="obra-tipo">${esc(tipo)}</span>` : ""}
          ${conta ? `<span class="obra-conta">${conta}</span>` : ""}
        </figcaption>
      </figure>`;
      })
      .join("");
    // cada arte recebe a proporção dela, para as linhas terem a mesma altura
    $$("#galeria img").forEach((img) => {
      const medir = () => img.naturalWidth && img.closest(".obra").style.setProperty("--r", (img.naturalWidth / img.naturalHeight).toFixed(3));
      img.complete ? medir() : img.addEventListener("load", medir, { once: true });
    });

    // vídeo do processo
    const video = $("#video");
    if (d.processo?.video) { if (!video.getAttribute("src")) video.src = d.processo.video; }
    else $("#processo").hidden = true;
    atualizarBotaoVideo = () => {
      const botao = $("#video-botao");
      botao.textContent = video.paused ? t.reproduzir_video : t.pausar_video;
      botao.setAttribute("aria-pressed", String(video.paused));
    };
    atualizarBotaoVideo();

    // legenda dos tamanhos
    $("#legenda").innerHTML = [...tipos].map((x) => `<span>${iconeCorte(x)}${esc(x)}</span>`).join("");

    // preços
    $("#lista-precos").innerHTML = estilos
      .map((e, i) => {
        const menor = Math.min(...(e.itens || []).map((it) => Number(it.preco)).filter((n) => !isNaN(n)));
        return `
      <article class="plano revelar" style="transition-delay:${i * 110}ms">
        <button class="plano-imagem" type="button" data-grupo="precos" data-indice="${i}" aria-label="${esc(preencher(t.ver_tabela_aria, { nome: e.nome }))}">
          ${isFinite(menor) ? `<span class="plano-desde">${esc(t.a_partir_de)} ${esc(dinheiro(menor))}</span>` : ""}
          <img src="${esc(e.imagem)}" alt="${esc(preencher(t.tabela_alt, { nome: e.nome }))}" loading="lazy" decoding="async">
        </button>
        <div class="plano-corpo">
          <h3>${esc(e.nome)}</h3>
          <p class="plano-descricao">${esc(e.descricao)}</p>
          <ul class="tabela">
            ${(e.itens || [])
              .map((it) => `<li>${iconeCorte(it.tipo)}<span class="tipo">${esc(it.tipo)}</span><span class="pontilhado"></span><span class="valor"><small>${esc(moeda)}</small>${esc(it.preco)}</span></li>`)
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

    // adicionais, gerados a partir dos valores de "extras" nos preços
    const ex = d.precos?.extras || {};
    const adicionais = [
      ex.personagemExtraPorcento != null && [t.personagem_extra, `+${ex.personagemExtraPorcento}%`],
      ex.backgroundSimples != null && [t.bg_simples, `${t.a_partir_de} ${dinheiro(ex.backgroundSimples)}`],
      ex.backgroundComplexo != null && [t.bg_complexo, `${t.a_partir_de} ${dinheiro(ex.backgroundComplexo)}`]
    ].filter(Boolean);
    $("#adicionais-quadro").hidden = !adicionais.length;
    $("#adicionais").innerHTML = adicionais
      .map(([item, valor]) => `<li><span>${esc(item)}</span><span class="pontilhado"></span><strong>${esc(valor)}</strong></li>`)
      .join("");

    // redes
    $("#redes").innerHTML = (d.contato?.redes || [])
      .map((r) => {
        const icone = ICONES[normalizar(r.nome)] || ICONES.padrao;
        return `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">
          <span class="rede-icone"><svg viewBox="0 0 24 24" aria-hidden="true">${icone}</svg></span>
          <span><span class="rede-nome">${esc(r.nome)}</span><span class="rede-usuario">${esc(r.usuario)}</span></span>
          <span class="rede-seta" aria-hidden="true">↗</span>
        </a></li>`;
      })
      .join("");

    $("#ano").textContent = new Date().getFullYear();

    // imagens do visor (ampliar)
    gruposVisor = {
      galeria: obras.map((o) => ({ src: o.imagem, titulo: o.titulo, alt: o.descricao || o.titulo })),
      precos: estilos.map((e) => ({ src: e.imagem, titulo: e.nome, alt: preencher(t.tabela_alt, { nome: e.nome }) }))
    };

    if (!jaMontou) {
      jaMontou = true;
      ativarVisor();
      ativarVideo();
    }
    ativarRevelar();
  }

  /* ---------------- visor de imagens ---------------- */

  function ativarVisor() {
    const visor = $("#visor");
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
      grupo = gruposVisor[alvo.dataset.grupo] || [];
      origem = alvo;
      mostrar(Number(alvo.dataset.indice));
      visor.showModal();
      // a luz e a asinha vão junto para dentro do visor
      visor.append($("#luz-cursor"), $("#asa-cursor"));
    });

    const fechar = () => { visor.close(); devolverEfeitosMouse(); };
    visor.addEventListener("click", (ev) => {
      const acao = ev.target.closest("[data-visor]")?.dataset.visor;
      if (acao === "fechar" || ev.target === visor || ev.target.tagName === "FIGURE") fechar();
      if (acao === "anterior") mostrar(atual - 1);
      if (acao === "proxima") mostrar(atual + 1);
    });
    visor.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowLeft") mostrar(atual - 1);
      if (ev.key === "ArrowRight") mostrar(atual + 1);
    });
    visor.addEventListener("close", () => {
      devolverEfeitosMouse();
      origem?.focus();
    });

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

  // traz a luz e a asinha de volta para a página quando o visor fecha
  function devolverEfeitosMouse() {
    const luz = $("#luz-cursor"), asa = $("#asa-cursor");
    if (asa.parentElement !== document.body) document.body.append(luz, asa);
  }

  /* ---------------- vídeo ---------------- */

  let atualizarBotaoVideo = () => {};

  function ativarVideo() {
    const video = $("#video");
    let pausadoPeloUsuario = semMovimento;
    video.addEventListener("play", () => atualizarBotaoVideo());
    video.addEventListener("pause", () => atualizarBotaoVideo());

    $("#video-botao").addEventListener("click", () => {
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

  let observadorRevelar = null;

  function ativarRevelar() {
    if (semMovimento || !("IntersectionObserver" in window)) return;
    // ao trocar de idioma, o que já apareceu não anima de novo
    if (observadorRevelar) {
      $$(".revelar:not(.visto)").forEach((el) => el.classList.add("visto"));
      return;
    }
    observadorRevelar = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("visto"); observadorRevelar.unobserve(e.target); }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    $$(".revelar").forEach((el) => observadorRevelar.observe(el));
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
  if (!semMovimento && mouseFino) {
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

  /* ---------------- mouse: luz que segue + ponteiro de asinha ---------------- */

  const luz = $("#luz-cursor");
  const asa = $("#asa-cursor");
  if (mouseFino) {
    let alvoX = innerWidth / 2, alvoY = innerHeight / 2;
    let x = alvoX, y = alvoY, escala = 1, alvoEscala = 1;
    let rodando = false;

    const passo = () => {
      // com "menos movimento" ativado, a luz vai direto para o mouse
      const f = semMovimento ? 1 : 0.18;
      x += (alvoX - x) * f;
      y += (alvoY - y) * f;
      escala += (alvoEscala - escala) * (semMovimento ? 1 : 0.2);
      luz.style.setProperty("--lx", `${x}px`);
      luz.style.setProperty("--ly", `${y}px`);
      luz.style.setProperty("--ls", escala.toFixed(3));
      const parado = Math.abs(alvoX - x) < 0.3 && Math.abs(alvoY - y) < 0.3 && Math.abs(alvoEscala - escala) < 0.002;
      rodando = !parado;
      if (rodando) requestAnimationFrame(passo);
    };
    const animar = () => { if (!rodando) { rodando = true; requestAnimationFrame(passo); } };

    // a asinha fica exatamente na ponta do mouse (sem atraso)
    const moverAsa = (px, py) => {
      asa.style.setProperty("--ax", `${px}px`);
      asa.style.setProperty("--ay", `${py}px`);
    };

    addEventListener("pointermove", (ev) => {
      if (ev.pointerType !== "mouse") return;
      // proteção: se o visor fechou, a asinha nunca pode ficar presa dentro dele
      if (!$("#visor").open) devolverEfeitosMouse();
      if (!luz.classList.contains("ativa")) { x = ev.clientX; y = ev.clientY; }
      alvoX = ev.clientX;
      alvoY = ev.clientY;
      moverAsa(ev.clientX, ev.clientY);
      document.documentElement.classList.add("com-asa");
      luz.classList.add("ativa");
      asa.classList.add("ativa");
      // sobre links e botões a asinha cresce um pouco
      asa.classList.toggle("sobre-link", !!ev.target.closest?.("a, button, select, label, [data-grupo]"));
      animar();
    }, { passive: true });

    addEventListener("pointerdown", (ev) => {
      if (ev.pointerType !== "mouse") return;
      luz.classList.add("clicando");
      alvoEscala = 0.82;
      animar();
      // bate a asa (reinicia a animação a cada clique)
      asa.classList.remove("batendo");
      void asa.offsetWidth;
      asa.classList.add("batendo");
    });
    const soltar = () => { luz.classList.remove("clicando"); alvoEscala = 1; animar(); };
    addEventListener("pointerup", soltar);
    addEventListener("blur", soltar);
    asa.addEventListener("animationend", () => asa.classList.remove("batendo"));
    document.documentElement.addEventListener("mouseleave", () => {
      luz.classList.remove("ativa");
      asa.classList.remove("ativa");
    });
  }

  /* ---------------- troca de idioma ---------------- */

  $("#idioma").addEventListener("change", (ev) => {
    idioma = ev.target.value;
    try { localStorage.setItem("idioma", idioma); } catch {}
    montar();
  });

  /* ---------------- carregar conteúdo ---------------- */

  const carregar = (arquivo) =>
    fetch(arquivo, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(`${arquivo}: HTTP ${r.status}`); return r.json(); });

  Promise.all([carregar("conteudo.json"), carregar("traducoes.json").catch((e) => { console.warn(e); return { idiomas: [{ codigo: "pt", nome: "Português", sigla: "PT" }], interface: {} }; })])
    .then(([conteudo, traducoes]) => {
      BASE = conteudo;
      TRAD = traducoes;
      idioma = escolherIdioma();
      montar();
    })
    .catch((erro) => {
      console.error("Erro ao carregar o conteúdo:", erro);
      $("#erro").hidden = false;
    });
})();
