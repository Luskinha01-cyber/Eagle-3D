import { createEagleExperience } from './eagle-scene.js';

const canvas = document.getElementById('webgl-canvas');
const loaderOverlay = document.getElementById('loader-overlay');
const loaderFill = document.getElementById('loader-fill');
const errorBox = document.getElementById('webgl-error');

const telScroll = document.getElementById('tel-scroll');
const telWingspan = document.getElementById('tel-wingspan');
const telRpm = document.getElementById('tel-rpm');
const railProgress = document.getElementById('rail-progress');

const sections = Array.from(document.querySelectorAll('.story-section'));
const railDots = Array.from(document.querySelectorAll('.rail-dot'));

const btnExplodeTop = document.getElementById('btn-explode-top');
const btnExplode = document.getElementById('btn-explode');
const btnWireframe = document.getElementById('btn-wireframe');
const btnOrbit = document.getElementById('btn-orbit');
const btnExitOrbit = document.getElementById('btn-exit-orbit');
const orbitBanner = document.getElementById('orbit-banner');
const btnTheme = document.getElementById('btn-theme');
const btnTop = document.getElementById('btn-top');

let app = null;

try {
  loaderFill.style.width = '100%';
  app = createEagleExperience(canvas);

  requestAnimationFrame(() => {
    loaderOverlay.classList.add('is-ready');
  });
} catch (err) {
  console.error('Erro ao inicializar WebGL:', err);
  loaderOverlay.classList.add('is-ready');
  errorBox.hidden = false;
}

if (app) {
  // --- 1. Scroll Sync ---
  function computeScrollProgress() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const raw = window.scrollY / maxScroll;
    return Math.min(1, Math.max(0, raw));
  }

  function onScroll() {
    const progress = computeScrollProgress();
    app.setScrollProgress(progress);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  // --- 2. Subtle Pointer Parallax ---
  window.addEventListener(
    'pointermove',
    (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      app.setPointer(nx, ny);
    },
    { passive: true }
  );

  // --- 3. Live HUD Telemetry & Rail Progress ---
  app.onTelemetry(({ scrollProgress, wingSpanDeg, coreRpm }) => {
    const pct = Math.round(scrollProgress * 100);
    telScroll.textContent = `${String(pct).padStart(3, '0')}%`;
    telWingspan.textContent = `${String(wingSpanDeg).padStart(3, '0')}°`;
    if (telRpm) {
      telRpm.textContent = `${coreRpm} RPM`;
    }
    if (railProgress) {
      railProgress.style.height = `${(scrollProgress * 100).toFixed(1)}%`;
    }
  });

  // --- 4. Section Reveal & Rail Active State ---
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          const idx = Number(entry.target.dataset.index || 0);
          railDots.forEach((dot, i) => dot.classList.toggle('is-active', i === idx));
        }
      }
    },
    { threshold: 0.35 }
  );

  sections.forEach((sec, idx) => {
    if (idx === 0) sec.classList.add('is-inview');
    observer.observe(sec);
  });

  railDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = Number(dot.dataset.chapter || 0);
      const target = sections[idx];
      if (target) {
        setOrbitMode(false);
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // --- 5. Interactive Controls ---
  let isExploded = false;
  let isWireframe = false;
  let isOrbit = false;
  let isDark = false;

  function syncExplodeButtons() {
    btnExplodeTop.setAttribute('aria-pressed', String(isExploded));
    btnExplode.setAttribute('aria-pressed', String(isExploded));
    btnExplode.textContent = isExploded ? 'Fechar Armadura' : 'Expandir Armadura';
  }

  function toggleExplode() {
    isExploded = !isExploded;
    app.setExploded(isExploded);
    syncExplodeButtons();
  }

  function setOrbitMode(enabled) {
    isOrbit = enabled;
    app.setFreeOrbit(isOrbit);
    document.body.classList.toggle('is-orbit-active', isOrbit);
    orbitBanner.hidden = !isOrbit;
    btnOrbit.setAttribute('aria-pressed', String(isOrbit));
    btnOrbit.textContent = isOrbit ? 'Sair do Giro 360°' : 'Giro 360° Livre';
  }

  btnExplodeTop.addEventListener('click', toggleExplode);
  btnExplode.addEventListener('click', toggleExplode);

  btnWireframe.addEventListener('click', () => {
    isWireframe = !isWireframe;
    app.setWireframe(isWireframe);
    btnWireframe.setAttribute('aria-pressed', String(isWireframe));
  });

  btnOrbit.addEventListener('click', () => setOrbitMode(!isOrbit));
  btnExitOrbit.addEventListener('click', () => setOrbitMode(false));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOrbit) {
      setOrbitMode(false);
    }
  });

  btnTheme.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    app.setTheme(isDark);
    btnTheme.setAttribute('aria-pressed', String(isDark));
    btnTheme.textContent = isDark ? 'Estúdio' : 'Hangar';
  });

  btnTop.addEventListener('click', () => {
    setOrbitMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

