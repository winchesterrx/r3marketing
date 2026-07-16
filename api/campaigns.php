<?php
// R3 Marketing Digital — API de Campanhas
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        listCampaigns();
        break;
    case 'get':
        getCampaign();
        break;
    case 'create':
        createCampaign();
        break;
    case 'update':
        updateCampaign();
        break;
    case 'delete':
        deleteCampaign();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Ação inválida.'], 400);
}

function listCampaigns() {
    $pdo = getConnection();
    $status = $_GET['status'] ?? 'ativa';
    $categoria = $_GET['categoria'] ?? '';

    $sql = "SELECT c.*, 
                   COUNT(ca.id) as total_candidatos
            FROM campanhas c
            LEFT JOIN candidaturas ca ON ca.campanha_id = c.id";
    $params = [];

    if ($status) {
        $sql .= " WHERE c.status = ?";
        $params[] = $status;
        if ($categoria) {
            $sql .= " AND c.categoria = ?";
            $params[] = $categoria;
        }
    }

    $sql .= " GROUP BY c.id ORDER BY c.criado_em DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $campanhas = $stmt->fetchAll();

    jsonResponse(['success' => true, 'data' => $campanhas]);
}

function getCampaign() {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['success' => false, 'message' => 'ID inválido.'], 400);

    $pdo = getConnection();
    $stmt = $pdo->prepare("SELECT * FROM campanhas WHERE id = ?");
    $stmt->execute([$id]);
    $campanha = $stmt->fetch();

    if (!$campanha) jsonResponse(['success' => false, 'message' => 'Campanha não encontrada.'], 404);
    jsonResponse(['success' => true, 'data' => $campanha]);
}

function createCampaign() {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) jsonResponse(['success' => false, 'message' => 'Dados inválidos.'], 400);

    $required = ['nome', 'marca', 'valor_base'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            jsonResponse(['success' => false, 'message' => "Campo obrigatório: $field"], 400);
        }
    }

    $pdo = getConnection();
    $stmt = $pdo->prepare("
        INSERT INTO campanhas (nome, marca, descricao, requisitos, valor_base, categoria, data_inicio, data_fim, vagas, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        sanitize($data['nome']),
        sanitize($data['marca']),
        sanitize($data['descricao'] ?? ''),
        sanitize($data['requisitos'] ?? ''),
        floatval($data['valor_base']),
        sanitize($data['categoria'] ?? 'outro'),
        $data['data_inicio'] ?? null,
        $data['data_fim'] ?? null,
        intval($data['vagas'] ?? 0),
        sanitize($data['status'] ?? 'ativa'),
    ]);

    jsonResponse(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Campanha criada com sucesso!']);
}

function updateCampaign() {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['success' => false, 'message' => 'ID inválido.'], 400);

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) jsonResponse(['success' => false, 'message' => 'Dados inválidos.'], 400);

    $pdo = getConnection();
    $stmt = $pdo->prepare("
        UPDATE campanhas SET
            nome = ?, marca = ?, descricao = ?, requisitos = ?,
            valor_base = ?, categoria = ?, data_inicio = ?,
            data_fim = ?, vagas = ?, status = ?
        WHERE id = ?
    ");
    $stmt->execute([
        sanitize($data['nome'] ?? ''),
        sanitize($data['marca'] ?? ''),
        sanitize($data['descricao'] ?? ''),
        sanitize($data['requisitos'] ?? ''),
        floatval($data['valor_base'] ?? 0),
        sanitize($data['categoria'] ?? 'outro'),
        $data['data_inicio'] ?? null,
        $data['data_fim'] ?? null,
        intval($data['vagas'] ?? 0),
        sanitize($data['status'] ?? 'ativa'),
        $id
    ]);

    jsonResponse(['success' => true, 'message' => 'Campanha atualizada com sucesso!']);
}

function deleteCampaign() {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['success' => false, 'message' => 'ID inválido.'], 400);

    $pdo = getConnection();
    $stmt = $pdo->prepare("DELETE FROM campanhas WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(['success' => true, 'message' => 'Campanha removida com sucesso!']);
}
