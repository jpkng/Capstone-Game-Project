<?php
/**
 * Grammar Vault — Save API
 * ─────────────────────────────────────────────────────────────────
 * Stores the 3 save slots in a native PHP session instead of the
 * browser's localStorage. This gives a specific, intentional
 * lifetime for save data:
 *
 *   - Closing a TAB (or navigating away and back) does NOT lose
 *     progress — the browser keeps the session cookie alive and
 *     the save data is still sitting in the session on the server.
 *   - Closing the BROWSER ENTIRELY does lose it — the cookie we
 *     issue is a *session cookie* (no expiry date), which every
 *     browser deletes when it fully shuts down. The next visit
 *     gets a brand new, empty session.
 *
 * This is useful for shared/lab computers: a student's progress
 * survives normal use of the browser during a session, but nothing
 * lingers on the machine once they've closed it down.
 *
 * Requires an actual PHP server (e.g. `php -S localhost:8000`, or
 * Apache/Nginx with PHP-FPM). Opening grammar_vault.html directly
 * via a file:// URL cannot reach this endpoint — the save/load
 * feature will simply be unavailable in that case, and the game
 * degrades gracefully (a toast explains the save couldn't reach
 * the server).
 *
 * ── API ──
 * All requests are POST with a JSON body: { "action": "...", ... }
 *
 *   action: "get_all"
 *     -> { success:true, slots:[slotOrNull, slotOrNull, slotOrNull] }
 *
 *   action: "save", slot: 0|1|2, data: { ...save object... }
 *     -> { success:true }
 *
 *   action: "delete", slot: 0|1|2
 *     -> { success:true }
 * ─────────────────────────────────────────────────────────────────
 */

// Session cookie with lifetime 0 = "expire when the browser closes".
// Set explicitly so this behavior doesn't depend on the host's php.ini.
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'samesite' => 'Lax',
]);
session_start();

header('Content-Type: application/json');
header('Cache-Control: no-store');

// Only same-site browser requests using fetch() from the game itself
// are expected; keep this simple and permissive for same-origin use.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

const MAX_SLOTS = 3;
const MAX_BODY_BYTES = 60000; // generous cap so a save can't bloat the session

$raw = file_get_contents('php://input');
if (strlen($raw) > MAX_BODY_BYTES) {
    http_response_code(413);
    echo json_encode(['success' => false, 'error' => 'Request too large']);
    exit;
}

$input = json_decode($raw, true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
    exit;
}

if (!isset($_SESSION['gv_saves']) || !is_array($_SESSION['gv_saves'])) {
    $_SESSION['gv_saves'] = array_fill(0, MAX_SLOTS, null);
}

$action = $input['action'] ?? '';

function valid_slot($slot) {
    return is_int($slot) && $slot >= 0 && $slot < MAX_SLOTS;
}

switch ($action) {

    case 'get_all':
        echo json_encode([
            'success' => true,
            'slots' => $_SESSION['gv_saves'],
        ]);
        break;

    case 'save':
        $slot = isset($input['slot']) ? intval($input['slot']) : -1;
        if (!valid_slot($slot)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid slot']);
            break;
        }
        $data = $input['data'] ?? null;
        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid save data']);
            break;
        }
        $_SESSION['gv_saves'][$slot] = $data;
        echo json_encode(['success' => true]);
        break;

    case 'delete':
        $slot = isset($input['slot']) ? intval($input['slot']) : -1;
        if (!valid_slot($slot)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid slot']);
            break;
        }
        $_SESSION['gv_saves'][$slot] = null;
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Unknown action']);
}
