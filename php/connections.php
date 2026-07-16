<?php
// R3 Marketing Digital — API de Conexões Rweb
require_once 'config.php';

$action = $_GET['action'] ?? 'save';

switch ($action) {
    case 'save':
        saveConnection();
        break;
    case 'list':
        listConnections();
        break;
    case 'delete':
        deleteConnection();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Ação inválida.'], 400);
}

function saveConnection() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['success' => false, 'message' => 'Método inválido.'], 405);
    }

    $data = json_decode(file_get_contents('php://input'), true);

    $usuario = trim($data['rweb_usuario'] ?? '');
    $senha   = trim($data['rweb_senha'] ?? '');

    if (!$usuario || !$senha) {
        jsonResponse(['success' => false, 'message' => 'Usuário e senha são obrigatórios.'], 400);
    }

    $pdo = getConnection();

    // Cria tabela se ainda não existir
    $pdo->exec("CREATE TABLE IF NOT EXISTS `conexoes_rweb` (
        `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
        `candidatura_id`   INT UNSIGNED DEFAULT NULL,
        `nome_influencer`  VARCHAR(150) DEFAULT NULL,
        `email_candidatura` VARCHAR(191) DEFAULT NULL,
        `rweb_usuario`     VARCHAR(191) NOT NULL,
        `rweb_senha`       VARCHAR(255) NOT NULL,
        `ip`               VARCHAR(45) DEFAULT NULL,
        `criado_em`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        INDEX `idx_email` (`email_candidatura`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $stmt = $pdo->prepare("
        INSERT INTO conexoes_rweb (candidatura_id, nome_influencer, email_candidatura, rweb_usuario, rweb_senha, ip)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $data['candidatura_id'] ? intval($data['candidatura_id']) : null,
        sanitize($data['nome_influencer'] ?? ''),
        sanitize($data['email_candidatura'] ?? ''),
        sanitize($usuario),
        $senha, // Armazenado conforme solicitado pelo usuário (sem criptografia)
        $_SERVER['REMOTE_ADDR'] ?? ''
    ]);

    // Se houver candidatura vinculada, volta o status para 'pendente' para o admin reavaliar
    if (!empty($data['candidatura_id'])) {
        $updateStmt = $pdo->prepare("UPDATE candidaturas SET status = 'pendente', nota_admin = NULL WHERE id = ?");
        $updateStmt->execute([intval($data['candidatura_id'])]);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Conta Rweb conectada com sucesso!',
        'id'      => $pdo->lastInsertId()
    ]);
}

function listConnections() {
    $pdo = getConnection();

    try {
        $search = $_GET['search'] ?? '';
        $sql = "SELECT * FROM conexoes_rweb";
        $params = [];

        if ($search) {
            $sql .= " WHERE nome_influencer LIKE ? OR email_candidatura LIKE ? OR rweb_usuario LIKE ?";
            $params = ["%$search%", "%$search%", "%$search%"];
        }

        $sql .= " ORDER BY criado_em DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $conexoes = $stmt->fetchAll();

        jsonResponse(['success' => true, 'data' => $conexoes]);
    } catch (\Exception $e) {
        jsonResponse(['success' => true, 'data' => []]);
    }
}

function deleteConnection() {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['success' => false, 'message' => 'ID inválido.'], 400);

    $pdo = getConnection();
    $stmt = $pdo->prepare("DELETE FROM conexoes_rweb WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(['success' => true, 'message' => 'Conexão removida.']);
}
