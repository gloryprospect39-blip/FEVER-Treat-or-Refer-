import type {
  ConsciousnessLevel,
  PatientContext,
  ReferralUrgency,
  SepsisScreenResult,
  TriageDecision,
} from "./models";

function ageBand(ageMonths: number): string {
  if (ageMonths < 2) return "neonate";
  if (ageMonths < 60) return "under5";
  if (ageMonths < 144) return "child_5_12";
  if (ageMonths < 216) return "adolescent";
  if (ageMonths >= 780) return "elderly";
  return "adult";
}

function heartRateThreshold(ageMonths: number): number {
  const band = ageBand(ageMonths);
  const map: Record<string, number> = {
    neonate: 160,
    under5: 140,
    child_5_12: 120,
    adolescent: 100,
    adult: 100,
    elderly: 100,
  };
  return map[band];
}

function respiratoryRateThreshold(ageMonths: number): number {
  const band = ageBand(ageMonths);
  const map: Record<string, number> = {
    neonate: 60,
    under5: 40,
    child_5_12: 30,
    adolescent: 20,
    adult: 20,
    elderly: 20,
  };
  return map[band];
}

function computeQsofa(ctx: PatientContext): number | null {
  if (ctx.age_months < 144) return null;
  let score = 0;
  if (ctx.consciousness === "lethargic" || ctx.consciousness === "unconscious") {
    score += 1;
  }
  if (ctx.vitals.systolic_bp != null && ctx.vitals.systolic_bp <= 100) {
    score += 1;
  }
  if (
    ctx.vitals.respiratory_rate != null &&
    ctx.vitals.respiratory_rate >= 22
  ) {
    score += 1;
  }
  return score;
}

function news2RespiratoryScore(rr: number, ageMonths: number): number {
  if (ageMonths >= 144) {
    if (rr <= 8) return 3;
    if (rr <= 11) return 1;
    if (rr <= 20) return 0;
    if (rr <= 24) return 2;
    return 3;
  }
  const threshold = respiratoryRateThreshold(ageMonths);
  if (rr <= threshold - 10) return 3;
  if (rr <= threshold - 5) return 1;
  if (rr <= threshold) return 0;
  if (rr <= threshold + 10) return 2;
  return 3;
}

function news2SystolicScore(sbp: number, ageMonths: number): number {
  if (ageMonths >= 144) {
    if (sbp <= 90) return 3;
    if (sbp <= 100) return 2;
    if (sbp <= 110) return 1;
    if (sbp <= 219) return 0;
    return 3;
  }
  if (ageMonths < 12) {
    if (sbp < 70) return 3;
    if (sbp < 80) return 2;
    if (sbp < 90) return 1;
    return 0;
  }
  if (sbp < 80) return 3;
  if (sbp < 90) return 2;
  if (sbp < 100) return 1;
  return 0;
}

function computeNews2(ctx: PatientContext): number | null {
  if (ctx.age_months < 144) return null;
  const vitals = ctx.vitals;
  if (vitals.respiratory_rate == null) return null;

  let score = news2RespiratoryScore(vitals.respiratory_rate, ctx.age_months);

  if (vitals.spo2_percent != null) {
    const spo2 = vitals.spo2_percent;
    if (spo2 <= 91) score += 3;
    else if (spo2 <= 93) score += 2;
    else if (spo2 <= 95) score += 1;
  }

  if (vitals.temperature_c != null) {
    const temp = vitals.temperature_c;
    if (temp <= 35.0) score += 3;
    else if (temp <= 36.0) score += 1;
    else if (temp <= 38.0) score += 0;
    else if (temp <= 39.0) score += 1;
    else score += 2;
  }

  if (vitals.systolic_bp != null) {
    score += news2SystolicScore(vitals.systolic_bp, ctx.age_months);
  }

  if (vitals.heart_rate != null) {
    const hr = vitals.heart_rate;
    const threshold = heartRateThreshold(ctx.age_months);
    if (hr <= 40) score += 3;
    else if (hr <= threshold - 20) score += 1;
    else if (hr <= threshold) score += 0;
    else if (hr <= threshold + 20) score += 1;
    else if (hr <= threshold + 40) score += 2;
    else score += 3;
  }

  if (ctx.consciousness === "unconscious") score += 3;
  else if (ctx.consciousness === "lethargic") score += 3;
  else if (ctx.consciousness === "irritable") score += 1;

  return score;
}

function imciDangerSigns(ctx: PatientContext): string[] {
  const triggers: string[] = [];
  const signs = ctx.danger_signs;

  if (signs.unable_to_drink_or_breastfeed) {
    triggers.push("imci:unable_to_drink_or_breastfeed");
  }
  if (signs.vomits_everything) triggers.push("imci:vomits_everything");
  if (signs.convulsions) triggers.push("imci:convulsions");
  if (signs.chest_indrawing) triggers.push("imci:chest_indrawing");
  if (signs.stiff_neck) triggers.push("imci:stiff_neck");
  if (signs.bulging_fontanelle) triggers.push("imci:bulging_fontanelle");
  if (signs.severe_palmar_pallor) triggers.push("imci:severe_palmar_pallor");
  if (ctx.consciousness === "lethargic") triggers.push("imci:lethargic");
  if (ctx.consciousness === "unconscious") triggers.push("imci:unconscious");

  return triggers;
}

function hardReferralTriggers(ctx: PatientContext): string[] {
  const triggers: string[] = [];
  const vitals = ctx.vitals;
  const band = ageBand(ctx.age_months);

  if (ctx.has_fever && band === "neonate") triggers.push("neonate_fever");
  if (vitals.weak_or_absent_radial_pulse) {
    triggers.push("weak_or_absent_radial_pulse");
  }
  if (vitals.spo2_percent != null && vitals.spo2_percent < 90) {
    triggers.push("hypoxia");
  }
  if (band === "adult" || band === "elderly" || band === "adolescent") {
    if (vitals.systolic_bp != null && vitals.systolic_bp < 90) {
      triggers.push("hypotension_adult");
    }
  } else if (vitals.systolic_bp != null && vitals.systolic_bp < 70) {
    triggers.push("hypotension_pediatric");
  }

  triggers.push(...imciDangerSigns(ctx));
  if (ctx.danger_signs.convulsions) triggers.push("convulsions");

  return [...new Set(triggers)].sort();
}

function compositeScore(ctx: PatientContext): [number, string[]] {
  let score = 0;
  const components: string[] = [];
  const band = ageBand(ctx.age_months);
  const vitals = ctx.vitals;

  const agePoints: Record<string, number> = {
    neonate: 3,
    under5: 1,
    child_5_12: 1,
    adolescent: 0,
    adult: 0,
    elderly: 2,
  };
  const pts = agePoints[band];
  if (pts) {
    score += pts;
    components.push(`age:${band}(+${pts})`);
  }

  if (vitals.temperature_c != null) {
    if (vitals.temperature_c < 36.0) {
      score += 2;
      components.push("hypothermia(+2)");
    } else if (vitals.temperature_c >= 39.5) {
      score += 1;
      components.push("high_fever(+1)");
    }
  }

  if (vitals.heart_rate != null) {
    const threshold = heartRateThreshold(ctx.age_months);
    if (vitals.heart_rate > threshold) {
      score += 1;
      components.push("tachycardia(+1)");
    }
  }

  if (vitals.respiratory_rate != null) {
    const threshold = respiratoryRateThreshold(ctx.age_months);
    if (vitals.respiratory_rate > threshold) {
      score += 1;
      components.push("tachypnea(+1)");
    }
  }

  if (ctx.consciousness === "lethargic") {
    score += 2;
    components.push("lethargy(+2)");
  } else if (ctx.consciousness === "unconscious") {
    score += 2;
    components.push("unconscious(+2)");
  } else if (ctx.consciousness === "irritable") {
    score += 1;
    components.push("irritable(+1)");
  }

  const comorbidityPoints = Math.min(ctx.comorbidities.length, 3);
  if (comorbidityPoints) {
    score += comorbidityPoints;
    components.push(`comorbidities(+${comorbidityPoints})`);
  }

  if (ctx.fever_duration_days > 3) {
    score += 1;
    components.push("prolonged_fever(+1)");
  }

  if (ctx.toxic_appearance) {
    score += 2;
    components.push("toxic_appearance(+2)");
  }

  const qsofa = computeQsofa(ctx);
  if (qsofa != null && qsofa >= 2) {
    score += 2;
    components.push("qsofa>=2(+2)");
  }

  const news2 = computeNews2(ctx);
  if (news2 != null && news2 >= 7) {
    score += 2;
    components.push("news2>=7(+2)");
  } else if (news2 != null && news2 >= 5) {
    score += 1;
    components.push("news2>=5(+1)");
  }

  return [score, components];
}

function decideFromScreen(
  ctx: PatientContext,
  hardTriggers: string[],
  score: number,
  qsofa: number | null,
  news2: number | null,
): [TriageDecision, ReferralUrgency, string[]] {
  const rationale: string[] = [];

  if (hardTriggers.length) {
    rationale.push("Hard referral rule triggered.");
    return ["REFER_IMMEDIATE", "immediate", rationale];
  }
  if (qsofa != null && qsofa >= 2) {
    rationale.push("qSOFA >= 2 in adolescent/adult.");
    return ["REFER", "same_day", rationale];
  }
  if (news2 != null && news2 >= 7) {
    rationale.push("NEWS2 >= 7.");
    return ["REFER_IMMEDIATE", "immediate", rationale];
  }
  if (news2 != null && news2 >= 5) {
    rationale.push("NEWS2 >= 5.");
    return ["REFER", "same_day", rationale];
  }
  if (score >= 3) {
    rationale.push("Composite sepsis screen score >= 3.");
    return ["REFER", "same_day", rationale];
  }
  if (score >= 1 && ctx.comorbidities.length) {
    rationale.push("Borderline score with high-risk comorbidity.");
    return ["REFER", "same_day", rationale];
  }
  if (score >= 1 || ctx.has_fever) {
    rationale.push("Low-risk screen; treat with scheduled monitoring.");
    return ["TREAT_AND_MONITOR", "routine", rationale];
  }
  rationale.push("No fever and low-risk screen.");
  return ["TREAT", "routine", rationale];
}

export function assessSepsisRisk(ctx: PatientContext): SepsisScreenResult {
  const hardTriggers = hardReferralTriggers(ctx);
  const [score, components] = compositeScore(ctx);
  const qsofa = computeQsofa(ctx);
  const news2 = computeNews2(ctx);
  const [decision, urgency, rationale] = decideFromScreen(
    ctx,
    hardTriggers,
    score,
    qsofa,
    news2,
  );

  return {
    score,
    qsofa_score: qsofa,
    news2_score: news2,
    hard_referral_triggers: hardTriggers,
    score_components: components,
    decision,
    urgency,
    rationale,
  };
}
