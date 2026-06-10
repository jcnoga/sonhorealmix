// ================================================================
// admin.js — Sonho Real Mix | Admin Panel Engine
// ================================================================
"use strict";

// ── Helpers ──────────────────────────────────────────────────
function qs(s, c = document) { return c.querySelector(s); }
function qsa(s, c = document) { return [...c.querySelectorAll(s)]; }

let TOAST_CONTAINER;
function toast(msg, type = 'info') {
  if (!TOAST_CONTAINER) {
    TOAST_CONTAINER = document.createElement('div');
    TOAST_CONTAINER.className = 'toast-container';
    document.body.appendChild(TOAST_CONTAINER);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${msg}`;
  TOAST_CONTAINER.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function loadingBtn(btn, loading, label = '') {
  btn.disabled = loading;
  btn.innerHTML = loading ? '<i class="fas fa-spinner fa-spin"></i> Salvando...' : label;
}

// Upload file to Firebase Storage
async function uploadFile(file, path) {
  const ref = storage.ref(path);
  await ref.put(file);
  return ref.getDownloadURL();
}

// ── Auth Guard ────────────────────────────────────────────────
// Admin inicializado uma unica vez apos DOM pronto
document.addEventListener('DOMContentLoaded', function() {
  // Esconde overlay de loading
  var overlay = document.getElementById('auth-loading');
  if (overlay) overlay.classList.add('hidden');

  // Inicia o painel
  initAdmin();
});

// ── Tab navigation ────────────────────────────────────────────
function initTabs() {
  qsa('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.tab-btn').forEach(b => b.classList.remove('active'));
      qsa('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      qs(`#tab-${btn.dataset.tab}`).classList.add('active');
    });
  });
}

// ── Logout ─ tratado via onclick inline no HTML ──────────────
function initLogout() {
  // Logout ja esta no onclick do botao no admin.html
  // Nada a fazer aqui
}

// ── Change Password ───────────────────────────────────────────
function initChangePassword() {
  const btn = qs('#btn-change-pw');
  if (!btn) return;
  const origLabel = btn.innerHTML;
  btn.addEventListener('click', async () => {
    const current = qs('#current-pw').value;
    const newPw   = qs('#new-pw').value;
    const confirm = qs('#confirm-pw').value;
    if (!current || !newPw || !confirm) { toast('Preencha todos os campos.', 'error'); return; }
    if (newPw !== confirm) { toast('As senhas não conferem.', 'error'); return; }
    if (newPw.length < 6) { toast('A senha deve ter pelo menos 6 caracteres.', 'error'); return; }
    loadingBtn(btn, true);
    try {
      const user = auth.currentUser;
      const cred = firebase.auth.EmailAuthProvider.credential(user.email, current);
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(newPw);
      toast('Senha alterada com sucesso!', 'success');
      qs('#current-pw').value = '';
      qs('#new-pw').value     = '';
      qs('#confirm-pw').value = '';
    } catch (e) {
      const msgs = {
        'auth/wrong-password': 'Senha atual incorreta.',
        'auth/weak-password':  'Senha muito fraca.',
      };
      toast(msgs[e.code] || `Erro: ${e.message}`, 'error');
    }
    loadingBtn(btn, false, origLabel);
  });
}

// ── Header Config ─────────────────────────────────────────────
let currentConfig = {};

async function loadHeaderConfig() {
  const snap = await CONFIG_DOC.get();
  currentConfig = snap.exists ? snap.data() : {};
  const h = currentConfig.header || {};
  const fields = ['company','slogan','desc','bg_color','text_color','btn1_text','btn1_link',
    'btn2_text','btn2_link','whatsapp','phone','email','instagram','facebook','tiktok','youtube',
    'banner_url','bg_video_url'];
  fields.forEach(f => {
    const el = qs(`#header-${f.replace(/_/g,'-')}`);
    if (el) el.value = h[f] || '';
  });
  if (h.logo_url) {
    const prev = qs('#header-logo-preview');
    if (prev) { prev.src = h.logo_url; prev.style.display = 'block'; }
  }
  if (h.banner_url) {
    const prev = qs('#header-banner-preview');
    if (prev) { prev.src = h.banner_url; prev.style.display = 'block'; }
  }
}

function initHeaderForm() {
  loadHeaderConfig();

  // Logo upload preview
  const logoInput = qs('#header-logo-upload');
  if (logoInput) {
    logoInput.addEventListener('change', () => {
      const file = logoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        const prev = qs('#header-logo-preview');
        if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
      };
      reader.readAsDataURL(file);
    });
  }

  // Banner upload preview
  const bannerInput = qs('#header-banner-upload');
  if (bannerInput) {
    bannerInput.addEventListener('change', () => {
      const file = bannerInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        const prev = qs('#header-banner-preview');
        if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
      };
      reader.readAsDataURL(file);
    });
  }

  const saveBtn = qs('#btn-save-header');
  if (!saveBtn) return;
  const origLabel = saveBtn.innerHTML;

  saveBtn.addEventListener('click', async () => {
    loadingBtn(saveBtn, true);
    try {
      // Coleta campos de texto
      const h = {};
      const fields = ['company','slogan','desc','bg_color','text_color','btn1_text','btn1_link',
        'btn2_text','btn2_link','whatsapp','phone','email','instagram','facebook','tiktok','youtube',
        'banner_url','bg_video_url'];
      fields.forEach(f => {
        const el = qs(`#header-${f.replace(/_/g,'-')}`);
        if (el) h[f] = el.value || '';
      });

      // Mantém logo existente ou faz upload
      const logoFile = qs('#header-logo-upload')?.files[0];
      if (logoFile) {
        toast('Enviando logo...', 'info');
        h.logo_url = await uploadFile(logoFile, `uploads/logo_${Date.now()}`);
      } else {
        h.logo_url = (currentConfig.header || {}).logo_url || '';
      }

      // Mantém banner existente ou faz upload
      const bannerFile = qs('#header-banner-upload')?.files[0];
      if (bannerFile) {
        toast('Enviando banner...', 'info');
        h.banner_url = await uploadFile(bannerFile, `uploads/banner_${Date.now()}`);
      }

      // Salva no Firestore
      toast('Salvando...', 'info');
      await db.collection('settings').doc('site').set({ header: h }, { merge: true });
      currentConfig.header = h;
      toast('Cabeçalho salvo com sucesso!', 'success');
    } catch (e) {
      console.error('Erro ao salvar cabeçalho:', e);
      if (e.code === 'permission-denied') {
        toast('Erro de permissão. Verifique as regras do Firestore.', 'error');
      } else if (e.code === 'unavailable') {
        toast('Firestore indisponível. Verifique sua conexão.', 'error');
      } else {
        toast(`Erro: ${e.code || e.message}`, 'error');
      }
    }
    loadingBtn(saveBtn, false, origLabel);
  });
}

// ── Footer Config ─────────────────────────────────────────────
async function loadFooterConfig() {
  const snap = await CONFIG_DOC.get();
  const f = (snap.exists ? snap.data().footer : null) || {};
  const fields = ['company','desc','address','city','state','cep','phone','whatsapp','email',
    'hours','instagram','facebook','tiktok','youtube','copyright','privacy_url','terms_url',
    'bg_color','text_color','logo_url'];
  fields.forEach(field => {
    const el = qs(`#footer-${field.replace(/_/g,'-')}`);
    if (el) el.value = f[field] || '';
  });
  if (f.logo_url) {
    const prev = qs('#footer-logo-preview');
    if (prev) { prev.src = f.logo_url; prev.style.display = 'block'; }
  }
}

function initFooterForm() {
  loadFooterConfig();

  const logoInput = qs('#footer-logo-upload');
  if (logoInput) {
    logoInput.addEventListener('change', () => {
      const file = logoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        const prev = qs('#footer-logo-preview');
        if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
      };
      reader.readAsDataURL(file);
    });
  }

  const saveBtn = qs('#btn-save-footer');
  if (!saveBtn) return;
  const origLabel = saveBtn.innerHTML;

  saveBtn.addEventListener('click', async () => {
    loadingBtn(saveBtn, true);
    try {
      const f = {};
      const fields = ['company','desc','address','city','state','cep','phone','whatsapp','email',
        'hours','instagram','facebook','tiktok','youtube','copyright','privacy_url','terms_url',
        'bg_color','text_color'];
      fields.forEach(field => {
        const el = qs(`#footer-${field.replace(/_/g,'-')}`);
        if (el) f[field] = el.value;
      });

      const logoFile = qs('#footer-logo-upload')?.files[0];
      if (logoFile) {
        f.logo_url = await uploadFile(logoFile, `uploads/footer_logo_${Date.now()}_${logoFile.name}`);
      } else {
        f.logo_url = (currentConfig.footer || {}).logo_url || '';
      }

      await db.collection('settings').doc('site').set({ footer: f }, { merge: true });
      currentConfig.footer = f;
      toast('Rodapé salvo com sucesso!', 'success');
    } catch (e) {
      console.error('Erro ao salvar rodapé:', e);
      if (e.code === 'permission-denied') {
        toast('Erro de permissão. Verifique as regras do Firestore.', 'error');
      } else {
        toast(`Erro: ${e.code || e.message}`, 'error');
      }
    }
    loadingBtn(saveBtn, false, origLabel);
  });
}

// ── Separator Config ──────────────────────────────────────────
async function loadSeparatorConfig() {
  const snap = await CONFIG_DOC.get();
  const s = (snap.exists ? snap.data().separator : null) || {};
  const el = { color: '#2D1B69', thickness: 1, style: 'solid', spacing: 0, ...s };
  qs('#sep-color').value     = el.color;
  qs('#sep-thickness').value = el.thickness;
  qs('#sep-style').value     = el.style;
  qs('#sep-spacing').value   = el.spacing;
  updateSepPreview(el);
}

function updateSepPreview(s) {
  const prev = qs('#sep-preview-line');
  if (!prev) return;
  if (s.style === 'solid') {
    prev.style.background = `linear-gradient(90deg, transparent, ${s.color}, transparent)`;
    prev.style.height = s.thickness + 'px';
    prev.style.border = 'none';
  } else {
    prev.style.background = 'none';
    prev.style.height = 'auto';
    prev.style.border = `${s.thickness}px ${s.style} ${s.color}`;
  }
  prev.style.margin = `${s.spacing}px 0`;
}

function initSeparatorForm() {
  loadSeparatorConfig();
  ['sep-color','sep-thickness','sep-style','sep-spacing'].forEach(id => {
    qs('#' + id)?.addEventListener('input', () => {
      updateSepPreview({
        color:     qs('#sep-color').value,
        thickness: qs('#sep-thickness').value,
        style:     qs('#sep-style').value,
        spacing:   qs('#sep-spacing').value
      });
    });
  });

  const saveBtn = qs('#btn-save-separator');
  if (!saveBtn) return;
  const origLabel = saveBtn.innerHTML;

  saveBtn.addEventListener('click', async () => {
    loadingBtn(saveBtn, true);
    try {
      const s = {
        color:     qs('#sep-color').value,
        thickness: Number(qs('#sep-thickness').value),
        style:     qs('#sep-style').value,
        spacing:   Number(qs('#sep-spacing').value)
      };
      await db.collection('settings').doc('site').set({ separator: s }, { merge: true });
      toast('Separador salvo!', 'success');
    } catch (e) {
      console.error('Erro ao salvar separador:', e);
      toast(`Erro: ${e.code || e.message}`, 'error');
    }
    loadingBtn(saveBtn, false, origLabel);
  });
}

// ── Products ──────────────────────────────────────────────────
let editingProductId = null;

async function loadProducts() {
  const grid = qs('#admin-products-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';

  try {
    const snap = await PRODUCTS_COL.orderBy('order', 'asc').get();
    grid.innerHTML = '';

    if (snap.empty) {
      grid.innerHTML = '<div class="empty-msg"><i class="fas fa-box-open"></i><p>Nenhum produto cadastrado.</p></div>';
      qs('#product-count').textContent = '0/60';
      return;
    }

    qs('#product-count').textContent = `${snap.size}/60`;

    snap.forEach(doc => {
      const p = { id: doc.id, ...doc.data() };
      grid.appendChild(buildAdminProductCard(p));
    });
  } catch (e) {
    grid.innerHTML = `<div class="error-msg">Erro ao carregar: ${e.message}</div>`;
  }
}

function buildAdminProductCard(p) {
  const card = document.createElement('div');
  card.className = `admin-product-card${p.active ? '' : ' inactive'}`;
  card.innerHTML = `
    <div class="apc-thumb">
      ${p.photo1 ? `<img src="${p.photo1}" alt="${p.name}" loading="lazy">` : '<div class="apc-no-img"><i class="fas fa-image"></i></div>'}
      <span class="apc-status ${p.active ? 'active' : 'inactive'}">${p.active ? 'Ativo' : 'Inativo'}</span>
      <span class="apc-order">#${p.order || 0}</span>
    </div>
    <div class="apc-info">
      <div class="apc-cat">${p.category || ''}</div>
      <div class="apc-name">${p.name || ''}</div>
      ${p.price ? `<div class="apc-price">R$ ${p.price}</div>` : ''}
    </div>
    <div class="apc-actions">
      <button class="btn-edit-product" data-id="${p.id}"><i class="fas fa-edit"></i> Editar</button>
      <button class="btn-toggle-product" data-id="${p.id}" data-active="${p.active}">
        <i class="fas fa-${p.active ? 'eye-slash' : 'eye'}"></i> ${p.active ? 'Desativar' : 'Ativar'}
      </button>
      <button class="btn-delete-product danger" data-id="${p.id}"><i class="fas fa-trash"></i></button>
    </div>
  `;

  card.querySelector('.btn-edit-product').addEventListener('click', () => openProductModal(p));
  card.querySelector('.btn-toggle-product').addEventListener('click', async () => {
    await PRODUCTS_COL.doc(p.id).update({ active: !p.active });
    toast(`Produto ${!p.active ? 'ativado' : 'desativado'}.`, 'success');
    loadProducts();
  });
  card.querySelector('.btn-delete-product').addEventListener('click', async () => {
    if (!confirm(`Excluir "${p.name}"? Esta ação não pode ser desfeita.`)) return;
    await PRODUCTS_COL.doc(p.id).delete();
    toast('Produto excluído.', 'success');
    loadProducts();
  });

  return card;
}

function openProductModal(p = null) {
  editingProductId = p ? p.id : null;
  const modal = qs('#product-form-modal');
  const title = qs('#product-modal-title');
  title.textContent = p ? 'Editar Produto' : 'Novo Produto';

  // Reset form
  qs('#pf-name').value        = p?.name     || '';
  qs('#pf-desc').value        = p?.desc     || '';
  qs('#pf-category').value    = p?.category || '';
  qs('#pf-price').value       = p?.price    || '';
  qs('#pf-order').value       = p?.order    ?? 0;
  qs('#pf-active').checked    = p?.active   ?? true;
  qs('#pf-photo1-url').value  = p?.photo1   || '';
  qs('#pf-photo2-url').value  = p?.photo2   || '';
  qs('#pf-photo3-url').value  = p?.photo3   || '';
  qs('#pf-ml-link').value     = p?.ml_link  || '';
  qs('#pf-ml-text').value     = p?.ml_text  || '';
  qs('#pf-shopee-link').value = p?.shopee_link  || '';
  qs('#pf-shopee-text').value = p?.shopee_text  || '';

  // Reset file inputs
  ['pf-photo1-file','pf-photo2-file','pf-photo3-file'].forEach(id => {
    const el = qs(`#${id}`);
    if (el) el.value = '';
  });

  // Previews
  setPreview('pf-photo1-preview', p?.photo1);
  setPreview('pf-photo2-preview', p?.photo2);
  setPreview('pf-photo3-preview', p?.photo3);

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function setPreview(id, url) {
  const el = qs(`#${id}`);
  if (!el) return;
  if (url) { el.src = url; el.style.display = 'block'; }
  else el.style.display = 'none';
}

function closeProductModal() {
  qs('#product-form-modal').classList.remove('open');
  document.body.style.overflow = '';
  editingProductId = null;
}

function initProductsSection() {
  // New product button
  qs('#btn-new-product')?.addEventListener('click', () => openProductModal());
  qs('#btn-close-product-modal')?.addEventListener('click', closeProductModal);
  qs('#product-form-modal')?.addEventListener('click', e => {
    if (e.target === qs('#product-form-modal')) closeProductModal();
  });

  // File previews
  setupFilePreview('pf-photo1-file', 'pf-photo1-preview', 'pf-photo1-url');
  setupFilePreview('pf-photo2-file', 'pf-photo2-preview', 'pf-photo2-url');
  setupFilePreview('pf-photo3-file', 'pf-photo3-preview', 'pf-photo3-url');
  qs('#pf-photo1-url')?.addEventListener('input', e => setPreview('pf-photo1-preview', e.target.value));
  qs('#pf-photo2-url')?.addEventListener('input', e => setPreview('pf-photo2-preview', e.target.value));
  qs('#pf-photo3-url')?.addEventListener('input', e => setPreview('pf-photo3-preview', e.target.value));

  // Save product
  qs('#btn-save-product')?.addEventListener('click', saveProduct);

  loadProducts();
}

function setupFilePreview(fileInputId, previewId, urlInputId) {
  qs(`#${fileInputId}`)?.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const prev = qs(`#${previewId}`);
      if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
    };
    reader.readAsDataURL(file);
    // Clear URL input so we know to use upload
    const urlInput = qs(`#${urlInputId}`);
    if (urlInput) urlInput.value = '';
  });
}

async function saveProduct() {
  const saveBtn = qs('#btn-save-product');
  const origLabel = saveBtn.innerHTML;

  const name = qs('#pf-name').value.trim();
  if (!name) { toast('Nome do produto é obrigatório.', 'error'); return; }

  const snap = await PRODUCTS_COL.get();
  if (!editingProductId && snap.size >= 60) {
    toast('Limite de 60 produtos atingido.', 'error');
    return;
  }

  loadingBtn(saveBtn, true);

  try {
    // Upload photos
    let photo1 = qs('#pf-photo1-url').value;
    let photo2 = qs('#pf-photo2-url').value;
    let photo3 = qs('#pf-photo3-url').value;

    const photo1File = qs('#pf-photo1-file')?.files[0];
    const photo2File = qs('#pf-photo2-file')?.files[0];
    const photo3File = qs('#pf-photo3-file')?.files[0];

    if (photo1File) photo1 = await uploadFile(photo1File, `products/${Date.now()}_photo1_${photo1File.name}`);
    if (photo2File) photo2 = await uploadFile(photo2File, `products/${Date.now()}_photo2_${photo2File.name}`);
    if (photo3File) photo3 = await uploadFile(photo3File, `products/${Date.now()}_photo3_${photo3File.name}`);

    const data = {
      name,
      desc:        qs('#pf-desc').value.trim(),
      category:    qs('#pf-category').value.trim(),
      price:       qs('#pf-price').value.trim(),
      order:       Number(qs('#pf-order').value) || 0,
      active:      qs('#pf-active').checked,
      photo1, photo2, photo3,
      ml_link:     qs('#pf-ml-link').value.trim(),
      ml_text:     qs('#pf-ml-text').value.trim(),
      shopee_link: qs('#pf-shopee-link').value.trim(),
      shopee_text: qs('#pf-shopee-text').value.trim(),
      updated_at:  firebase.firestore.FieldValue.serverTimestamp()
    };

    if (editingProductId) {
      await PRODUCTS_COL.doc(editingProductId).update(data);
      toast('Produto atualizado!', 'success');
    } else {
      data.created_at = firebase.firestore.FieldValue.serverTimestamp();
      await PRODUCTS_COL.add(data);
      toast('Produto criado!', 'success');
    }

    closeProductModal();
    loadProducts();
  } catch (e) {
    toast(`Erro: ${e.message}`, 'error');
  }

  loadingBtn(saveBtn, false, origLabel);
}

// ── Init ──────────────────────────────────────────────────────
function initAdmin() {
  initTabs();
  initLogout();
  initChangePassword();
  initHeaderForm();
  initFooterForm();
  initSeparatorForm();
  initProductsSection();
}
