"""Parse deployment settings and enforce the browser's exact public origin."""
from urllib.parse import urlsplit

def public_origin(environ):
    value=environ.get('NAPQUEST_PUBLIC_ORIGIN','')
    if not value and environ.get('SPACE_HOST'):
        value=f"https://{environ['SPACE_HOST']}"
    if not value:return ''
    parsed=urlsplit(value)
    if (parsed.scheme not in {'http','https'} or not parsed.hostname
        or parsed.username or parsed.password or parsed.path not in {'','/'}
        or parsed.query or parsed.fragment):
        raise ValueError('NAPQUEST_PUBLIC_ORIGIN must be a single HTTP(S) origin, without a path or credentials.')
    if parsed.scheme!='https' and parsed.hostname not in {'localhost','127.0.0.1','::1'}:
        raise ValueError('Public hosting requires an HTTPS origin.')
    return f'{parsed.scheme}://{parsed.netloc}'

def origin_allowed(origin,host,configured='',hosted=False):
    if not origin:return True
    if configured:return origin==configured
    return not hosted and origin==f'http://{host}'
