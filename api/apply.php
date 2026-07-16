<?php
// R3 Marketing Digital — API de Candidaturas
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'submit';

switch ($action) {
    case 'submit':
        submitApplication();
        break;
    case 'list':
        listApplications();
        break;
    case 'get':
        getApplication();
        break;
    case 'update_status':
        updateStatus();
        break;
    case 'export':
        exportCSV();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Ação inválida.'], 400);
}

function submitApplication() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'Método não permitido.'], 405);
    }

    $required = ['campanha_id', 'nome_completo', 'email', 'idade', 'diferencial', 'aceite_termos'];
    foreach ($required as $field) {
        if (empty($_POST[$field])) {
            jsonResponse(['success' => false, 'message' => "Campo obrigatório: $field"], 400);
        }
    }

    if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'E-mail inválido.'], 400);
    }

    $pdo = getConnection();

    // Verificar se campanha existe e está ativa
    $stmt = $pdo->prepare("SELECT id, nome FROM campanhas WHERE id = ? AND status = 'ativa'");
    $stmt->execute([intval($_POST['campanha_id'])]);
    $campanha = $stmt->fetch();
    if (!$campanha) {
        jsonResponse(['success' => false, 'message' => 'Campanha não encontrada ou encerrada.'], 404);
    }

    // Verificar duplicidade
    $stmt = $pdo->prepare("SELECT id FROM candidaturas WHERE campanha_id = ? AND email = ?");
    $stmt->execute([intval($_POST['campanha_id']), sanitize($_POST['email'])]);
    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'Você já se candidatou a esta campanha.'], 409);
    }

    // Inserir candidatura
    $stmt = $pdo->prepare("
        INSERT INTO candidaturas (
            campanha_id, nome_completo, email, telefone, idade, cidade, estado,
            link_instagram, link_tiktok, link_youtube, link_twitter, link_facebook, link_pinterest, link_kwai,
            seguidores_instagram, seguidores_tiktok, seguidores_youtube, seguidores_outros,
            taxa_engajamento, nicho, dias_disponiveis, horarios_postagem, frequencia_postagem,
            diferencial, aceite_termos, ip_candidatura
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        intval($_POST['campanha_id']),
        sanitize($_POST['nome_completo']),
        sanitize($_POST['email']),
        sanitize($_POST['telefone'] ?? ''),
        intval($_POST['idade']),
        sanitize($_POST['cidade'] ?? ''),
        sanitize($_POST['estado'] ?? ''),
        sanitize($_POST['link_instagram'] ?? ''),
        sanitize($_POST['link_tiktok'] ?? ''),
        sanitize($_POST['link_youtube'] ?? ''),
        sanitize($_POST['link_twitter'] ?? ''),
        sanitize($_POST['link_facebook'] ?? ''),
        sanitize($_POST['link_pinterest'] ?? ''),
        sanitize($_POST['link_kwai'] ?? ''),
        intval($_POST['seguidores_instagram'] ?? 0),
        intval($_POST['seguidores_tiktok'] ?? 0),
        intval($_POST['seguidores_youtube'] ?? 0),
        intval($_POST['seguidores_outros'] ?? 0),
        floatval($_POST['taxa_engajamento'] ?? 0),
        sanitize($_POST['nicho'] ?? ''),
        sanitize($_POST['dias_disponiveis'] ?? ''),
        sanitize($_POST['horarios_postagem'] ?? ''),
        sanitize($_POST['frequencia_postagem'] ?? ''),
        sanitize($_POST['diferencial']),
        intval($_POST['aceite_termos']),
        $_SERVER['REMOTE_ADDR'] ?? ''
    ]);

    $candidaturaId = $pdo->lastInsertId();

    // Upload de fotos
    if (!empty($_FILES)) {
        if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
        $fotoStmt = $pdo->prepare("INSERT INTO fotos_candidatura (candidatura_id, tipo, arquivo, nome_original, tamanho) VALUES (?, ?, ?, ?, ?)");

        $fotoFields = ['foto_perfil' => 'perfil', 'foto_feed_1' => 'feed', 'foto_feed_2' => 'feed', 'foto_metricas' => 'metricas'];
        foreach ($fotoFields as $fieldName => $tipo) {
            if (!empty($_FILES[$fieldName]['tmp_name'])) {
                $file = $_FILES[$fieldName];
                if ($file['error'] === UPLOAD_ERR_OK && $file['size'] <= MAX_FILE_SIZE && in_array($file['type'], ALLOWED_TYPES)) {
                    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                    $filename = 'cand_' . $candidaturaId . '_' . $tipo . '_' . time() . '.' . $ext;
                    if (move_uploaded_file($file['tmp_name'], UPLOAD_DIR . $filename)) {
                        $fotoStmt->execute([$candidaturaId, $tipo, $filename, $file['name'], $file['size']]);
                    }
                }
            }
        }
    }

    jsonResponse([
        'success' => true,
        'message' => 'Candidatura enviada com sucesso! Em breve entraremos em contato.',
        'id' => $candidaturaId
    ]);
}

function listApplications() {
    $pdo = getConnection();
    $campanha_id = intval($_GET['campanha_id'] ?? 0);
    $status = $_GET['status'] ?? '';
    $search = $_GET['search'] ?? '';

    $sql = "SELECT ca.*, c.nome as campanha_nome, c.marca, c.valor_base,
                   GROUP_CONCAT(f.arquivo SEPARATOR ',') as fotos
            FROM candidaturas ca
            JOIN campanhas c ON c.id = ca.campanha_id
            LEFT JOIN fotos_candidatura f ON f.candidatura_id = ca.id";
    $params = [];
    $where = [];

    if ($campanha_id) { $where[] = "ca.campanha_id = ?"; $params[] = $campanha_id; }
    if ($status) { $where[] = "ca.status = ?"; $params[] = $status; }
    if ($search) { $where[] = "(ca.nome_completo LIKE ? OR ca.email LIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; }

    if ($where) $sql .= " WHERE " . implode(' AND ', $where);
    $sql .= " GROUP BY ca.id ORDER BY ca.criado_em DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $candidaturas = $stmt->fetchAll();

    jsonResponse(['success' => true, 'data' => $candidaturas]);
}

function getApplication() {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['success' => false, 'message' => 'ID inválido.'], 400);

    $pdo = getConnection();
    $stmt = $pdo->prepare("
        SELECT ca.*, c.nome as campanha_nome, c.marca, c.valor_base
        FROM candidaturas ca
        JOIN campanhas c ON c.id = ca.campanha_id
        WHERE ca.id = ?
    ");
    $stmt->execute([$id]);
    $candidatura = $stmt->fetch();
    if (!$candidatura) jsonResponse(['success' => false, 'message' => 'Candidatura não encontrada.'], 404);

    $stmt2 = $pdo->prepare("SELECT * FROM fotos_candidatura WHERE candidatura_id = ?");
    $stmt2->execute([$id]);
    $candidatura['fotos'] = $stmt2->fetchAll();

    jsonResponse(['success' => true, 'data' => $candidatura]);
}

function updateStatus() {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['success' => false, 'message' => 'ID inválido.'], 400);

    $data = json_decode(file_get_contents('php://input'), true);
    $validStatus = ['pendente', 'em_analise', 'aprovado', 'reprovado', 'rweb_invalida'];
    if (!in_array($data['status'] ?? '', $validStatus)) {
        jsonResponse(['success' => false, 'message' => 'Status inválido.'], 400);
    }

    $pdo = getConnection();
    $stmt = $pdo->prepare("UPDATE candidaturas SET status = ?, nota_admin = ? WHERE id = ?");
    $stmt->execute([$data['status'], sanitize($data['nota_admin'] ?? ''), $id]);

    jsonResponse(['success' => true, 'message' => 'Status atualizado com sucesso!']);
}

function exportCSV() {
    $pdo = getConnection();
    $campanha_id = intval($_GET['campanha_id'] ?? 0);

    $sql = "SELECT ca.nome_completo, ca.email, ca.telefone, ca.idade, ca.cidade, ca.estado,
                   ca.link_instagram, ca.link_tiktok, ca.link_youtube,
                   ca.seguidores_instagram, ca.seguidores_tiktok, ca.seguidores_youtube,
                   ca.total_seguidores, ca.nicho, ca.diferencial, ca.status, ca.criado_em,
                   c.nome as campanha, c.valor_base
            FROM candidaturas ca
            JOIN campanhas c ON c.id = ca.campanha_id";
    $params = [];
    if ($campanha_id) { $sql .= " WHERE ca.campanha_id = ?"; $params[] = $campanha_id; }
    $sql .= " ORDER BY ca.criado_em DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="candidaturas_r3_' . date('Y-m-d') . '.csv"');
    header('Access-Control-Allow-Origin: *');

    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM UTF-8

    if (!empty($rows)) {
        fputcsv($output, array_keys($rows[0]), ';');
        foreach ($rows as $row) fputcsv($output, $row, ';');
    }
    fclose($output);
    exit;
}
