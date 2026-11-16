# Fase 1: Grunnmur, oppskrifter og ukeplan

Les først `PROMPT.md` for den fulle visjonen. **I denne omgangen bygger vi BARE det som står her.** Innlogging, deling, tale, handleliste og AI kommer senere, etter at jeg har fått tilbakemeldinger på prototypen fra venner og familie.

## Om meg og hvordan du skal jobbe
- Jeg er nybegynner og kan nesten ingenting om backend eller apputvikling. Forklar på **norsk, kort og enkelt**.
- Arbeidsmåte: **bygg raskt, forklar kort.** Etter hvert steg: 2–4 setninger om hva du gjorde og hvorfor, og hvordan jeg kan se resultatet.
- Når jeg må gjøre noe selv (lage konto, klikke, godkjenne), gi nummererte steg med nøyaktig hva jeg skal klikke på.
- Lag en kort plan først og vent på at jeg godkjenner den. Stopp etter hvert delmål (A–F under) og vent på «fortsett».
- Spør før du tar valg som ikke står her. Forklar alternativene og konsekvensene.
- Jeg bruker Windows og PowerShell. Node v26 og Git er installert.

## Teknologivalg (allerede bestemt)
- **React + Vite + TypeScript**
- **Tailwind CSS + shadcn/ui**, med primærfarge lilla `#7C3AED` (mørk `#6D28D9`, lys `#F5F3FF`/`#EDE9FE`), bakgrunn `#FAF9FC`, tekst `#1F1B2E`, dempet tekst `#6B6880`, font Inter, avrundede hjørner (14–18 px) og store trykkflater (min. 44 px)
- **Vitest** for tester på de viktigste reglene
- **Lagring i nettleseren foreløpig** (localStorage). All lesing og skriving av data skal gå gjennom ett eget lag (f.eks. `src/data/repository.ts`), slik at vi enkelt kan bytte til Supabase i fase 5 uten å skrive om skjermene.
- **i18n** (react-i18next) med norsk som standard, og tysk og engelsk klargjort. Ingen hardkodet tekst i komponentene.
- **Offentlig GitHub-repo.** Hemmeligheter (API-nøkler osv.) skal aldri inn i koden. Sett opp `.gitignore` og `.env.example` fra start.

## Må fungere på alle telefoner
Appen skal fungere like godt på **iPhone (Safari), Android (Chrome, Samsung Internet) og PC (Chrome, Edge, Safari, Firefox)**:
- **PWA:** manifest, ikoner (inkl. maskable-ikon for Android og apple-touch-icon for iPhone) og service worker, slik at appen kan installeres på hjemskjermen på både Android og iPhone. Vis en liten guide «Legg til på hjemskjermen» som tilpasser seg enheten (Android: installer-knapp, iPhone: Del → «Legg til på Hjem-skjerm»).
- Responsivt fra små Android-skjermer (360 px) og opp. Respekter «safe areas» (notch på iPhone, navigasjonslinje på Android) og Android-tilbakeknappen (lukker åpne ark og dialoger).
- Funksjoner som bare støttes i noen nettlesere (tale, kamera, passkeys) skal sjekkes med feature-detection og vise en vennlig melding hvis de ikke støttes. Appen skal aldri krasje.
- Forklar meg hvordan jeg tester på Android og iPhone (f.eks. Chrome DevTools sin enhetsemulering, og ekte telefon via lokal nettverksadresse).

## Delmål

### A. Prosjektoppsett og GitHub
1. Opprett prosjektet i denne mappen (behold `PROMPT.md`, `FASE1_PROMPT.md` og `FIGMA_MAKE_*.md`, flytt dem gjerne til `docs/`).
2. Lag `CLAUDE.md` (på engelsk) med prosjektoppsummering, teknologivalg, mappestruktur og hvilken fase vi er i. Hold den oppdatert.
3. Jeg har **ikke GitHub-konto**. Guid meg steg for steg til å lage en gratis konto med min **private e-post** (ikke bootcamp-e-posten). Hjelp meg deretter med å sette opp git-navn og e-post, og koble prosjektet til et nytt **offentlig** repo kalt `maltidsplanlegger`. Bruk gjerne GitHub CLI (`gh`) hvis det er enklest, og forklar hva den er.
4. Commit etter hvert ferdige steg med korte, tydelige commit-meldinger **på engelsk**, og push til GitHub.

### B. Designsystem og app-skall
- Farger, typografi og grunnkomponenter (knapp, kort, chip, bottom sheet, toast, bryter, input) i lilla stil.
- Mobil først (390 px), men skal også se bra ut på PC.
- Bunnmeny med **Uke · Handleliste · Hjemme · Oppskrifter · Innstillinger**. Skjermene som ikke bygges nå, viser en vennlig «Kommer snart»-tilstand.
- Enkel ruting mellom skjermene.

### C. Datamodell
Definer TypeScript-typer og forklar dem kort for meg:
- `Recipe` (id, navn, måltidstype frokost/lunsj/middag, tid, porsjoner, protein og kcal per porsjon, ingredienser med mengde og enhet, steg, tagger som `fisk`/`nøtter`/`svin`, favoritt)
- `Ingredient`, `WeekPlan` (uke → dag → frokost/lunsj/middag), `HouseholdSettings` (antall voksne og barn, utelukket mat – **svinekjøtt utelukket som standard**, språk)

### D. Oppskriftsbibliotek
- Startdata: de 14 oppskriftene fra prototypen (listen nederst), med ingredienser, mengder og steg.
- Oppskriftsliste med søk, filtre (Alle / Frokost / Middag / Lunsj / Favoritter) og favoritt-hjerte.
- Oppskriftsdetalj i et bottom sheet: protein, tid, kcal, ingredienser skalert til husholdningen og steg.
- Legg til, rediger og slett oppskrifter manuelt (et enkelt skjema). Import fra lenke eller bilde med AI kommer i fase 6.

### E. Ukeplan
- Kalender mandag–søndag med dato, og forrige/neste uke.
- Knappen **«Lag ukeplan»** fyller uken automatisk.
- **Regler (skal ha tester):**
  - Fredag har **ingen middag**.
  - Lunsj = **rester fra middagen dagen før** (mandag = rester fra søndag). Vises som «Rester fra søndag».
  - Lørdag har **egen rask lunsj**.
  - Utelukket mat (f.eks. svinekjøtt) foreslås **aldri**.
  - Vanlige middager tar maks 30 min.
  - Middagen beregnes med ekstra porsjoner til neste dags lunsj.
  - Favoritter foreslås litt oftere.
- Bytt én rett (↻). Bytter man middag, oppdateres lunsjen dagen etter.
- Protein per rett og totalt per dag.
- Innstillinger (enkel versjon nå): antall voksne og barn, utelukket mat, språk.

### F. Dokumentasjon for porteføljen – ALT PÅ ENGELSK
**All dokumentasjon skal skrives på engelsk**: README, beslutningslogg, tilbakemeldingslogg, PRD, `CLAUDE.md`, kodekommentarer og commit-meldinger. Bare forklaringene du gir meg i chatten skal være på norsk. Appens brukergrensesnitt er fortsatt norsk som standard (med tysk og engelsk via i18n).

Lag:
- `README.md` i rotmappen: what the app is, the problem it solves, key features, tech stack, how to run it, and placeholders for screenshots and a live link. Professional tone, written for employers.
- `docs/DECISIONS.md` – a decision log (date, decision, alternatives considered, rationale, consequences). Start with the decisions I have already made:
  1. Public GitHub repo – to show code to employers
  2. Claude Code builds fast with short explanations – focus on progress and the PM role
  3. TypeScript – catches errors early, in demand by employers
  4. Browser storage first, Supabase later – free, quick start, backend postponed until after user feedback
  5. React + Vite – most widely used, simple, free hosting
  6. Tailwind + shadcn/ui – professional look quickly
  7. Tests on core business rules – rules don't break when we change things
  8. Login with Google + email/password, Face ID/fingerprint via passkeys – free; no Sign in with Apple due to cost
  9. Calendar sync optional and off by default
  10. PWA instead of native app-store apps – one codebase for iPhone, Android and desktop, free, no App Store / Google Play fees
- `docs/FEEDBACK_LOG.md` – a template for logging user feedback (who/role, what they said, insight, priority, what I changed and why).
- `docs/PRD.md` – a short product requirements document (problem, target users, goals and success metrics, features as Must/Should/Could, out of scope).

Add new decisions to the log (in English) whenever we make a choice.

## Når fase 1 er ferdig
Gi meg en kort oppsummering, vis hvordan jeg kjører appen lokalt (`npm run dev`) og åpner den på mobilen i samme nettverk, og foreslå hva som bør skje i fase 2.

## Startoppskrifter (proteinrike, uten svinekjøtt, maks 30 min)
- **Frokost:** Gresk yoghurt med bær og nøtter (25 g), Eggerøre med cottage cheese (28 g), Proteinpannekaker med banan (24 g), Overnight oats med skyr (26 g), Omelett med spinat og feta (27 g)
- **Middag:** Kylling-tikka med ris (42 g), Laks med søtpotet og brokkoli (38 g), Taco med storfekjøttdeig (35 g), Kylling-wok med nudler (40 g), Linse- og kikertgryte (24 g), Kalkunburger med salat (36 g), Tunfiskpasta med erter (34 g)
- **Lørdagslunsj:** Kyllingwrap med hummus (32 g), Tunfisk-bowl med egg (35 g)
