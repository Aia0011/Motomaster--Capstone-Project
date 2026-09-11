<?php
header('Content-Type: application/json');
require_once __DIR__ . '/auth_session.php';

motoMasterStartSession();

$dbHost = '127.0.0.1';
$dbUser = 'root';
$dbPass = '';
$dbName = 'motomasterdb';

$mysqli = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing email or password']);
    exit;
}

$stmt = $mysqli->prepare('SELECT admin_id, first_name, last_name, email, password FROM admin WHERE email = ? LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Account not registered']);
    exit;
}

$stmt->bind_result($adminId, $firstName, $lastName, $storedEmail, $hash);
$stmt->fetch();
$stmt->close();

if (password_verify($password, $hash)) {
    session_regenerate_id(true);
    $_SESSION['role'] = 'Admin';
    $_SESSION['admin_id'] = (int) $adminId;
    $_SESSION['admin_email'] = $storedEmail;
    $_SESSION['admin_name'] = trim($firstName . ' ' . $lastName);

    echo json_encode([
        'success' => true,
        'message' => 'Authenticated',
        'admin' => [
            'admin_id' => (int) $adminId,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $storedEmail,
            'role' => 'Admin'
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
}

$mysqli->close();
?>
