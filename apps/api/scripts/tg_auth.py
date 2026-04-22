import asyncio, os, sys
from telethon import TelegramClient
from telethon.sessions import StringSession

API_ID   = int(os.environ['API_ID'])
API_HASH = os.environ['API_HASH']
PHONE    = os.environ['PHONE']
ACTION   = os.environ.get('ACTION', 'send')
CODE     = os.environ.get('CODE', '')
PASSWORD = os.environ.get('PASSWORD', '')
HASH     = os.environ.get('PHONE_CODE_HASH', '')
SESSION  = os.environ.get('SESSION_STRING', '')

async def main():
    client = TelegramClient(StringSession(SESSION), API_ID, API_HASH)
    await client.connect()

    if ACTION == 'send':
        result = await client.send_code_request(PHONE)
        session_tmp = client.session.save()
        sys.stdout.write(f"HASH:{result.phone_code_hash}\n")
        sys.stdout.write(f"SESSION:{session_tmp}\n")
        sys.stdout.flush()

    elif ACTION == 'verify':
        try:
            await client.sign_in(PHONE, CODE, phone_code_hash=HASH)
        except Exception as e:
            err = str(e).lower()
            if 'password' in err or 'two' in err or '2fa' in err or 'session_password' in err:
                if not PASSWORD:
                    sys.stdout.write("NEED_2FA\n")
                    sys.stdout.flush()
                    await client.disconnect()
                    return
                await client.sign_in(password=PASSWORD)
            else:
                sys.stderr.write(f"ERROR:{str(e)}\n")
                sys.stderr.flush()
                await client.disconnect()
                return
        session_final = client.session.save()
        sys.stdout.write(f"SESSION:{session_final}\n")
        sys.stdout.flush()

    await client.disconnect()

asyncio.run(main())
