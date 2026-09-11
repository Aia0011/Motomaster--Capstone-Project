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
if (!$input) { $input = $_POST; }

$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing email or password']);
    exit;
}

$stmt = $mysqli->prepare('SELECT student_id, first_name, last_name, email, section, password FROM students WHERE email = ? LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Account not registered']);
    exit;
}
$stmt->bind_result($studentId, $firstName, $lastName, $storedEmail, $section, $hash);
$stmt->fetch();
$stmt->close();

if (password_verify($password, $hash)) {
    session_regenerate_id(true);
    $_SESSION['role'] = 'Student';
    $_SESSION['student_id'] = (int) $studentId;
    $_SESSION['student_email'] = $storedEmail;
    $_SESSION['student_name'] = trim($firstName . ' ' . $lastName);

    echo json_encode([
        'success' => true,
        'message' => 'Authenticated',
        'student' => [
            'student_id' => (int) $studentId,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $storedEmail,
            'section' => $section,
            'role' => 'Student'
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
}

$mysqli->close();
?>
