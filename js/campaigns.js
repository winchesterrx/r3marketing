// R3 Marketing Digital — Campaigns Page JS

const API = 'php/campaigns.php';
const CATEGORY_COLORS = {
  beleza:      { bg: '#d4145a22', border: '#d4145a44', text: '#d4145a' },
  ecommerce:   { bg: '#ff990022', border: '#ff990044', text: '#ff9900' },
  saude:       { bg: '#00953422', border: '#00953444', text: '#009534' },
  moda:        { bg: '#b8860b22', border: '#b8860b44', text: '#b8860b' },
  fitness:     { bg: '#7B2FBE22', border: '#7B2FBE44', text: '#9D4EDD' },
  gastronomia: { bg: '#e6471d22', border: '#e6471d44', text: '#e6471d' },
  tecnologia:  { bg: '#3B82F622', border: '#3B82F644', text: '#60a5fa' },
  lifestyle:   { bg: '#06b6d422', border: '#06b6d444', text: '#22d3ee' },
  outro:       { bg: '#64748b22', border: '#64748b44', text: '#94a3b8' },
};

let allCampaigns = [];
let currentCat = '';

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  loadCampaigns();

  document.getElementById('search-input').addEventListener('input', renderCampaigns);

  document.getElementById('filter-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentCat = tab.dataset.cat;
    renderCampaigns();
  });
});

async function loadCampaigns() {
  const loading = document.getElementById('campaigns-loading');
  const grid = document.getElementById('campaigns-grid');
  loading.style.display = 'flex';
  grid.style.display = 'none';

  try {
    const res = await fetch(`${API}?action=list&status=ativa`);
    const data = await res.json();
    if (data.success) {
      allCampaigns = data.data;
    }
  } catch (e) {
    // fallback: usar dados de exemplo se API não disponível
    allCampaigns = getFallbackCampaigns();
  }

  loading.style.display = 'none';
  grid.style.display = 'grid';
  renderCampaigns();
}

function renderCampaigns() {
  const grid = document.getElementById('campaigns-grid');
  const empty = document.getElementById('campaigns-empty');
  const query = document.getElementById('search-input').value.toLowerCase();

  let filtered = allCampaigns.filter(c => {
    const matchCat = !currentCat || c.categoria === currentCat;
    const matchSearch = !query || c.nome.toLowerCase().includes(query) || c.marca.toLowerCase().includes(query);
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = filtered.map(c => renderCard(c)).join('');
  lucide.createIcons();
}

function renderCard(c) {
  const col = CATEGORY_COLORS[c.categoria] || CATEGORY_COLORS.outro;
  const catLabel = { beleza:'Beleza', ecommerce:'E-commerce', saude:'Saúde', moda:'Moda', fitness:'Fitness', gastronomia:'Gastronomia', tecnologia:'Tecnologia', lifestyle:'Lifestyle', outro:'Outro' }[c.categoria] || 'Outro';
  const valor = parseFloat(c.valor_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const vagas = c.vagas > 0 ? `${c.vagas} vagas` : 'Vagas abertas';
  const inicio = c.data_inicio ? new Date(c.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '';
  const fim = c.data_fim ? new Date(c.data_fim + 'T00:00:00').toLocaleDateString('pt-BR') : '';

  return `
    <div class="campaign-card" data-id="${c.id}">
      <div class="card-header">
        <div class="card-brand-icon" style="background:${col.bg}; border-color:${col.border}; color:${col.text}">
          ${c.marca.substring(0,4).toUpperCase()}
        </div>
        <div class="card-header-info">
          <span class="card-category">${catLabel}</span>
          <div class="card-title">${esc(c.nome)}</div>
          <div class="card-brand">${esc(c.marca)}</div>
        </div>
      </div>
      ${inicio ? `<div class="card-dates"><i data-lucide="calendar"></i> ${inicio}${fim ? ' → ' + fim : ''}</div>` : ''}
      <div class="card-body">
        <p class="card-desc">${esc(c.descricao || '')}</p>
        ${c.requisitos ? `<div class="card-req"><strong>Requisitos</strong>${esc(c.requisitos)}</div>` : ''}
      </div>
      <div class="card-footer">
        <div class="card-value-wrap">
          <span class="card-value-label">Valor Base</span>
          <span class="card-value">${valor}</span>
          <span class="card-value-sub">por campanha</span>
        </div>
        <div class="card-info">
          <div class="card-chip"><i data-lucide="users"></i>${c.total_candidatos || 0} inscritos</div>
          <div class="card-chip"><i data-lucide="briefcase"></i>${vagas}</div>
        </div>
      </div>
      <div class="card-cta">
        <a href="apply.html?campanha=${c.id}" class="btn-primary">
          <i data-lucide="rocket"></i> Me candidatar
        </a>
      </div>
    </div>
  `;
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/&amp;amp;/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getFallbackCampaigns() {
  return [
    { id:1, nome:'Beleza & Estilo Avon 2025', marca:'Avon', descricao:'Buscamos influenciadores de beleza apaixonados por maquiagem, skincare e lifestyle para representar a Avon nas redes sociais.', requisitos:'Mínimo 5.000 seguidores no Instagram ou TikTok.', valor_base:450, categoria:'beleza', data_inicio:'2025-08-01', data_fim:'2025-10-31', vagas:50, status:'ativa', total_candidatos:12 },
    { id:2, nome:'Natura Ekos — Sustentabilidade', marca:'Natura', descricao:'Campanha focada em sustentabilidade, bem-estar e conexão com a natureza.', requisitos:'Mínimo 3.000 seguidores.', valor_base:380, categoria:'saude', data_inicio:'2025-08-01', data_fim:'2025-11-30', vagas:40, status:'ativa', total_candidatos:8 },
    { id:3, nome:'Amazon Prime — Creators Program', marca:'Amazon', descricao:'Programa para criadores de conteúdo divulgarem produtos e serviços Amazon.', requisitos:'Mínimo 10.000 seguidores.', valor_base:600, categoria:'ecommerce', data_inicio:'2025-07-01', data_fim:'2025-12-31', vagas:100, status:'ativa', total_candidatos:34 },
    { id:4, nome:'Vivara Joias — Coleção Outono', marca:'Vivara', descricao:'Campanha de lançamento da nova coleção de joias e relógios Vivara.', requisitos:'Mínimo 8.000 seguidores. Público feminino.', valor_base:750, categoria:'moda', data_inicio:'2025-08-15', data_fim:'2025-10-15', vagas:20, status:'ativa', total_candidatos:5 },
    { id:5, nome:'Growth Supplements — #TransformaCom', marca:'Growth Supplements', descricao:'Ação para influenciadores fitness, nutrição e saúde. Divulgação de suplementos com foco em performance.', requisitos:'Mínimo 5.000 seguidores. Nicho fitness.', valor_base:500, categoria:'fitness', data_inicio:'2025-07-15', data_fim:'2025-12-31', vagas:60, status:'ativa', total_candidatos:21 },
  ];
}
