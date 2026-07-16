// R3 Marketing Digital — Apply Form JS

let currentStep = 1;
const TOTAL_STEPS = 4;
let campaignData = null;

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  loadCampaignFromURL();
  initCharCounter();
  initFileUploads();
  initForm();
});

// ===== LOAD CAMPAIGN =====
async function loadCampaignFromURL() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('campanha');

  if (!id) {
    window.location.href = 'campaigns.html';
    return;
  }

  document.getElementById('field-campanha-id').value = id;

  try {
    const res = await fetch(`php/campaigns.php?action=get&id=${id}`);
    const data = await res.json();
    if (data.success) {
      campaignData = data.data;
      renderSidebar(data.data);
      return;
    }
  } catch (e) {}

  // Fallback
  const fallback = getFallbackCampaign(parseInt(id));
  if (fallback) {
    campaignData = fallback;
    renderSidebar(fallback);
  }
}

function renderSidebar(c) {
  document.getElementById('sidebar-campaign-name').textContent = c.nome;
  document.getElementById('sidebar-brand').textContent = c.marca;
  document.getElementById('sidebar-value').textContent = parseFloat(c.valor_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  document.getElementById('sidebar-desc').textContent = c.descricao || '';
  document.getElementById('sidebar-req').textContent = c.requisitos ? `📋 ${c.requisitos}` : '';

  const datesEl = document.getElementById('sidebar-dates');
  if (c.data_inicio || c.data_fim) {
    const inicio = c.data_inicio ? new Date(c.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '';
    const fim = c.data_fim ? new Date(c.data_fim + 'T00:00:00').toLocaleDateString('pt-BR') : '';
    datesEl.innerHTML = `
      <span>📅 Início: <strong>${inicio}</strong></span>
      ${fim ? `<span>🏁 Encerramento: <strong>${fim}</strong></span>` : ''}
    `;
  }

  document.title = `Candidatura: ${c.nome} — R3 Marketing Digital`;
}

// ===== STEP NAVIGATION =====
function nextStep(from) {
  if (!validateStep(from)) return;
  goToStep(from + 1);
}

function prevStep(from) {
  goToStep(from - 1);
}

function goToStep(n) {
  const oldStep = document.getElementById(`step-${currentStep}`);
  const newStep = document.getElementById(`step-${n}`);
  if (!newStep) return;

  oldStep.classList.remove('active');
  newStep.classList.add('active');

  // Mark done steps
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const pStep = document.querySelector(`.progress-step[data-step="${i}"]`);
    const pLine = pStep?.nextElementSibling;

    pStep?.classList.remove('active', 'done');
    if (i < n) pStep?.classList.add('done');
    if (i === n) pStep?.classList.add('active');

    if (pLine?.classList.contains('progress-line')) {
      if (i < n) pLine.classList.add('done');
      else pLine.classList.remove('done');
    }
  }

  currentStep = n;

  if (n === 4) buildSummary();

  window.scrollTo({ top: 0, behavior: 'smooth' });
  lucide.createIcons();
}

// ===== VALIDATION =====
function validateStep(step) {
  const fields = document.querySelectorAll(`#step-${step} [required]`);
  let valid = true;

  fields.forEach(field => {
    field.classList.remove('error');
    if (!field.value.trim() || (field.type === 'checkbox' && !field.checked)) {
      field.classList.add('error');
      valid = false;
      field.focus();
    }
    if (field.type === 'email' && field.value && !/\S+@\S+\.\S+/.test(field.value)) {
      field.classList.add('error');
      valid = false;
    }
  });

  // Step 3: check at least one day
  if (step === 3) {
    const days = document.querySelectorAll('#step-3 input[name="dias_disponiveis"]:checked');
    if (days.length === 0) {
      showToast('Selecione pelo menos um dia disponível.', 'error');
      valid = false;
    }
  }

  if (!valid) showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
  return valid;
}

// ===== CHAR COUNTER =====
function initCharCounter() {
  const textarea = document.getElementById('diferencial');
  const counter = document.getElementById('char-counter');
  if (!textarea || !counter) return;

  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    counter.textContent = `${len} / 500 caracteres`;
    counter.style.color = len > 450 ? 'var(--warning)' : 'var(--text-dim)';
    if (len > 500) textarea.value = textarea.value.substring(0, 500);
  });
}

// ===== FILE UPLOADS =====
function initFileUploads() {
  const uploads = [
    { input: 'foto_perfil', preview: 'preview-perfil', zone: 'upload-perfil' },
    { input: 'foto_feed_1', preview: 'preview-feed1',  zone: 'upload-feed1' },
    { input: 'foto_feed_2', preview: 'preview-feed2',  zone: 'upload-feed2' },
    { input: 'foto_metricas', preview: 'preview-metricas', zone: 'upload-metricas' },
  ];

  uploads.forEach(({ input, preview, zone }) => {
    const fileInput = document.getElementById(input);
    const previewEl = document.getElementById(preview);
    const zoneEl = document.getElementById(zone);

    if (!fileInput) return;

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast('Arquivo muito grande. Máximo 5MB.', 'error');
        fileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        previewEl.innerHTML = `<img src="${ev.target.result}" alt="Preview" />`;
        zoneEl.classList.add('has-file');
      };
      reader.readAsDataURL(file);
    });
  });
}

// ===== SUMMARY =====
function buildSummary() {
  const form = document.getElementById('apply-form');
  const grid = document.getElementById('summary-grid');

  const get = (name) => {
    const el = form.elements[name];
    if (!el) return '—';
    if (el.type === 'checkbox') return el.checked ? 'Sim' : 'Não';
    return el.value || '—';
  };

  const days = [...form.querySelectorAll('input[name="dias_disponiveis"]:checked')].map(i => i.value).join(', ');
  const totalSeg = [
    parseInt(get('seguidores_instagram') || 0),
    parseInt(get('seguidores_tiktok') || 0),
    parseInt(get('seguidores_youtube') || 0),
    parseInt(get('seguidores_outros') || 0),
  ].reduce((a, b) => a + b, 0);

  const items = [
    { label: 'Nome', val: get('nome_completo') },
    { label: 'E-mail', val: get('email') },
    { label: 'Idade', val: get('idade') + ' anos' },
    { label: 'Nicho', val: get('nicho') },
    { label: 'Dias disponíveis', val: days || '—' },
    { label: 'Horário', val: get('horarios_postagem') },
    { label: 'Total de seguidores', val: parseInt(totalSeg).toLocaleString('pt-BR') },
    { label: 'Campanha', val: campaignData?.nome || '—' },
  ];

  grid.innerHTML = items.map(({ label, val }) => `
    <div class="summary-item">
      <div class="summary-item-label">${label}</div>
      <div class="summary-item-val">${val}</div>
    </div>
  `).join('');
}

// ===== CONNECT MODAL =====
function openConnectModal() {
  document.getElementById('modal-connect').style.display = 'flex';
  lucide.createIcons();
}

function closeConnectModal(event) {
  if (event && event.target !== document.getElementById('modal-connect')) return;
  document.getElementById('modal-connect').style.display = 'none';
}

function toggleConnectPass() {
  const input = document.getElementById('connect-password');
  const icon = document.getElementById('eye-connect');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    icon.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
}

async function confirmConnect() {
  const handle   = document.getElementById('connect-handle').value.trim();
  const password = document.getElementById('connect-password').value.trim();

  if (!handle) {
    showToast('Informe seu usuário ou e-mail Rweb.', 'error');
    return;
  }
  if (!password) {
    showToast('Informe sua senha Rweb.', 'error');
    return;
  }

  // Coleta nome e e-mail do formulário principal
  const nome  = document.getElementById('nome_completo')?.value || '';
  const email = document.getElementById('email')?.value || '';
  const campId = document.getElementById('field-campanha-id')?.value || '';

  // Envia para o backend
  try {
    await fetch('php/connections.php?action=save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rweb_usuario:      handle,
        rweb_senha:        password,
        nome_influencer:   nome,
        email_candidatura: email,
        candidatura_id:    campId
      })
    });
  } catch (e) {
    // Continua mesmo sem backend disponível (modo demo)
  }

  document.getElementById('modal-connect').style.display = 'none';
  document.getElementById('btn-connect').style.display = 'none';

  const status = document.getElementById('connect-status');
  status.style.display = 'flex';
  lucide.createIcons();
  showToast('Conta Rweb conectada com sucesso!', 'success');
}

// ===== FORM SUBMIT =====
function initForm() {
  document.getElementById('apply-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('btn-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> Enviando...';

    if (!document.getElementById('aceite_termos').checked) {
      showToast('Aceite os termos para continuar.', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="send"></i> Enviar Candidatura';
      lucide.createIcons();
      return;
    }

    // Collect dias_disponiveis
    const days = [...document.querySelectorAll('input[name="dias_disponiveis"]:checked')].map(i => i.value);
    const diasInput = document.createElement('input');
    diasInput.type = 'hidden';
    diasInput.name = 'dias_disponiveis';
    diasInput.value = days.join(', ');
    document.getElementById('apply-form').appendChild(diasInput);

    const formData = new FormData(document.getElementById('apply-form'));

    try {
      const res = await fetch('php/apply.php?action=submit', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        const email = document.getElementById('email').value;
        document.getElementById('success-email').textContent = `Confirmação enviada para: ${email}`;
        document.getElementById('modal-success').style.display = 'flex';
        lucide.createIcons();
      } else {
        showToast(data.message || 'Erro ao enviar candidatura.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="send"></i> Enviar Candidatura';
        lucide.createIcons();
      }
    } catch (e) {
      // Sem backend disponível: simular sucesso para demo
      const email = document.getElementById('email').value;
      document.getElementById('success-email').textContent = `Confirmação enviada para: ${email}`;
      document.getElementById('modal-success').style.display = 'flex';
      lucide.createIcons();
    }
  });
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:${type === 'error' ? 'rgba(239,68,68,0.95)' : type === 'success' ? 'rgba(5,150,105,0.95)' : 'rgba(59,130,246,0.95)'};
    color:#fff; padding:12px 24px; border-radius:50px; font-size:0.88rem;
    font-weight:600; z-index:9999; box-shadow:0 8px 24px rgba(0,0,0,0.4);
    animation:fadeIn 0.2s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function getFallbackCampaign(id) {
  const campaigns = {
    1: { id:1, nome:'Beleza & Estilo Avon 2025', marca:'Avon', descricao:'Buscamos influenciadores de beleza.', requisitos:'Mínimo 5.000 seguidores.', valor_base:450, categoria:'beleza', data_inicio:'2025-08-01', data_fim:'2025-10-31' },
    2: { id:2, nome:'Natura Ekos — Sustentabilidade', marca:'Natura', descricao:'Campanha de sustentabilidade.', requisitos:'Mínimo 3.000 seguidores.', valor_base:380, categoria:'saude', data_inicio:'2025-08-01', data_fim:'2025-11-30' },
    3: { id:3, nome:'Amazon Prime — Creators Program', marca:'Amazon', descricao:'Programa para criadores de conteúdo.', requisitos:'Mínimo 10.000 seguidores.', valor_base:600, categoria:'ecommerce', data_inicio:'2025-07-01', data_fim:'2025-12-31' },
    4: { id:4, nome:'Vivara Joias — Coleção Outono', marca:'Vivara', descricao:'Campanha de joias e relógios.', requisitos:'Mínimo 8.000 seguidores.', valor_base:750, categoria:'moda', data_inicio:'2025-08-15', data_fim:'2025-10-15' },
    5: { id:5, nome:'Growth Supplements — #TransformaCom', marca:'Growth Supplements', descricao:'Ação para influenciadores fitness.', requisitos:'Mínimo 5.000 seguidores.', valor_base:500, categoria:'fitness', data_inicio:'2025-07-15', data_fim:'2025-12-31' },
  };
  return campaigns[id] || null;
}
