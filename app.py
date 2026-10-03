"""
Minimal SMS Dashboard backend.

Sends SMS via Africa's Talking, logs every attempt to a local SQLite file,
and serves that log back out -- matching exactly what frontend/src/lib/api.ts
expects.

Routes:
  GET  /health     -> {"status": "ok"}
  GET  /sms-logs    -> [ {id, phone, message, status, timestamp, error, statusCode}, ... ]
                       newest first
  POST /send-sms   -> body {"phone": "...", "message": "..."}; sends via
                       Africa's Talking and appends exactly one log row
                       either way (status "sent" or "failed")
  POST /dlr        -> Africa's Talking's delivery-report webhook (optional).
                       Set this route's public URL as your AT account's
                       "Delivery Report Callback URL" and a log row moves
                       from "sent" to "delivered"/"failed" once AT actually
                       confirms the handset received it. Without this,
                       every successful send just stays "sent" forever --
                       which is accurate (AT only ever told us it *queued*
                       the message, not that it arrived).

Storage: SQLite at DB_PATH (default ./sms_logs.db, created on first run).
Railway's own disk does NOT persist across deploys/restarts unless you
attach a Volume -- if you want logs to survive a redeploy, attach one and
point DB_PATH at a path under it (e.g. /data/sms_logs.db). Without a
volume, every deploy starts with an empty log table -- sends still work
either way, you just lose history on each deploy.
"""
import os
import sqlite3
import uuid
from datetime import datetime, timezone

from flask import Flask, jsonify, request

from africastalking_client import AfricasTalkingError, send_sms

DB_PATH = os.environ.get('DB_PATH', 'sms_logs.db')
CORS_ORIGIN = os.environ.get('CORS_ORIGIN', '*')

app = Flask(__name__)


# Hand-rolled instead of pulling in flask-cors for one header -- same
# effect, one fewer dependency to install on every deploy.
@app.after_request
def _add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = CORS_ORIGIN
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


@app.route('/<path:_path>', methods=['OPTIONS'])
def _cors_preflight(_path):
    return '', 204


def _db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    with _db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS sms_logs (
                id TEXT PRIMARY KEY,
                phone TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                error TEXT,
                status_code TEXT,
                message_id TEXT
            )
        ''')


_init_db()


def _row_to_log(row) -> dict:
    return {
        'id': row['id'],
        'phone': row['phone'],
        'message': row['message'],
        'status': row['status'],
        'timestamp': row['timestamp'],
        'error': row['error'],
        'statusCode': row['status_code'],
    }


@app.get('/health')
def health():
    return jsonify({'status': 'ok'})


@app.get('/sms-logs')
def sms_logs():
    with _db() as conn:
        rows = conn.execute('SELECT * FROM sms_logs ORDER BY timestamp DESC').fetchall()
    return jsonify([_row_to_log(r) for r in rows])


@app.post('/send-sms')
def send_sms_route():
    body = request.get_json(silent=True) or {}
    phone = str(body.get('phone', '')).strip()
    message = str(body.get('message', '')).strip()
    if not phone or not message:
        return jsonify({'error': 'phone and message are both required'}), 422

    log_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    status, error, status_code, message_id = 'failed', None, None, None

    try:
        recipient = send_sms(phone, message)
        status_code = str(recipient.get('statusCode') or '') or None
        message_id = recipient.get('messageId')
        if 'success' in str(recipient.get('status', '')).lower():
            status = 'sent'
        else:
            error = recipient.get('status') or 'send_failed'
    except AfricasTalkingError as e:
        error = str(e)

    with _db() as conn:
        conn.execute(
            'INSERT INTO sms_logs (id, phone, message, status, timestamp, error, status_code, message_id) '
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (log_id, phone, message, status, timestamp, error, status_code, message_id),
        )

    result = {
        'id': log_id, 'phone': phone, 'message': message, 'status': status,
        'timestamp': timestamp, 'error': error, 'statusCode': status_code,
        'success': status == 'sent',
    }
    return jsonify(result), (201 if status == 'sent' else 502)


@app.post('/dlr')
def delivery_report():
    """Africa's Talking's delivery-report webhook -- form-encoded POST
    with at least `id` (the messageId from the original send) and
    `status`. See the module docstring for how to wire this up."""
    body = request.form or request.get_json(silent=True) or {}
    message_id = body.get('id')
    if not message_id:
        return jsonify({'error': 'missing id'}), 400

    at_status = str(body.get('status', '')).strip().lower()
    if at_status == 'success':
        mapped = 'delivered'
    elif at_status in ('sent', 'submitted', 'buffered'):
        mapped = 'sent'
    else:
        mapped = 'failed'

    with _db() as conn:
        conn.execute(
            'UPDATE sms_logs SET status = ?, error = COALESCE(?, error) WHERE message_id = ?',
            (mapped, body.get('failureReason'), message_id),
        )
    return jsonify({'ok': True}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 3000)), debug=False)
