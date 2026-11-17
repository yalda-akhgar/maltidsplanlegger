# Prosjekt: Måltidsplanlegger (proteinrik familie-app)

Du skal hjelpe meg å bygge en personlig måltidsplanlegger-app. Jeg er nybegynner i koding, så:

- **Forklar alt på norsk, enkelt og steg for steg.** Når jeg må gjøre noe selv (lage konto, kopiere en nøkkel, åpne en lenke), skriv nøyaktig hva jeg skal klikke på.
- **Jobb i faser (se nederst).** Etter hver fase: stopp, fortell meg hvordan jeg tester det i nettleseren, og vent på at jeg sier «fortsett».
- Start med å lage en `CLAUDE.md` som oppsummerer prosjektet, valgene under og hvilken fase vi er i, og oppdater den underveis.
- **All dokumentasjon skal være på engelsk** (README, `CLAUDE.md`, `docs/`, beslutningslogg, tilbakemeldingslogg, PRD, kodekommentarer og commit-meldinger). Forklaringene til meg i chatten skal være på norsk.
- Bruk git fra start og commit etter hvert ferdige steg med tydelige meldinger.
- Spør meg før du installerer noe stort eller tar et valg som ikke står her.

---

## 1. Hva appen skal gjøre

### Ukeplan og kalender
- Kalendervisning for uken: **mandag–søndag med dato** (f.eks. «Mandag 16. nov»). Hver dag har **frokost, lunsj og middag**.
- **Fredag: ingen middag.** Fredag vises uten middagsfelt.
- **Lunsj = rester fra middagen dagen før.** Middagen beregnes derfor med ekstra porsjoner til neste dags lunsj, og lunsjen viser f.eks. «Rester: Kylling-tikka (fra søndag)».
- **Lørdag lunsj:** egen rask, proteinrik lunsj (det blir ingen rester fra fredag).
- Knappen **«Lag ukeplan»** fyller hele uken automatisk ut fra oppskriftene mine. Deretter kan jeg:
  - bytte én rett med ett trykk («Gi meg et annet forslag»)
  - dra en rett til en annen dag
  - velge en rett manuelt fra oppskriftslisten
- Man skal kunne bla til forrige og neste uke.
- Alle måltider skal være **proteinrike**. Vis protein (g) per porsjon på hver rett, og totalt protein per dag.
- Vanlige middager skal ta **maks 30 minutter** å lage.

### Daglig proteinmål (VIKTIG – kjernefunksjon)
- **Hver voksen har sitt eget daglige proteinmål** (f.eks. Yalda 120 g, mannen min 140 g). Barn har ikke mål, men får vanlige barneporsjoner.
- **Oppstart (onboarding) første gang man åpner/logger inn:** noen korte, vennlige steg:
  1. Velkommen og navn
  2. **«Hvor mye protein trenger du daglig?»**: tallfelt i gram (f.eks. 80 eller 120), med valgfri hjelp «Vet du ikke? Regn ut» (kroppsvekt × 1,2–2,0 g avhengig av aktivitetsnivå, med en kort forklaring om at det er et veiledende tall)
  3. Husholdning: antall voksne og barn (andre voksne setter sitt eget mål når de blir med)
  4. Mat vi ikke vil ha (svinekjøtt forhåndsvalgt)
  5. Cheat day(s) (valgfritt)
  Hvert steg kan hoppes over med fornuftige standardverdier. Etterpå lages første ukeplan automatisk.
- **Proteinmålet kan endres når som helst** under Innstillinger → «Min profil». Ukeplanen for inneværende og kommende uker oppdateres da (bakover i tid endres ikke).
- **Planleggeren velger retter og justerer porsjoner** slik at frokost + lunsj + middag + kveldssnacks til sammen treffer målet for hver person (f.eks. 3 egg i stedet for 2, større porsjon kylling).
- **Standard fordeling:** ca. 25 % frokost, 30 % lunsj, 30 % middag, 15 % snacks. Kan justeres i innstillingene.
- Mangler det fortsatt protein, foreslår appen en **«proteinboost»** (f.eks. «+1 beger skyr = 12 g», «+1 kokt egg = 6 g»).
- Hver dag viser en **fremdriftsindikator per person**, f.eks. «Yalda: 118 / 120 g». Hvert måltid viser personlig porsjon og protein.
- **Cheat days:** Proteinmålet gjelder fortsatt, slik at frokost, lunsj og middag dekker proteinet selv om snacksen er cheat.
- Ingredienser og snacks trenger proteinverdier per enhet (f.eks. egg ≈ 6 g/stk, skyr ≈ 11 g/100 g, kyllingfilet ≈ 23 g/100 g), slik at porsjoner kan beregnes.
- Reglene for proteinberegning skal ha tester.

### Kveldssnacks og cheat days
- **Hver kveld har én kveldssnacks** (4. rad i dagen), som kan byttes med ↻.
- **Vanlige dager:** snacksen skal alltid være **proteinrik og sunn** (f.eks. skyr, gresk yoghurt, cottage cheese, kokte egg, nøtter, edamame, frukt med kesam, grønnsaker med hummus) og vise protein og ca. kcal.
- **Cheat days (valgfrie dager i innstillingene):** Bare da kan snacksen være noe annet, f.eks. nachos eller is fra favorittlisten, merket «Cheat day». Proteinmålet gjelder fortsatt.
- **Snack-favoritter:** Man kan favorisere snacks slik at de dukker opp oftere, gjerne flere kvelder i uken, men **med variasjon** (f.eks. skyr med vanilje, blåbær og mango på ulike kvelder). Egne favoritter legges til og merkes «sunn» eller «cheat».
- **Ingen sesong-logikk i brukergrensesnittet.** Appen skal fungere likt i Norge, Tyskland og andre land. (Sesong kan eventuelt brukes diskret i bakgrunnen senere, men ikke nå.)
- Snacks i ukeplanen legges automatisk på **handlelisten** (fase 3).

### Næringsrik balanse hver dag
- Målet er at **hver dag er næringsrik**, ikke bare proteinrik: planleggeren skal sørge for variasjon i proteinkilder (kylling, fisk, egg, meieri, belgfrukter, storfe) og at hver dag inneholder **grønnsaker og frukt** og **fiberrike karbohydrater** (fullkorn, havre, belgfrukter).
- Vis en enkel **«Dagens næring»**-oppsummering per dag: protein (mot mål), porsjoner frukt og grønt (mål ca. 5 om dagen), fiber og ca. kcal. Hold det enkelt og positivt, uten medisinske råd.
- Unngå at samme proteinkilde dominerer flere dager på rad (f.eks. ikke kylling til middag tre dager på rad).
- Oppskrifter og snacks trenger derfor enkle næringsdata: protein, kcal, fiber og antall frukt-/grønt-porsjoner.

### Familie, porsjoner og preferanser
- Planen er for **en familie med barn**. I innstillingene kan jeg sette antall voksne og barn, og mengdene i oppskrifter og handleliste skaleres automatisk.
- **Ekskluder mat:** I innstillingene kan jeg velge bort ingredienser eller kategorier jeg ikke vil ha. **Bare svinekjøtt er valgt bort som standard** (vi spiser fisk og nøtter). Man kan legge til egne ting man ikke vil ha via feltet «Legg til mat vi ikke vil ha». Utelukket mat skal aldri foreslås, verken i ukeplan, «Hva har jeg i kjøleskapet?» eller AI-forslag.

### «Hva kan jeg lage?» – ut fra det jeg har hjemme
- Et inputfelt der jeg skriver (eller sier) hva jeg har i kjøleskapet, f.eks. «kyllingfilet, paprika, ris, egg».
- Appen foreslår **enkle, sunne og proteinrike middager**:
  1. **Først gratis matching** mot mine egne oppskrifter (sortert etter hvor mange ingredienser jeg allerede har, og vis hva som mangler).
  2. **Knapp «Foreslå noe nytt med AI»**, som bruker Claude API til å lage en ny oppskrift ut fra ingrediensene, mine preferanser og utelukkelser. Et AI-forslag skal kunne lagres som ny oppskrift med ett trykk.

### Ingredienser hjemme (lager)
- En liste over alle ingredienser vi har hjemme, med status **«har» / «tom»**.
- Jeg kan legge til ingredienser på tre måter:
  - **Skrive** dem inn
  - **Tale** (se under)
  - **Bilde:** ta bilde av kjøleskapet, skapet eller en kvittering, så kjenner AI igjen varene og foreslår dem (jeg bekrefter før de lagres)
- Når jeg markerer noe som **tom** (f.eks. olje), legges det automatisk på handlelisten.
- Basisvarer (olje, salt, krydder, mel osv.) skal ikke legges på handlelisten hver uke, bare når de er markert som tomme.

### Handleliste
- Lages automatisk fra **ukeplanen minus det vi har hjemme, pluss alt som er markert tomt**.
- Mengdene slås sammen (2 oppskrifter med løk = én linje med total mengde).
- Grupper etter butikkavdeling (frukt og grønt, kjøtt og fisk, meieri, tørrvarer, frys osv.).
- Avkrysning når noe er kjøpt. Kjøpte varer går automatisk tilbake til «har» i lageret.
- Mulighet for å legge til egne varer manuelt (også ting som ikke er mat).
- **Delt i sanntid:** Hvis mannen min krysser av noe i butikken, ser jeg det med en gang.
- **Spør om varer som er brukt:** Når handlelisten lages, spør appen om varer ukeplanen har brukt: «Forrige uke brukte dere kyllingfilet og kikerter. Har dere fortsatt igjen? [Ja] [Nei, legg på listen]». Ingen mengderegistrering nødvendig.

### Tale
- En tydelig mikrofonknapp (alltid lett tilgjengelig, også på mobil).
- Eksempler på hva jeg kan si:
  - «Jeg har gått tom for olje» → olje settes til tom og havner på handlelisten
  - «Legg til melk og egg på handlelisten»
  - «Jeg har kylling, brokkoli og ris, hva kan jeg lage?»
  - «Lag handleliste» / «Vis handlelisten»
- Bruk nettleserens innebygde talegjenkjenning (Web Speech API) på valgt språk. Tolk enkle kommandoer selv og bruk Claude API til å forstå friere setninger. Fungerer ikke tale i nettleseren, vis en vennlig melding.

### Oppskrifter
- Oppskriftsbibliotek med søk og filtre (frokost / lunsj / middag, tid, protein).
- Hver oppskrift har: navn, bilde (valgfritt), måltidstype, tid, porsjoner, ingredienser med mengde og enhet, fremgangsmåte, protein og kalorier per porsjon, og tagger.
- Jeg skal enkelt kunne **legge til nye oppskrifter** når jeg finner dem:
  - skrive inn manuelt
  - lime inn en **lenke** til en oppskrift, så henter AI ut og fyller inn feltene
  - ta **bilde** av en oppskrift (bok eller skjermbilde), så leser AI den
  - Jeg ser alltid over og kan redigere før den lagres.
- Redigere og slette oppskrifter, og markere favoritter (favoritter foreslås oftere i ukeplanen).
- **Startdata:** Legg inn ca. 25 enkle, proteinrike og barnevennlige oppskrifter uten svinekjøtt (frokost, middag og lørdagslunsj) basert på listen min under.

### Matvarer jeg liker (bruk disse i oppskrifter og forslag)
```
[LIM INN LISTEN DIN HER]
```

### Innlogging
- Appen krever innlogging. Innloggingsskjermen har:
  - **«Fortsett med Google»** (Supabase Google OAuth)
  - **E-post + passord**, med «Opprett konto» og «Glemt passord?»
  - **«Logg inn med Face ID / fingeravtrykk»** via **passkeys (WebAuthn)**. Første gang logger man inn med Google eller e-post. Deretter tilbyr appen «Vil du bruke Face ID neste gang?». Passkeys kan administreres og slettes under Innstillinger.
- **Man holder seg innlogget** på enheten til man logger ut selv (Logg ut-knapp i Innstillinger).
- Ikke bruk «Logg inn med Apple», fordi det krever en betalt Apple-utviklerkonto.
- Alt skal være gratis i bruk for en familie (Supabase gratisplan).

### Deling med familie
- Jeg kan **invitere mannen min (og andre) på e-post**. De får en lenke, lager konto (Google eller e-post) og blir automatisk med i husholdningen vår. Alle i husholdningen ser og kan redigere **samme ukeplan, handleliste, lager og oppskrifter**.
- Ekstra: en «kun se»-lenke til ukeplanen som jeg kan sende til andre (f.eks. besteforeldre eller barnevakt).
- **Kalendersynk (valgfritt, AV som standard):** Under Innstillinger finnes bryteren «Vis måltider i Google-/Outlook-kalender». Først når den slås på, lager appen en iCal-lenke man kan abonnere på. Den kan slås av igjen når som helst, og da slutter lenken å virke.

### Språk
- Appen skal finnes på **norsk, tysk og engelsk**, og det skal være lett å **legge til flere språk** senere (alle tekster i egne språkfiler, ingen hardkodet tekst).
- Språkvelger i innstillingene. Tale og AI-svar følger valgt språk.

---

## 2. Design
- **Primærfarge: lilla `#7C3AED`**, med lysere og mørkere nyanser (lys lilla til bakgrunner og valgte elementer, mørk lilla til hover).
- Elegant, rolig og **veldig enkel å bruke**: mye luft, avrundede hjørner, myke skygger, tydelig typografi (f.eks. Inter), store trykkflater på mobil.
- **Mobil først**, men skal også se bra ut på PC.
- Navigasjon på mobil: bunnmeny med **Uke · Handleliste · Hjemme · Oppskrifter · Innstillinger**, og mikrofonknapp godt synlig. På PC: sidemeny.
- Vennlige tomtilstander («Ingen oppskrifter ennå – legg til din første!»), tydelige bekreftelser og angre-mulighet når noe slettes.
- Skal kunne installeres på hjemskjermen på mobilen som en app (PWA).
- **Skal fungere på alle telefoner og nettlesere:** iPhone (Safari), Android (Chrome, Samsung Internet) og PC. Skjermstørrelser fra 360 px. Støtte for safe areas og Android-tilbakeknappen. Tale, kamera og Face ID/fingeravtrykk (passkeys) sjekkes med feature-detection og har en vennlig reserveløsning der de ikke støttes.

---

## 3. Teknologi (forslag – si fra hvis du har et bedre alternativ, men forklar hvorfor)
- **React + Vite + TypeScript + Tailwind CSS**
- **PWA** (installerbar, fungerer delvis uten nett, f.eks. handlelisten i butikken)
- **Supabase** for innlogging, database, sanntidsdeling og bildelagring. Bruk Row Level Security slik at bare medlemmer av en husholdning ser dataene sine.
- **Claude API** for AI-forslag, bilde- og oppskriftsgjenkjenning og tolkning av tale. **API-nøkkelen skal aldri ligge i frontend-koden**, men i en Supabase Edge Function. Appen skal fungere fullt ut uten AI hvis nøkkelen mangler (AI-knappene skjules eller viser en forklaring).
- **i18n** (f.eks. react-i18next) for språk
- **Hosting:** Vercel (gratis)
- Viktig: Alle kontoer (GitHub, Supabase, Vercel, Anthropic API) skal være **mine private kontoer**, ikke knyttet til bootcampen min, så appen fortsetter å fungere når bootcampen er over.

---

## 4. Ekstra funksjoner
- **Vurder retten (👍/👎)** etter måltidet. Likte retter foreslås oftere, mislikte sjeldnere.
- **«Vi spiser ute» / «Vi får besøk»:** hopp over et måltid eller legg til ekstra porsjoner for én dag. Handlelisten justeres.
- **Påminnelser:** f.eks. «Ta kyllingen ut av fryseren» kvelden før, og «Planlegg neste uke» på søndag (push-varsler i PWA; på iPhone krever det at appen er lagt til på hjemskjermen).
- **Matlagingsmodus:** steg for steg med stor tekst, innebygde tidtakere, og skjermen holdes våken (Wake Lock API).
- **Bruk opp før utløp:** utløpsdato på varer i Hjemme. Appen foreslår retter som bruker dem først.
- **Barnevennlig-merking + barnas preferanser:** oppskrifter merkes barnevennlig, og hvert barn kan ha ting det ikke liker.
- **Matpakke-modus:** lunsj (rester) vises som matpakke med en egen liste.
- **Ukebudsjett:** omtrentlig pris for handlelisten og forslag til billigere alternativer.
- **Tilbakemeldingsknapp i appen:** innspill lagres og kan eksporteres til `docs/FEEDBACK_LOG.md`.
- **Anonym bruksstatistikk med PostHog** (gratisplan): hvilke funksjoner som brukes, uten personopplysninger. Krever samtykke og en kort personvernerklæring.
- **Mørk modus** (lilla aksent beholdes) og **del handlelisten** via WhatsApp/SMS (Web Share API).
- **Ukesoppsummering:** snitt protein per person og frukt/grønt per dag denne uken.

## 5. Faser (stopp etter hver fase og vent på meg)

**Rekkefølge (endret 2026-11-17):** Etter fase 1 tas fase 3 (Hjemme + handleliste) før fase 2. Akseptansetesten viste at handlelisten er kjerneverdi. Numrene beholdes, så henvisninger til «fase 2» osv. gjelder fortsatt.

**Publisering (endret 2026-11-17, beslutning #174):** Appen publiseres (GitHub + Vercel, live lenke) rett etter fase 1, ikke i fase 7. Resten av fase 7 (kun-se-lenke, kalendersynk, påminnelser, tilbakemeldingsknapp, PostHog) blir der den er.

Rekkefølge nå: 1 → publisering → 3 → 2 → 4 → 5 → 6 → 7.

1. **Fundament:** oppsett, design (inkl. **mørk modus**), språk, datamodell (med felt for næring, barnevennlig, vurdering, pris og utløpsdato fra start), oppskrifter, ukeplan med proteinmål, kveldssnacks, næringsbalanse, oppstartsveiviser, **barnevennlig + barnas preferanser** og **«spiser ute/besøk»**. Lagres lokalt.
2. **Bruksopplevelse:** matlagingsmodus, vurder retten (👍/👎), ukesoppsummering og **marker måltider som spist**: knappen «✓ Spist» og «Jeg spiste noe annet → velg oppskrift» (eller hoppet over). Fremdriften viser spist protein i tillegg til planlagt. **Innsjekk og oppsummering** (beslutning #169): innstilling daglig, ukentlig eller av, med valgfritt tidspunkt (f.eks. kl. 20 eller søndag kveld). Innsjekk: «Spiste dere det som var planlagt i dag?» – kryss av alt med ett trykk, eller endre enkeltmåltider (spiste noe annet / hoppet over). Oppsummering med positiv tone, f.eks. «Snitt 116 / 120 g protein per dag. 5 av 7 dager nådde du målet – bra jobbet!». Ved mangel et konstruktivt tips, f.eks. «Onsdag og torsdag manglet 15–20 g. Vil du at neste ukeplan legger inn litt ekstra? [Ja, juster neste uke]». Tonen er alltid oppmuntrende, aldri skamfull, og uten medisinske råd.
3. **Hjemme + handleliste:** **Kjernen (beslutning #173, erstatter #172):**
   1. Knappen **«Godkjenn ukeplan»**.
   2. Ved godkjenning åpnes et ark med alle varene uken trenger, gruppert etter butikkavdeling. Varer vi har hjemme er krysset av på forhånd. Varer brukt forrige uke får «Har dere fortsatt …?».
   3. Jeg justerer og trykker **«Legg 12 varer på handlelisten»** (eller «Hopp over»). Ingenting legges til automatisk uten at jeg bekrefter.
   4. Bekreftelse: «Uke 47 er klar ✓ · 12 varer lagt til» med [Se handlelisten]. Jeg blir værende på ukeplanen.
   5. I handlelisten kan jeg legge til egne varer.
   6. Bytter jeg en rett etter godkjenning (f.eks. laks → kylling): dialog – laks ikke kjøpt: [Bytt] / [Behold laks, legg til kylling]; laks allerede kjøpt: «Legge til kylling?» [Ja]/[Nei] + tips «Bruke laksen en annen dag?»; kylling finnes hjemme: bare «Kylling har dere hjemme ✓»; brukes laksen i en annen rett samme uke, fjernes bare den ekstra mengden.

   I tillegg: har/tom, automatisk handleliste (inkl. snacks), **utløpsdatoer**, **matpakke-modus**, **ukebudsjett** og **del handlelisten** på WhatsApp/SMS. Når handlelisten lages, spør appen om varer forrige ukeplan brukte («Har dere fortsatt igjen?»). Innstillingen **«Fast handledag»** (f.eks. søndag): handlelisten dekker perioden frem til neste handledag. Man kan også velge perioden selv (f.eks. man–fre eller man–søn).
4. **Tale:** mikrofonknapp og talekommandoer, f.eks. «lag en favorittuke».
5. **Innlogging + deling:** Supabase, Google + e-post/passord, passkeys (Face ID/fingeravtrykk), husholdning, invitasjon på e-post, sanntid. Flytt lokale data til databasen.
6. **AI:** kjøleskap-forslag, bildegjenkjenning, import av oppskrift fra lenke/bilde (Edge Function + min egen API-nøkkel), og be om en ukeplan med friere ord (f.eks. «en uke med bare favorittene våre, men ikke fisk»).
7. **Publisering + innsikt:** ~~GitHub + Vercel~~ (flyttet til rett etter fase 1, #174), PWA-ikon (ferdig i fase 1), kun-se-lenke, valgfri kalendersynk, **påminnelser (push)**, **tilbakemeldingsknapp** og **PostHog-statistikk** med personvernerklæring.

Begynn med å lese dette, still meg eventuelle spørsmål du har, og lag deretter en kort plan for fase 1 før du skriver kode.
