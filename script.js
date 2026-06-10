// ================================================================
// script.js — Sonho Real Mix | Landing Page Engine
// ================================================================
"use strict";

// ── Helpers ──────────────────────────────────────────────────
function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }
function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'html')  e.innerHTML = v;
    else if (k === 'text')  e.textContent = v;
    else e.setAttribute(k, v);
  });
  children.forEach(c => c && e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return e;
}
function toast(msg, type = 'info') {
  const c = qs('.toast-container') || (() => {
    const t = el('div', { class: 'toast-container' });
    document.body.appendChild(t);
    return t;
  })();
  const t = el('div', { class: `toast ${type}`, text: msg });
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── Default config (shown before Firebase loads) ─────────────
const DEFAULTS = {
  header: {
    company: 'Sonho Real Mix',
    slogan: 'As melhores fantasias e acessórios',
    desc: 'Para todas as ocasiões — festa, carnaval, halloween e muito mais.',
    bg_color: '#1A0A2E',
    text_color: '#FFFFFF',
    btn1_text: 'Comprar Agora',
    btn1_link: '#catalog',
    btn2_text: 'Ver Produtos',
    btn2_link: '#catalog',
    whatsapp: '',
    phone: '',
    email: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    logo_url: '',
    banner_url: '',
    bg_video_url: ''
  },
  footer: {
    company: 'Sonho Real Mix Fantasias',
    desc: 'Especialistas em fantasias e acessórios para festas, eventos e datas comemorativas.',
    address: '',
    city: '',
    state: '',
    cep: '',
    phone: '',
    whatsapp: '',
    email: '',
    hours: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    copyright: '© 2026 Todos os direitos reservados.',
    privacy_url: '#',
    terms_url: '#',
    bg_color: '#1A0A2E',
    text_color: '#FFFFFF',
    logo_url: ''
  },
  separator: { color: '#2D1B69', thickness: 1, style: 'solid', spacing: 0 }
};

let SITE_CONFIG = JSON.parse(JSON.stringify(DEFAULTS));
let ALL_PRODUCTS = [];

// ── Firebase listener ─────────────────────────────────────────
function initDataListeners(safetyTimer) {
  // Settings
  CONFIG_DOC.onSnapshot(snap => {
    if (snap.exists) {
      const d = snap.data();
      SITE_CONFIG.header    = { ...DEFAULTS.header,    ...(d.header    || {}) };
      SITE_CONFIG.footer    = { ...DEFAULTS.footer,    ...(d.footer    || {}) };
      SITE_CONFIG.separator = { ...DEFAULTS.separator, ...(d.separator || {}) };
    }
    renderHeader();
    renderSeparator();
    renderFooter();
  }, () => { renderHeader(); renderSeparator(); renderFooter(); });

  // Products
  PRODUCTS_COL
    .where('active', '==', true)
    .orderBy('order', 'asc')
    .onSnapshot(snap => {
      clearTimeout(safetyTimer);
      ALL_PRODUCTS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderProducts(ALL_PRODUCTS);
    }, err => {
      clearTimeout(safetyTimer);
      console.warn('Products snapshot error:', err);
      // Tenta sem filtro de indice
      PRODUCTS_COL.get().then(snap => {
        ALL_PRODUCTS = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.active)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        renderProducts(ALL_PRODUCTS);
      }).catch(() => {
        renderProducts([]);
        removeLoadingState();
      });
    });
}

// ── Render Header ─────────────────────────────────────────────
function renderHeader() {
  const h = SITE_CONFIG.header;
  const hero = qs('#hero');

  // BG color
  hero.style.setProperty('--hero-bg', h.bg_color || '#1A0A2E');

  // Background media
  const bgContainer = qs('#hero-bg-container');
  bgContainer.innerHTML = '';

  if (h.bg_video_url) {
    const video = el('video', {
      class: 'hero-bg-video',
      autoplay: '',
      muted: '',
      loop: '',
      playsinline: ''
    });
    const src = el('source', { src: h.bg_video_url });
    video.appendChild(src);
    bgContainer.appendChild(video);
  } else if (h.banner_url) {
    bgContainer.appendChild(el('img', { class: 'hero-bg-img', src: h.banner_url, alt: 'Banner' }));
  } else {
    bgContainer.style.background = 'linear-gradient(135deg, #1A0A2E, #2D1B69, #4A2C9E)';
  }

  // Logo
  const logoImg = qs('#nav-logo');
  const logoName = qs('#nav-company');
  if (logoImg) { logoImg.src = h.logo_url || ''; logoImg.style.display = h.logo_url ? '' : 'none'; }
  if (logoName) logoName.textContent = h.company || '';

  // Hero text
  qs('#hero-company').textContent  = h.company || '';
  qs('#hero-slogan').innerHTML     = formatSlogan(h.slogan || '');
  qs('#hero-desc').textContent     = h.desc || '';

  // Buttons
  const b1 = qs('#hero-btn1');
  const b2 = qs('#hero-btn2');
  if (b1) { b1.textContent = h.btn1_text || 'Comprar Agora'; b1.href = h.btn1_link || '#catalog'; }
  if (b2) { b2.textContent = h.btn2_text || 'Ver Produtos';  b2.href = h.btn2_link || '#catalog'; }

  // Social
  renderHeroSocial(h);

  // WhatsApp float
  const wa = qs('#whatsapp-float');
  if (wa) {
    const num = (h.whatsapp || '').replace(/\D/g, '');
    if (num) {
      wa.href = `https://wa.me/55${num}`;
      wa.style.display = '';
    } else {
      wa.style.display = 'none';
    }
  }
}

function formatSlogan(slogan) {
  const words = slogan.split(' ');
  if (words.length <= 3) return `<span class="accent">${slogan}</span>`;
  const mid = Math.floor(words.length / 2);
  return words.slice(0, mid).join(' ') +
    ` <span class="accent">${words.slice(mid).join(' ')}</span>`;
}

function renderHeroSocial(h) {
  const container = qs('#hero-social-icons');
  if (!container) return;
  container.innerHTML = '';
  const platforms = [
    { key: 'instagram', icon: 'fab fa-instagram', url: v => `https://instagram.com/${v}` },
    { key: 'facebook',  icon: 'fab fa-facebook-f', url: v => `https://facebook.com/${v}` },
    { key: 'tiktok',    icon: 'fab fa-tiktok',     url: v => `https://tiktok.com/@${v}` },
    { key: 'youtube',   icon: 'fab fa-youtube',    url: v => v },
    { key: 'whatsapp',  icon: 'fab fa-whatsapp',   url: v => `https://wa.me/55${v.replace(/\D/g,'')}` }
  ];
  platforms.forEach(p => {
    if (!h[p.key]) return;
    const a = el('a', { class: 'social-icon', href: p.url(h[p.key]), target: '_blank', rel: 'noopener' });
    a.innerHTML = `<i class="${p.icon}"></i>`;
    container.appendChild(a);
  });
  qs('#hero-social').style.display = container.children.length ? '' : 'none';
}

// ── Render Separator ──────────────────────────────────────────
function renderSeparator() {
  const s = SITE_CONFIG.separator;
  qsa('.visual-sep').forEach(sep => {
    sep.style.borderTopColor = s.color || '#2D1B69';
    sep.style.borderTopWidth = (s.thickness || 1) + 'px';
    sep.style.margin = `${s.spacing || 0}px 0`;
    sep.setAttribute('data-style', s.style || 'solid');
    if (s.style === 'solid') {
      sep.style.background = `linear-gradient(90deg, transparent, ${s.color || '#2D1B69'}, transparent)`;
      sep.style.height = (s.thickness || 1) + 'px';
      sep.style.borderTop = 'none';
    } else {
      sep.style.background = 'none';
      sep.style.height = 'auto';
      sep.style.borderTop = `${s.thickness || 1}px ${s.style} ${s.color || '#2D1B69'}`;
    }
  });
}

// ── Render Products ───────────────────────────────────────────
let activeCategory = 'all';

function renderProducts(products) {
  buildCategoryFilter(products);
  filterAndDisplay(products, activeCategory);
  removeLoadingState();
}

function buildCategoryFilter(products) {
  const cats = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];
  const container = qs('#category-filter');
  if (!container) return;
  container.innerHTML = '';
  cats.forEach(cat => {
    const btn = el('button', {
      class: `cat-btn${cat === activeCategory ? ' active' : ''}`,
      text: cat === 'all' ? 'Todos' : cat
    });
    btn.addEventListener('click', () => {
      activeCategory = cat;
      qsa('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterAndDisplay(products, cat);
    });
    container.appendChild(btn);
  });
}

function filterAndDisplay(products, cat) {
  const filtered = cat === 'all' ? products : products.filter(p => p.category === cat);
  const grid = qs('#products-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!filtered.length) {
    grid.appendChild(el('div', { class: 'empty-state', html: '<i class="fas fa-box-open"></i><p>Nenhum produto encontrado.</p>' }));
    return;
  }

  filtered.forEach((product, i) => {
    const card = buildProductCard(product);
    card.style.animationDelay = `${i * 0.05}s`;
    card.classList.add('reveal');
    grid.appendChild(card);
  });

  // Trigger reveal
  setTimeout(() => observeReveal(), 100);
}

function buildProductCard(p) {
  const hasML     = p.ml_link;
  const hasShopee = p.shopee_link;

  const card = el('div', { class: 'product-card' });

  // Media section
  const mediaDiv = el('div', { class: 'product-media' });
  if (p.photo1 || p.photo2 || p.photo3) {
    const mediaGrid = el('div', { class: 'product-media-grid' });

    // Main photo
    if (p.photo1) {
      const imgMain = el('div', { class: 'media-main' });
      imgMain.appendChild(el('img', { src: p.photo1, alt: p.name, loading: 'lazy' }));
      mediaGrid.appendChild(imgMain);
    }

    // Secondary photo
    if (p.photo2) {
      const imgThumb = el('div', { class: 'media-thumb' });
      imgThumb.appendChild(el('img', { src: p.photo2, alt: p.name, loading: 'lazy' }));
      mediaGrid.appendChild(imgThumb);
    }

    // Photo 3
    if (p.photo3) {
      const img3 = el('div', { class: 'media-video-thumb' });
      img3.appendChild(el('img', { src: p.photo3, alt: p.name, loading: 'lazy', style: 'width:100%;height:100%;object-fit:cover;' }));
      mediaGrid.appendChild(img3);
    }

    // If only one media item, show full
    if (!p.photo2 && !p.photo3 && p.photo1) {
      mediaDiv.appendChild(el('img', { src: p.photo1, alt: p.name, loading: 'lazy', style: 'width:100%;height:100%;object-fit:cover;' }));
    } else {
      mediaDiv.appendChild(mediaGrid);
    }
  } else {
    mediaDiv.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--cream);color:var(--text-muted);"><i class="fas fa-image" style="font-size:2.5rem;opacity:.3;"></i></div>';
  }

  if (p.category) mediaDiv.appendChild(el('span', { class: 'product-badge', text: p.category }));
  card.appendChild(mediaDiv);

  // Info
  const info = el('div', { class: 'product-info' });
  if (p.category) info.appendChild(el('div', { class: 'product-category', text: p.category }));
  info.appendChild(el('h3', { class: 'product-name', text: p.name }));
  if (p.desc) info.appendChild(el('p', { class: 'product-desc', text: p.desc }));
  if (p.price) info.appendChild(el('div', { class: 'product-price', text: formatPrice(p.price) }));

  const btnRow = el('div', { class: 'product-buttons' });

  if (hasML) {
    const a = el('a', { class: 'btn btn-ml', href: p.ml_link, target: '_blank', rel: 'noopener', text: p.ml_text || '🛒 Mercado Livre' });
    if (!hasShopee) a.classList.add('product-btn-full');
    btnRow.appendChild(a);
  }
  if (hasShopee) {
    const a = el('a', { class: 'btn btn-shopee', href: p.shopee_link, target: '_blank', rel: 'noopener', text: p.shopee_text || '🛍 Shopee' });
    if (!hasML) a.classList.add('product-btn-full');
    btnRow.appendChild(a);
  }
  if (!hasML && !hasShopee) {
    const a = el('a', { class: 'btn btn-primary product-btn-full', href: '#', text: 'Ver Produto' });
    a.addEventListener('click', e => { e.preventDefault(); openModal(p); });
    btnRow.appendChild(a);
  }

  // Detail button
  const detailBtn = el('button', { class: 'btn btn-secondary product-btn-full', style: 'margin-top:.35rem;', text: '🔍 Ver Detalhes' });
  detailBtn.addEventListener('click', () => openModal(p));

  info.appendChild(btnRow);
  if (hasML || hasShopee) info.appendChild(detailBtn);
  card.appendChild(info);

  return card;
}

function formatPrice(price) {
  if (!price) return '';
  const n = parseFloat(String(price).replace(',', '.'));
  return isNaN(n) ? price : `R$ ${n.toFixed(2).replace('.', ',')}`;
}


// ── Product Modal ─────────────────────────────────────────────
function openModal(p) {
  const overlay = qs('#product-modal-overlay');
  const modal   = qs('#product-modal');
  if (!overlay || !modal) return;

  // Build media frames
  const frame = qs('#modal-media-frame', modal);
  frame.innerHTML = '';

  if (p.photo1) {
    frame.appendChild(el('img', { class: 'modal-img-main', src: p.photo1, alt: p.name }));
  }
  if (p.photo2) {
    frame.appendChild(el('img', { class: 'modal-img-secondary', src: p.photo2, alt: p.name }));
  }
  if (p.photo3) {
    frame.appendChild(el('img', { class: 'modal-img-secondary', src: p.photo3, alt: p.name }));
  }
  if (!p.photo1 && !p.photo2 && !p.photo3) {
    frame.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:var(--cream);color:var(--text-muted);"><i class="fas fa-image" style="font-size:3rem;opacity:.3;"></i></div>';
  }

  qs('#modal-category', modal).textContent = p.category || '';
  qs('#modal-title', modal).textContent    = p.name || '';
  qs('#modal-desc', modal).textContent     = p.desc || '';
  qs('#modal-price', modal).textContent    = p.price ? formatPrice(p.price) : '';

  const btnContainer = qs('#modal-buttons', modal);
  btnContainer.innerHTML = '';
  if (p.ml_link) {
    btnContainer.appendChild(el('a', { class: 'btn btn-ml', href: p.ml_link, target: '_blank', text: p.ml_text || '🛒 Comprar no Mercado Livre' }));
  }
  if (p.shopee_link) {
    btnContainer.appendChild(el('a', { class: 'btn btn-shopee', href: p.shopee_link, target: '_blank', text: p.shopee_text || '🛍 Comprar na Shopee' }));
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  qs('#product-modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Render Footer ─────────────────────────────────────────────
function renderFooter() {
  const f = SITE_CONFIG.footer;
  const footer = qs('#footer');

  footer.style.background = f.bg_color || '#1A0A2E';
  footer.style.color      = f.text_color || '#FFFFFF';

  const logoImg  = qs('#footer-logo');
  const brandName = qs('#footer-brand-name');
  const brandDesc = qs('#footer-brand-desc');
  if (logoImg)   { logoImg.src = f.logo_url || ''; logoImg.style.display = f.logo_url ? '' : 'none'; }
  if (brandName) brandName.textContent = f.company || '';
  if (brandDesc) brandDesc.textContent = f.desc || '';

  // Contact
  const contactDiv = qs('#footer-contact');
  if (contactDiv) {
    contactDiv.innerHTML = '';
    if (f.address)   addContactItem(contactDiv, 'fas fa-map-marker-alt', [f.address, f.city, f.state, f.cep].filter(Boolean).join(', '));
    if (f.phone)     addContactItem(contactDiv, 'fas fa-phone',        f.phone);
    if (f.whatsapp)  addContactItem(contactDiv, 'fab fa-whatsapp',     f.whatsapp);
    if (f.email)     addContactItem(contactDiv, 'fas fa-envelope',     f.email);
    if (f.hours)     addContactItem(contactDiv, 'fas fa-clock',        f.hours);
  }

  // Social
  const socialDiv = qs('#footer-social');
  if (socialDiv) {
    socialDiv.innerHTML = '';
    const platforms = [
      { key: 'instagram', icon: 'fab fa-instagram', url: v => `https://instagram.com/${v}` },
      { key: 'facebook',  icon: 'fab fa-facebook-f', url: v => `https://facebook.com/${v}` },
      { key: 'tiktok',    icon: 'fab fa-tiktok',     url: v => `https://tiktok.com/@${v}` },
      { key: 'youtube',   icon: 'fab fa-youtube',    url: v => v },
      { key: 'whatsapp',  icon: 'fab fa-whatsapp',   url: v => `https://wa.me/55${v.replace(/\D/g,'')}` }
    ];
    platforms.forEach(p => {
      if (!f[p.key]) return;
      const a = el('a', { class: 'social-icon', href: p.url(f[p.key]), target: '_blank', rel: 'noopener' });
      a.innerHTML = `<i class="${p.icon}"></i>`;
      socialDiv.appendChild(a);
    });
  }

  // Bottom
  const cp = qs('#footer-copyright');
  if (cp) cp.textContent = f.copyright || '';
  const privLink = qs('#footer-privacy');
  const termsLink = qs('#footer-terms');
  if (privLink)  privLink.href = f.privacy_url || '#';
  if (termsLink) termsLink.href = f.terms_url || '#';

  // WhatsApp
  const wa = qs('#whatsapp-float');
  if (wa && f.whatsapp) {
    const num = f.whatsapp.replace(/\D/g, '');
    wa.href = `https://wa.me/55${num}`;
  }
}

function addContactItem(container, icon, text) {
  const div = el('div', { class: 'footer-contact-item' });
  div.innerHTML = `<i class="${icon}"></i><span>${text}</span>`;
  container.appendChild(div);
}

// ── Loading state ─────────────────────────────────────────────
function removeLoadingState() {
  const overlay = qs('#loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// ── Navbar scroll ─────────────────────────────────────────────
function initNavbar() {
  const navbar = qs('#navbar');
  const toggle = qs('#nav-toggle');
  const links  = qs('#nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  if (toggle) toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  // Close on link click (mobile)
  qsa('#nav-links a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });

  // Smooth scroll for anchor links
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = qs(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

// ── Scroll reveal ─────────────────────────────────────────────
function observeReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: .12 });
  qsa('.reveal').forEach(el => obs.observe(el));
}

// ── Floating particles ────────────────────────────────────────
function initParticles() {
  const container = qs('.hero-particles');
  if (!container) return;
  const count = window.innerWidth < 768 ? 15 : 30;
  for (let i = 0; i < count; i++) {
    const p = el('div', { class: 'particle' });
    p.style.left            = Math.random() * 100 + 'vw';
    p.style.width           = Math.random() * 4 + 2 + 'px';
    p.style.height          = p.style.width;
    p.style.animationDelay  = Math.random() * 10 + 's';
    p.style.animationDuration = Math.random() * 15 + 10 + 's';
    container.appendChild(p);
  }
}

// ── Modal close ───────────────────────────────────────────────
function initModal() {
  const overlay = qs('#product-modal-overlay');
  if (!overlay) return;
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });
  qs('#modal-close-btn')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initParticles();
  initModal();
  observeReveal();

  // Render defaults imediatamente — pagina ja visivel
  renderHeader();
  renderSeparator();
  renderFooter();

  // Timeout de seguranca: remove loading em no maximo 3s
  const safetyTimer = setTimeout(() => {
    removeLoadingState();
    const grid = qs('#products-grid');
    if (grid && grid.innerHTML.includes('fa-spinner')) {
      grid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Nenhum produto cadastrado ainda.</p></div>';
    }
  }, 3000);

  // Verifica se Firebase esta configurado
  try {
    const isConfigured = typeof firebase !== 'undefined' &&
      firebase.apps.length > 0 &&
      firebase.app().options.apiKey !== 'SUA_API_KEY';

    if (!isConfigured) {
      clearTimeout(safetyTimer);
      renderProducts([]);
      removeLoadingState();
      return;
    }

    initDataListeners(safetyTimer);
  } catch (e) {
    clearTimeout(safetyTimer);
    console.warn('Firebase nao configurado:', e);
    renderProducts([]);
    removeLoadingState();
  }
});
