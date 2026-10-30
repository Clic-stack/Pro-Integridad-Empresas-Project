// Comprobación de movimiento reducido
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const track = document.getElementById('carousel-track');
const originals = Array.from(track.children);

originals.forEach(item => {
  const clone = item.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  clone.querySelectorAll('[tabindex]').forEach(el => el.setAttribute('tabindex', '-1'));
  track.appendChild(clone);
});

const pauseBtn = document.querySelector('.carousel-pause');

if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    const paused = track.classList.toggle('is-paused');
    pauseBtn.setAttribute('aria-pressed', paused);
    pauseBtn.textContent = paused ? 'Reanudar animación' : 'Pausar animación';
  });
}

// Modal
let pendingUrl = null;
let lastFocus = null;
const overlay = document.getElementById('modal-overlay');

function openModal(label, url) {
  lastFocus = document.activeElement;
  pendingUrl = url || null;
  document.getElementById('modal-text').textContent = 'Este enlace te llevará a: "' + label + '", fuera de esta página.';
  overlay.classList.add('open');
  overlay.querySelector('.modal-btn.cancel').focus();
}

function closeModal() {
  overlay.classList.remove('open');
  if (lastFocus) lastFocus.focus();
}

function continueToLink() {
  if (pendingUrl) window.open(pendingUrl, '_blank', 'noopener,noreferrer');
  closeModal();
}

overlay.addEventListener('keydown', e => {
  if (e.key === 'Escape') { 
    closeModal(); 
    return; 
  }
  if (e.key === 'Tab') {
    const btns = overlay.querySelectorAll('button');
    const first = btns[0], last = btns[btns.length - 1];
    if (e.shiftKey && document.activeElement === first) { 
      e.preventDefault(); 
      last.focus(); 
    } else if (!e.shiftKey && document.activeElement === last) { 
      e.preventDefault(); 
      first.focus(); 
    }
  }
});

overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

// Animación escalonada de tarjetas de estadísticas + conteo ascendente
const statCards = document.querySelectorAll('.stat-card');

if(!reduceMotion) {
  statCards.forEach(c => c.querySelector('.stat-num').textContent = '0');
}

let statsPlayed = false;

function animateCount(el, target, duration, prefix = '') {
  if(reduceMotion) { 
    el.textContent = prefix + target; 
    return; 
  }
  const startTime = performance.now();
  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(progress * target);
    el.textContent = prefix + value;
    if(progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = prefix + target;
    }
  }
  requestAnimationFrame(tick);
}

function playStats() {
  if(statsPlayed) return; statsPlayed = true;
  statCards.forEach((card, i) => {
    setTimeout(() => {
      card.classList.add('in');
      const numEl = card.querySelector('.stat-num');
      const target = parseInt(card.dataset.target, 10);
      const prefix = card.dataset.prefix || '';
      setTimeout(() => animateCount(numEl, target, 900, prefix), reduceMotion ? 0 : 550);
    }, reduceMotion ? 0 : i * 650);
  });
}

// IntersectionObserver para estadísticas + desvanecimiento de las tarjetas de recursos
const statsSection = document.getElementById('stats-section');
const resCards = document.querySelectorAll('.res-card');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target === statsSection) { 
        playStats(); 
      }
    });
  }, { threshold: 0.15 });
  io.observe(statsSection);

  const resIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { 
        entry.target.classList.add('in'); 
        resIo.unobserve(entry.target); 
      }
    });
  }, { threshold: 0.2 });
  resCards.forEach(c => resIo.observe(c));

} else {
  // Respaldo: navegador sin IntersectionObserver.
  // Se quita la clase 'js' para que el CSS no oculte las tarjetas,
  // y se dejan las cifras con su valor final.
  document.documentElement.classList.remove('js');
  statCards.forEach(c => {
    c.querySelector('.stat-num').textContent = (c.dataset.prefix || '') + c.dataset.target;
  });
}

// Llenado de las barras con color, usando el efecto scroll-driven por sección
const sections = document.querySelectorAll('section');

function updateFillBars() {
  const vh = window.innerHeight;
  sections.forEach(sec => {
    const bar = sec.querySelector('.fill-bar i');
    if(!bar) return;
    const rect = sec.getBoundingClientRect();
    let visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    visible = Math.max(0, visible);
    const ratio = Math.min(visible / rect.height, 1);
    bar.style.height = reduceMotion ? '100%' : (ratio * 100) + '%';
  });
}

if(!reduceMotion) {
  window.addEventListener('scroll', updateFillBars, { passive:true });
  window.addEventListener('resize', updateFillBars);
  updateFillBars();
} else {
  document.querySelectorAll('.fill-bar i').forEach(b => b.style.height = '100%');
}

// Enlaces internos que abren los formatos descargables de la tarjeta destino
document.querySelectorAll('a[data-open-formats]').forEach(link => {
  link.addEventListener('click', () => {
    const card = document.querySelector(link.getAttribute('href'));
    const formats = card && card.querySelector('details.formats');
    if (formats) formats.open = true;
  });
});