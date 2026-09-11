<?php
header('Content-Type: application/json');
require_once __DIR__ . '/auth_session.php';

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

// Get parameters
$studentId = motoMasterRequireStudentId();
$title = isset($_GET['title']) ? trim($_GET['title']) : 'Battery Maintenance';

if ($title === 'all') {
    $stmt = $mysqli->prepare(
        "SELECT s1.simulation_id, s1.title, s1.description, s1.score, s1.completion_status, s1.date_attempted 
         FROM simulation s1
         JOIN (
             SELECT title, MAX(simulation_id) as max_id
             FROM simulation
             WHERE student_id = ?
             GROUP BY title
         ) s2 ON s1.simulation_id = s2.max_id"
    );
    $stmt->bind_param('i', $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $allProgress = [];
    while ($row = $result->fetch_assoc()) {
        $description = json_decode($row['description'], true);
        $allProgress[] = [
            'simulation_id' => (int) $row['simulation_id'],
            'student_id' => $studentId,
            'title' => $row['title'],
            'score' => (float) $row['score'],
            'completion_status' => $row['completion_status'],
            'date_attempted' => $row['date_attempted'],
            'steps' => $description['steps'] ?? [],
            'time_elapsed_seconds' => $description['time_elapsed_seconds'] ?? 0,
            'saved_at' => $description['saved_at'] ?? null
        ];
    }
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'student_id' => $studentId,
        'progress' => $allProgress
    ]);
    $mysqli->close();
    exit;
}

// Get the most recent simulation progress for this student and title
$stmt = $mysqli->prepare(
    "SELECT simulation_id, description, score, completion_status, date_attempted 
     FROM simulation 
     WHERE student_id = ? AND title = ? 
     ORDER BY date_attempted DESC LIMIT 1"
);
$stmt->bind_param('is', $studentId, $title);
$stmt->execute();
$result = $stmt->get_result();

$progress = null;
if ($row = $result->fetch_assoc()) {
    $description = json_decode($row['description'], true);
    $progress = [
        'simulation_id' => (int) $row['simulation_id'],
        'student_id' => $studentId,
        'title' => $title,
        'score' => (float) $row['score'],
        'completion_status' => $row['completion_status'],
        'date_attempted' => $row['date_attempted'],
        'steps' => $description['steps'] ?? [],
        'time_elapsed_seconds' => $description['time_elapsed_seconds'] ?? 0,
        'saved_at' => $description['saved_at'] ?? null
    ];
}
$stmt->close();

// Also get summary statistics for all attempts
$statsStmt = $mysqli->prepare(
    "SELECT 
        COUNT(*) as total_attempts,
        MAX(score) as best_score,
        AVG(score) as avg_score,
        MIN(date_attempted) as first_attempt,
        MAX(date_attempted) as last_attempt
     FROM simulation 
     WHERE student_id = ? AND title = ?"
);
$statsStmt->bind_param('is', $studentId, $title);
$statsStmt->execute();
$statsResult = $statsStmt->get_result();
$stats = $statsResult->fetch_assoc();
$statsStmt->close();

echo json_encode([
    'success' => true,
    'student_id' => $studentId,
    'current_progress' => $progress,
    'statistics' => [
        'total_attempts' => (int) $stats['total_attempts'],
        'best_score' => $stats['best_score'] ? (float) $stats['best_score'] : null,
        'average_score' => $stats['avg_score'] ? round((float) $stats['avg_score'], 2) : null,
        'first_attempt' => $stats['first_attempt'],
        'last_attempt' => $stats['last_attempt']
    ]
]);

$mysqli->close();
