Build a clickable, high-fidelity mobile prototype (390×844, mobile-first, also works full-screen on a phone) of a family meal-planner app. All UI text in Norwegian (bokmål). Use realistic sample data and make every button work with local state – no backend needed. Simulate voice, photo recognition and AI with fake results.

DESIGN
- Primary color purple #7C3AED (hover/dark #6D28D9, light backgrounds #F5F3FF and #EDE9FE). Background #FAF9FC, text #1F1B2E, muted text #6B6880.
- Font: Inter. Elegant, calm and very easy to use: lots of white space, rounded corners (14–18px), soft shadows, large touch targets (min 44px). No gradients, no emojis – use simple line icons (e.g. Lucide).
- Bottom navigation with 5 tabs: Uke · Handleliste · Hjemme · Oppskrifter · Innstillinger. A large round purple microphone button floats above the bottom nav on every screen.
- Bottom sheets (slide up from bottom, dimmed backdrop, close button) for details and actions. A short dark toast message at the top confirms every action (e.g. "Olivenolje er tom – lagt på handlelisten").

0. LOGIN (first screen)
- Clean login screen with app name "Måltidsplanlegger", short tagline "Proteinrike måltider for hele familien" and a purple logo mark.
- Buttons: "Fortsett med Google" (white with Google-style G icon), divider "eller", e-post and passord fields, primary button "Logg inn", links "Glemt passord?" and "Opprett konto".
- Button "Logg inn med Face ID" (face-scan icon) – simulates a short Face ID animation and logs in.
- After first login with Google/e-post, show a sheet: "Vil du bruke Face ID neste gang?" with "Ja, slå på" / "Ikke nå".
- The user stays logged in; "Logg ut" is in Settings and returns to this screen.

1. UKE (week plan – after login)
- Header: "Uke 47 · 16. nov – 22. nov" with arrows for previous/next week, title "Ukeplan", avatars of household members and a share button.
- A highlighted purple-tinted card "Hva kan jeg lage?" – "Skriv eller si hva du har i kjøleskapet" (opens the fridge sheet).
- "Snitt 120 g protein per dag" + primary button "Lag ukeplan" (shuffles the whole week).
- One card per day, Monday–Sunday, with day name + date and total protein for the day. Each day has three rows: Frokost, Lunsj, Middag, each showing dish name, "25 min · 42 g protein" and a swap icon (↻) that replaces the dish with another one.
- Rules: FRIDAY has NO dinner (show a dashed row "Ingen middag på fredag"). LUNCH is always leftovers from the previous day's dinner, shown in purple text as "Rester fra søndag · 42 g" (swapping a dinner updates the next day's lunch). SATURDAY lunch is its own quick high-protein lunch (no leftovers from Friday).
- Tapping a dish opens a recipe sheet: type, name, three stat tiles (protein per serving, time, kcal), ingredient list scaled to the household (e.g. "2 voksne + 2 barn · dobbel, inkl. lunsj i morgen"), and numbered steps.

2. HVA KAN JEG LAGE? (sheet)
- Text field ("kylling, brokkoli, ris") + mic button + button "Finn enkel middag".
- Results from my own recipes: dish name, badge "Har 4 av 5", time/protein and "Mangler: koriander".
- Button "Foreslå noe nytt med AI" → shows an AI recipe card (name, 20 min · 38 g protein, 3 steps) with "Lagre som oppskrift".

3. HANDLELISTE (shopping list)
- Subtitle "23 varer · 3 kjøpt · basert på ukeplanen" and a banner "Delt med Mannen min – avkrysninger vises hos begge i sanntid".
- Input "Legg til vare …" + add button.
- Items grouped by store section (Frukt og grønt, Kjøtt og fisk, Meieri og kjøl, Brød, Tørrvarer, Frys) with checkbox, name, amount (e.g. "1,2 kg") and an orange tag "Tom hjemme" on items that ran out at home. Checked items get strikethrough.
- Button "Ferdig handlet – flytt kjøpte varer til Hjemme".

4. HJEMME (pantry)
- Input to add an ingredient, plus two buttons: "Ta bilde" and "Si det".
- Segmented filter Alle / Har / Tom.
- List of ingredients with category and a status pill: green "Har" or orange "Tom". Tapping toggles; setting "Tom" adds the item to the shopping list.
- "Ta bilde" opens a sheet with a photo placeholder and AI-detected items with checkboxes (Paprika, Gresk yoghurt, Spinat, Cottage cheese, Agurk) and a button "Legg til 5 varer i Hjemme".

5. OPPSKRIFTER (recipes)
- Title with "14 oppskrifter · 2 favoritter", button "Ny oppskrift", search field, filter chips Alle / Frokost / Middag / Lunsj / Favoritter.
- Recipe cards with a colored initial tile, name, "Middag · 25 min · 42 g protein" and a heart for favorite.
- "Ny oppskrift" sheet with three options: "Skriv inn selv", "Lim inn lenke" (AI fetches the recipe from a URL), "Ta bilde" (AI reads a cookbook page). All lead to a preview where I can edit the name and see ingredients, then "Lagre oppskrift".

6. INNSTILLINGER (settings)
- Språk: chips Norsk / Deutsch / English + "Legg til språk" (switching language changes at least the navigation and headings).
- Husholdning: me (Yalda, eier) + "Inviter på e-post" (sheet with an e-mail field and "Send invitasjon") → shows "Mannen min · Invitasjon sendt", later "Kan se og redigere".
- Konto og sikkerhet: "Face ID" toggle (on), "Innlogget med Google · yalda@…", and a "Logg ut" button.
- Porsjoner: Voksne and Barn with −/+ steppers (amounts scale automatically).
- Mat vi ikke vil ha: chips Svinekjøtt (selected by default), Fisk og sjømat, Nøtter. Excluded food is never suggested.
- Deling: "Kopier «kun se»-lenke", and a toggle "Vis måltider i Google-/Outlook-kalender" that is OFF by default. Only when switched on, show a row "Kopier kalenderlenke (iCal)". The share sheet in the week view must not mention the calendar unless the toggle is on.

7. MICROPHONE (sheet)
- Pulsing purple mic, "Jeg lytter …" and tappable example sentences that simulate speech:
  "Jeg har gått tom for olivenolje" → marks it Tom + adds to shopping list.
  "Legg til kaffe og bananer på handlelisten" → adds them.
  "Jeg har kylling, brokkoli og ris – hva kan jeg lage?" → opens the fridge sheet with results.
  "Lag handleliste" → goes to the shopping list.
- Show "Du sa: «…»" for a second before executing.

SAMPLE RECIPES (high-protein, family-friendly, NO pork, max 30 min)
Breakfast: Gresk yoghurt med bær og nøtter (25 g), Eggerøre med cottage cheese (28 g), Proteinpannekaker med banan (24 g), Overnight oats med skyr (26 g), Omelett med spinat og feta (27 g).
Dinner: Kylling-tikka med ris (42 g), Laks med søtpotet og brokkoli (38 g), Taco med storfekjøttdeig (35 g), Kylling-wok med nudler (40 g), Linse- og kikertgryte (24 g), Kalkunburger med salat (36 g), Tunfiskpasta med erter (34 g).
Saturday lunch: Kyllingwrap med hummus (32 g), Tunfisk-bowl med egg (35 g).
