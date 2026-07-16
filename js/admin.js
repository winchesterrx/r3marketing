// R3 Marketing Digital — Admin Panel JS

const API_CAMP = 'php/campaigns.php';
const API_CAND = 'php/apply.php';
const API_ADMIN = 'php/admin.php';

let allCampaigns = [];
let allCandidates = [];

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  checkAuth();
});

// ===== AUTH =====
async function checkAuth() {
  try {
    const res = await fetch(`${API_ADMIN}?action=check`);
    const data = await res.json();
    if (data.success) {
      showPanel(data.admin);
    } else {
      showLogin();
    }
  } catch (e) {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('admin-login').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
  lucide.createIcons();
}

function showPanel(admin) {
  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'flex';
  if (admin) document.getElementById('admin-name-display').textContent = admin.nome;
  lucide.createIcons();
  loadDashboard();
}

async function adminLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  const email = document.getElementById('login-email').value;
  const senha = document.getElementById('login-senha').value;

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block"></div> Entrando...';
  errEl.style.display = 'none';

  try {
    const res = await fetch(`${API_ADMIN}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    const data = await res.json();

    if (data.success) {
      showPanel(data.admin);
    } else {
      errEl.textContent = data.message;
      errEl.style.display = 'block';
    }
  } catch (e) {
    // Demo mode sem backend
    if (email === 'admin@r3marketing.com.br' && senha === 'r3marketing') {
      showPanel({ nome: 'Administrador R3' });
    } else {
      errEl.textContent = 'E-mail ou senha incorretos.';
      errEl.style.display = 'block';
    }
  }

  btn.disabled = false;
  btn.innerHTML = '<i data-lucide="log-in"></i> Entrar no Painel';
  lucide.createIcons();
}

async function adminLogout() {
  try { await fetch(`${API_ADMIN}?action=logout`); } catch(e) {}
  showLogin();
}

function togglePass() {
  const input = document.getElementById('login-senha');
  const icon = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    icon.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
}

// ===== NAVIGATION =====
function showSection(section, linkEl) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  document.getElementById(`section-${section}`).classList.add('active');
  linkEl.classList.add('active');

  const titles = { dashboard: 'Dashboard', campanhas: 'Campanhas', candidatos: 'Candidatos', conexoes: 'Conexões Rweb' };
  document.getElementById('section-title').textContent = titles[section] || section;

  const newBtn = document.getElementById('topbar-new-btn');
  newBtn.style.display = section === 'campanhas' ? 'flex' : 'none';

  if (section === 'dashboard')  loadDashboard();
  if (section === 'campanhas')  loadCampaignsAdmin();
  if (section === 'candidatos') loadCandidatesAdmin();
  if (section === 'conexoes')   loadConnectionsAdmin();

  lucide.createIcons();
  return false;
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const res = await fetch(`${API_ADMIN}?action=dashboard`);
    const data = await res.json();
    if (data.success) {
      const d = data.data;
      document.getElementById('m-campanhas').textContent = d.campanhas_ativas;
      document.getElementById('m-candidatos').textContent = d.total_candidatos;
      document.getElementById('m-aprovados').textContent = d.aprovados;
      document.getElementById('m-pendentes').textContent = d.pendentes;
      document.getElementById('pending-count').textContent = d.pendentes;

      renderTopCampanhas(d.top_campanhas);
      return;
    }
  } catch(e) {}

  // Demo data
  document.getElementById('m-campanhas').textContent = '5';
  document.getElementById('m-candidatos').textContent = '80';
  document.getElementById('m-aprovados').textContent = '12';
  document.getElementById('m-pendentes').textContent = '68';
  document.getElementById('pending-count').textContent = '68';
  renderTopCampanhas([
    { nome:'Amazon Prime', marca:'Amazon', total:34 },
    { nome:'Growth Supplements', marca:'Growth', total:21 },
    { nome:'Avon Beleza', marca:'Avon', total:12 },
    { nome:'Natura Ekos', marca:'Natura', total:8 },
    { nome:'Vivara Joias', marca:'Vivara', total:5 },
  ]);
}

function renderTopCampanhas(list) {
  const el = document.getElementById('top-campanhas-list');
  if (!list || !list.length) { el.innerHTML = '<p style="color:var(--text-dim);font-size:.85rem">Nenhuma campanha.</p>'; return; }
  el.innerHTML = list.map(c => `
    <div class="top-item">
      <div>
        <div class="top-item-name">${esc(c.nome)}</div>
        <div class="top-item-brand">${esc(c.marca)}</div>
      </div>
      <div class="top-item-count">${c.total}</div>
    </div>
  `).join('');
}

// ===== CAMPANHAS ADMIN =====
async function loadCampaignsAdmin() {
  try {
    const res = await fetch(`${API_CAMP}?action=list&status=`);
    const data = await res.json();
    if (data.success) { allCampaigns = data.data; renderCampaignsAdmin(); return; }
  } catch(e) {}
  allCampaigns = getFallbackCampaigns();
  renderCampaignsAdmin();
  populateCampaignFilter();
}

function renderCampaignsAdmin() {
  const query = (document.getElementById('camp-search')?.value || '').toLowerCase();
  const filtered = allCampaigns.filter(c =>
    !query || c.nome.toLowerCase().includes(query) || c.marca.toLowerCase().includes(query)
  );
  const tbody = document.getElementById('camp-tbody');
  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td class="td-name">${esc(c.nome)}</td>
      <td class="td-muted">${esc(c.marca)}</td>
      <td class="td-value">${parseFloat(c.valor_base).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
      <td>${c.total_candidatos || 0}</td>
      <td><span class="badge badge-${c.status}">${statusLabel(c.status)}</span></td>
      <td>
        <div class="action-btns">
          <button class="action-btn" onclick="editCampaign(${c.id})" title="Editar"><i data-lucide="edit-2"></i></button>
          <button class="action-btn danger" onclick="deleteCampaign(${c.id})" title="Excluir"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:32px">Nenhuma campanha encontrada.</td></tr>';
  lucide.createIcons();
}

function filterCampaignsAdmin() { renderCampaignsAdmin(); }

// ===== CURRENCY MASK =====
function maskCurrency(input) {
  // Remove tudo que nao for digito
  let raw = input.value.replace(/\D/g, '');
  if (!raw) { input.value = ''; return; }

  // Converte para centavos e formata
  const num = parseInt(raw, 10);
  const reais = (num / 100).toFixed(2);
  // Formata no padrao brasileiro: pontos para milhares, virgula para decimal
  input.value = parseFloat(reais)
    .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseBRCurrency(str) {
  // Converte "3.790,00" ou "3790" para float 3790.00
  if (!str) return 0;
  // Remove pontos de milhar, substitui virgula por ponto
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatBRCurrency(num) {
  return parseFloat(num || 0)
    .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===== CAMPAIGN MODAL =====
function openCampaignModal(id) {
  document.getElementById('camp-id').value = id || '';
  document.getElementById('camp-modal-title').textContent = id ? 'Editar Campanha' : 'Nova Campanha';

  if (id) {
    const c = allCampaigns.find(c => c.id == id);
    if (c) {
      document.getElementById('camp-nome').value = c.nome;
      document.getElementById('camp-marca').value = c.marca;
      document.getElementById('camp-valor').value = formatBRCurrency(c.valor_base);
      document.getElementById('camp-categoria').value = c.categoria;
      document.getElementById('camp-inicio').value = c.data_inicio || '';
      document.getElementById('camp-fim').value = c.data_fim || '';
      document.getElementById('camp-vagas').value = c.vagas || 0;
      document.getElementById('camp-status').value = c.status;
      document.getElementById('camp-desc').value = c.descricao || '';
      document.getElementById('camp-req').value = c.requisitos || '';
    }
  } else {
    document.getElementById('camp-form').reset();
  }

  document.getElementById('modal-campanha').style.display = 'flex';
  lucide.createIcons();
}

function closeCampModal(event) {
  if (event && event.target !== document.getElementById('modal-campanha')) return;
  document.getElementById('modal-campanha').style.display = 'none';
}

async function saveCampaign(e) {
  e.preventDefault();
  const id = document.getElementById('camp-id').value;
  const payload = {
    nome: document.getElementById('camp-nome').value,
    marca: document.getElementById('camp-marca').value,
    valor_base: parseBRCurrency(document.getElementById('camp-valor').value),
    categoria: document.getElementById('camp-categoria').value,
    data_inicio: document.getElementById('camp-inicio').value,
    data_fim: document.getElementById('camp-fim').value,
    vagas: document.getElementById('camp-vagas').value,
    status: document.getElementById('camp-status').value,
    descricao: document.getElementById('camp-desc').value,
    requisitos: document.getElementById('camp-req').value,
  };

  const action = id ? `update&id=${id}` : 'create';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(`${API_CAMP}?action=${action}`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) {
      closeCampModal();
      await loadCampaignsAdmin();
    }
  } catch(e) {
    // Demo: update local array
    if (id) {
      const idx = allCampaigns.findIndex(c => c.id == id);
      if (idx >= 0) Object.assign(allCampaigns[idx], payload);
    } else {
      allCampaigns.unshift({ id: Date.now(), ...payload, total_candidatos: 0 });
    }
    showToast('Campanha salva (modo demo)!', 'success');
    closeCampModal();
    renderCampaignsAdmin();
  }
}

function editCampaign(id) { openCampaignModal(id); }

async function deleteCampaign(id) {
  if (!confirm('Excluir esta campanha? Todos os candidatos serão removidos.')) return;
  try {
    const res = await fetch(`${API_CAMP}?action=delete&id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) await loadCampaignsAdmin();
  } catch(e) {
    allCampaigns = allCampaigns.filter(c => c.id != id);
    showToast('Campanha removida (modo demo).', 'success');
    renderCampaignsAdmin();
  }
}

// ===== CANDIDATOS ADMIN =====
async function loadCandidatesAdmin() {
  populateCampaignFilter();
  try {
    const res = await fetch(`${API_CAND}?action=list`);
    const data = await res.json();
    if (data.success) { allCandidates = data.data; renderCandidatesAdmin(); return; }
  } catch(e) {}
  allCandidates = [];
  renderCandidatesAdmin();
}

function populateCampaignFilter() {
  const sel = document.getElementById('cand-campanha-filter');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Todas as campanhas</option>' +
    allCampaigns.map(c => `<option value="${c.id}" ${current==c.id?'selected':''}>${esc(c.nome)}</option>`).join('');
}

function renderCandidatesAdmin() {
  const query = (document.getElementById('cand-search')?.value || '').toLowerCase();
  const campanha = document.getElementById('cand-campanha-filter')?.value || '';
  const status = document.getElementById('cand-status-filter')?.value || '';

  const filtered = allCandidates.filter(c => {
    const mQ = !query || c.nome_completo?.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query);
    const mC = !campanha || c.campanha_id == campanha;
    const mS = !status || c.status === status;
    return mQ && mC && mS;
  });

  const tbody = document.getElementById('cand-tbody');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:32px">Nenhum candidato encontrado.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const total = (parseInt(c.seguidores_instagram||0) + parseInt(c.seguidores_tiktok||0) + parseInt(c.seguidores_youtube||0) + parseInt(c.seguidores_outros||0)).toLocaleString('pt-BR');
    const date = c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '—';
    return `
      <tr>
        <td class="td-name">${esc(c.nome_completo)}</td>
        <td class="td-muted" style="font-size:.8rem">${esc(c.email)}</td>
        <td style="font-size:.82rem">${esc(c.campanha_nome || c.campanha || '—')}</td>
        <td>${total}</td>
        <td><span class="badge badge-${c.status}">${statusCandLabel(c.status)}</span></td>
        <td class="td-muted">${date}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn" onclick="viewCandidate(${c.id})" title="Ver detalhes"><i data-lucide="eye"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  lucide.createIcons();
}

function filterCandidatesAdmin() { renderCandidatesAdmin(); }

// ===== CONEXOES RWEB =====
let allConnections = [];

async function loadConnectionsAdmin() {
  try {
    const res = await fetch('php/connections.php?action=list');
    const data = await res.json();
    if (data.success) {
      allConnections = data.data;
      renderConnectionsAdmin();
      // Atualizar badge
      const badge = document.getElementById('conexoes-count');
      if (allConnections.length > 0) {
        badge.textContent = allConnections.length;
        badge.style.display = 'inline-flex';
      }
      return;
    }
  } catch(e) {}
  allConnections = [];
  renderConnectionsAdmin();
}

function renderConnectionsAdmin() {
  const query = (document.getElementById('con-search')?.value || '').toLowerCase();

  const filtered = allConnections.filter(c => {
    return !query ||
      (c.nome_influencer || '').toLowerCase().includes(query) ||
      (c.email_candidatura || '').toLowerCase().includes(query) ||
      (c.rweb_usuario || '').toLowerCase().includes(query);
  });

  const tbody = document.getElementById('con-tbody');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:48px">
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
        <i data-lucide="link-2" style="width:40px;height:40px;color:var(--text-dim)"></i>
        <span>Nenhuma conexão Rweb registrada ainda.</span>
      </div>
    </td></tr>`;
    lucide.createIcons();
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const date = c.criado_em ? new Date(c.criado_em).toLocaleString('pt-BR') : '—';
    return `
      <tr>
        <td class="td-muted">${c.id}</td>
        <td class="td-name">${esc(c.nome_influencer || '—')}</td>
        <td class="td-muted" style="font-size:.82rem">${esc(c.email_candidatura || '—')}</td>
        <td>
          <span class="rweb-user-chip">
            <i data-lucide="user" style="width:13px;height:13px"></i>
            ${esc(c.rweb_usuario)}
          </span>
        </td>
        <td>
          <div class="senha-reveal">
            <span class="senha-dots" id="senha-dots-${c.id}">••••••••</span>
            <span class="senha-text" id="senha-text-${c.id}" style="display:none">${esc(c.rweb_senha)}</span>
            <button class="action-btn" onclick="toggleSenha(${c.id})" title="Mostrar/ocultar senha">
              <i data-lucide="eye" id="eye-senha-${c.id}"></i>
            </button>
          </div>
        </td>
        <td class="td-muted" style="font-size:.78rem">${date}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn danger" onclick="deleteConnection(${c.id})" title="Remover">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  lucide.createIcons();
}

function filterConnectionsAdmin() { renderConnectionsAdmin(); }

function toggleSenha(id) {
  const dots = document.getElementById(`senha-dots-${id}`);
  const text  = document.getElementById(`senha-text-${id}`);
  const icon  = document.getElementById(`eye-senha-${id}`);
  const showing = text.style.display !== 'none';
  dots.style.display = showing ? 'inline' : 'none';
  text.style.display = showing ? 'none'  : 'inline';
  icon.setAttribute('data-lucide', showing ? 'eye' : 'eye-off');
  lucide.createIcons();
}

async function deleteConnection(id) {
  if (!confirm('Remover esta conexão Rweb?')) return;
  try {
    const res = await fetch(`php/connections.php?action=delete&id=${id}`);
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
  } catch(e) {
    allConnections = allConnections.filter(c => c.id != id);
    showToast('Conexão removida.', 'success');
  }
  await loadConnectionsAdmin();
}

function exportConnectionsCSV() {
  if (!allConnections.length) { showToast('Nenhuma conexão para exportar.', 'info'); return; }
  const header = ['ID','Nome','Email','Usuario Rweb','Senha Rweb','Data'];
  const rows = allConnections.map(c => [
    c.id, c.nome_influencer || '', c.email_candidatura || '',
    c.rweb_usuario || '', c.rweb_senha || '',
    c.criado_em || ''
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `conexoes_rweb_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

async function viewCandidate(id) {
  try {
    const res = await fetch(`${API_CAND}?action=get&id=${id}`);
    const data = await res.json();
    if (data.success) { renderCandidateDetail(data.data); return; }
  } catch(e) {}

  const c = allCandidates.find(c => c.id == id);
  if (c) renderCandidateDetail(c);
}

function renderCandidateDetail(c) {
  const total = (parseInt(c.seguidores_instagram||0) + parseInt(c.seguidores_tiktok||0) + parseInt(c.seguidores_youtube||0) + parseInt(c.seguidores_outros||0)).toLocaleString('pt-BR');

  const socialLinks = [
    ['Instagram', c.link_instagram, c.seguidores_instagram],
    ['TikTok', c.link_tiktok, c.seguidores_tiktok],
    ['YouTube', c.link_youtube, c.seguidores_youtube],
    ['Twitter/X', c.link_twitter, 0],
    ['Facebook', c.link_facebook, 0],
    ['Pinterest', c.link_pinterest, 0],
    ['Kwai', c.link_kwai, 0],
  ].filter(([, link]) => link).map(([name, link, seg]) =>
    `<a href="${esc(link)}" target="_blank" class="cand-field-val">@${name}${seg ? ` (${parseInt(seg).toLocaleString('pt-BR')} seg.)` : ''}</a>`
  ).join('<br/>');

  const content = `
    <div class="cand-section">
      <div class="cand-section-title">Dados Pessoais</div>
      <div class="cand-detail-grid">
        <div class="cand-field"><div class="cand-field-label">Nome</div><div class="cand-field-val">${esc(c.nome_completo)}</div></div>
        <div class="cand-field"><div class="cand-field-label">E-mail</div><div class="cand-field-val">${esc(c.email)}</div></div>
        <div class="cand-field"><div class="cand-field-label">Telefone</div><div class="cand-field-val">${esc(c.telefone||'—')}</div></div>
        <div class="cand-field"><div class="cand-field-label">Idade</div><div class="cand-field-val">${c.idade||'—'} anos</div></div>
        <div class="cand-field"><div class="cand-field-label">Cidade/UF</div><div class="cand-field-val">${esc(c.cidade||'—')} / ${esc(c.estado||'—')}</div></div>
        <div class="cand-field"><div class="cand-field-label">Nicho</div><div class="cand-field-val">${esc(c.nicho||'—')}</div></div>
      </div>
    </div>
    <div class="cand-section">
      <div class="cand-section-title">Redes Sociais (Total: ${total} seguidores)</div>
      <div style="font-size:.85rem;line-height:2">${socialLinks || 'Nenhum link informado.'}</div>
    </div>
    <div class="cand-section">
      <div class="cand-section-title">Disponibilidade</div>
      <div class="cand-detail-grid">
        <div class="cand-field"><div class="cand-field-label">Dias</div><div class="cand-field-val">${esc(c.dias_disponiveis||'—')}</div></div>
        <div class="cand-field"><div class="cand-field-label">Horário</div><div class="cand-field-val">${esc(c.horarios_postagem||'—')}</div></div>
        <div class="cand-field"><div class="cand-field-label">Frequência</div><div class="cand-field-val">${esc(c.frequencia_postagem||'—')}</div></div>
      </div>
    </div>
    <div class="cand-section">
      <div class="cand-section-title">Diferencial</div>
      <p style="font-size:.85rem;color:var(--text-muted);line-height:1.7">${esc(c.diferencial||'—')}</p>
    </div>
    <div class="cand-section">
      <div class="cand-section-title">Status da Candidatura</div>
      <p>Status atual: <span class="badge badge-${c.status}">${statusCandLabel(c.status)}</span></p>
      <div class="cand-status-actions">
        <button class="status-btn aprovar" onclick="updateCandStatus(${c.id},'aprovado')">✓ Aprovar</button>
        <button class="status-btn analisar" onclick="updateCandStatus(${c.id},'em_analise')">🔍 Em Análise</button>
        <button class="status-btn reprovar" onclick="updateCandStatus(${c.id},'reprovado')">✗ Reprovar</button>
        <button class="status-btn" style="background:var(--error);color:#fff;border:none;" onclick="document.getElementById('rweb-invalid-box-${c.id}').style.display='block'">⚠️ Rweb Inválida</button>
      </div>
      <div id="rweb-invalid-box-${c.id}" style="display:none; margin-top:14px;">
        <textarea id="rweb-msg-${c.id}" rows="3" style="width:100%;background:rgba(255,255,255,0.05);color:white;border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;margin-bottom:10px;font-family:inherit;font-size:0.85rem;" placeholder="Deixe em branco para usar a mensagem padrão com a logo, ou digite uma personalizada..."></textarea>
        <button class="btn-primary" style="width:100%;justify-content:center;background:var(--error);border:none" onclick="updateCandStatus(${c.id},'rweb_invalida', document.getElementById('rweb-msg-${c.id}').value)">Confirmar e Enviar Feedback</button>
      </div>
    </div>
    ${c.fotos?.length ? `
    <div class="cand-section">
      <div class="cand-section-title">Fotos</div>
      <div class="cand-fotos">
        ${(Array.isArray(c.fotos) ? c.fotos : []).map(f => `
          <div class="cand-foto">
            <img src="uploads/${f.arquivo}" alt="${f.tipo}" />
          </div>
        `).join('')}
      </div>
    </div>` : ''}
  `;

  document.getElementById('cand-detail-content').innerHTML = content;
  document.getElementById('modal-candidato').style.display = 'flex';
  lucide.createIcons();
}

function closeCandModal(event) {
  if (event && event.target !== document.getElementById('modal-candidato')) return;
  document.getElementById('modal-candidato').style.display = 'none';
}

async function updateCandStatus(id, status, nota = '') {
  try {
    const res = await fetch(`${API_CAND}?action=update_status&id=${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, nota_admin: nota })
    });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
  } catch(e) {
    const c = allCandidates.find(c => c.id == id);
    if (c) c.status = status;
    showToast('Status atualizado!', 'success');
  }

  closeCandModal();
  await loadCandidatesAdmin();
}

function exportCSV() {
  const campanha = document.getElementById('cand-campanha-filter')?.value || '';
  window.location.href = `${API_CAND}?action=export${campanha ? `&campanha_id=${campanha}` : ''}`;
}

// ===== UTILS =====
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function statusLabel(s) {
  return { ativa:'Ativa', pausada:'Pausada', encerrada:'Encerrada' }[s] || s;
}

function statusCandLabel(s) {
  return { pendente:'Pendente', em_analise:'Em Análise', aprovado:'Aprovado', reprovado:'Reprovado', rweb_invalida:'Rweb Inválida' }[s] || s;
}

function showToast(msg, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:28px; right:28px; z-index:9999;
    background:${type === 'error' ? 'rgba(239,68,68,0.95)' : type === 'success' ? 'rgba(5,150,105,0.95)' : 'rgba(59,130,246,0.95)'};
    color:#fff; padding:12px 24px; border-radius:50px; font-size:.88rem;
    font-weight:600; box-shadow:0 8px 24px rgba(0,0,0,0.4);
    animation:fadeIn 0.2s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function getFallbackCampaigns() {
  return [
    { id:1, nome:'Beleza & Estilo Avon 2025', marca:'Avon', valor_base:450, categoria:'beleza', data_inicio:'2025-08-01', data_fim:'2025-10-31', vagas:50, status:'ativa', total_candidatos:12 },
    { id:2, nome:'Natura Ekos — Sustentabilidade', marca:'Natura', valor_base:380, categoria:'saude', data_inicio:'2025-08-01', data_fim:'2025-11-30', vagas:40, status:'ativa', total_candidatos:8 },
    { id:3, nome:'Amazon Prime — Creators Program', marca:'Amazon', valor_base:600, categoria:'ecommerce', data_inicio:'2025-07-01', data_fim:'2025-12-31', vagas:100, status:'ativa', total_candidatos:34 },
    { id:4, nome:'Vivara Joias — Coleção Outono', marca:'Vivara', valor_base:750, categoria:'moda', data_inicio:'2025-08-15', data_fim:'2025-10-15', vagas:20, status:'ativa', total_candidatos:5 },
    { id:5, nome:'Growth Supplements — #TransformaCom', marca:'Growth Supplements', valor_base:500, categoria:'fitness', data_inicio:'2025-07-15', data_fim:'2025-12-31', vagas:60, status:'ativa', total_candidatos:21 },
  ];
}
