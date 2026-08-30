import subprocess
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
SCRIPT = BACKEND_DIR / "scripts" / "backfill_event_workflow.py"


def test_backfill_script_supports_direct_execution():
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--help"],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
        timeout=10,
    )

    assert result.returncode == 0, result.stderr
    assert "--apply" in result.stdout
