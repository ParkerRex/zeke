// sv.ts
export default {
  navigation: {
    today: "Idag",
    sources: "Källor",
    stories: "Nyheter",
    insights: "Insikter",
    briefs: "Sammandrag",
    playbooks: "Handlingsplaner",
    watchlists: "Bevakningslistor",
    settings: {
      root: "Inställningar",
      workspace: "Arbetsyta",
      team: "Team",
      notifications: "Aviseringar",
      developer: "Utvecklare",
    },
  },
  status: {
    loading: "Laddar …",
    loadError: "Det går inte att ladda data just nu.",
    retry: "Försök igen",
    comingSoon: "Vi färdigställer den här upplevelsen – tack för tålamodet.",
    openStory: "Välj en story för att visa detaljer.",
  },
  today: {
    title: "Dagens viktigaste nyheter",
    description: "Dagens främsta AI- och teknikhistorier med kontextuella insikter.",
  },
  stories: {
    title: "Nyheter",
    description: "Utforska AI-drivna nyhetsartiklar med sammanhang och sammanfattningar.",
    discoverHeading: "Utforska nyheter",
    searchPlaceholder: "Sök efter artiklar (titel eller URL)…",
    filter: {
      all: "Alla",
      youtube: "YouTube",
      arxiv: "arXiv",
      podcast: "Podcast",
      reddit: "Reddit",
      hn: "HN",
      article: "Artikel",
    },
    loadMore: "Ladda fler",
    showingCount: "Visar {shown} av {total} nyheter",
    personalizedTitle: "Personligt nyhetsflöde",
    gatedTitle: "Registrera dig för att låsa upp det personliga nyhetsflödet och mycket mer",
    signupCta: "Registrera dig",
    settingsAria: "Inställningar",
  },
  news: {
    topTitle: "Toppnyheter",
    latestTitle: "Senaste nyheter",
    showMore: "Visa mer",
    hypeScore: "Hype-poäng",
    hypeLabel: "Hype",
    coverage: "{value}% {label} täckning",
    coverageLabel: "vänster",
    sources: {
      one: "{count} källa",
      other: "{count} källor",
    },
    timeAgo: "för {time} sedan",
    chiliAria: "styrka",
  },
  watchlists: {
    header: "Bevakningslistor",
    empty: "Skapa en lista över objekt att bevaka. Kommer snart.",
  },
  insights: {
    header: "Insikter",
    intro1:
      "Granskning av insikter hamnar här – vi lyfter fram höjdpunkter, länkar tillbaka till underliggande källor och lägger upp uppföljningar i kö. Datakontrakten är på plats och instrumentpanelen tänds när de nya Trigger.dev-jobben för insikter landar.",
    intro2:
      "Tills dess påminner ytan om att stories mynnar ut i insikter, och gränssnittet speglar Midday-flödet fast med Zekes vokabulär.",
  },
  sources: {
    header: "Källor",
    intro1:
      "Här kopplar team ihop RSS-flöden, nyhetsbrev, forskningsbibliotek och andra insamlingskällor. Vi färdigställer Trigger.dev-jobben och Cloudflare-routrarna, så UI:t är tills vidare en platshållare.",
    intro2:
      "Så snart onboardingflödet är på plats kan du lägga till källor här och låta ZEKE samla in, normalisera och dirigera stories genom det nya jobbsystemet.",
  },
  briefs: {
    header: "Sammandrag",
    intro1:
      "Playbooks och sammanfattningar mynnar ut i sammandrag – strukturerade paket att dela eller exportera. Rapporteringskedjan kopplas fortfarande, så betrakta detta som en platshållare medan flödet story → insikt → sammandrag tar form.",
  },
  playbooks: {
    header: "Handlingsplaner",
    intro1:
      "Handlingsplaner låter dig kedja Trigger.dev-jobb – samla källor, skapa insikter och publicera sammandrag på schema. UI:t landar när orkestreringen är stabil; tills dess behåller vi en platshållare så navigationen fortsätter följa Midday-strukturen.",
  },
  overlay: {
    whyItMatters: "Varför det är viktigt",
    hype: "Hype",
    confidence: "säkerhet",
    sources: "Källor",
    share: "Dela",
  },
  tabs: {
    one: "Stängde {count} flik",
    other: "Stängde {count} flikar",
    undo: "Ångra",
  },
  support: {
    success: "Supportärende skickat.",
    error: "Något gick fel, försök igen.",
    subjectLabel: "Ämne",
    subjectPlaceholder: "Sammanfatta problemet du har",
    areaLabel: "Område",
    areaPlaceholder: "Välj område",
    areas: {
      stories: "Stories",
      insights: "Insikter",
      watchlists: "Bevakningslistor",
      sources: "Källor",
      briefs: "Sammandrag",
      playbooks: "Handlingsplaner",
      integrations: "Integrationer",
      general: "Allmänt",
    },
    severityLabel: "Allvarlighetsgrad",
    severityPlaceholder: "Välj allvarlighetsgrad",
    severities: {
      low: "Låg",
      normal: "Normal",
      high: "Hög",
      urgent: "Brådskande",
    },
    messageLabel: "Meddelande",
    messagePlaceholder:
      "Beskriv problemet du upplever samt relevant information. Var så detaljerad som möjligt.",
    submit: "Skicka",
  },
  feedback: {
    trigger: "Feedback",
    thanksTitle: "Tack för din feedback!",
    thanksBody: "Vi återkommer så snart som möjligt",
    textareaPlaceholder: "Idéer för att förbättra sidan eller problem du upplever.",
    send: "Skicka",
  },
}