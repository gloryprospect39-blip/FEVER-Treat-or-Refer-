"""Myanmar (Burmese) UI strings for FeverGate Streamlit."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class AppStrings:
    title: str
    tagline: str


@dataclass(frozen=True, slots=True)
class AgeStrings:
    title: str
    pathway_child: str
    pathway_adult: str
    under_2_months: str
    months_2_to_5: str
    years_5_to_15: str
    years_15_to_17: str
    years_18_to_64: str
    years_65_plus: str


@dataclass(frozen=True, slots=True)
class FeverStrings:
    title: str
    has_fever: str
    duration_days: str


@dataclass(frozen=True, slots=True)
class VitalsStrings:
    title: str
    show: str
    hide: str
    systolic_bp: str
    spo2: str
    respiratory_rate: str
    temperature: str
    heart_rate: str
    not_measured_help: str


@dataclass(frozen=True, slots=True)
class DangerSignStrings:
    pediatric_title: str
    pediatric_desc: str
    adult_title: str
    adult_desc: str


@dataclass(frozen=True, slots=True)
class ComorbidityStrings:
    pediatric_title: str
    pediatric_desc: str
    adult_title: str
    adult_desc: str
    system_heart: str
    system_lungs: str
    system_kidneys: str
    system_immune: str
    system_blood: str
    system_nutrition: str
    system_other: str


@dataclass(frozen=True, slots=True)
class ActionStrings:
    assess: str
    new_patient: str
    call_teleconsultation: str
    schedule_teleconsultation: str
    start_treatment: str
    treatment_acknowledged: str


@dataclass(frozen=True, slots=True)
class ResultStrings:
    triage_decision: str
    refer: str
    treat_and_monitor: str
    treat: str

    def monitor_reason(self, days: int) -> str:
        return f"ယခု ကုသပြီး {days} ရက်အကြာတွင် ပြန်စစ်ဆေးရန်။"


@dataclass(frozen=True, slots=True)
class ClinicStrings:
    title: str
    stock_heading: str
    endemicity_heading: str
    show_settings: str
    hide_settings: str
    high_endemicity: str
    low_endemicity: str
    act_in_stock: str
    amoxicillin: str
    paracetamol: str


@dataclass(frozen=True, slots=True)
class AssistantStrings:
    title: str
    subtitle: str
    placeholder: str
    thinking: str
    disclaimer: str
    unavailable: str
    error: str
    greeting: str
    use_context: str


@dataclass(frozen=True, slots=True)
class MmStrings:
    app: AppStrings
    age: AgeStrings
    fever: FeverStrings
    vitals: VitalsStrings
    danger_signs: DangerSignStrings
    comorbidity: ComorbidityStrings
    actions: ActionStrings
    result: ResultStrings
    clinic: ClinicStrings
    assistant: AssistantStrings
    assess_error: str
    encounters_logged: str


mm = MmStrings(
    app=AppStrings(
        title="FeverGate",
        tagline="ပဏာမ အကြမ်းမျဥ်း အသုံးပြုရန်အတွက်သာ",
    ),
    age=AgeStrings(
        title="အသက်အုပ်စု",
        pathway_child="ကလေး (၁၅ နှစ်အောက်)",
        pathway_adult="လူကြီး (၁၅ နှစ် နှင့် အထက်)",
        under_2_months="၂ လ မပြည့်",
        months_2_to_5="၂ လ – ၅ နှစ်",
        years_5_to_15="၅ – ၁၅ နှစ်",
        years_15_to_17="၁၅ – ၁၇ နှစ်",
        years_18_to_64="၁၈ – ၆၄ နှစ်",
        years_65_plus="၆၅ နှစ် နှင့် အထက်",
    ),
    fever=FeverStrings(
        title="ဖျား",
        has_fever="ဖျားသည်",
        duration_days="ကြာချိန် (ရက်)",
    ),
    vitals=VitalsStrings(
        title="အခြေခံစမ်းသပ်မှု (မထည့်လည်းရသည်)",
        show="အချက်အလက် ထည့်ရန်",
        hide="အချက်အလက် ဝှက်ရန်",
        systolic_bp="ဆီစတိုလစ် သွေးဖိအား",
        spo2="SpO₂ %",
        respiratory_rate="အသက်ရှုနှုန်း /မိနစ်",
        temperature="ကိုယ်အပူချိန် (°C)",
        heart_rate="နှလုံးခုန်နှုန်း /မိနစ်",
        not_measured_help="မတိုင်းတာရသေးပါက ဗလာထားပါ။",
    ),
    danger_signs=DangerSignStrings(
        pediatric_title="အန္တရာယ် လက္ခဏာများ (ကလေး)",
        pediatric_desc="IMCI လက္ခဏာများ — ရှိပါက နှိပ်ရွေးပါ",
        adult_title="အန္တရာယ် လက္ခဏာများ (လူကြီး)",
        adult_desc="လူကြီးများအတွက် အန္တရာယ် လက္ခဏာများ — ရှိပါက နှိပ်ရွေးပါ",
    ),
    comorbidity=ComorbidityStrings(
        pediatric_title="အန္တရာယ်မြင့် အခြေအနေများ",
        pediatric_desc="သွေးအားနည်း သို့မဟုတ် အာဟာရချို့တဲ့မှု",
        adult_title="နာတာရှည်ရောဂါများ",
        adult_desc="ကိုယ်ခန္ဓာ အစိတ်အပိုင်း အလိုက်",
        system_heart="နှလုံး",
        system_lungs="အဆုတ်",
        system_kidneys="ကျောက်ကပ်",
        system_immune="ကိုယ်ခံအား",
        system_blood="သွေး",
        system_nutrition="အာဟာရ",
        system_other="အခြား",
    ),
    actions=ActionStrings(
        assess="လူနာ စစ်ဆေးရန်",
        new_patient="← လူနာအသစ်",
        call_teleconsultation="တယ်လီ အကြံပြုခန်း ခေါ်ဆိုရန်",
        schedule_teleconsultation="တယ်လီ အကြံပြု စီစဉ်ရန်",
        start_treatment="ကုသမှု စတင်ရန်",
        treatment_acknowledged="ကုသမှု အစီအစဉ်ကို အတည်ပြုပြီး။",
    ),
    result=ResultStrings(
        triage_decision="စစ်ဆေးမှု ရလဒ်",
        refer="ပို့ဆောင်ရန်",
        treat_and_monitor="ကုသ၍ စောင့်ကြည့်",
        treat="ကုသရန်",
    ),
    clinic=ClinicStrings(
        title="ဆေးခန်း အခြေအနေ",
        stock_heading="ယနေ့ စတော့",
        endemicity_heading="ဌက်ဖျားရောဂါ ဖြစ်ပွားမှု",
        show_settings="ဆက်တင်များ ပြရန်",
        hide_settings="ဆက်တင်များ ဝှက်ရန်",
        high_endemicity="ဖြစ်ပွားမှု များသော",
        low_endemicity="ဖြစ်ပွားမှု နည်းသော",
        act_in_stock="ဌက်ဖျားဆေး ရှိသည်",
        amoxicillin="အမောက်ဆီလင်",
        paracetamol="ပါရာစီတမော ရှိသည်",
    ),
    assistant=AssistantStrings(
        title="AI အကူအညီ",
        subtitle="ဆေးဘက်ဆိုင်ရာ မေးခွန်းများ (အကြံပြုသာ)",
        placeholder="မေးခွန်း ရိုက်ထည့်ပါ…",
        thinking="စဉ်းစားနေသည်…",
        disclaimer="AI ၏ အကြံပြုချက်များသည် ကိုးကားရန်သာဖြစ်ပြီး ဆရာဝန်၏ ဆုံးဖြတ်ချက်ကို အစားမထိုးပါ။",
        unavailable="AI အကူအညီ ကို ဖွင့်ထားခြင်း မရှိသေးပါ (GEMINI_API_KEY သတ်မှတ်ပါ)။",
        error="တောင်းဆိုမှု မအောင်မြင်ပါ။ ထပ်ကြိုးစားပါ။",
        greeting="မင်္ဂလာပါ။ ဖျားနာမှု စစ်ဆေးခြင်း၊ အန္တရာယ်လက္ခဏာများ သို့မဟုတ် ကုသမှု အကြောင်း မေးမြန်းနိုင်ပါသည်။",
        use_context="လက်ရှိလူနာ အချက်အလက်ဖြင့် မေးရန်",
    ),
    assess_error="ထည့်သွင်းမှု စစ်ဆေးပြီး ပြန်ကြိုးစားပါ။",
    encounters_logged="မှတ်တမ်းတင်ထားသော လူနာ",
)

DANGER_SIGN_LABELS_MM: dict[str, str] = {
    "imci:unable_to_drink_or_breastfeed": "နို့မစို့ သို့မဟုတ် အစာမစားဝင်ခြင်း",
    "imci:vomits_everything": "အစားစားတိုင်းအန်နေခြင်း",
    "imci:convulsions": "လူနာ တက်သွားခြင်း",
    "imci:lethargic": "နုန်းချိနေခြင်း",
    "imci:unconscious": "သတိမေ့လျော့ခြင်း",
    "imci:chest_indrawing": "အသက်ရှူလျှင် ရင်ဘတ်ချိုင့်ဝင်နေခြင်း",
    "imci:stiff_neck": "လည်ပင်းကြွက်သားတောင့်တင်းနေခြင်း",
    "imci:bulging_fontanelle": "ငယ်ထိပ်ဖောင်းနေခြင်း",
    "imci:severe_palmar_pallor": "ခြေဖဝါး လက်ဖဝါး ဖြူဆုတ်နေခြင်း",
}

COMORBIDITY_LABELS_MM: dict[str, str] = {
    "sickle_cell": "သွေးအားနည်း",
    "severe_malnutrition": "အာဟာရချို့တဲ့မှု",
    "chronic_heart_disease": "နာတာရှည် နှလုံးရောဂါ",
    "chronic_lung_disease": "နာတာရှည် အဆုတ်ရောဂါ",
    "chronic_kidney_disease": "နာတာရှည် ကျောက်ကပ်ရောဂါ",
    "hiv": "HIV",
    "immunosuppression": "ကိုယ်ခံအား အားနည်းခြင်း",
    "pregnancy": "ကိုယ်ဝန်ရှိခြင်း",
    "recent_surgery_or_wound": "မကြာသေးမီ ခွဲစိတ်ခြင်း သို့မဟုတ် ဒဏ်ရာ",
}

SYSTEM_LABELS_MM: dict[str, str] = {
    "Heart": mm.comorbidity.system_heart,
    "Lungs": mm.comorbidity.system_lungs,
    "Kidneys": mm.comorbidity.system_kidneys,
    "Immune": mm.comorbidity.system_immune,
    "Blood": mm.comorbidity.system_blood,
    "Nutrition": mm.comorbidity.system_nutrition,
    "Other": mm.comorbidity.system_other,
}
