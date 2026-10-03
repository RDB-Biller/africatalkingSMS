"""
Thin, modern client for Africa's Talking's SMS REST API.

Deliberately NOT built on the legacy AfricasTalkingGateway.py already in
this repo -- that file is Africa's Talking's own 2014 reference class,
kept here for history. It predates Python 3's string-identity rules (it
compares `username_ is 'sandbox'`, which is unreliable in modern Python)
and has no notion of logging what was sent. This module talks to the same
endpoint directly with `requests`, which is simpler to test and to reason
about.

API reference: POST {base}/version1/messaging, header `apiKey`, form body
{username, to, message, from?}. Example response:

    {"SMSMessageData": {"Message": "Sent to 1/1 Total Cost: ...",
      "Recipients": [{"number": "+233557389017", "cost": "...",
                       "status": "Success", "statusCode": 101,
                       "messageId": "ATXid_..."}]}}

A per-recipient `status` other than "Success" (e.g. "InvalidPhoneNumber",
"InsufficientBalance") means Africa's Talking understood and rejected the
send -- that's a normal, expected outcome for this module to return, not
an exception. AfricasTalkingError is reserved for cases with no usable
per-recipient response at all (network failure, bad credentials, a
malformed request) -- see send_sms below.
"""
import os

import requests


class AfricasTalkingError(Exception):
    pass


def _base_url(username: str) -> str:
    forced = os.environ.get('AT_SANDBOX', 'false').strip().lower() == 'true'
    sandbox = forced or username.strip().lower() == 'sandbox'
    return 'https://api.sandbox.africastalking.com' if sandbox else 'https://api.africastalking.com'


def send_sms(to: str, message: str, *, username: str | None = None,
             api_key: str | None = None, sender_id: str | None = None) -> dict:
    """Sends one SMS. Returns Africa's Talking's raw per-recipient result
    dict (keys: number, status, statusCode, messageId, cost) whether AT
    accepted or rejected the message -- callers decide what counts as a
    successful send by checking result['status'] (case-insensitively
    contains "success" when AT actually queued it).

    Raises AfricasTalkingError only when AT couldn't be reached, or
    responded with something that isn't a parseable per-recipient result
    at all (bad apiKey/username, malformed `to`, network error).
    """
    username = username or os.environ['AT_USERNAME']
    api_key = api_key or os.environ['AT_API_KEY']
    sender_id = sender_id if sender_id is not None else (os.environ.get('AT_SENDER_ID') or None)

    data = {'username': username, 'to': to, 'message': message}
    if sender_id:
        data['from'] = sender_id

    try:
        resp = requests.post(
            f'{_base_url(username)}/version1/messaging',
            data=data,
            headers={'apiKey': api_key, 'Accept': 'application/json'},
            timeout=15,
        )
    except requests.RequestException as e:
        raise AfricasTalkingError(f'network_error: {e}') from e

    try:
        body = resp.json()
    except ValueError:
        raise AfricasTalkingError(f'non_json_response (HTTP {resp.status_code}): {resp.text[:200]}')

    sms_data = body.get('SMSMessageData') or {}
    recipients = sms_data.get('Recipients') or []
    if not recipients:
        # No per-recipient data at all -- a credential/request-level error
        # (bad apiKey, bad username, malformed `to`), not a per-message one.
        raise AfricasTalkingError(sms_data.get('Message') or f'http_{resp.status_code}')

    return recipients[0]
