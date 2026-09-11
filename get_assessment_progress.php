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

$studentId = motoMasterRequireStudentId();
$title = isset($_GET['title']) ? trim($_GET['title']) : 'Battery Maintenance Assessment';

function mapAssessmentRow($row, $studentId, $titleOverride = null) {
    $details = [];
    if (!empty($row['details'])) {
        $decoded = json_decode($row['details'], true);
        if (is_array($decoded)) {
            $details = $decoded;
        }
    }

    $completionStatus = $details['completion_status'] ?? 'Completed';

    return [
        'assessment_id' => (int) $row['assessment_id'],
        'student_id' => $studentId,
        'title' => $titleOverride ?? $row['title'],
        'score' => (float) $row['score'],
        'remarks' => $row['remarks'],
        'completion_status' => $completionStatus,
        'date_taken' => $row['date_taken'],
        'steps' => $details['steps'] ?? [],
        'time_elapsed_seconds' => $details['time_elapsed_seconds'] ?? 0,
        'saved_at' => $details['saved_at'] ?? null,
    ];
}

if ($title === 'all') {
    $stmt = $mysqli->prepare(
        'SELECT a1.assessment_id, a1.title, a1.score, a1.remarks, a1.details, a1.date_taken
         FROM assessment a1
         INNER JOIN (
             SELECT title, MAX(assessment_id) AS max_id
             FROM assessment
             WHERE student_id = ?
             GROUP BY title
         ) a2 ON a1.assessment_id = a2.max_id'
    );
    $stmt->bind_param('i', $studentId);
    $stmt->execute();
    $result = $stmt->get_result();

    $allProgress = [];
    while ($row = $result->fetch_assoc()) {
        $allProgress[] = mapAssessmentRow($row, $studentId);
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'student_id' => $studentId,
        'progress' => $allProgress,
    ]);
    $mysqli->close();
    exit;
}

$stmt = $mysqli->prepare(
    'SELECT assessment_id, title, score, remarks, details, date_taken
     FROM assessment
     WHERE student_id = ? AND title = ?
     ORDER BY date_taken DESC
     LIMIT 1'
);
$stmt->bind_param('is', $studentId, $title);
$stmt->execute();
$result = $stmt->get_result();

$progress = null;
if ($row = $result->fetch_assoc()) {
    $progress = mapAssessmentRow($row, $studentId, $title);
}
$stmt->close();

$statsStmt = $mysqli->prepare(
    'SELECT COUNT(*) AS total_attempts,
            MAX(score) AS best_score,
            AVG(score) AS avg_score,
            MIN(date_taken) AS first_attempt,
            MAX(date_taken) AS last_attempt
     FROM assessment
     WHERE student_id = ? AND title = ?'
);
$statsStmt->bind_param('is', $studentId, $title);
$statsStmt->execute();
$stats = $statsStmt->get_result()->fetch_assoc();
$statsStmt->close();

echo json_encode([
    'success' => true,
    'student_id' => $studentId,
    'current_progress' => $progress,
    'statistics' => [
        'total_attempts' => (int) ($stats['total_attempts'] ?? 0),
        'best_score' => $stats['best_score'] !== null ? (float) $stats['best_score'] : null,
        'average_score' => $stats['avg_score'] !== null ? round((float) $stats['avg_score'], 2) : null,
        'first_attempt' => $stats['first_attempt'] ?? null,
        'last_attempt' => $stats['last_attempt'] ?? null,
    ],
]);

$mysqli->close();
