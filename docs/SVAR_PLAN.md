# Svar på planen din

## VIKTIGSTE REGEL: Du tar aldri valg selv
- **Ta aldri noe valg selv**, verken om funksjoner, design, tekst, teknologi, pakker, mappestruktur, datamodell eller hvordan en regel skal fungere.
- Når et valg dukker opp: stopp, forklar kort hva valget gjelder, gi meg 2–3 alternativer med konsekvenser, si hva du **anbefaler** og hvorfor, og **vent på at jeg velger**.
- Samle gjerne flere små valg i én liste (slik du gjorde med de 8 forslagene), så jeg kan svare på alle samtidig.
- Er noe uklart i PROMPT.md eller SVAR_PLAN.md: spør, ikke gjett.
- Skriv denne regelen øverst i `CLAUDE.md`, slik at den gjelder i alle fremtidige økter også.
- Rene tekniske detaljer uten betydning for meg eller brukerne (f.eks. variabelnavn eller hvordan en fil er organisert internt) kan du bestemme selv, men nevn dem kort i oppsummeringen.

---

Godkjent, med endringene og tilleggene under. Jeg har oppdatert PROMPT.md. Les særlig seksjonene «Daglig proteinmål», «Kveldssnacks og cheat days», «Næringsrik balanse hver dag», «4. Ekstra funksjoner» og «5. Faser».

## Dine 8 forslag
- **1–4 og 6–8: OK.** (14 oppskrifter nå, barn = halv porsjon, mandagslunsj = søndagsmiddag fra uken før ellers rask lunsj, ingen gjentatt middag i en uke + favoritter dobbel sjanse, mikrofonknappen skjules til fase 4, sidemeny på PC / bunnmeny på mobil, og de fire pakkene kan installeres.)
- **5: ENDRES.** Bare svinekjøtt er valgt bort som standard. Vi spiser fisk og nøtter, så ikke ha dem som forhåndsvalg. I stedet: et felt «Legg til mat vi ikke vil ha».

## Nytt i fase 1

### 1. Daglig proteinmål (kjernefunksjon)
- Hver voksen har sitt eget daglige proteinmål (f.eks. 120 g og 140 g). I fase 1 lagres personene lokalt (navn + mål). Barn har ikke mål, men får barneporsjoner.
- Planleggeren velger retter OG justerer porsjonsstørrelse per person slik at frokost + lunsj + middag + kveldssnacks treffer målet. Standard fordeling 25/30/30/15 %, justerbar i innstillingene.
- Mangler det protein: foreslå en «proteinboost» (f.eks. +1 skyr = 12 g, +1 egg = 6 g).
- Fremdrift per person per dag, f.eks. «Yalda: 118 / 120 g».
- På cheat days gjelder proteinmålet fortsatt.
- Tester for proteinberegningen.

### 2. Oppstartsveiviser (første gang appen åpnes)
1) Velkommen + navn, 2) «Hvor mye protein trenger du daglig?» (gram, med valgfri «Vet du ikke? Regn ut»: kroppsvekt × 1,2–2,0 g etter aktivitetsnivå, merket som veiledende), 3) antall voksne og barn, 4) mat vi ikke vil ha (svinekjøtt forhåndsvalgt), 5) cheat day(s).
- Alle steg kan hoppes over. Etterpå lages første ukeplan automatisk.
- Proteinmålet kan endres når som helst under Innstillinger → «Min profil» (oppdaterer inneværende og kommende uker, ikke tidligere).
- I fase 5 kobles veiviseren til innloggingen.

### 3. Kveldssnacks
- Hver kveld har én kveldssnacks (4. rad i dagen), som kan byttes med ↻.
- Vanlige dager: alltid proteinrik og sunn (skyr, gresk yoghurt, cottage cheese, kokte egg, nøtter, edamame, frukt med kesam, grønnsaker med hummus osv.), med protein og ca. kcal.
- Bare på cheat days (valgfrie dager i innstillingene) kan snacksen være noe annet fra favorittlisten (f.eks. nachos, is), merket «Cheat day».
- Snack-favoritter: man kan favorisere snacks så de dukker opp oftere, gjerne flere kvelder i uken, men med variasjon (f.eks. skyr med vanilje, blåbær, mango på ulike kvelder). Egne favoritter merkes «sunn» eller «cheat».
- **Ingen sesong-logikk.** Appen skal fungere likt i Norge, Tyskland og andre land.

### 4. Næringsrik balanse hver dag
- Hver dag skal være næringsrik, ikke bare proteinrik: variasjon i proteinkilder, grønnsaker og frukt hver dag, og fiberrike karbohydrater.
- Unngå samme proteinkilde flere dager på rad (f.eks. ikke kylling til middag tre dager på rad).
- Enkel «Dagens næring»-oppsummering per dag: protein mot mål, porsjoner frukt og grønt (mål ca. 5), fiber og ca. kcal. Enkelt og positivt, uten medisinske råd.
- Næringsdata per ingrediens/enhet (protein, kcal, fiber, frukt/grønt-porsjoner), f.eks. egg ≈ 6 g protein/stk, skyr ≈ 11 g/100 g, kyllingfilet ≈ 23 g/100 g.
- Tester for balansereglene.

### 5. Andre ting i fase 1
- **Mørk modus** (lilla aksent beholdes).
- **Barnevennlig-merking** på oppskrifter + hvert barn kan ha ting det ikke liker.
- **«Vi spiser ute» / «Vi får besøk»** på en dag (hopp over måltid eller legg til ekstra porsjoner).
- **Datamodellen skal fra start ha plass til** næringsdata, barnevennlig, vurdering (👍/👎), pris og utløpsdato, selv om funksjonene for disse bygges i senere faser.

## Senere faser (ikke nå – se «5. Faser» i PROMPT.md)
- **Fase 2:** matlagingsmodus, vurder retten (👍/👎), ukesoppsummering
- **Fase 3:** handleliste (inkl. snacks), utløpsdatoer, matpakke-modus, ukebudsjett, del handlelisten på WhatsApp/SMS
- **Fase 7:** påminnelser (push), tilbakemeldingsknapp, PostHog-statistikk

## Neste steg
1. Oppdater planen med alt over, og si fra hvis dette endrer rekkefølgen på delmålene.
2. Legg alle valgene til i `docs/DECISIONS.md` (på engelsk), inkludert hvorfor funksjonene er fordelt på faser (MVP-prioritering: kjerneverdien proteinbalansert planlegging først, engasjementsfunksjoner etter at vi har ekte bruksdata).
3. **Vis meg den oppdaterte planen før du starter med delmål A.**
