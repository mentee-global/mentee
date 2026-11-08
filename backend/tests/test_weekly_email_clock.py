import importlib.util
from pathlib import Path
from types import SimpleNamespace


script_path = Path(__file__).resolve().parents[1] / "scripts" / "emails.py"
spec = importlib.util.spec_from_file_location("weekly_emails", script_path)
emails = importlib.util.module_from_spec(spec)
spec.loader.exec_module(emails)


def test_weekly_email_clock_uses_configured_url(monkeypatch):
    calls = []
    monkeypatch.setenv(
        "WEEKLY_EMAILS_URL",
        "https://web-prod-production-13a6.up.railway.app/api/notifications/weeklyemails",
    )
    monkeypatch.setattr(
        emails.requests,
        "get",
        lambda url: calls.append(url) or SimpleNamespace(status_code=200),
    )

    emails.scheduled_job()

    assert calls == [
        "https://web-prod-production-13a6.up.railway.app/api/notifications/weeklyemails"
    ]
