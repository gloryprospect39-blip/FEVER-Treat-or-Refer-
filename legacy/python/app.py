"""FeverGate — point-of-care febrile triage UI (Streamlit).

Run with: ``uv run streamlit run app.py``
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "src"))

from ui.streamlit_app.main import run

if __name__ == "__main__":
    run()
