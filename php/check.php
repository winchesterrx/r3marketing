<?php
// R3 Marketing Digital — API de Checagem de Status
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Método inválido.'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);
$telefone = sanitize($data['telefone'] ?? '');

if (empty($telefone)) {
    jsonResponse(['success' => false, 'message' => 'O número de telefone é obrigatório.'], 400);
}

$pdo = getConnection();
$stmt = $pdo->prepare("
    SELECT c.id, c.nome_completo, c.status, c.nota_admin, c.criado_em, 
           camp.nome as campanha_nome, camp.marca as campanha_marca
    FROM candidaturas c
    JOIN campanhas camp ON c.campanha_id = camp.id
    WHERE c.telefone = ?
    ORDER BY c.criado_em DESC
    LIMIT 1
");
$stmt->execute([$telefone]);
$candidatura = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$candidatura) {
    jsonResponse(['success' => false, 'message' => 'Nenhuma candidatura encontrada com este número de telefone. Verifique se digitou corretamente.'], 404);
}

jsonResponse([
    'success' => true,
    'data' => $candidatura
]);
?>
