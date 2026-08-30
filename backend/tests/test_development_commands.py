import json
from pathlib import Path


def test_backend_dev_starts_api_and_notification_worker():
    project_root = Path(__file__).resolve().parents[2]
    scripts = json.loads((project_root / "backend" / "package.json").read_text())[
        "scripts"
    ]

    assert scripts["dev"] == 'pnpm --parallel run "/^dev:.*/"'
    assert scripts["dev:server"] == "uv run python manage.py runserver"
    assert scripts["dev:worker"] == "uv run python manage.py runworker"
