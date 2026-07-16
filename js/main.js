// R3 Marketing Digital — Main JS (Landing Page)

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initNavbar();
  initCounters();
});

function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.style.background = window.scrollY > 40
      ? 'rgba(8,8,20,0.95)'
      : 'rgba(8,8,20,0.8)';
  });
}

function initCounters() {
  const counters = document.querySelectorAll('.stat-num[data-target]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        animateCounter(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

function animateCounter(el, target) {
  const duration = 1800;
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString('pt-BR');
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString('pt-BR');
  };
  requestAnimationFrame(update);
}
