"""Global FeverGate Streamlit theme."""

GLOBAL_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@400;500;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: "Noto Sans Myanmar", "Segoe UI", sans-serif;
}

.block-container {
    max-width: 42rem;
    padding-top: 1.5rem;
    padding-bottom: 2rem;
}

.fg-header {
    margin-bottom: 1.25rem;
}
.fg-title {
    font-size: 1.75rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.02em;
}
.fg-tagline {
    color: #64748b;
    font-size: 0.95rem;
    margin: 0.25rem 0 0 0;
}

.fg-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    padding: 1.1rem 1.15rem 1.15rem;
    margin-bottom: 0.85rem;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.fg-card-title {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 0.15rem 0;
}
.fg-card-desc {
    font-size: 0.85rem;
    color: #64748b;
    margin: 0 0 0.75rem 0;
}

.triage-card {
    width: 100%;
    border-radius: 1.25rem;
    padding: 1.75rem 1.5rem;
    margin: 0.5rem 0 1rem 0;
    color: #ffffff;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);
}
.triage-card .decision {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    margin: 0 0 0.5rem 0;
}
.triage-card .reason {
    font-size: 1.15rem;
    font-weight: 500;
    margin: 0 0 0.65rem 0;
    line-height: 1.45;
}
.triage-card .plan {
    font-size: 1rem;
    font-weight: 400;
    margin: 0;
    line-height: 1.5;
    opacity: 0.95;
}
.triage-card.refer { background: linear-gradient(135deg, #e11d48, #b91c1c); }
.triage-card.monitor { background: linear-gradient(135deg, #f59e0b, #ea580c); }
.triage-card.treat { background: linear-gradient(135deg, #059669, #0f766e); }

div[data-testid="stSidebar"] {
    background: #f8fafc;
}
div[data-testid="stSidebar"] .stCaption {
    color: #475569;
}

.stButton > button[kind="primary"] {
    background: linear-gradient(135deg, #0d9488, #0f766e);
    border: none;
    border-radius: 0.85rem;
    font-weight: 700;
    padding: 0.65rem 1rem;
}
.stButton > button[kind="primary"]:hover {
    background: linear-gradient(135deg, #0f766e, #115e59);
    border: none;
}
</style>
"""
