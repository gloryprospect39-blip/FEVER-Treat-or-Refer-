"""Tests for age-based clinical pathways (<15 vs 15+)."""

import pytest

from decision_engine.models import Comorbidity
from ui.comorbidity_options import comorbidity_options_for_band, filter_comorbidities_for_band
from ui.danger_sign_labels import (
    ADULT_DANGER_SIGN_TILES,
    PEDIATRIC_DANGER_SIGN_TILES,
    danger_sign_tiles_for_band,
    danger_sign_tiles_for_pathway,
)
from ui.pathways import ADULT_AGE_BANDS, PEDIATRIC_AGE_BANDS, is_adult_pathway, is_pediatric_pathway
from ui.pathways import (
    PATHWAY_ADULT,
    PATHWAY_CHILD,
    age_bands_for_pathway,
    default_age_band_index,
)


@pytest.mark.parametrize("age_band", sorted(PEDIATRIC_AGE_BANDS))
def test_pediatric_age_bands_use_pediatric_pathway(age_band: str):
    assert is_pediatric_pathway(age_band)
    assert not is_adult_pathway(age_band)


@pytest.mark.parametrize("age_band", sorted(ADULT_AGE_BANDS))
def test_adult_age_bands_use_adult_pathway(age_band: str):
    assert is_adult_pathway(age_band)
    assert not is_pediatric_pathway(age_band)


@pytest.mark.parametrize("age_band", sorted(PEDIATRIC_AGE_BANDS))
def test_pediatric_age_bands_show_nine_danger_sign_tiles(age_band: str):
    tiles = danger_sign_tiles_for_band(age_band)
    assert len(tiles) == 9
    assert tiles == PEDIATRIC_DANGER_SIGN_TILES


@pytest.mark.parametrize("age_band", sorted(ADULT_AGE_BANDS))
def test_adult_age_bands_show_seven_danger_sign_tiles(age_band: str):
    tiles = danger_sign_tiles_for_band(age_band)
    assert len(tiles) == 7
    assert tiles == ADULT_DANGER_SIGN_TILES


def test_adult_pathway_toggle_excludes_infant_danger_signs():
    tiles = danger_sign_tiles_for_pathway(PATHWAY_ADULT)
    codes = {tile.trigger_code for tile in tiles}
    assert len(tiles) == 7
    assert "imci:chest_indrawing" not in codes
    assert "imci:bulging_fontanelle" not in codes


def test_child_pathway_toggle_includes_infant_danger_signs():
    tiles = danger_sign_tiles_for_pathway(PATHWAY_CHILD)
    codes = {tile.trigger_code for tile in tiles}
    assert len(tiles) == 9
    assert "imci:chest_indrawing" in codes
    assert "imci:bulging_fontanelle" in codes


def test_pediatric_pathway_has_reduced_comorbidity_options():
    options = comorbidity_options_for_band("5\u201315 years")
    assert len(options) == 2
    codes = {option.comorbidity for option in options}
    assert codes == {Comorbidity.SICKLE_CELL, Comorbidity.SEVERE_MALNUTRITION}


def test_adult_comorbidities_include_all_nine_options():
    options = comorbidity_options_for_band("18\u201364 years")
    assert len(options) == 9


def test_filter_comorbidities_keeps_pediatric_allowed_only():
    filtered = filter_comorbidities_for_band(
        "5\u201315 years",
        [Comorbidity.SICKLE_CELL, Comorbidity.CHRONIC_HEART_DISEASE],
    )
    assert filtered == [Comorbidity.SICKLE_CELL]


def test_filter_comorbidities_drops_adult_only_for_pediatric():
    filtered = filter_comorbidities_for_band(
        "2 months \u2013 5 years",
        [Comorbidity.SEVERE_MALNUTRITION, Comorbidity.HIV],
    )
    assert filtered == [Comorbidity.SEVERE_MALNUTRITION]


def test_age_bands_for_pathway_groups():
    assert age_bands_for_pathway(PATHWAY_CHILD) == (
        "Under 2 months",
        "2 months \u2013 5 years",
        "5\u201315 years",
    )
    assert age_bands_for_pathway(PATHWAY_ADULT) == (
        "15\u201317 years",
        "18\u201364 years",
        "65+ years",
    )
    assert default_age_band_index(PATHWAY_CHILD) == 1
    assert default_age_band_index(PATHWAY_ADULT) == 1
