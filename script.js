/* ================================================================
   Solutec — interacciones de la web
   ================================================================ */
(function () {
  'use strict';

  /* ---------- Header ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menú móvil ---------- */
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');

  const closeMenu = () => {
    nav?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Abrir menú');
  };

  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });

  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', e => {
    if (nav?.classList.contains('is-open') && !header.contains(e.target)) closeMenu();
  });

  /* ---------- Reveal al hacer scroll ---------- */
  const revealables = document.querySelectorAll('[data-reveal]');
  revealables.forEach(el => {
    const delay = Number(el.dataset.revealDelay || 0);
    if (delay) el.style.setProperty('--reveal-delay', `${delay * 0.12}s`);
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealables.forEach(el => revealObserver.observe(el));
  } else {
    revealables.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Contadores ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const animateCounter = el => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const start = performance.now();

    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = (target < 10 ? value.toFixed(0) : Math.round(value)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(el => counterObserver.observe(el));
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- Nav activa ---------- */
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = Array.from(nav?.querySelectorAll('a') || []);
  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`));
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    sections.forEach(section => sectionObserver.observe(section));
  }

  /* ---------- Proyectos ---------- */
  const grid = document.getElementById('projectsGrid');
  const filters = document.getElementById('projectFilters');

  if (grid && Array.isArray(window.SOLUTEC_PROJECTS)) {
    const esc = value => String(value).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);

    const renderCards = list => {
      grid.innerHTML = list.map(project => `
        <article class="project-card" data-accent="${esc(project.accent || 'navy')}">
          <div class="project-card__cover">
            <span class="project-card__initials">${esc(project.initials || 'SL')}</span>
            ${project.image ? `<img src="${esc(project.image)}" alt="Vista del sistema ${esc(project.title)}" loading="lazy">` : ''}
            <span class="project-card__year">${esc(project.year || '')}</span>
          </div>
          <div class="project-card__body">
            <span class="project-card__cat">${esc(project.category)}</span>
            <h3>${esc(project.title)}</h3>
            <p>${esc(project.description)}</p>
            <div class="project-card__tags">${(project.tags || []).map(tag => `<span>${esc(tag)}</span>`).join('')}</div>
            ${project.metric ? `<div class="project-card__metric">${esc(project.metric)}</div>` : ''}
          </div>
        </article>
      `).join('');
    };

    const categories = ['Todos', ...new Set(window.SOLUTEC_PROJECTS.map(p => p.category))];
    if (filters) {
      filters.innerHTML = categories.map((cat, i) => `
        <button class="filter-btn${i === 0 ? ' is-active' : ''}" type="button" data-filter="${esc(cat)}">${esc(cat)}</button>
      `).join('');

      filters.addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const value = btn.dataset.filter;
        renderCards(value === 'Todos'
          ? window.SOLUTEC_PROJECTS
          : window.SOLUTEC_PROJECTS.filter(p => p.category === value));
      });
    }

    renderCards(window.SOLUTEC_PROJECTS);
  }

  /* ---------- Formulario ---------- */
  const form = document.getElementById('contactForm');
  const toast = document.getElementById('toast');
  let toastTimer;

  const showToast = message => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4000);
  };

  form?.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      const ok = field.checkValidity() && field.value.trim() !== '';
      field.classList.toggle('field-error', !ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      showToast('Revisá los campos marcados.');
      return;
    }
    showToast('¡Listo! Tu consulta fue enviada (demo).');
    form.reset();
  });

  form?.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('input', () => field.classList.remove('field-error'));
  });

  /* ---------- Año ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
