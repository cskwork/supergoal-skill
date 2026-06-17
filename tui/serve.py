"""Serve the Supergoal Board in a browser via textual-serve.

textual-serve runs the Textual app in a subprocess per browser visit over a websocket, so several
tabs/humans can watch one run. It does NOT open a browser itself - tui/launch.sh does that.

Run: python -m tui.serve   (host/port from SUPERGOAL_TUI_HOST / SUPERGOAL_TUI_PORT)
"""

from __future__ import annotations

import os
import sys


def main() -> int:
    try:
        from textual_serve.server import Server  # type: ignore[import-not-found]
    except ImportError:
        sys.stderr.write(
            "tui.serve: textual-serve is not installed.\n"
            "  pip install textual-serve\n"
            "Or run the board locally without a browser:  python -m tui.app\n"
        )
        return 1

    host = os.environ.get("SUPERGOAL_TUI_HOST", "127.0.0.1")
    port = int(os.environ.get("SUPERGOAL_TUI_PORT", "8000"))
    # Launch the app module the same interpreter is using, so the venv is inherited.
    command = f"{sys.executable} -m tui.app"
    server = Server(command, host=host, port=port, title="Supergoal Board")
    server.serve()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
