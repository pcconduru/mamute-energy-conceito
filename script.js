/* ==========================================================================
   MAMUTE ENERGY — interações da landing
   Sem dependências. Cada bloco é independente e comentado.
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Marca que o JS está ativo (as animações de entrada só se aplicam com JS)
  root.classList.add('js');

  /* ------------------------------------------------------------------------
     DADOS DOS SABORES
     Para adicionar um sabor: inclua aqui, crie o tema em styles.css
     ([data-flavor="..."]) e adicione o botão no trilho do hero.
     ------------------------------------------------------------------------ */
  const FLAVORS = {
    'original': {
      name: 'Original',
      tagline: 'O clássico do bando.',
      desc: 'O clássico do bando. Sabor intenso e marcante para quem não desacelera.',
      img: 'assets/lata-original.webp',
    },
    'tropical': {
      name: 'Tropical',
      tagline: 'Kiwi, maracujá e abacaxi.',
      desc: 'Kiwi, maracujá e abacaxi num sabor de verão o ano inteiro. Doce na medida, refrescante até o fim.',
      img: 'assets/lata-tropical.webp',
    },
    'melancia': {
      name: 'Melancia',
      tagline: 'Suculenta e gelada.',
      desc: 'Refrescante do começo ao fim. Sabor de melancia madura, leve e fácil de gostar.',
      img: 'assets/lata-melancia.webp',
    },
    'maca-verde': {
      name: 'Maçã Verde',
      tagline: 'Ácida na medida.',
      desc: 'Crocante no paladar. Maçã verde vibrante com aquele toque ácido que desperta.',
      img: 'assets/lata-maca-verde.webp',
    },
  };
  const FLAVOR_KEYS = Object.keys(FLAVORS);

  // Pré-carrega as latas para a troca ser instantânea
  FLAVOR_KEYS.forEach((key) => { const img = new Image(); img.src = FLAVORS[key].img; });

  /* ------------------------------------------------------------------------
     1. LOADER — conta de 0 a 100% e libera a página
     ------------------------------------------------------------------------ */
  const loaderCount = document.querySelector('[data-loader-count]');
  const loaderWave = document.querySelector('[data-loader-wave]');   // onda que enche o logo (SVG)
  let loadProgress = 0;
  let pageLoaded = false;

  let lastTick = performance.now();
  function tickLoader(now) {
    // Avança por tempo (não por quadro) até 90% e só completa quando a página terminar de carregar
    const dt = Math.min(0.1, (now - lastTick) / 1000);
    lastTick = now;
    const target = pageLoaded ? 100 : 90;
    loadProgress += Math.max(40 * dt, (target - loadProgress) * 5 * dt);
    loadProgress = Math.min(loadProgress, target);
    if (loaderCount) loaderCount.textContent = `${Math.round(loadProgress)}%`;
    if (loaderWave) {
      // logo tem 937 de altura no viewBox; a onda sobe de baixo (937) até cobrir tudo (-60)
      const y = 937 - (loadProgress / 100) * 1000;
      const x = -((now * 0.35) % 700);          // 700 = comprimento de uma onda no desenho
      loaderWave.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    }

    if (loadProgress >= 100) {
      setTimeout(() => body.classList.remove('is-loading'), 250);
      return;
    }
    requestAnimationFrame(tickLoader);
  }

  // Libera quando a página carregou E a lata 3D ficou pronta (ou falhou / não existe)
  let windowLoaded = false;
  const threeReady = () => window.__mamute3d !== 'pending';
  const checkReady = () => { if (windowLoaded && threeReady()) pageLoaded = true; };
  window.addEventListener('load', () => { windowLoaded = true; checkReady(); });
  document.addEventListener('mamute:3d-ready', checkReady);
  // Segurança: nunca prende o usuário no loader por mais de 6s
  setTimeout(() => { pageLoaded = true; }, 6000);
  prefersReducedMotion ? body.classList.remove('is-loading') : requestAnimationFrame(tickLoader);

  /* ------------------------------------------------------------------------
     2. TROCA DE SABOR — atualiza tema, textos e imagens
     ------------------------------------------------------------------------ */
  const flavorButtons = [...document.querySelectorAll('[data-flavor-btn]')];
  const flavorNames = document.querySelectorAll('[data-flavor-name]');
  const flavorDescs = document.querySelectorAll('[data-flavor-desc]');
  const flavorTaglines = document.querySelectorAll('[data-flavor-tagline]');
  const flavorIndexes = document.querySelectorAll('[data-flavor-index]');
  const flavorImgs = document.querySelectorAll('[data-flavor-img]');
  const hudIndex = document.querySelector('[data-hud-index]');

  // source: 'user' (clique) ou 'scroll' (painéis de sabores) — a lata 3D anima diferente
  function setFlavor(key, source = 'user') {
    const flavor = FLAVORS[key];
    if (!flavor || body.dataset.flavor === key) return;

    const n = String(FLAVOR_KEYS.indexOf(key) + 1).padStart(2, '0');
    body.dataset.flavor = key;

    // Avisa a lata 3D e a camada de animação (app.js)
    document.dispatchEvent(new CustomEvent('mamute:flavor', { detail: { key, source } }));

    flavorNames.forEach((el) => { el.textContent = flavor.name; });
    flavorDescs.forEach((el) => { el.textContent = flavor.desc; });
    flavorTaglines.forEach((el) => { el.textContent = flavor.tagline; });
    flavorIndexes.forEach((el) => { el.textContent = `N°${n} — Linha Mamute`; });
    if (hudIndex) hudIndex.innerHTML = `${n}<br>/<br>04`;

    // Imagens: sai com fade, troca a fonte, entra de volta
    flavorImgs.forEach((img) => {
      img.classList.add('is-swapping');
      setTimeout(() => {
        img.src = flavor.img;
        if (!img.hasAttribute('alt') || img.alt) img.alt = `Lata Mamute Energy Drink sabor ${flavor.name}, 473 ml`;
        img.classList.remove('is-swapping');
      }, prefersReducedMotion ? 0 : 300);
    });

    flavorButtons.forEach((btn) => {
      const active = btn.dataset.flavorBtn === key;
      btn.setAttribute('aria-selected', String(active));
      btn.tabIndex = active ? 0 : -1;
    });
  }

  flavorButtons.forEach((btn, i) => {
    btn.tabIndex = btn.getAttribute('aria-selected') === 'true' ? 0 : -1;
    btn.addEventListener('click', () => setFlavor(btn.dataset.flavorBtn));

    // Navegação por setas dentro do trilho (padrão de tablist acessível)
    btn.addEventListener('keydown', (e) => {
      const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      const next = flavorButtons[(i + dir + flavorButtons.length) % flavorButtons.length];
      next.focus();
      setFlavor(next.dataset.flavorBtn);
    });
  });

  // Usado pelos painéis de sabores (app.js) conforme a rolagem
  window.mamuteSetFlavor = setFlavor;

  /* ------------------------------------------------------------------------
     MOMENTOS — um painel aberto por vez (hover no desktop, toque no celular)
     ------------------------------------------------------------------------ */
  const moments = [...document.querySelectorAll('[data-moments] .moment')];
  const openMoment = (m) => moments.forEach((o) => {
    o.classList.toggle('is-open', o === m);
    o.setAttribute('aria-expanded', String(o === m));
  });
  moments.forEach((m) => {
    m.addEventListener('click', () => openMoment(m));
    m.addEventListener('focus', () => openMoment(m));
    m.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') openMoment(m); });
  });

  /* ------------------------------------------------------------------------
     4. MENU EM TELA CHEIA
     ------------------------------------------------------------------------ */
  const menu = document.querySelector('[data-menu]');
  const menuOpenBtn = document.querySelector('[data-menu-open]');
  const menuCloseBtn = document.querySelector('[data-menu-close]');

  function openMenu() {
    menu.hidden = false;
    body.classList.add('menu-open');
    menuOpenBtn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => menu.classList.add('is-open'));
    menuCloseBtn.focus();
  }

  function closeMenu({ restoreFocus = true } = {}) {
    menu.classList.remove('is-open');
    body.classList.remove('menu-open');
    menuOpenBtn.setAttribute('aria-expanded', 'false');
    setTimeout(() => { menu.hidden = true; }, prefersReducedMotion ? 0 : 450);
    if (restoreFocus) menuOpenBtn.focus();
  }

  menuOpenBtn?.addEventListener('click', openMenu);
  menuCloseBtn?.addEventListener('click', () => closeMenu());
  menu?.querySelectorAll('[data-menu-link]').forEach((link) => {
    link.addEventListener('click', () => closeMenu({ restoreFocus: false }));
  });

  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') closeMenu();

    // Mantém o foco do teclado dentro do menu aberto
    if (e.key === 'Tab') {
      const focusables = [...menu.querySelectorAll('a, button')];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ------------------------------------------------------------------------
     5. BARRA DE PROGRESSO DA ROLAGEM (HUD)
     ------------------------------------------------------------------------ */
  const hudProgress = document.querySelector('[data-hud-progress]');
  const energyBar = document.querySelector('[data-energy-bar]');
  const energyText = document.querySelector('[data-energy]');
  let ticking = false;

  function updateProgress() {
    const max = root.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    hudProgress?.style.setProperty('--progress', p.toFixed(4));
    // Medidor de energia do HUD acompanha a rolagem
    energyBar?.style.setProperty('--energy', p.toFixed(4));
    if (energyText) energyText.textContent = Math.round(p * 100);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; }
  }, { passive: true });
  updateProgress();

  /* ------------------------------------------------------------------------
     6. ANIMAÇÃO DE ENTRADA — [data-reveal] ganha .is-visible ao aparecer
     ------------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ------------------------------------------------------------------------
     7. FAQ — só um item aberto por vez
     (o atributo name="faq" já faz isso nos navegadores novos; aqui é o fallback)
     ------------------------------------------------------------------------ */
  const faqItems = document.querySelectorAll('[data-faq] details');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      faqItems.forEach((other) => { if (other !== item) other.open = false; });
    });
  });

  /* ------------------------------------------------------------------------
     8. NEWSLETTER — validação no navegador (formulário demonstrativo:
     nenhum dado é enviado; conecte a um serviço de e-mail antes de publicar)
     ------------------------------------------------------------------------ */
  const form = document.querySelector('[data-newsletter]');
  const formMsg = document.querySelector('[data-newsletter-msg]');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.elements.email;
    const valid = input.checkValidity() && input.value.trim() !== '';

    input.setAttribute('aria-invalid', String(!valid));
    if (!valid) {
      formMsg.textContent = 'Digite um e-mail válido.';
      input.focus();
      return;
    }
    formMsg.textContent = 'Bem-vindo à manada!';
    form.reset();
  });
})();
