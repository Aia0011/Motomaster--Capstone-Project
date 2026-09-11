<?php

function motoMasterStartSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();
}

function motoMasterJsonFail(string $message, int $statusCode = 401): void
{
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

function motoMasterGetCurrentUserContext(): ?array
{
    motoMasterStartSession();

    if (empty($_SESSION['role'])) {
        return null;
    }

    switch ($_SESSION['role']) {
        case 'Student':
            if (empty($_SESSION['student_id'])) {
                return null;
            }

            return [
                'role' => 'Student',
                'user_id' => (int) $_SESSION['student_id'],
                'name' => $_SESSION['student_name'] ?? '',
                'email' => $_SESSION['student_email'] ?? '',
            ];

        case 'Teacher':
            if (empty($_SESSION['teacher_id'])) {
                return null;
            }

            return [
                'role' => 'Teacher',
                'user_id' => (int) $_SESSION['teacher_id'],
                'name' => $_SESSION['teacher_name'] ?? '',
                'email' => $_SESSION['teacher_email'] ?? '',
            ];

        case 'Admin':
            if (empty($_SESSION['admin_id'])) {
                return null;
            }

            return [
                'role' => 'Admin',
                'user_id' => (int) $_SESSION['admin_id'],
                'name' => $_SESSION['admin_name'] ?? '',
                'email' => $_SESSION['admin_email'] ?? '',
            ];
    }

    return null;
}

function motoMasterRequireAuthenticatedUser(): array
{
    $user = motoMasterGetCurrentUserContext();

    if (!$user) {
        motoMasterJsonFail('Authentication required', 401);
    }

    return $user;
}

function motoMasterRequireStudentId(): int
{
    motoMasterStartSession();

    if (empty($_SESSION['role']) || $_SESSION['role'] !== 'Student' || empty($_SESSION['student_id'])) {
        motoMasterJsonFail('Authentication required', 401);
    }

    return (int) $_SESSION['student_id'];
}

function motoMasterRequireTeacherSession(): array
{
    motoMasterStartSession();

    if (empty($_SESSION['role']) || $_SESSION['role'] !== 'Teacher') {
        motoMasterJsonFail('Authentication required', 401);
    }

    return $_SESSION;
}

function motoMasterRequireAdminSession(): array
{
    motoMasterStartSession();

    if (empty($_SESSION['role']) || $_SESSION['role'] !== 'Admin') {
        motoMasterJsonFail('Authentication required', 401);
    }

    return $_SESSION;
}