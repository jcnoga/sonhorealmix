// admin.js — Sonho Real Mix | Painel Admin
"use strict";

// ── Helpers ───────────────────────────────────────────────────
function qs(s,c){ return (c||document).querySelector(s); }
function qsa(s,c){ return Array.from((c||document).querySelectorAll(s)); }

function toast(msg, tipo) {
  var box = qs('.toast-box');
  if (!box) {
    box = document.createElement('div');
    box.className = 'toast-box';
    box.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:.4rem;';
    document.body.appendChild(box);
  }
  var t = document.createElement('div');
  t.className = 'toast-item';
  var cor = tipo==='success'?'#065F46':tipo==='error'?'#B91C1C':'#1A0A2E';
  var bg  = tipo==='success'?'#D1FAE5':tipo==='error'?'#FEE2E2':'#EDE9FF';
  t.style.cssText = 'padding:.75rem 1.1rem;border-radius:10px;font-size:.88rem;max-width:300px;box-shadow:0 4px 16px rgba(0,0,0,.15);animation:tin .3s ease;background:'+bg+';color:'+cor+';border-left:3px solid currentColor;';
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(function(){ t.remove(); }, 3500);
}

var _style = document.createElement('style');
_style.textContent = '@keyframes tin{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}';
document.head.appendChild(_style);

function setBtn(btn, loading, label) {
  btn.disabled = loading;
  btn.innerHTML = loading ? '<i class="fas fa-spinner fa-spin"></i> Aguarde...' : label;
}

async function uploadFile(file, path) {
  // Storage requer plano pago - use URLs diretas
  throw new Error('Use a URL da imagem em vez de fazer upload de arquivo.');
}

// ── Auth Guard ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {

  // Esconde pagina ate auth confirmar
  document.body.style.visibility = 'hidden';

  var guardTimer = setTimeout(function() {
    window.location.href = 'login.html';
  }, 8000);

  auth.onAuthStateChanged(function(user) {
    clearTimeout(guardTimer);
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    document.body.style.visibility = '';
    var el = qs('#user-email');
    if (el) el.textContent = user.email;
    initAdmin();
  });

});

// ── Init Admin ────────────────────────────────────────────────
function initAdmin() {
  initTabs();
  initHeaderForm();
  initFooterForm();
  initSeparatorForm();
  initProductsSection();
  initChangePassword();
}

// ── Tabs ──────────────────────────────────────────────────────
function initTabs() {
  qsa('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      qsa('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
      qsa('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
      btn.classList.add('active');
      var panel = qs('#tab-' + btn.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });
}

// ── Header ────────────────────────────────────────────────────
var currentHeader = {};

async function initHeaderForm() {
  try {
    var snap = await CONFIG_DOC.get();
    currentHeader = snap.exists ? (snap.data().header || {}) : {};
    var fields = ['company','slogan','desc','bg_color','text_color',
      'btn1_text','btn1_link','btn2_text','btn2_link',
      'whatsapp','phone','email','instagram','facebook','tiktok','youtube',
      'banner_url','bg_video_url'];
    fields.forEach(function(f) {
      var el = qs('#h-'+f.replace(/_/g,'-'));
      if (el) el.value = currentHeader[f] || '';
    });
    if (currentHeader.logo_url) showPreview('h-logo-prev', currentHeader.logo_url);
    if (currentHeader.banner_url) showPreview('h-banner-prev', currentHeader.banner_url);
  } catch(e) { console.warn('loadHeader:', e); }

  setupPreview('h-logo-file',   'h-logo-prev');
  setupPreview('h-banner-file', 'h-banner-prev');
  qs('#h-banner-url') && qs('#h-banner-url').addEventListener('input', function(e){ showPreview('h-banner-prev', e.target.value); });

  var btn = qs('#btn-save-header');
  if (!btn) return;
  btn.addEventListener('click', async function() {
    var orig = btn.innerHTML;
    setBtn(btn, true);
    try {
      var h = {};
      var fields = ['company','slogan','desc','bg_color','text_color',
        'btn1_text','btn1_link','btn2_text','btn2_link',
        'whatsapp','phone','email','instagram','facebook','tiktok','youtube',
        'banner_url','bg_video_url'];
      fields.forEach(function(f) {
        var el = qs('#h-'+f.replace(/_/g,'-'));
        h[f] = el ? el.value : '';
      });
      // Logo: usa URL do campo de texto
      h.logo_url = qs('#h-logo') ? qs('#h-logo').value : (currentHeader.logo_url || '');
      if (!h.logo_url) h.logo_url = currentHeader.logo_url || '';

      await db.collection('settings').doc('site').set({ header: h }, { merge: true });
      currentHeader = h;
      toast('Cabeçalho salvo!', 'success');
    } catch(e) {
      console.error(e);
      toast('Erro: ' + (e.code || e.message), 'error');
    }
    setBtn(btn, false, orig);
  });
}

// ── Footer ────────────────────────────────────────────────────
var currentFooter = {};

async function initFooterForm() {
  try {
    var snap = await CONFIG_DOC.get();
    currentFooter = snap.exists ? (snap.data().footer || {}) : {};
    var fields = ['company','desc','address','city','state','cep',
      'phone','whatsapp','email','hours',
      'instagram','facebook','tiktok','youtube',
      'copyright','privacy_url','terms_url','bg_color','text_color'];
    fields.forEach(function(f) {
      var el = qs('#f-'+f.replace(/_/g,'-'));
      if (el) el.value = currentFooter[f] || '';
    });
    if (currentFooter.logo_url) showPreview('f-logo-prev', currentFooter.logo_url);
  } catch(e) { console.warn('loadFooter:', e); }

  setupPreview('f-logo-file', 'f-logo-prev');

  var btn = qs('#btn-save-footer');
  if (!btn) return;
  btn.addEventListener('click', async function() {
    var orig = btn.innerHTML;
    setBtn(btn, true);
    try {
      var f = {};
      var fields = ['company','desc','address','city','state','cep',
        'phone','whatsapp','email','hours',
        'instagram','facebook','tiktok','youtube',
        'copyright','privacy_url','terms_url','bg_color','text_color'];
      fields.forEach(function(field) {
        var el = qs('#f-'+field.replace(/_/g,'-'));
        f[field] = el ? el.value : '';
      });
      f.logo_url = currentFooter.logo_url || '';

      await db.collection('settings').doc('site').set({ footer: f }, { merge: true });
      currentFooter = f;
      toast('Rodapé salvo!', 'success');
    } catch(e) {
      console.error(e);
      toast('Erro: ' + (e.code || e.message), 'error');
    }
    setBtn(btn, false, orig);
  });
}

// ── Separator ─────────────────────────────────────────────────
async function initSeparatorForm() {
  try {
    var snap = await CONFIG_DOC.get();
    var s = snap.exists ? (snap.data().separator || {}) : {};
    qs('#s-color')     && (qs('#s-color').value     = s.color     || '#2D1B69');
    qs('#s-thickness') && (qs('#s-thickness').value = s.thickness || 1);
    qs('#s-style')     && (qs('#s-style').value     = s.style     || 'solid');
    qs('#s-spacing')   && (qs('#s-spacing').value   = s.spacing   || 0);
    updateSepPreview();
  } catch(e) {}

  ['s-color','s-thickness','s-style','s-spacing'].forEach(function(id) {
    var el = qs('#'+id);
    if (el) el.addEventListener('input', updateSepPreview);
  });

  var btn = qs('#btn-save-sep');
  if (!btn) return;
  btn.addEventListener('click', async function() {
    var orig = btn.innerHTML;
    setBtn(btn, true);
    try {
      var s = {
        color:     qs('#s-color').value,
        thickness: Number(qs('#s-thickness').value),
        style:     qs('#s-style').value,
        spacing:   Number(qs('#s-spacing').value)
      };
      await db.collection('settings').doc('site').set({ separator: s }, { merge: true });
      toast('Separador salvo!', 'success');
    } catch(e) {
      toast('Erro: ' + (e.code || e.message), 'error');
    }
    setBtn(btn, false, orig);
  });
}

function updateSepPreview() {
  var el = qs('#sep-preview');
  if (!el) return;
  var color = qs('#s-color') ? qs('#s-color').value : '#2D1B69';
  var thick = qs('#s-thickness') ? qs('#s-thickness').value : 1;
  var style = qs('#s-style') ? qs('#s-style').value : 'solid';
  if (style === 'solid') {
    el.style.background = 'linear-gradient(90deg,transparent,'+color+',transparent)';
    el.style.height = thick+'px';
    el.style.border = 'none';
  } else {
    el.style.background = 'none';
    el.style.height = 'auto';
    el.style.border = thick+'px '+style+' '+color;
  }
}

// ── Products ──────────────────────────────────────────────────
var editingId = null;

async function initProductsSection() {
  await loadProducts();
  qs('#btn-new-prod') && qs('#btn-new-prod').addEventListener('click', function(){ openProdModal(null); });
  qs('#btn-close-modal') && qs('#btn-close-modal').addEventListener('click', closeProdModal);
  qs('#prod-modal') && qs('#prod-modal').addEventListener('click', function(e){ if(e.target===qs('#prod-modal')) closeProdModal(); });

  setupPreview('pf-photo1-file', 'pf-photo1-prev', 'pf-photo1-url');
  setupPreview('pf-photo2-file', 'pf-photo2-prev', 'pf-photo2-url');
  setupPreview('pf-photo3-file', 'pf-photo3-prev', 'pf-photo3-url');
  ['pf-photo1-url','pf-photo2-url','pf-photo3-url'].forEach(function(id) {
    var el = qs('#'+id);
    if (el) el.addEventListener('input', function(e){ showPreview(id.replace('-url','-prev'), e.target.value); });
  });

  qs('#btn-save-prod') && qs('#btn-save-prod').addEventListener('click', saveProd);
}

async function loadProducts() {
  var grid = qs('#prod-grid');
  if (!grid) return;
  grid.innerHTML = '<div style="text-align:center;padding:3rem;color:#6B5E8A;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i></div>';
  try {
    var snap = await PRODUCTS_COL.orderBy('order','asc').get();
    var el = qs('#prod-count');
    if (el) el.textContent = snap.size+'/60';
    grid.innerHTML = '';
    if (snap.empty) {
      grid.innerHTML = '<div style="text-align:center;padding:3rem;color:#6B5E8A;"><i class="fas fa-box-open" style="font-size:2rem;display:block;margin-bottom:.75rem;opacity:.3;"></i>Nenhum produto. Clique em Novo Produto.</div>';
      return;
    }
    snap.forEach(function(doc) {
      var p = Object.assign({ id: doc.id }, doc.data());
      grid.appendChild(buildProdCard(p));
    });
  } catch(e) {
    grid.innerHTML = '<div style="text-align:center;padding:2rem;color:#B91C1C;">Erro ao carregar: '+e.message+'</div>';
  }
}

function buildProdCard(p) {
  var card = document.createElement('div');
  card.className = 'prod-card' + (p.active ? '' : ' inactive');
  card.innerHTML =
    '<div class="pc-thumb">'+(p.photo1?'<img src="'+p.photo1+'" loading="lazy">':'<div class="pc-no-img"><i class="fas fa-image"></i></div>')+'<span class="pc-status '+(p.active?'on':'off')+'">'+(p.active?'Ativo':'Inativo')+'</span><span class="pc-ord">#'+(p.order||0)+'</span></div>'+
    '<div class="pc-info"><div class="pc-cat">'+(p.category||'')+'</div><div class="pc-name">'+(p.name||'')+'</div>'+(p.price?'<div class="pc-price">R$ '+p.price+'</div>':'')+'</div>'+
    '<div class="pc-actions">'+
      '<button class="pca-edit"><i class="fas fa-edit"></i> Editar</button>'+
      '<button class="pca-tog"><i class="fas fa-'+(p.active?'eye-slash':'eye')+'"></i> '+(p.active?'Desativar':'Ativar')+'</button>'+
      '<button class="pca-del"><i class="fas fa-trash"></i></button>'+
    '</div>';

  card.querySelector('.pca-edit').onclick = function(){ openProdModal(p); };
  card.querySelector('.pca-tog').onclick  = async function() {
    await PRODUCTS_COL.doc(p.id).update({ active: !p.active });
    toast((p.active?'Desativado':'Ativado')+': '+p.name, 'success');
    loadProducts();
  };
  card.querySelector('.pca-del').onclick  = async function() {
    if (!confirm('Excluir "'+p.name+'"?')) return;
    await PRODUCTS_COL.doc(p.id).delete();
    toast('Produto excluído.', 'success');
    loadProducts();
  };
  return card;
}

function openProdModal(p) {
  editingId = p ? p.id : null;
  qs('#modal-title').textContent = p ? 'Editar Produto' : 'Novo Produto';

  qs('#pf-name').value        = p ? p.name       || '' : '';
  qs('#pf-desc').value        = p ? p.desc        || '' : '';
  qs('#pf-category').value    = p ? p.category    || '' : '';
  qs('#pf-price').value       = p ? p.price       || '' : '';
  qs('#pf-order').value       = p ? p.order       || 0  : 0;
  qs('#pf-active').checked    = p ? !!p.active         : true;
  qs('#pf-photo1-url').value  = p ? p.photo1      || '' : '';
  qs('#pf-photo2-url').value  = p ? p.photo2      || '' : '';
  qs('#pf-photo3-url').value  = p ? p.photo3      || '' : '';
  qs('#pf-ml-link').value     = p ? p.ml_link     || '' : '';
  qs('#pf-ml-text').value     = p ? p.ml_text     || '' : '';
  qs('#pf-shopee-link').value = p ? p.shopee_link || '' : '';
  qs('#pf-shopee-text').value = p ? p.shopee_text || '' : '';

  ['pf-photo1-file','pf-photo2-file','pf-photo3-file'].forEach(function(id){
    var el = qs('#'+id); if(el) el.value='';
  });
  showPreview('pf-photo1-prev', p ? p.photo1 : '');
  showPreview('pf-photo2-prev', p ? p.photo2 : '');
  showPreview('pf-photo3-prev', p ? p.photo3 : '');

  qs('#prod-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProdModal() {
  qs('#prod-modal').classList.remove('open');
  document.body.style.overflow = '';
  editingId = null;
}

async function saveProd() {
  var btn = qs('#btn-save-prod');
  var orig = btn.innerHTML;
  var name = qs('#pf-name').value.trim();
  if (!name) { toast('Nome obrigatório.','error'); return; }

  if (!editingId) {
    var snap = await PRODUCTS_COL.get();
    if (snap.size >= 60) { toast('Limite de 60 produtos atingido.','error'); return; }
  }

  setBtn(btn, true);
  try {
    var photo1 = qs('#pf-photo1-url').value.trim();
    var photo2 = qs('#pf-photo2-url').value.trim();
    var photo3 = qs('#pf-photo3-url').value.trim();

    var data = {
      name:        name,
      desc:        qs('#pf-desc').value.trim(),
      category:    qs('#pf-category').value.trim(),
      price:       qs('#pf-price').value.trim(),
      order:       Number(qs('#pf-order').value) || 0,
      active:      qs('#pf-active').checked,
      photo1: photo1, photo2: photo2, photo3: photo3,
      ml_link:     qs('#pf-ml-link').value.trim(),
      ml_text:     qs('#pf-ml-text').value.trim(),
      shopee_link: qs('#pf-shopee-link').value.trim(),
      shopee_text: qs('#pf-shopee-text').value.trim(),
      updated_at:  firebase.firestore.FieldValue.serverTimestamp()
    };

    if (editingId) {
      await PRODUCTS_COL.doc(editingId).update(data);
      toast('Produto atualizado!', 'success');
    } else {
      data.created_at = firebase.firestore.FieldValue.serverTimestamp();
      await PRODUCTS_COL.add(data);
      toast('Produto criado!', 'success');
    }
    closeProdModal();
    loadProducts();
  } catch(e) {
    console.error(e);
    toast('Erro: '+(e.code||e.message),'error');
  }
  setBtn(btn, false, orig);
}

// ── Change Password ───────────────────────────────────────────
function initChangePassword() {
  var btn = qs('#btn-change-pw');
  if (!btn) return;
  btn.addEventListener('click', async function() {
    var cur = qs('#pw-cur').value;
    var nw  = qs('#pw-new').value;
    var cf  = qs('#pw-cf').value;
    if (!cur||!nw||!cf) { toast('Preencha todos os campos.','error'); return; }
    if (nw !== cf)       { toast('As senhas não conferem.','error'); return; }
    if (nw.length < 6)   { toast('Mínimo 6 caracteres.','error'); return; }
    var orig = btn.innerHTML;
    setBtn(btn, true);
    try {
      var user = auth.currentUser;
      var cred = firebase.auth.EmailAuthProvider.credential(user.email, cur);
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(nw);
      toast('Senha alterada!', 'success');
      qs('#pw-cur').value = qs('#pw-new').value = qs('#pw-cf').value = '';
    } catch(e) {
      var msgs = { 'auth/wrong-password':'Senha atual incorreta.', 'auth/weak-password':'Senha fraca.' };
      toast(msgs[e.code]||'Erro: '+e.message,'error');
    }
    setBtn(btn, false, orig);
  });
}

// ── Utils ─────────────────────────────────────────────────────
function showPreview(id, url) {
  var el = qs('#'+id);
  if (!el) return;
  if (url) { el.src = url; el.style.display = 'block'; }
  else      { el.src = ''; el.style.display = 'none'; }
}

function setupPreview(fileId, prevId, urlId) {
  var fileEl = qs('#'+fileId);
  if (!fileEl) return;
  fileEl.addEventListener('change', function() {
    var file = fileEl.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e){ showPreview(prevId, e.target.result); };
    reader.readAsDataURL(file);
    if (urlId) { var u = qs('#'+urlId); if(u) u.value=''; }
  });
}
