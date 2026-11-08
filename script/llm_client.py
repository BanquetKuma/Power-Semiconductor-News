"""Claude API access shared by the news build and the tweet job."""
import os

import anthropic

DEFAULT_MODEL = 'claude-opus-5-5'

_client = None
_halted = False


def model_name():
    return os.getenv('CLAUDE_MODEL') or DEFAULT_MODEL


def is_available():
    return bool(os.getenv('ANTHROPIC_API_KEY')) and not _halted


def _halts_all_calls(ex):
    """True for errors that would repeat on every remaining call."""
    if isinstance(ex, (anthropic.AuthenticationError, anthropic.PermissionDeniedError)):
        return True
    return isinstance(ex, anthropic.BadRequestError) and 'credit' in str(ex).lower()


def generate(prompt, *, system=None, schema=None, effort='low', max_tokens=4000, timeout=60):
    """Return Claude's text, or None when it is unavailable or the call fails."""
    global _client, _halted
    if not is_available():
        return None
    if _client is None:
        _client = anthropic.Anthropic()

    params = {
        'model': model_name(),
        'max_tokens': max_tokens,
        'messages': [{'role': 'user', 'content': prompt}],
        'output_config': {'effort': effort},
        'betas': ['server-side-fallback-2026-07-01'],
        'fallbacks': 'default',
    }
    if system:
        params['system'] = system
    if schema:
        params['output_config']['format'] = {'type': 'json_schema', 'schema': schema}

    try:
        response = _client.with_options(timeout=timeout).beta.messages.create(**params)
    except anthropic.APIError as ex:
        if _halts_all_calls(ex):
            _halted = True
            print(f'Claude API unavailable, skipping further calls: {str(ex)[:200]}', flush=True)
        else:
            print(f'Claude API error: {type(ex).__name__} {str(ex)[:200]}', flush=True)
        return None

    if response.stop_reason in ('refusal', 'max_tokens'):
        print(f'Claude response unusable: stop_reason={response.stop_reason}', flush=True)
        return None
    return next((b.text for b in response.content if b.type == 'text'), None)
