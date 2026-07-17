/** Myanmar (Burmese) UI strings for FeverGate */

export const mm = {
  app: {
    title: "FeverGate",
    tagline: "ပဏာမ အကြမ်းဖျဥ်း အသုံးပြုရန်အတွက်သာ",
    metaTitle: "FeverGate — ကုသရန် သို့မဟုတ် ပို့ဆောင်ရန်",
    metaDescription:
      "နယ်စပ်ဆေးခန်း ဖျားနာမှု စစ်ဆေးခြင်း — ကုသရန် / ပို့ဆောင်ရန် ဆုံးဖြတ်ချက်",
  },

  clinic: {
    title: "ငှက်ဖျားရောဂါ ဖြစ်ပွားမှု နှင့် ပေးရန် ဆေးရှိမှု အခြေအနေ",
    endemicityHeading: "ငှက်ဖျားရောဂါ ဖြစ်ပွားမှု",
    stockHint:
      "နေ့စဥ် ဆေးခန်း စတင်ချိန် တစ်နေ့ တစ်ကြိမ် သာဖြည့်ရန် (လူနာတိုင်း ပြန်မမေးရ)",
    stockIncomplete: "ACT နှင့် ပါရာစီတမော နှစ်မျိုးလုံး ရွေးပါ။",
    stockReminder: "ဆက်တင်များ → ယနေ့ ဆေးရှိ/မရှိ ကို ရွေးပါ",
    showSettings: "ဆက်တင်များ ပြရန်",
    hideSettings: "ဆက်တင်များ ဝှက်ရန်",
    highEndemicity: "ဖြစ်ပွားမှုများ",
    lowEndemicity: "ဖြစ်ပွားမှုနည်း",
  },

  stockPrompt: {
    title: "ယနေ့ ဆေးခန်းတွင် ရှိ/မရှိ",
    actQuestion: "ငှက်ဖျားဆေး — ယနေ့ ပေးနိုင်ပါသလား။",
    paracetamolQuestion: "ပါရာစီတမော — ယနေ့ ပေးနိုင်ပါသလား။",
    actLabel: "ငှက်ဖျားဆေး",
    paracetamolLabel: "ပါရာစီတမော",
    yes: "ပေးနိုင်သည်",
    no: "မပေးနိုင်ပါ",
    change: "ပြောင်းရန်",
    answerToSeePlan: "ကုသမှု အစီအစဉ် ကြည့်ရန် ဆေးရှိ/မရှိ ကို ရွေးပါ။",
    drugAvailable: (name: string) => `${name} — ပေးနိုင်သည်`,
    drugUnavailable: (name: string) => `${name} — မပေးနိုင်ပါ`,
  },

  drugDispensing: {
    title: "ဤလူနာအတွက် ဆေးပေးမှု",
    subtitle: "ကုသမှု / တယ်လီ အကြံပြု မတိုင်မီ ရွေးပါ",
    actLabel: "ငှက်ဖျားဆေး",
    paracetamolLabel: "ပါရာစီတမော",
    given: "ပေးပြီး",
    outOfStock: "စတော့ မရှိ",
    notIndicated: "မလိုပါ",
    cancel: "ပယ်ဖျက်ရန်",
  },

  age: {
    title: "အသက်အုပ်စု",
    pathwayChild: "ကလေး (၁၅ နှစ်အောက်)",
    pathwayAdult: "လူကြီး (၁၅ နှစ် နှင့် အထက်)",
    under2Months: "၂ လ မပြည့်",
    months2to5: "၂ လ – ၅ နှစ်",
    years5to15: "၅ – ၁၅ နှစ်",
    years15to17: "၁၅ – ၁၇ နှစ်",
    years18to64: "၁၈ – ၆၄ နှစ်",
    years65plus: "၆၅ နှစ် နှင့် အထက်",
  },

  patient: {
    title: "လူနာ အချက်အလက် (မထည့်လည်းရသည်။)",
    name: "လူနာ အမည်",
    namePlaceholder: "အမည် ရိုက်ထည့်ပါ",
    village: "ကျေးရွာ / နေရပ်",
    villagePlaceholder: "ကျေးရွာ ရိုက်ထည့်ပါ",
    villageSelect: "ကျေးရွာ ရွေးချယ်ပါ",
    clinician: "ကျန်းမာရေး ဝန်ထမ်း အမည်",
    clinicianPlaceholder: "ဝန်ထမ်း အမည်",
    unnamed: "အမည်မဖော်",
    returningPatient: "ပြန်လည် လာရောက် လူနာ",
    returningPatientNew: "— လူနာအသစ် —",
    returningPatientSelect: "ယခင်လူနာ ရွေးချယ်ပါ",
    returningPatientEmpty:
      "ဤကျေးရွာတွင် ယခင်လူနာ မှတ်တမ်း မရှိသေးပါ — အမည် ထည့်ပြီး စစ်ဆေးပါက နောက်တစ်ကြိမ် ဤနေရာတွင် ပေါ်လာပါမည်။",
    visitTrace: (count: number, lastSeen: string) =>
      `Visit #${count} · last seen ${lastSeen}`,
    priorVisits: "ယခင်စစ်ဆေးမှု မှတ်တမ်း",
    priorVisitsEmpty: "ယခင်မှတ်တမ်း မရှိသေးပါ",
    visitCaption: (name: string, village: string, count: number) =>
      `${name} · ${village} (visit #${count})`,
    catchmentOnly: (village: string) => `Catchment: ${village}`,
  },

  fever: {
    title: "ဖျား",
    hasFever: "ဖျားသည်",
    durationDays: "ကြာချိန် (ရက်)",
  },

  vitals: {
    title: "အခြေခံစမ်းသပ်မှု (မထည့်လည်းရသည်။)",
    show: "အချက်အလက် ထည့်ရန်",
    hide: "အချက်အလက် ဝှက်ရန်",
    notMeasuredHelp:
      "Skip if not measured. English clinical bands below match NEWS2, qSOFA, and referral scoring.",
    selectCategory: "Select clinical band (English)",
    coreGroup: "အခြေခံ",
    circulationGroup: "သွေးကြော",
    respiratoryGroup: "အသက်ရှု / SpO₂",
    temperature: "ကိုယ်အပူချိန် (°C)",
    heartRate: "နှလုံးခုန်နှုန်း /မိနစ်",
    systolicBp: "အပေါ် သွေးဖိအား",
    spo2: "SpO₂ %",
    respiratoryRate: "အသက်ရှုနှုန်း /မိနစ်",
  },

  dangerSigns: {
    pediatricTitle: "အန္တရာယ် လက္ခဏာများ (ကလေး)",
    pediatricDesc: "IMCI လက္ခဏာများ — ရှိပါက နှိပ်ရွေးပါ",
    adultTitle: "အန္တရာယ် လက္ခဏာများ (လူကြီး)",
    adultDesc: "လူကြီးများအတွက် အန္တရာယ် လက္ခဏာများ — ရှိပါက နှိပ်ရွေးပါ",
    title: "အန္တရာယ် လက္ခဏာများ",
    description: "ရှိပါက နှိပ်ရွေးပါ",
    convulsions: "လူနာ တက်သွားခြင်း",
    vomitsEverything: "အစားစားတိုင်းအန်နေခြင်း",
    unconscious: "သတိမေ့လျော့ခြင်း",
    stiffNeck: "လည်ပင်းကြွက်သားတောင့်တင်းနေခြင်း",
    severePallor: "ခြေဖဝါး လက်ဖဝါး ဖြူဆုတ်နေခြင်း",
    unableToDrinkPediatric: "နို့မစို့ သို့မဟုတ် အစာမစားဝင်ခြင်း",
    unableToDrinkAdult: "အစာမစားဝင်ခြင်း",
    lethargic: "နုန်းချိနေခြင်း",
    chestIndrawing: "အသက်ရှူလျှင် ရင်ဘတ်ချိုင့်ဝင်နေခြင်း",
    bulgingFontanelle: "ငယ်ထိပ်ဖောင်းနေခြင်း",
    neonateFever: "မွေးကင်း ဖျားခြင်း",
  },

  comorbidity: {
    pediatricTitle: "အန္တရာယ်မြင့်စေနိုင်သော အခြေအနေများ",
    pediatricDesc: "သွေးအားနည်း သို့မဟုတ် အာဟာရချို့တဲ့မှု",
    adultTitle: "နာတာရှည်ရောဂါများ",
    adultDesc: "ကိုယ်ခန္ဓာ အစိတ်အပိုင်း အလိုက်",
    sickleCell: "သွေးအားနည်း",
    severeMalnutrition: "အာဟာရချို့တဲ့မှု",
    chronicHeart: "နာတာရှည် နှလုံးရောဂါ",
    chronicLung: "နာတာရှည် အဆုတ်ရောဂါ",
    chronicKidney: "နာတာရှည် ကျောက်ကပ်ရောဂါ",
    hiv: "HIV",
    immunosuppression: "ကိုယ်ခံအား အားနည်းခြင်း",
    pregnancy: "ကိုယ်ဝန်ရှိခြင်း",
    recentSurgery: "မကြာသေးမီ ခွဲစိတ်ခြင်း သို့မဟုတ် ဒဏ်ရာ",
    systemBlood: "သွေး",
    systemNutrition: "အာဟာရ",
    systemHeart: "နှလုံး",
    systemLungs: "အဆုတ်",
    systemKidneys: "ကျောက်ကပ်",
    systemImmune: "ကိုယ်ခံအား",
    systemOther: "အခြား",
  },

  actions: {
    assess: "လူနာ စစ်ဆေးရန်",
    newPatient: "လူနာအသစ်",
    callTeleconsultation: "တယ်လီ အကြံပြုခန်း ခေါ်ဆိုရန်",
    scheduleTeleconsultation: "onlineမှတဆင့် ဆရာဝန်ပြရန် ရက်ချိန်း စီစဥ်ပါ။",
    startTreatment: "ကုသမှု စတင်ရန်",
    treatmentAcknowledged: "ကုသမှု အစီအစဉ်ကို အတည်ပြုပြီး။",
    dialTeleconsultation: "တယ်လီ အကြံပြုခန်း ခေါ်ဆိုရန်",
  },

  result: {
    triageDecision: "စစ်ဆေးမှု ရလဒ်",
    refer: "ပို့ဆောင်ရန်",
    treatAndMonitor: "အုပ်စု (B) ကုသ၍ စောင့်ကြည့်ရန်",
    treat: "ကုသရန်",
    monitorReason: (days: number) =>
      `ယခု သောက်ရန် ဆေးပေးပီး ${days} ရက်အကြာတွင် ပြန်လာပြရပါမည်။`,
  },

  nav: {
    reports: "အစီရင်ခံစာများ",
    activity: "လုပ်ဆောင်ချက် မှတ်တမ်း",
    supervisor: "ကြီးကြပ်သူ အသုံးပြုရန်",
    triage: "လူနာ စစ်ဆေးရန်",
    backToTriage: "စစ်ဆေးမှုသို့ ပြန်သွားရန်",
    backToSupervisor: "ကြီးကြပ်သူ အသုံးပြုရန်သို့ ပြန်သွားရန်",
  },

  supervisor: {
    title: "ကြီးကြပ်သူ အသုံးပြုရန်",
    subtitle: "နေ့စဥ် အခြေအနေ နှင့် စီမံခန့်ခွဲမှု အစီရင်ခံစာများ",
    todayOverview: "ယနေ့ အနှစ်ချုပ်",
    actStockOuts: "ငှက်ဖျားဆေး စတော့ မရှိ",
    weekEncounters: (n: number) => `ဤအပတ် စစ်ဆေးမှု ${n} ခု`,
    weekTreatments: (n: number) => `ကုသမှု လုပ်ဆောင်ချက် ${n} ခု`,
    reportsCard:
      "ကျေးရွာ အလိုက် စစ်ဆေးမှု၊ ဆုံးဖြတ်ချက် နှင့် ဆေးသုံးစွဲမှု အစီရင်ခံစာများ",
    activityCard:
      "ဝန်ထမ်း လုပ်ဆောင်ချက် မှတ်တမ်း၊ ရက်စွဲ စစ်ထုတ်ခြင်း နှင့် ထုတ်ယူမှု",
    decisionMixTitle: "ဆုံးဖြတ်ချက် အမျိုးအစား (ယနေ့ / ၇ ရက်)",
    decisionMixAria: (total: number) => `စစ်ဆေးမှု ${total} ခု၏ ဆုံးဖြတ်ချက် ခွဲခြမ်း`,
    villageVolumeTitle: "ယနေ့ — ကျေးရွာ အလိုက် လူနာ အရေအတွက်",
    drugChartTitle: "ယနေ့ — ဆေးပေးမှု အခြေအနေ",
    drugChartSubtitle: "ပေးပြီး · စတော့ မရှိ · မလိုပါ",
    activityPulseTitle: "ဤအပတ် — လုပ်ဆောင်ချက် အနှစ်ချုပ်",
    noDrugLogs: "မှတ်တမ်း မရှိ",
    loggedShort: "မှတ်တမ်း",
  },

  activity: {
    title: "လုပ်ဆောင်ချက် မှတ်တမ်း",
    subtitle: "စစ်ဆေးမှု နှင့် လုပ်ဆောင်ချက်များ၏ အချိန်ဇယား",
    daily: "ယနေ့ (နေ့စဥ်)",
    weekly: "လွန်ခဲ့သော ၇ ရက် (အပတ်စဉ်)",
    totalEvents: "စုစုပေါင်း",
    assessments: "စစ်ဆေးမှု",
    referralActions: "ပို့ဆောင်မှု လုပ်ဆောင်ချက်",
    treatmentActions: "ကုသမှု လုပ်ဆောင်ချက်",
    printActions: "ပရင့်ထုတ်မှု",
    newPatients: "လူနာအသစ်",
    recent: "မကြာသေးမီ လုပ်ဆောင်ချက်များ",
    colTime: "အချိန်",
    colEvent: "လုပ်ဆောင်ချက်",
    colActor: "ဝန်ထမ်း",
    colPatient: "လူနာ",
    colDetails: "အသေးစိတ်",
    empty:
      "မှတ်တမ်း မရှိသေးပါ။ လူနာ စစ်ဆေးပြီး လုပ်ဆောင်ချက်များ ပြုလုပ်ပါက ဤနေရာတွင် ပေါ်လာပါမည်။",
    print: "ပရင့်ထုတ်ရန် / သိမ်းရန်",
    generatedAt: "ထုတ်ယူချိန်",
    filterHeading: "ရက်စွဲ အကွာအဝေး",
    filterFrom: "စတင်ရက်",
    filterTo: "ပြီးဆုံးရက်",
    filterReset: "အားလုံး ပြန်ပြပါ",
    filterPresetToday: "ယနေ့",
    filterPresetWeek: "၇ ရက်",
    filterPresetMonth: "၃၀ ရက်",
    filterPresetAll: "အားလုံး",
    filteredSummary: "ရွေးချယ်ထားသော အကွာအဝေး",
    exportCsv: "CSV ထုတ်ယူရန်",
    exportJson: "JSON ထုတ်ယူရန်",
    showingCount: (shown: number, total: number) =>
      `${total} ခုအနက် ${shown} ခု ပြသထားသည်`,
    events: {
      assess_completed: "စစ်ဆေးမှု ပြီးမြောက်",
      teleconsultation_call: "တယ်လီ အကြံပြု ခေါ်ဆိုမှု",
      schedule_teleconsultation: "တယ်လီ အကြံပြု စီစဉ်မှု",
      start_treatment: "ကုသမှု စတင်မှု",
      open_referral_form: "ပို့ဆောင်ရေး ဖောင် ဖွင့်မှု",
      print_referral: "ပို့ဆောင်ရေး ဖောင် ပရင့်ထုတ်မှု",
      new_patient: "လူနာအသစ်",
      view_reports: "အစီရင်ခံစာ ကြည့်ရှုမှု",
      view_activity: "လုပ်ဆောင်ချက် မှတ်တမ်း ကြည့်ရှုမှု",
    },
  },

  referral: {
    button: "ပို့ဆောင်ရေး ဖောင် / မှတ်တမ်း",
    formTitle: "လူနာ ပို့ဆောင်ရေး ဖောင်",
    reportTitle: "လူနာ မှတ်တမ်း",
    print: "ပရင့်ထုတ်ရန် / သိမ်းရန်",
    close: "ပိတ်ရန်",
    date: "နေ့စွဲ",
    patientName: "လူနာ အမည်",
    village: "ကျေးရွာ / နေရပ်",
    ageGroup: "အသက်အုပ်စု",
    pathway: "လမ်းကြောင်း",
    clinician: "ကျန်းမာရေး ဝန်ထမ်း",
    clinic: "ငှက်ဖျားရောဂါ ဖြစ်ပွားမှု နှင့် ပေးရန် ဆေးရှိမှု အခြေအနေ",
    findings: "တွေ့ရှိချက်များ",
    fever: "ဖျားနာမှု",
    feverYes: (days: number) => `ဖျားသည် (${days} ရက်)`,
    feverNo: "ဖျားခြင်း မရှိ",
    vitals: "အခြေခံ တိုင်းတာမှုများ",
    dangerSigns: "အန္တရာယ် လက္ခဏာများ",
    comorbidities: "အန္တရာယ်မြင့်စေနိုင်သော အခြေအနေများ",
    none: "မရှိ",
    decision: "စစ်ဆေးမှု ဆုံးဖြတ်ချက်",
    urgency: "အရေးပေါ် အဆင့်",
    referralReasons: "ပို့ဆောင်ရသည့် အကြောင်းရင်း",
    plan: "ကုသမှု / အကြံပြုချက်",
    teleconsult: "တယ်လီ အကြံပြုခန်း ဖုန်း",
    signature: "လက်မှတ်",
    disclaimer:
      "ဤဖောင်သည် ပဏာမ အကြမ်းဖျဥ်း အသုံးပြုရန်သာ ဖြစ်ပါသည်။",
    systolicBp: "အပေါ် သွေးဖိအား",
    temperature: "ကိုယ်အပူချိန်",
    heartRate: "နှလုံးခုန်နှုန်း",
    spo2: "SpO₂",
    respiratoryRate: "အသက်ရှုနှုန်း",
  },

  report: {
    title: "အစီရင်ခံစာများ",
    subtitle: "နေ့စဥ် နှင့် အပတ်စဉ် လူနာ စစ်ဆေးမှု အနှစ်ချုပ်",
    daily: "ယနေ့ (နေ့စဥ်)",
    weekly: "လွန်ခဲ့သော ၇ ရက် (အပတ်စဉ်)",
    totalPatients: "လူနာ စုစုပေါင်း",
    referrals: "ပို့ဆောင်မှု",
    referImmediate: "ချက်ချင်း ပို့ဆောင်",
    treatMonitor: "အုပ်စု (B) ကုသ၍ စောင့်ကြည့်ရန်",
    treat: "ကုသရန်",
    children: "ကလေး",
    adults: "လူကြီး",
    byDecision: "ဆုံးဖြတ်ချက် အလိုက်",
    byVillage: "ကျေးရွာ အလိုက်",
    colEncounters: "စစ်ဆေးမှု",
    colPctTotal: "ခုနှုန်း %",
    colReferralRate: "ပို့ဆောင်မှု နှုန်း",
    villageUnknown: "မသတ်မှတ်ရေး",
    stockReportTitle: "ယနေ့ ဆေးသုံးစွဲမှု (ချက်ချင်း)",
    stockReportSubtitle: "ကုသမှု / တယ်လီ အကြံပြု လုပ်ဆောင်ချက်မှတ်တမ်းများ",
    stockReportEmpty: "ယနေ့ ဆေးပေးမှု မှတ်တမ်း မရှိသေးပါ။",
    stockColDrug: "ဆေး",
    stockColGiven: "ပေးပြီး",
    stockColOutOfStock: "စတော့ မရှိ",
    stockColNotIndicated: "မလိုပါ",
    stockPatientsLogged: "မှတ်တမ်းရှိ လူနာ",
    recent: "မကြာသေးမီ လူနာများ",
    colTime: "အချိန်",
    colName: "အမည်",
    colVillage: "ကျေးရွာ",
    colAge: "အသက်အုပ်စု",
    colDecision: "ဆုံးဖြတ်ချက်",
    empty: "မှတ်တမ်း မရှိသေးပါ။ လူနာ စစ်ဆေးပြီးပါက ဤနေရာတွင် ပေါ်လာပါမည်။",
    print: "ပရင့်ထုတ်ရန် / သိမ်းရန်",
    generatedAt: "ထုတ်ယူချိန်",
  },

  referReason: {
    hypoxia: "အောက်ဆီဂျင် နည်းပါးခြင်း",
    hypotension: "သွေးဖိအား နည်းပါးခြင်း",
    weakPulse: "သွေးခုန်နှုန်း အားနည်း သို့မဟုတ် မရှိ",
    elevatedQsofa: "qSOFA မြင့်မားခြင်း",
    elevatedNews2: "NEWS2 မြင့်မားခြင်း",
    elevatedSepsisScreen: "ဖျားနာရောဂါ ပြင်းထန်မှု",
    elevatedSevereIllness: "ပြင်းထန်သော ရောဂါ လက္ခဏာ မြင့်မား",
    referImmediately: "ချက်ချင်း ပို့ဆောင်ရန်",
    referSameDay: "ယနေ့ပို့ဆောင်ရန်",
    refer: "ပို့ဆောင်ရန်",
  },

  treatment: {
    noOutpatient: "လူနာအပြင်ဘက် ကုသမှု မစတင်ရ",
    noOutpatientDetail:
      "ပို့ဆောင်ရေး ဆေးရုံသို့ အမြန်သွားရန် စီစဉ်ပါ။ တယ်လီ အကြံပြုခန်း မတိုင်မီ ဒေသန္တရ ပရိုတိုကောလ် အရ တည်ငြိမ်အောင် ကုသပါ။",
    actOutOfStock:
      "ဌက်ဖျားရောဂါ ယူဆကုသမှု လိုအပ်သော်လည်း ငှက်ဖျားဆေး မရှိပါ။",
    actOutOfStockDetail:
      "ငှက်ဖျားဆေး ရရှိရန် ပို့ဆောင်ရန် သို့မဟုတ် ယူဆကုသမှု မလုပ်မီ စတော့ ရယူပါ။",
    giveAct: (dose: string) => `ယူဆ ငှက်ဖျားဆေး ပေးရန်: ${dose}။`,
    actDetail: (dose: string, feverSupport: string) =>
      `ဌက်ဖျားရောဂါ ဖြစ်ပွားမှု များသောဒေသတွင် ဖြစ်သော သာမန်အဖျား — ယခု ${dose} စတင်ပါ။${feverSupport} အမြန်စစ်ဆေးမှု မလိုပါ။`,
    paracetamolForFever: " ဖျားရန် အတွက် ပါရာစီတမောပေးပါ။",
    recheckInDays: (days: number) =>
      ` ဤလူနာကို ${days} ရက်အကြာတွင် ပြန်စစ်ဆေးရန်။`,
    giveParacetamol: "ဖျားရန် အတွက် ပါရာစီတမော ပေးရန်",
    supportiveFever: (days: number) =>
      `ရိုးရှင်းသော ဖျားအတွက် ထောက်ပံ့ကုသမှု။ ${days} ရက်အကြာတွင် ပြန်စစ်ဆေးရန်။ အန္တရာယ်လက္ခဏာ ပေါ်ပါက အမြန်ပြန်လာရန်။`,
    supportiveCare: "ထောက်ပံ့ကုသမှု နှင့် စောင့်ကြည့်ခြင်း",
    monitorHome: (days: number) =>
      `အိမ်တွင် စောင့်ကြည့်ပါ။ ${days} ရက်အကြာတွင် ပြန်စစ်ဆေးရန်။ အခြေအနေ ဆိုးပါက အမြန်ပြန်လာရန်။`,
    noAntimalarial: "ဌက်ဖျားရောဂါ ကုသစရာ မလို",
    noAntimalarialDetail:
      "ဖျားမရှိဘဲ အန္တရာယ်နည်း — ပုံမှန်ကြည့်ရှုရေး။ ဖျားပါက ပြန်လာရန် အကြံပြုပါ။",
    supportiveLowRisk:
      "အန္တရာယ်နည်း ဖျားရောဂါအတွက် ထောက်ပံ့ကုသမှု — ဌက်ဖျားရောဂါ ယူဆကုသမှု မလို",
    supportiveGeneral: "ထောက်ပံ့ကုသမှု",
    supportiveGeneralDetail:
      "အန္တရာယ်နည်း — အနားယူရန်၊ ရေဓာတ်ပြည့်ဝရန်။ အန္တရာယ်လက္ခဏာ ပေါ်ပါက ပြန်လာရန် အကြံပြုပါ။",
    actDoseUnder5:
      "ကိုယ်အလေးချိန် အလိုက် ငှက်ဖျားဆေး (artemether-lumefantrine) — ၅ နှစ်အောက် ပုံမှန် ပမာဏအတိုင်း",
    actDoseChild:
      "ကိုယ်အလေးချိန် အလိုက် ငှက်ဖျားဆေး (artemether-lumefantrine) — ကလေး ပုံမှန် ပမာဏအတိုင်း",
    actDoseAdult:
      "လူကြီး ငှက်ဖျားဆေး (artemether-lumefantrine) — ပုံမှန် ပမာဏအတိုင်း",
    teleconsultScheduled: (days: number, phone: string) =>
      `${days} ရက် ပြန်လာချိန် တယ်လီ အကြံပြု စီစဉ်ပြီး။ အခြေအနေ ဆိုးပါက ${phone} သို့ ခေါ်ဆိုပါ။`,
  },
} as const;

/** IMCI danger-sign codes → Myanmar labels (for referral reason lines) */
export const dangerSignLabelsMm: Record<string, string> = {
  "imci:vomits_everything": mm.dangerSigns.vomitsEverything,
  "imci:convulsions": mm.dangerSigns.convulsions,
  "imci:lethargic": mm.dangerSigns.lethargic,
  "imci:unconscious": mm.dangerSigns.unconscious,
  "imci:chest_indrawing": mm.dangerSigns.chestIndrawing,
  "imci:stiff_neck": mm.dangerSigns.stiffNeck,
  "imci:bulging_fontanelle": mm.dangerSigns.bulgingFontanelle,
  "imci:severe_palmar_pallor": mm.dangerSigns.severePallor,
  neonate_fever: mm.dangerSigns.neonateFever,
};

/** Pathway-aware label for danger signs whose wording differs by child/adult. */
export function dangerSignLabelMm(
  code: string,
  pathway?: string,
): string | undefined {
  if (code === "imci:unable_to_drink_or_breastfeed") {
    return pathway === mm.age.pathwayAdult
      ? mm.dangerSigns.unableToDrinkAdult
      : mm.dangerSigns.unableToDrinkPediatric;
  }
  return dangerSignLabelsMm[code];
}
