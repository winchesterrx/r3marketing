<?php
// R3 Marketing Digital — API Admin (autenticação e dashboard)
session_start();
require_once 'config.php';

$action = $_GET['action'] ?? 'login';

switch ($action) {
    case 'login':
        adminLogin();
        break;
    case 'logout':
        adminLogout();
        break;
    case 'check':
        checkSession();
        break;
    case 'dashboard':
        getDashboard();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Ação inválida.'], 400);
}

function adminLogin() {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = sanitize($data['email'] ?? '');
    $senha = $data['senha'] ?? '';

    if (!$email || !$senha) {
        jsonResponse(['success' => false, 'message' => 'E-mail e senha são obrigatórios.'], 400);
    }

    $pdo = getConnection();
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE email = ? AND senha = ? LIMIT 1");
    $stmt->execute([$email, $senha]);
    $admin = $stmt->fetch();

    if (!$admin) {
        jsonResponse(['success' => false, 'message' => 'E-mail ou senha incorretos.'], 401);
    }

    $_SESSION['admin_id'] = $admin['id'];
    $_SESSION['admin_nome'] = $admin['nome'];

    jsonResponse(['success' => true, 'message' => 'Login realizado!', 'admin' => ['id' => $admin['id'], 'nome' => $admin['nome'], 'email' => $admin['email']]]);
}

function adminLogout() {
    session_destroy();
    jsonResponse(['success' => true, 'message' => 'Logout realizado.']);
}

function checkSession() {
    if (!empty($_SESSION['admin_id'])) {
        jsonResponse(['success' => true, 'admin' => ['id' => $_SESSION['admin_id'], 'nome' => $_SESSION['admin_nome']]]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Não autenticado.'], 401);
    }
}

function getDashboard() {
    if (empty($_SESSION['admin_id'])) {
        jsonResponse(['success' => false, 'message' => 'Acesso negado.'], 401);
    }

    $pdo = getConnection();

    $totalCampanhas   = $pdo->query("SELECT COUNT(*) FROM campanhas WHERE status = 'ativa'")->fetchColumn();
    $totalCandidatos  = $pdo->query("SELECT COUNT(*) FROM candidaturas")->fetchColumn();
    $totalAprovados   = $pdo->query("SELECT COUNT(*) FROM candidaturas WHERE status = 'aprovado'")->fetchColumn();
    $totalPendentes   = $pdo->query("SELECT COUNT(*) FROM candidaturas WHERE status = 'pendente'")->fetchColumn();

    $stmt = $pdo->query("
        SELECT c.nome, c.marca, COUNT(ca.id) as total
        FROM campanhas c
        LEFT JOIN candidaturas ca ON ca.campanha_id = c.id
        GROUP BY c.id
        ORDER BY total DESC
        LIMIT 5
    ");
    $topCampanhas = $stmt->fetchAll();

    $stmt2 = $pdo->query("
        SELECT DATE(criado_em) as dia, COUNT(*) as total
        FROM candidaturas
        WHERE criado_em >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY dia
        ORDER BY dia ASC
    ");
    $tendencia = $stmt2->fetchAll();

    jsonResponse([
        'success' => true,
        'data' => [
            'campanhas_ativas' => intval($totalCampanhas),
            'total_candidatos' => intval($totalCandidatos),
            'aprovados'        => intval($totalAprovados),
            'pendentes'        => intval($totalPendentes),
            'top_campanhas'    => $topCampanhas,
            'tendencia'        => $tendencia,
        ]
    ]);
}
