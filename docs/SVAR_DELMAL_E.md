# Svar på delmål E + nye beslutninger

Husk regelen i CLAUDE.md: spør meg før du tar valg. Er noe her uklart, spør før du bygger.

## Bakgrunn
Appen skal brukes av **andre familier også**, ikke bare min. Regler som bare passer min familie (som fredag uten middag) skal derfor være **innstillinger**, ikke hardkodet.

## 1. Faste dager uten middag hjemme (erstatter hardkodet fredag)
- Fredag uten middag skal **ikke** være hardkodet.
- Ny innstilling: **«Faste dager vi ikke spiser middag hjemme»** (velg ukedager). **Standard: ingen dager.**
- Legg den inn som et **steg i oppstartsveiviseren** også.
- Min husholdning velger fredag.
- «Spiser ute» per måltid (engangsvalg) beholdes for de som ikke har faste dager.

## 2. Generaliser lunsjregelen
- Dagen etter en middag ute (fast dag eller «spiser ute») får en **rask lunsj**, ikke bare lørdag.

## 3. Proteinmål og måltider utenfor appen (spørsmål 1)
- **a)** Måltider utenfor appen (faste dager ute og «spiser ute») regnes **ikke** med i dagens mål. Appen teller bare det som planlegges i appen.

## 4. Barn som ikke liker noe (spørsmål 2)
- **a)** Gjenta heller en middag enn å servere noe et barn ikke liker. Endre koden.

## 5. Proteinboost (spørsmål 3)
- **a)** 1 egg, 2 dl melk, 100 g cottage cheese, 170 g skyr.

## 6. Planlegg selv (delmål F, nå)
- På hvert måltid skal man kunne **velge en rett selv** fra oppskriftslisten (med søk og filtre), eller gå til «Ny oppskrift».
- Man skal kunne **starte med en tom uke** og planlegge alt selv, la appen fylle ut alt, eller blande (appen fyller ut, jeg bytter).
- Mens man planlegger, viser fremdriften hvor nær proteinmålet dagen er.
- Dette gjelder både når man planlegger hele uken (f.eks. søndag kveld) og når man **bytter en rett samme dag** (f.eks. lasagne → fajitas i kveld). Protein beregnes alltid på nytt.

### Proteinpåvirkning når man velger eller bytter rett
- **I listen man velger fra:** hver rett viser hvordan den påvirker dagens mål, f.eks. «+5 g over målet» eller «20 g under målet». Da ser man konsekvensen **før** man velger.
- **Etter byttet:** porsjonene justeres først automatisk (som i planleggerreglene). Mangler det fortsatt protein, vises en **diskret melding (toast), ikke en pop-up som blokkerer**, f.eks.: «Fajitas i kveld: 20 g under målet i dag. Legg til skyr som kveldssnacks? [Legg til]».
- **Innstilling:** «Vis proteinvarsler» (på/av), **standard: på**. Når den er av, vises ingen meldinger, men tallene i listen og fremdriften vises fortsatt.

## 7. Matdagbok: planlagt vs. spist (bare datamodellen nå)
- Hvert måltid skal kunne ha status: **planlagt**, **spist**, **«spiste noe annet»** (med lenke til en annen oppskrift) eller **hoppet over**.
- Selve funksjonen kommer i **fase 2**, sammen med vurdering 👍/👎: knappen «✓ Spist», «Jeg spiste noe annet → velg oppskrift», og fremdriften viser spist protein i tillegg til planlagt. Legg dette til i fase 2 i `docs/PROMPT.md`.
- Man skal kunne registrere i etterkant hva man spiste, også uten å ha åpnet oppskriften (man kan jo lage taco uten å se på oppskriften).

## 8. Handleliste (fase 3) – legg inn i docs/PROMPT.md
- Innstillingen **«Fast handledag»** (f.eks. søndag). Handlelisten dekker perioden frem til neste handledag.
- Man kan også velge periode for handlelisten selv (f.eks. man–fre eller man–søn).

## 9. Backlog – legg inn i docs/BACKLOG.md (på engelsk)
- Planner actively prefers dishes with more fruit and vegetables.
- Longer weekend dinners (over 30 min).
- Food diary: manual protein logging (add protein eaten outside the app, e.g. dinner out) + logging what was actually eaten. Belongs together with the «eaten» status from point 7.

## Til slutt
1. Oppdater testene for de nye reglene (faste dager ute, generalisert lunsjregel, barn-regelen).
2. Legg alle valgene inn i `docs/DECISIONS.md` (på engelsk), inkludert hvorfor: «Family-specific rules became settings so the app works for any household.»
3. Flytt denne filen til `docs/`.
4. Vis meg hvordan ukeplan-skjermen (delmål F) skal se ut, og spør om valgene, før du bygger den.
