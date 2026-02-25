const root = document.documentElement;
let contactClickCount = 0;

const FLAPPY_STORAGE_KEY = 'prodeskit-flappy-progress';
const FLAPPY_SKINS = [
  {
    id: 'classic',
    name: 'Klassiek',
    body: '#38bdf8',
    wing: '#0ea5e9',
    beak: '#f97316',
    eye: '#e5e7eb',
    price: 0,
  },
  {
    id: 'forest',
    name: 'Bosvogel',
    body: '#22c55e',
    wing: '#16a34a',
    beak: '#fbbf24',
    eye: '#ecfeff',
    price: 15,
  },
  {
    id: 'sunset',
    name: 'Zonsondergang',
    body: '#f97316',
    wing: '#ea580c',
    beak: '#facc15',
    eye: '#fffbeb',
    price: 25,
  },
  {
    id: 'night',
    name: 'Nacht',
    body: '#0f172a',
    wing: '#111827',
    beak: '#38bdf8',
    eye: '#e5e7eb',
    price: 35,
  },
];

const flappy = {
  active: false,
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  bird: null,
  pipes: [],
  score: 0,
  coins: 0,
  ownedSkinIds: ['classic'],
  activeSkinId: 'classic',
  skinSelectionIndex: 0,
  lastPipeTime: 0,
  lastFrameTime: 0,
  running: false,
  animationId: null,
};

function setYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
}

function initTheme() {
  const stored = window.localStorage.getItem('prodeskit-theme');
  const prefersLight = window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches;

  if (stored === 'light' || (!stored && prefersLight)) {
    document.documentElement.classList.add('is-light');
  }

  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const icon = toggle.querySelector('.theme-toggle-icon');
  const applyIcon = () => {
    const isLight = document.documentElement.classList.contains('is-light');
    if (icon) icon.textContent = isLight ? '☀' : '☾';
  };

  applyIcon();

  toggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('is-light');
    const isLight = document.documentElement.classList.contains('is-light');
    window.localStorage.setItem('prodeskit-theme', isLight ? 'light' : 'dark');
    applyIcon();
  });
}

function initNav() {
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  const mobileToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      if (href === '#contact') {
        contactClickCount += 1;
        if (contactClickCount >= 5) {
          event.preventDefault();
          contactClickCount = 0;
          showFlappyGame();
          return;
        }
      }

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      const headerOffset = 72;
      const rect = target.getBoundingClientRect();
      const offsetTop = rect.top + window.scrollY - headerOffset + 4;

      window.scrollTo({ top: offsetTop, behavior: 'smooth' });

      if (navLinks && mobileToggle && navLinks.classList.contains('is-open')) {
        navLinks.classList.remove('is-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }
}

function buildAdvisorCopy({ pain, size, preference }) {
  let headline = '';
  let body = '';

  if (pain === 'tijd') {
    headline = 'Focus op automatisering van handwerk';
    body =
      'Een kort traject om jouw meest repetitieve taken te identificeren en te automatiseren. We starten met één of twee concrete workflows zodat je snel resultaat ziet.';
  } else if (pain === 'chaos') {
    headline = 'Breng structuur aan in je tool‑landschap';
    body =
      'Een scherpe inventarisatie van alle gebruikte tools en processen. Vervolgens ontwerpen we een eenvoudiger, beter gekoppeld landschap met duidelijke afspraken.';
  } else if (pain === 'data') {
    headline = 'Zicht op cijfers en voortgang';
    body =
      'We bepalen welke vragen je beantwoord wilt zien, en bouwen daar omheen lichte dashboards of rapportages. Geen datalake nodig, wel helderheid.';
  } else if (pain === 'ai') {
    headline = 'Veilig en praktisch starten met AI';
    body =
      'We verkennen één of twee concrete AI‑use‑cases, toetsen haalbaarheid en bouwen een proof‑of‑concept die jouw team echt gebruikt.';
  }

  if (size === 'small' || size === 'solo') {
    body +=
      ' De aanpak blijft bewust lichtgewicht zodat jij of een klein team het goed kan blijven onderhouden.';
  } else if (size === 'medium' || size === 'large') {
    body +=
      ' We letten extra op schaalbaarheid, rollen en governance zodat de oplossing meegroeit met je organisatie.';
  }

  if (preference === 'snel') {
    body +=
      ' We plannen een korte intensieve sessie en leveren binnen enkele weken de eerste werkende oplossing op.';
  } else if (preference === 'advies') {
    body +=
      ' Eerst maken we samen een beknopte roadmap, daarna beslis je zelf welke onderdelen we als eerste realiseren.';
  } else if (preference === 'stap') {
    body +=
      ' We knippen het werk bewust op in kleine, overzichtelijke stappen zodat iedereen kan meekomen.';
  }

  return { headline, body };
}

function initAdvisor() {
  const form = document.getElementById('advisor-form');
  const result = document.getElementById('advisor-result');
  if (!form || !result) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const pain = form.querySelector('select[name="pain"]');
    const size = form.querySelector('select[name="size"]');
    const preference = form.querySelector('select[name="preference"]');

    if (!pain || !size || !preference) return;
    if (!pain.value || !size.value || !preference.value) {
      result.textContent = 'Vul alle drie de vragen even in zodat het advies klopt.';
      return;
    }

    const copy = buildAdvisorCopy({
      pain: pain.value,
      size: size.value,
      preference: preference.value,
    });

    result.innerHTML = `<strong>${copy.headline}</strong><br>${copy.body}`;
  });
}

function initAccordion() {
  const accordions = document.querySelectorAll('[data-accordion] .accordion-item');
  accordions.forEach((item) => {
    const panel = item.querySelector('.accordion-panel');
    if (!panel) return;

    item.addEventListener('click', () => {
      const isOpen = item.classList.toggle('is-open');
      panel.style.maxHeight = isOpen ? `${panel.scrollHeight}px` : '0px';
      accordions.forEach((other) => {
        if (other !== item && other.classList.contains('is-open')) {
          other.classList.remove('is-open');
          const otherPanel = other.querySelector('.accordion-panel');
          if (otherPanel) otherPanel.style.maxHeight = '0px';
        }
      });
    });
  });
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('contact-status');
  if (!form || !status) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const values = Object.fromEntries(data.entries());

    if (!values.name || !values.email || !values.message) {
      status.textContent = 'Vul in ieder geval je naam, e‑mail en vraag in.';
      return;
    }

    status.textContent =
      'Bedankt voor je bericht. Dit formulier stuurt nog geen e‑mail, maar je kunt de tekst hieronder kopiëren en naar Yannick sturen via je eigen mailprogramma.';

    const summary = [
      `Naam: ${values.name}`,
      `E‑mail: ${values.email}`,
      values.company ? `Organisatie: ${values.company}` : '',
      values.budget ? `Budgetindicatie: ${values.budget}` : '',
      '',
      'Vraag / situatie:',
      values.message,
    ]
      .filter(Boolean)
      .join('\n');

    console.log('Contactformulier samenvatting:\n\n' + summary);
  });
}

function loadFlappyProgress() {
  try {
    const raw = window.localStorage.getItem(FLAPPY_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    if (typeof parsed.coins === 'number' && parsed.coins >= 0) {
      flappy.coins = parsed.coins;
    }

    if (Array.isArray(parsed.ownedSkinIds) && parsed.ownedSkinIds.length) {
      flappy.ownedSkinIds = Array.from(new Set(['classic', ...parsed.ownedSkinIds]));
    }

    if (
      typeof parsed.activeSkinId === 'string' &&
      flappy.ownedSkinIds.includes(parsed.activeSkinId)
    ) {
      flappy.activeSkinId = parsed.activeSkinId;
    }

    const idx = FLAPPY_SKINS.findIndex((skin) => skin.id === flappy.activeSkinId);
    flappy.skinSelectionIndex = idx >= 0 ? idx : 0;
  } catch {
    // negeer corrupte opslag
  }
}

function saveFlappyProgress() {
  try {
    const payload = {
      coins: flappy.coins || 0,
      ownedSkinIds: flappy.ownedSkinIds || ['classic'],
      activeSkinId: flappy.activeSkinId || 'classic',
    };
    window.localStorage.setItem(FLAPPY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // lokale opslag is optioneel
  }
}

function getActiveSkin() {
  const skin =
    FLAPPY_SKINS.find((item) => item.id === flappy.activeSkinId) || FLAPPY_SKINS[0];
  return skin;
}

function getSelectedSkin() {
  const index =
    typeof flappy.skinSelectionIndex === 'number'
      ? (flappy.skinSelectionIndex + FLAPPY_SKINS.length) % FLAPPY_SKINS.length
      : 0;
  return FLAPPY_SKINS[index] || FLAPPY_SKINS[0];
}

function cycleFlappySkin() {
  if (!FLAPPY_SKINS.length) return;

  let index =
    typeof flappy.skinSelectionIndex === 'number'
      ? flappy.skinSelectionIndex + 1
      : 1;
  if (index >= FLAPPY_SKINS.length) index = 0;

  flappy.skinSelectionIndex = index;
  const nextSkin = FLAPPY_SKINS[index];
  const hasSkin = flappy.ownedSkinIds.includes(nextSkin.id);

  if (!hasSkin && flappy.coins >= nextSkin.price) {
    flappy.coins -= nextSkin.price;
    flappy.ownedSkinIds.push(nextSkin.id);
    flappy.activeSkinId = nextSkin.id;
    saveFlappyProgress();
  } else if (hasSkin) {
    flappy.activeSkinId = nextSkin.id;
    saveFlappyProgress();
  }

  if (flappy.bird) {
    drawFlappy();
  }
}

function addFlappyCoins(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  flappy.coins = (flappy.coins || 0) + amount;
  saveFlappyProgress();
}

function initFlappyGame() {
  const canvas = document.getElementById('flappy-canvas');
  const overlay = document.getElementById('flappy-overlay');
  if (!canvas || !overlay) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  flappy.canvas = canvas;
  flappy.ctx = ctx;

  loadFlappyProgress();

  const closeBtn = overlay.querySelector('.flappy-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideFlappyGame();
    });
  }

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      hideFlappyGame();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!flappy.active) return;
    if (event.key === 'Escape') {
      hideFlappyGame();
      return;
    }
    if (event.key === ' ' || event.key === 'ArrowUp') {
      event.preventDefault();
      flappyJump();
      return;
    }
    if (event.key === 'c' || event.key === 'C') {
      event.preventDefault();
      cycleFlappySkin();
    }
  });

  canvas.addEventListener('mousedown', () => {
    if (!flappy.active) return;
    flappyJump();
  });

  canvas.addEventListener(
    'touchstart',
    (event) => {
      if (!flappy.active) return;
      event.preventDefault();
      flappyJump();
    },
    { passive: false }
  );

  window.addEventListener('resize', () => {
    if (!flappy.active) return;
    resizeFlappyCanvas();
    if (flappy.bird) {
      drawFlappy();
    }
  });
}

function resizeFlappyCanvas() {
  if (!flappy.canvas) return;
  const overlayInner = document.querySelector('.flappy-inner');
  if (!overlayInner) return;

  const maxWidth = Math.min(520, overlayInner.clientWidth - 32);
  const maxHeight = Math.min(720, window.innerHeight - 220);
  const aspect = 3 / 4;

  let width = maxWidth;
  let height = width / aspect;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }

  flappy.canvas.width = width;
  flappy.canvas.height = height;
  flappy.width = width;
  flappy.height = height;
}

function resetFlappyGame() {
  if (!flappy.canvas || !flappy.ctx) return;
  resizeFlappyCanvas();

  flappy.bird = {
    x: flappy.width * 0.3,
    y: flappy.height * 0.5,
    vy: 0,
  };
  flappy.pipes = [];
  flappy.score = 0;
  flappy.lastPipeTime = 0;
  flappy.lastFrameTime = 0;
  flappy.running = false;
  drawFlappy();
}

function showFlappyGame() {
  const overlay = document.getElementById('flappy-overlay');
  if (!overlay || !flappy.canvas || !flappy.ctx) return;

  overlay.classList.add('is-active');
  overlay.setAttribute('aria-hidden', 'false');
  flappy.active = true;
  contactClickCount = 0;
  resetFlappyGame();
}

function hideFlappyGame() {
  const overlay = document.getElementById('flappy-overlay');
  if (!overlay) return;
  overlay.classList.remove('is-active');
  overlay.setAttribute('aria-hidden', 'true');

  flappy.active = false;
  flappy.running = false;

  if (flappy.animationId) {
    cancelAnimationFrame(flappy.animationId);
    flappy.animationId = null;
  }
}

function flappyJump() {
  if (!flappy.bird) return;

  const jumpVelocity = -450;
  if (!flappy.running) {
    flappy.running = true;
    flappy.lastFrameTime = performance.now();
    flappy.lastPipeTime = 0;
    flappy.animationId = requestAnimationFrame(flappyLoop);
  }
  flappy.bird.vy = jumpVelocity;
}

function drawFlappy(showGameOver = false) {
  if (!flappy.ctx || !flappy.canvas || !flappy.bird) return;

  const ctx = flappy.ctx;
  const w = flappy.width;
  const h = flappy.height;
  const radius = Math.max(h * 0.03, 10);

  const activeSkin = getActiveSkin();
  const selectedSkin = getSelectedSkin();

  ctx.clearRect(0, 0, w, h);

  const skyHeight = h * 0.8;
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, 0, w, skyHeight);

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(0, skyHeight, w, h - skyHeight);

  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, skyHeight - 6, w, 10);

  ctx.fillStyle = '#4ade80';
  const bladeWidth = 14;
  for (let x = 0; x < w; x += bladeWidth) {
    ctx.beginPath();
    ctx.moveTo(x, skyHeight + 4);
    ctx.lineTo(x + bladeWidth / 2, skyHeight - 6);
    ctx.lineTo(x + bladeWidth, skyHeight + 4);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#15803d';
  flappy.pipes.forEach((pipe) => {
    const { x, width, gapY, gapHeight } = pipe;
    ctx.fillRect(x, 0, width, gapY);
    ctx.fillRect(x, gapY + gapHeight, width, h - (gapY + gapHeight));
  });

  ctx.fillStyle = activeSkin.body;
  ctx.beginPath();
  ctx.arc(flappy.bird.x, flappy.bird.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = activeSkin.wing;
  ctx.beginPath();
  ctx.arc(flappy.bird.x + radius * 0.2, flappy.bird.y - radius * 0.2, radius * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = activeSkin.eye;
  ctx.beginPath();
  ctx.arc(flappy.bird.x + radius * 0.3, flappy.bird.y - radius * 0.25, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(flappy.bird.x + radius * 0.35, flappy.bird.y - radius * 0.28, radius * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = activeSkin.beak;
  ctx.beginPath();
  ctx.moveTo(flappy.bird.x + radius * 0.5, flappy.bird.y);
  ctx.lineTo(flappy.bird.x + radius * 0.9, flappy.bird.y + radius * 0.1);
  ctx.lineTo(flappy.bird.x + radius * 0.5, flappy.bird.y + radius * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${flappy.score}`, 16, 32);

  ctx.textAlign = 'right';
  ctx.fillText(`Coins: ${flappy.coins || 0}`, w - 16, 32);

  ctx.font = '12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  const owned = flappy.ownedSkinIds.includes(selectedSkin.id);
  const skinLabel = owned
    ? `Skin: ${selectedSkin.name} (gekocht)`
    : `Skin: ${selectedSkin.name} – ${selectedSkin.price} coins`;
  ctx.fillText(skinLabel, w / 2, h - 20);

  if (!flappy.running && !showGameOver) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    const boxHeight = 110;
    ctx.fillRect(0, h * 0.32, w, boxHeight);

    ctx.fillStyle = '#e5e7eb';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Klik of druk op spatie om te starten', w / 2, h * 0.36);

    ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('ESC om terug te gaan naar de site', w / 2, h * 0.43);
    ctx.fillText('Druk op C om skins te wisselen/kopen', w / 2, h * 0.5);
  }

  if (showGameOver) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    const boxHeight = 120;
    ctx.fillRect(0, h * 0.32, w, boxHeight);

    ctx.fillStyle = '#e5e7eb';
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Game over', w / 2, h * 0.36);

    ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Klik of druk op spatie om opnieuw te spelen', w / 2, h * 0.43);
    ctx.fillText('ESC sluit het spel', w / 2, h * 0.49);
    ctx.fillText('C: wissel/kopen skin met je coins', w / 2, h * 0.55);
  }
}

function flappyLoop(timestamp) {
  if (!flappy.running || !flappy.active || !flappy.bird) return;

  if (!flappy.lastFrameTime) {
    flappy.lastFrameTime = timestamp;
  }

  const dt = Math.min((timestamp - flappy.lastFrameTime) / 1000, 0.03);
  flappy.lastFrameTime = timestamp;

  const gravity = 1500;
  const pipeSpeed = 200;
  const pipeInterval = 1500;
  const pipeWidth = 60;
  const pipeGap = flappy.height * 0.26;

  flappy.bird.vy += gravity * dt;
  flappy.bird.y += flappy.bird.vy * dt;

  flappy.lastPipeTime += dt * 1000;
  if (flappy.lastPipeTime > pipeInterval) {
    flappy.lastPipeTime = 0;
    const margin = flappy.height * 0.15;
    const maxGapStart = flappy.height - margin - pipeGap;
    const gapY = margin + Math.random() * Math.max(maxGapStart - margin, 0);
    flappy.pipes.push({
      x: flappy.width + pipeWidth,
      width: pipeWidth,
      gapY,
      gapHeight: pipeGap,
      scored: false,
    });
  }

  const radius = Math.max(flappy.height * 0.03, 10);

  flappy.pipes.forEach((pipe) => {
    pipe.x -= pipeSpeed * dt;
  });
  flappy.pipes = flappy.pipes.filter((pipe) => pipe.x + pipe.width > -10);

  let gameOver = false;
  if (flappy.bird.y + radius > flappy.height || flappy.bird.y - radius < 0) {
    gameOver = true;
  }

  flappy.pipes.forEach((pipe) => {
    const withinX = flappy.bird.x + radius > pipe.x && flappy.bird.x - radius < pipe.x + pipe.width;
    const outsideGap =
      flappy.bird.y - radius < pipe.gapY || flappy.bird.y + radius > pipe.gapY + pipe.gapHeight;

    if (withinX && outsideGap) {
      gameOver = true;
    }

    if (!pipe.scored && pipe.x + pipe.width < flappy.bird.x) {
      pipe.scored = true;
      flappy.score += 1;
      addFlappyCoins(1);
    }
  });

  drawFlappy(gameOver);

  if (gameOver) {
    flappy.running = false;
    return;
  }

  flappy.animationId = requestAnimationFrame(flappyLoop);
}

document.addEventListener('DOMContentLoaded', () => {
  setYear();
  initTheme();
  initNav();
  initAdvisor();
  initAccordion();
  initContactForm();
  initFlappyGame();
});

