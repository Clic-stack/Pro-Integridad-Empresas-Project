// Duplicate carousel content for seamless infinite loop
const track = document.getElementById('carousel-track');
track.innerHTML += track.innerHTML;

// Modal
let pendingUrl = null;

function openModal(label, url){
  pendingUrl = url || null;
  document.getElementById('modal-text').textContent = 'Este enlace te llevará a: "' + label + '", fuera de esta página.';
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal(){ document.getElementById('modal-overlay').classList.remove('open'); }
function continueToLink(){
  if(pendingUrl){ window.open(pendingUrl, '_blank', 'noopener,noreferrer'); }
  closeModal();
}

// Reduced motion check
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Stat cards staggered animation + count-up
const statCards = document.querySelectorAll('.stat-card');
let statsPlayed = false;
function animateCount(el, target, duration){
  if(reduceMotion){ el.textContent = target; return; }
  let start = 0; const startTime = performance.now();
  function tick(now){
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(progress * target);
    el.textContent = value;
    if(progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function playStats(){
  if(statsPlayed) return; statsPlayed = true;
  statCards.forEach((card, i) => {
    setTimeout(() => {
      card.classList.add('in');
      const numEl = card.querySelector('.stat-num');
      const target = parseInt(card.dataset.target, 10);
      setTimeout(() => animateCount(numEl, target, 900), reduceMotion ? 0 : 550);
    }, reduceMotion ? 0 : i * 650);
  });
}

// IntersectionObserver for stats + resource cards fade-in + scroll fill bars
const statsSection = document.getElementById('stats-section');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting && entry.target === statsSection){ playStats(); }
  });
}, { threshold: 0.4 });
io.observe(statsSection);

const resCards = document.querySelectorAll('.res-card');
const resIo = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){ entry.target.classList.add('in'); resIo.unobserve(entry.target); }
  });
}, { threshold: 0.2 });
resCards.forEach(c => resIo.observe(c));

// Scroll-driven fill bars per section
const sections = document.querySelectorAll('section');
function updateFillBars(){
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
if(!reduceMotion){
  window.addEventListener('scroll', updateFillBars, { passive:true });
  window.addEventListener('resize', updateFillBars);
  updateFillBars();
} else {
  document.querySelectorAll('.fill-bar i').forEach(b => b.style.height = '100%');
}