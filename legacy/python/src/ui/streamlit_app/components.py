"""Reusable Streamlit layout helpers."""

from __future__ import annotations

from contextlib import contextmanager
from collections.abc import Iterator

import streamlit as st


def page_header(title: str, tagline: str) -> None:
    st.markdown(
        f"""
        <div class="fg-header">
            <p class="fg-title">{title}</p>
            <p class="fg-tagline">{tagline}</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


@contextmanager
def section_block(title: str, description: str | None = None) -> Iterator[None]:
    with st.container(border=True):
        st.markdown(f"**{title}**")
        if description:
            st.caption(description)
        yield
