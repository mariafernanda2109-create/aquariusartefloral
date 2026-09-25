/* ============================================================
   Ateliê Aquarius Arte Floral — main.js
   Parte 1: comportamento (funciona sem GSAP e sem animação).
   Parte 2: camada de animação (GSAP + ScrollTrigger + Lenis),
            só com prefers-reduced-motion desligado.
   ============================================================ */
(function () {
  "use strict";

  var doc = document.documentElement;
  var movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lenis = null; // preenchido pela camada de animação
  var animarAcordeao = false;

  function rem(valor) {
    return valor * parseFloat(getComputedStyle(doc).fontSize);
  }

  function alturaCabecalho() {
    var cab = document.querySelector(".cabecalho");
    return cab ? cab.offsetHeight : 0;
  }

  /* ==========================================================
     PARTE 1 — COMPORTAMENTO
     ========================================================== */

  /* ---------- WhatsApp: mensagem pré-preenchida ------------- */
  var WHATSAPP_NUMERO = "5567996776309";
  var WHATSAPP_MENSAGEM = "Olá! Vim pelo site do Ateliê Aquarius e gostaria de um orçamento.";

  function linksWhatsApp() {
    // data-whatsapp="mensagem" troca a mensagem padrão só naquele link
    document.querySelectorAll("[data-whatsapp]").forEach(function (a) {
      var msg = a.getAttribute("data-whatsapp") || WHATSAPP_MENSAGEM;
      a.setAttribute("href", "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(msg));
    });
  }

  /* ---------- Ano dinâmico ---------------------------------- */
  function anoAtual() {
    document.querySelectorAll("[data-ano]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------- Rolagem até âncora ------------------------------
     Com Lenis ativo, a rolagem passa por ele. O foco vai para o
     destino, para quem navega por teclado continuar dali.       */
  function focarDestino(alvo) {
    if (!alvo.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(alvo.tagName)) {
      alvo.setAttribute("tabindex", "-1");
    }
    alvo.focus({ preventScroll: true });
  }

  function rolarPara(alvo) {
    if (lenis) {
      lenis.scrollTo(alvo, { offset: alvo === document.body ? 0 : -(alturaCabecalho() + rem(1)) });
    } else if (alvo === document.body) {
      window.scrollTo({ top: 0, behavior: movimentoReduzido ? "auto" : "smooth" });
    } else {
      alvo.scrollIntoView({ behavior: movimentoReduzido ? "auto" : "smooth" });
    }
  }

  function ancoras() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute("href").slice(1);
      var alvo = id ? document.getElementById(id) : null;
      if (!alvo) return;
      e.preventDefault();
      rolarPara(alvo);
      focarDestino(alvo);
      if (history.replaceState) history.replaceState(null, "", "#" + id);
    });
  }

  function voltarAoTopo() {
    var botao = document.querySelector("[data-topo]");
    if (!botao) return;
    botao.addEventListener("click", function () {
      rolarPara(document.body);
      var logo = document.querySelector(".cabecalho__logo");
      if (logo) logo.focus({ preventScroll: true });
    });
  }

  /* ---------- Menu mobile ----------------------------------- */
  function menuMobile() {
    var botao = document.querySelector(".menu-botao");
    var menu = document.getElementById("menu-mobile");
    if (!botao || !menu) return;

    var rotulo = botao.querySelector(".menu-botao__rotulo");
    var aberto = false;

    function focaveis() {
      return [botao].concat([].slice.call(menu.querySelectorAll("a[href], button")));
    }

    function abrir() {
      aberto = true;
      botao.setAttribute("aria-expanded", "true");
      botao.setAttribute("aria-label", "Fechar menu");
      if (rotulo) rotulo.textContent = "Fechar";
      menu.classList.add("is-aberto");
      doc.classList.add("trava-scroll", "menu-aberto");
      if (lenis) lenis.stop();
      var primeiro = menu.querySelector("a[href]");
      if (primeiro) setTimeout(function () { primeiro.focus(); }, 50);
    }

    function fechar(devolverFoco) {
      if (!aberto) return;
      aberto = false;
      botao.setAttribute("aria-expanded", "false");
      botao.removeAttribute("aria-label");
      if (rotulo) rotulo.textContent = "Menu";
      menu.classList.remove("is-aberto");
      doc.classList.remove("trava-scroll", "menu-aberto");
      if (lenis) lenis.start();
      if (devolverFoco) botao.focus();
    }

    botao.addEventListener("click", function () {
      if (aberto) fechar(true);
      else abrir();
    });

    // link do menu: fecha e deixa a âncora rolar
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) fechar(false);
    });

    document.addEventListener("keydown", function (e) {
      if (!aberto) return;
      if (e.key === "Escape") {
        e.preventDefault();
        fechar(true);
        return;
      }
      if (e.key !== "Tab") return;
      var lista = focaveis();
      var primeiro = lista[0];
      var ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    });

    window.matchMedia("(min-width: 64rem)").addEventListener("change", function (mq) {
      if (mq.matches) fechar(false);
    });
  }

  /* ---------- Serviços: palco de fotos (desktop) ------------
     O serviço sob o mouse, com foco de teclado ou no centro da
     tela (telas grandes sem mouse) acende e troca a foto.       */
  function servicosPalco() {
    var itens = document.querySelectorAll("[data-servico]");
    if (!itens.length) return;
    var fotos = document.querySelectorAll("[data-palco]");
    var legenda = document.querySelector("[data-palco-legenda]");
    var grande = window.matchMedia("(min-width: 64rem)");
    var total = ("0" + itens.length).slice(-2);

    // fotos escondidas não entram no lazy-load: no desktop, carrega já
    function carregarFotos() {
      if (!grande.matches) return;
      fotos.forEach(function (f) {
        var img = f.querySelector("img");
        if (img) img.loading = "eager";
      });
    }
    carregarFotos();
    grande.addEventListener("change", carregarFotos);

    function ativar(n) {
      itens.forEach(function (s) { s.classList.toggle("is-ativo", s.getAttribute("data-servico") === n); });
      fotos.forEach(function (f) { f.classList.toggle("is-ativo", f.getAttribute("data-palco") === n); });
      if (legenda) legenda.textContent = ("0" + n).slice(-2) + " / " + total;
    }

    itens.forEach(function (s) {
      var n = s.getAttribute("data-servico");
      s.addEventListener("mouseenter", function () { if (grande.matches) ativar(n); });
      s.addEventListener("focusin", function () { ativar(n); });
    });

    if ("IntersectionObserver" in window) {
      var semMouse = window.matchMedia("(hover: none)");
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting && grande.matches && semMouse.matches) {
            ativar(en.target.getAttribute("data-servico"));
          }
        });
      }, { rootMargin: "-45% 0px -45% 0px" });
      itens.forEach(function (s) { obs.observe(s); });
    }
  }

  /* ---------- Portfólio: carrossel de trios -----------------
     Troca a cada 4s, mesmo com o mouse em cima. Para com foco de
     teclado dentro dele, fora da tela e com a aba escondida; o
     botão pausa de vez. Com movimento reduzido começa pausado.   */
  function carrosselPortfolio() {
    var raiz = document.querySelector("[data-carrossel]");
    if (!raiz) return;
    var trios = [].slice.call(raiz.querySelectorAll("[data-trio]"));
    var fotos = [].slice.call(raiz.querySelectorAll(".trio__item"));
    var caixaPontos = raiz.querySelector(".carrossel__indicadores");
    var trilho = raiz.querySelector("[data-carrossel-trilho]");
    var atual = raiz.querySelector("[data-carrossel-atual]");
    var total = raiz.querySelector("[data-carrossel-total]");
    var botao = raiz.querySelector("[data-carrossel-pausa]");
    // celular: uma foto por vez; do tablet em diante: trios
    var celular = window.matchMedia("(max-width: 47.99rem)");
    var INTERVALO = 4000;
    var umaPorVez = false;
    var pontos = [];
    var i = 0;
    var tocando = !movimentoReduzido;
    var comFoco = false;
    var naTela = true;
    var timer = null;

    raiz.querySelector("[data-carrossel-controles]").hidden = false;

    function dois(n) { return ("0" + n).slice(-2); }
    function passos() { return umaPorVez ? fotos.length : trios.length; }

    function marcarSlide(el, rotulo) {
      if (rotulo) {
        el.setAttribute("role", "group");
        el.setAttribute("aria-roledescription", "slide");
        el.setAttribute("aria-label", rotulo);
      } else {
        el.removeAttribute("role");
        el.removeAttribute("aria-roledescription");
        el.removeAttribute("aria-label");
      }
    }

    function esconder(el, sim) {
      if (sim) el.setAttribute("aria-hidden", "true");
      else el.removeAttribute("aria-hidden");
      el.inert = sim;
    }

    function montarPontos() {
      caixaPontos.innerHTML = "";
      pontos = [];
      for (var k = 0; k < passos(); k++) {
        var p = document.createElement("button");
        p.type = "button";
        p.className = "indicador";
        p.innerHTML = '<span class="sr-only">Mostrar ' + (umaPorVez ? "foto " : "trio ") + (k + 1) + "</span>";
        p.addEventListener("click", (function (n) {
          return function () { ir(n); agendar(); };
        })(k));
        caixaPontos.appendChild(p);
        pontos.push(p);
      }
      if (total) total.textContent = dois(passos());
    }

    function definirModo() {
      var uma = celular.matches;
      if (uma === umaPorVez && pontos.length) return;
      // mantém o lugar: 1ª foto do trio atual, ou o trio da foto atual
      var trioAtual = umaPorVez ? trios.indexOf(fotos[i].closest("[data-trio]")) : i;
      umaPorVez = uma;
      raiz.classList.toggle("carrossel--uma", uma);
      trios.forEach(function (t, k) {
        marcarSlide(t, uma ? null : (k + 1) + " de " + trios.length);
      });
      fotos.forEach(function (f, k) {
        marcarSlide(f, uma ? (k + 1) + " de " + fotos.length : null);
      });
      montarPontos();
      ir(uma ? fotos.indexOf(trios[trioAtual].querySelector(".trio__item")) : trioAtual);
    }

    function ir(n) {
      i = (n + passos()) % passos();
      var trioAtivo = umaPorVez ? fotos[i].closest("[data-trio]") : trios[i];
      trios.forEach(function (t) {
        var ativo = t === trioAtivo;
        t.classList.toggle("is-ativo", ativo);
        esconder(t, !ativo);
      });
      fotos.forEach(function (f, k) {
        var ativa = umaPorVez && k === i;
        f.classList.toggle("is-ativa", ativa);
        esconder(f, umaPorVez && !ativa);
      });
      pontos.forEach(function (p, k) {
        if (k === i) p.setAttribute("aria-current", "true");
        else p.removeAttribute("aria-current");
      });
      if (atual) atual.textContent = dois(i + 1);
    }

    function agendar() {
      clearTimeout(timer);
      var rodando = tocando && !comFoco && naTela && !document.hidden;
      raiz.classList.remove("is-tocando");
      if (!rodando) return;
      void raiz.offsetWidth; // reinicia o traço que enche
      raiz.classList.add("is-tocando");
      timer = setTimeout(function () {
        ir(i + 1);
        agendar();
      }, INTERVALO);
    }

    function atualizarBotao() {
      botao.textContent = tocando ? "Pausar" : "Reproduzir";
      botao.setAttribute("aria-label", (tocando ? "Pausar" : "Reproduzir") + " a troca automática de fotos");
      // parado, quem usa leitor de tela ouve a troca
      trilho.setAttribute("aria-live", tocando ? "off" : "polite");
    }

    botao.addEventListener("click", function () {
      tocando = !tocando;
      atualizarBotao();
      agendar();
    });

    // só o foco de teclado pausa: clique com o mouse não trava a troca
    raiz.addEventListener("focusin", function (e) {
      if (e.target.matches(":focus-visible")) { comFoco = true; agendar(); }
    });
    raiz.addEventListener("focusout", function (e) {
      if (!raiz.contains(e.relatedTarget)) { comFoco = false; agendar(); }
    });
    document.addEventListener("visibilitychange", agendar);

    // arrastar com o dedo: para a esquerda avança, para a direita volta.
    // Só conta gesto mais horizontal que vertical, para não brigar com a rolagem.
    var toqueX = null;
    var toqueY = 0;
    trilho.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      toqueX = e.clientX;
      toqueY = e.clientY;
    });
    trilho.addEventListener("pointerup", function (e) {
      if (toqueX === null) return;
      var dx = e.clientX - toqueX;
      var dy = e.clientY - toqueY;
      toqueX = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      ir(dx < 0 ? i + 1 : i - 1);
      agendar();
    });
    trilho.addEventListener("pointercancel", function () { toqueX = null; });
    // "change" nem sempre dispara ao girar a tela; resize reforça
    function aoMudarLargura() {
      var antes = umaPorVez;
      definirModo();
      if (antes !== umaPorVez) agendar();
    }
    celular.addEventListener("change", aoMudarLargura);
    window.addEventListener("resize", aoMudarLargura, { passive: true });

    // fotos escondidas não entram no lazy-load: perto da tela, carrega todas
    var carregou = false;
    function carregar() {
      if (carregou) return;
      carregou = true;
      raiz.querySelectorAll("img").forEach(function (img) { img.loading = "eager"; });
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting) carregar();
        });
      }, { rootMargin: "50% 0px" }).observe(raiz);
      new IntersectionObserver(function (entradas) {
        naTela = entradas[0].isIntersecting;
        agendar();
      }).observe(raiz);
    } else {
      carregar();
    }

    definirModo();
    atualizarBotao();
    agendar();
  }

  /* ---------- Vídeo do CTA -----------------------------------
     Loop contínuo com as regras do vídeo da hero: não toca com
     movimento reduzido nem economia de dados, pausa fora da tela
     e com a aba oculta. Como passa de 5s, clicar ou tocar no
     vídeo pausa e retoma (WCAG 2.2.2).                          */
  function videoCta() {
    var video = document.querySelector("[data-video-cta]");
    var controle = document.querySelector("[data-video-cta-controle]");
    if (!video || !controle) return;

    var economia = navigator.connection && navigator.connection.saveData;
    if (movimentoReduzido || economia) return;

    var pausadoPorVoce = false;
    var naTela = false;

    function tocar() {
      if (pausadoPorVoce || !naTela || document.hidden) return;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }

    function atualizar() {
      controle.classList.toggle("is-pausado", pausadoPorVoce);
      controle.setAttribute("aria-label", pausadoPorVoce ? "Reproduzir vídeo" : "Pausar vídeo");
    }

    controle.hidden = false;
    atualizar();

    controle.addEventListener("click", function () {
      pausadoPorVoce = !pausadoPorVoce;
      atualizar();
      if (pausadoPorVoce) video.pause();
      else tocar();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        naTela = entradas[0].isIntersecting;
        if (naTela) tocar();
        else video.pause();
      }, { threshold: 0.25 }).observe(video);
    } else {
      naTela = true;
      tocar();
    }

    // o navegador pausa vídeo em aba oculta; retoma ao voltar
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") tocar();
    });
  }

  /* ---------- Cabeçalho inteligente --------------------------
     Translúcido ao rolar; some ao descer, volta ao subir.       */
  function cabecalhoInteligente() {
    var cab = document.querySelector(".cabecalho");
    if (!cab) return;
    var ultimoY = window.scrollY;
    var agendado = false;

    function atualizar() {
      agendado = false;
      var y = window.scrollY;
      var menuAberto = doc.classList.contains("menu-aberto");
      var focoDentro = cab.contains(document.activeElement);

      cab.classList.toggle("is-rolado", y > 8);

      if (!menuAberto && !focoDentro && y > ultimoY && y > cab.offsetHeight * 2) {
        cab.classList.add("is-escondido");
      } else if (y < ultimoY - 2 || y <= cab.offsetHeight) {
        cab.classList.remove("is-escondido");
      }
      ultimoY = y;
    }

    window.addEventListener("scroll", function () {
      if (!agendado) {
        agendado = true;
        requestAnimationFrame(atualizar);
      }
    }, { passive: true });

    cab.addEventListener("focusin", function () {
      cab.classList.remove("is-escondido");
    });

    atualizar();
  }

  /* ---------- Acordeão (botões com aria-expanded) ----------- */
  function acordeao() {
    document.querySelectorAll("[data-acordeao] .faq__botao").forEach(function (botao) {
      var painel = document.getElementById(botao.getAttribute("aria-controls"));
      if (!painel) return;

      botao.addEventListener("click", function () {
        var abrir = botao.getAttribute("aria-expanded") !== "true";
        botao.setAttribute("aria-expanded", String(abrir));

        if (!animarAcordeao || !window.gsap) {
          painel.hidden = !abrir;
          return;
        }

        gsap.killTweensOf(painel);
        if (abrir) {
          painel.hidden = false;
          gsap.fromTo(painel, { height: 0 }, {
            height: "auto",
            duration: 0.6,
            ease: "power4.out",
            onComplete: function () {
              gsap.set(painel, { clearProps: "height" });
              if (window.ScrollTrigger) ScrollTrigger.refresh();
            }
          });
        } else {
          gsap.to(painel, {
            height: 0,
            duration: 0.4,
            ease: "power2.inOut",
            onComplete: function () {
              painel.hidden = true;
              gsap.set(painel, { clearProps: "height" });
              if (window.ScrollTrigger) ScrollTrigger.refresh();
            }
          });
        }
      });
    });
  }

  /* ---------- WhatsApp flutuante ------------------------------
     Aparece depois do hero, some quando o CTA final está visível. */
  function whatsFlutuante() {
    var botao = document.querySelector(".whats-flutuante");
    var hero = document.querySelector(".hero");
    var cta = document.querySelector(".cta");
    if (!botao || !hero || !cta || !("IntersectionObserver" in window)) return;

    var heroVisivel = true;
    var ctaVisivel = false;

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.target === hero) heroVisivel = e.isIntersecting;
        if (e.target === cta) ctaVisivel = e.isIntersecting;
      });
      botao.classList.toggle("is-visivel", !heroVisivel && !ctaVisivel);
    });

    observador.observe(hero);
    observador.observe(cta);
  }

  /* ---------- Vídeo de fundo do hero ------------------------
     Toca uma vez, por no máximo 5s, e para num quadro fixo. Movimento
     que termina em até 5s dispensa botão de pausa (WCAG 2.2.2).
     Sem autoplay no HTML: só toca com JS, sem movimento reduzido e
     sem economia de dados.                                        */
  function videoHero() {
    var video = document.querySelector("[data-video-hero]");
    if (!video) return;

    var economia = navigator.connection && navigator.connection.saveData;
    if (movimentoReduzido || economia) return;

    // a capa é o quadro de 1s do vídeo: começar dali deixa a troca
    // capa → vídeo sem emenda. Para em 5.7s: mesmo com o evento de
    // tempo a cada 0.25s, o movimento fica abaixo de 5s.
    var INICIO = 1;
    var FIM = INICIO + 4.7;
    var iniciado = false;
    var terminou = false;
    var naTela = true;

    function tocar() {
      if (!iniciado || terminou) return;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }

    function conferirFim() {
      if (terminou || video.currentTime < FIM) return;
      terminou = true;
      video.pause();
    }

    function iniciar() {
      try { video.currentTime = INICIO; } catch (e) {}
      iniciado = true;
      if (naTela) tocar();
    }

    // quadro a quadro quando o navegador permite; senão, pelo evento de tempo
    if ("requestVideoFrameCallback" in video) {
      var aCadaQuadro = function () {
        conferirFim();
        if (!terminou) video.requestVideoFrameCallback(aCadaQuadro);
      };
      video.requestVideoFrameCallback(aCadaQuadro);
    }
    video.addEventListener("timeupdate", conferirFim);
    video.addEventListener("ended", function () { terminou = true; });

    video.preload = "auto";
    if (video.readyState >= 1) iniciar();
    else video.addEventListener("loadedmetadata", iniciar, { once: true });
    video.load();

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          naTela = e.isIntersecting;
          if (naTela) tocar();
          else video.pause();
        });
      }).observe(video);
    }

    // o navegador pausa vídeo em aba oculta; retoma ao voltar, se ainda não acabou
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && naTela) tocar();
    });
  }

  /* ==========================================================
     PARTE 2 — CAMADA DE ANIMAÇÃO
     Checa prefers-reduced-motion antes de qualquer coisa.
     Easing: --ease-out cubic-bezier(0.22, 1, 0.36, 1) equivale a
     "power4.out" (quint out) no GSAP; --ease-in-out
     cubic-bezier(0.65, 0, 0.35, 1) equivale a "power2.inOut".
     ========================================================== */
  var EASE = "power4.out";
  var GATILHO = "top 85%";

  function liberarTudo() {
    clearTimeout(window.__seguranca);
    doc.classList.remove("anim", "com-preloader");
  }

  /* Divide o título em linhas mascaradas, preservando <em> e
     outros elementos inline. Devolve o HTML original no fim.     */
  function escapar(t) {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function dividirEmLinhas(el) {
    var grupos = [[]];

    function percorrer(no, envolver) {
      [].slice.call(no.childNodes).forEach(function (filho) {
        if (filho.nodeType === 3) {
          filho.textContent.split(/(\s+)/).forEach(function (parte) {
            if (!parte) return;
            if (!parte.trim()) {
              if (grupos[grupos.length - 1].length) grupos.push([]);
              return;
            }
            grupos[grupos.length - 1].push(envolver(escapar(parte)));
          });
        } else if (filho.nodeType === 1) {
          var tag = filho.tagName.toLowerCase();
          var attrs = [].slice.call(filho.attributes).map(function (a) {
            return " " + a.name + '="' + escapar(a.value).replace(/"/g, "&quot;") + '"';
          }).join("");
          percorrer(filho, function (h) {
            return envolver("<" + tag + attrs + ">" + h + "</" + tag + ">");
          });
        }
      });
    }

    percorrer(el, function (h) { return h; });
    grupos = grupos.filter(function (g) { return g.length; });

    el.innerHTML = grupos.map(function (g) {
      return '<span class="anim-palavra">' + g.join("") + "</span>";
    }).join(" ");

    var linhas = [];
    var topoAtual = null;
    [].slice.call(el.querySelectorAll(".anim-palavra")).forEach(function (p) {
      var topo = Math.round(p.offsetTop);
      if (topo !== topoAtual) {
        topoAtual = topo;
        linhas.push([]);
      }
      linhas[linhas.length - 1].push(p.innerHTML);
    });

    el.innerHTML = linhas.map(function (l) {
      return '<span class="anim-linha"><span class="anim-linha__interna">' + l.join(" ") + "</span></span>";
    }).join(" ");

    return [].slice.call(el.querySelectorAll(".anim-linha__interna"));
  }

  /* revelaTextoLinhas — cada linha sobe de dentro da máscara */
  function revelaTextoLinhas() {
    document.querySelectorAll('[data-anim="texto"]').forEach(function (el) {
      var original = el.innerHTML;
      var linhas = dividirEmLinhas(el);
      gsap.set(el, { visibility: "visible" });
      gsap.fromTo(linhas, { yPercent: 100 }, {
        yPercent: 0,
        duration: 1.1,
        stagger: 0.08,
        ease: EASE,
        scrollTrigger: { trigger: el, start: GATILHO, once: true },
        onComplete: function () { el.innerHTML = original; }
      });
    });
  }

  /* revelaLista — rótulos e parágrafos: fade + y 1.5rem */
  function revelaLista() {
    ScrollTrigger.batch('[data-anim="fade"]', {
      start: GATILHO,
      once: true,
      onEnter: function (itens) {
        gsap.fromTo(itens, { autoAlpha: 0, y: rem(1.5) }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.06,
          ease: EASE,
          clearProps: "transform"
        });
      }
    });
  }

  /* imagemCortina (variação clip-path) + imagemEscala na imagem interna */
  function revelaImagem(el, atraso) {
    var img = el.querySelector("img");
    var tl = gsap.timeline({ delay: atraso || 0 });
    tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 1.2,
      ease: EASE
    });
    if (img) {
      tl.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.2, ease: EASE, clearProps: "transform" }, 0);
    }
    return tl;
  }

  function imagensAoRolar() {
    ScrollTrigger.batch('[data-anim="imagem"]:not(.hero [data-anim="imagem"])', {
      start: GATILHO,
      once: true,
      onEnter: function (itens) {
        itens.forEach(function (el, i) { revelaImagem(el, i * 0.08); });
      }
    });
  }

  /* parallaxSuave — só a partir de 48rem */
  function parallaxSuave(mm) {
    mm.add("(min-width: 48rem)", function () {
      document.querySelectorAll("[data-parallax]").forEach(function (el) {
        gsap.fromTo(el, { yPercent: -8 }, {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        });
      });
    });
  }

  /* linha do processo desenhada pelo scroll */
  function linhaProcesso(mm) {
    var progresso = document.querySelector(".processo__progresso");
    if (!progresso) return;
    var gatilho = {
      trigger: ".processo__trilho",
      start: "top 75%",
      end: "bottom 60%",
      scrub: true
    };
    mm.add("(min-width: 64rem)", function () {
      gsap.fromTo(progresso, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: gatilho });
    });
    mm.add("(max-width: 63.99rem)", function () {
      gsap.fromTo(progresso, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: gatilho });
    });
  }

  /* marqueeLoop — cópia com aria-hidden, pausa no hover e no foco */
  function marqueeLoop() {
    document.querySelectorAll("[data-marquee]").forEach(function (el) {
      var trilha = el.querySelector(".marquee__trilha");
      if (!trilha) return;
      var copia = trilha.cloneNode(true);
      copia.setAttribute("aria-hidden", "true");
      copia.setAttribute("inert", "");
      el.appendChild(copia);
      el.classList.add("is-animado");

      var tween = gsap.to(el.querySelectorAll(".marquee__trilha"), {
        xPercent: -100,
        duration: 70,
        ease: "none",
        repeat: -1
      });

      function pausar() { tween.pause(); }
      function seguir() {
        if (!el.matches(":hover") && !el.contains(document.activeElement)) tween.play();
      }
      el.addEventListener("mouseenter", pausar);
      el.addEventListener("mouseleave", seguir);
      el.addEventListener("focusin", pausar);
      el.addEventListener("focusout", function () { setTimeout(seguir, 0); });
    });
  }

  /* flor do CTA: flutua e gira levemente (loop, como o marquee) */
  /* entrada do hero: logo em fade + scale, cartões em sequência */
  function entradaHero() {
    var tl = gsap.timeline();
    tl.fromTo(".hero__logo", { autoAlpha: 0, scale: 0.96 }, {
      autoAlpha: 1, scale: 1, duration: 1.2, ease: EASE, clearProps: "transform"
    });
    tl.fromTo(".hero__tagline, .hero__acoes", { autoAlpha: 0, y: rem(1.5) }, {
      autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, ease: EASE, clearProps: "transform"
    }, 0.25);
    return tl;
  }

  /* preloader — logo revelado e escondido por clip-path, até 1.2s */
  function preloader(depois) {
    var el = document.querySelector(".preloader");
    if (!el || !doc.classList.contains("com-preloader")) {
      if (el) el.remove();
      depois();
      return;
    }
    if (lenis) lenis.stop();
    var logo = el.querySelector(".preloader__logo");
    gsap.timeline({
      onComplete: function () {
        doc.classList.remove("com-preloader");
        el.remove();
        try { sessionStorage.setItem("aquarius-preloader", "1"); } catch (e) {}
        if (lenis) lenis.start();
      }
    })
      .fromTo(logo, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.45, ease: "power2.inOut" })
      .to(logo, { clipPath: "inset(0% 0% 0% 100%)", duration: 0.3, ease: "power2.in" }, "+=0.05")
      .to(el, { autoAlpha: 0, duration: 0.2, ease: "power2.in" })
      .add(depois, "-=0.15");
  }

  function scrollSuave() {
    if (!window.Lenis) return;
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function iniciarAnimacoes() {
    if (movimentoReduzido || !window.gsap || !window.ScrollTrigger) {
      liberarTudo();
      return;
    }
    clearTimeout(window.__seguranca);
    gsap.registerPlugin(ScrollTrigger);
    animarAcordeao = true;

    scrollSuave();

    var mm = gsap.matchMedia();
    marqueeLoop();

    // as linhas dos títulos dependem da fonte carregada
    var fontes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var limite = new Promise(function (r) { setTimeout(r, 1500); });

    Promise.race([fontes, limite]).then(function () {
      preloader(function () {
        entradaHero();
        revelaTextoLinhas();
        revelaLista();
        imagensAoRolar();
        parallaxSuave(mm);
        linhaProcesso(mm);
        ScrollTrigger.refresh();
      });
    });
  }

  /* ---------- Início ---------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    linksWhatsApp();
    anoAtual();
    ancoras();
    voltarAoTopo();
    menuMobile();
    cabecalhoInteligente();
    acordeao();
    servicosPalco();
    carrosselPortfolio();
    whatsFlutuante();
    videoHero();
    videoCta();
    iniciarAnimacoes();
  });
})();
