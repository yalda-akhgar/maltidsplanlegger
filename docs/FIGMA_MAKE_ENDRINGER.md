Do NOT create a new app. Keep the existing prototype exactly as it is (design, colors, screens, data and all current functionality) and only make the following changes:

1. ADD A LOGIN SCREEN (shown before the app)
- App name "Måltidsplanlegger", tagline "Proteinrike måltider for hele familien", small purple logo mark. Same purple design (#7C3AED, Inter) as the rest of the app.
- Button "Fortsett med Google" (white, Google-style G icon), divider "eller", fields for e-post and passord, primary button "Logg inn", links "Glemt passord?" and "Opprett konto".
- Button "Logg inn med Face ID" (face-scan icon): shows a short Face ID animation, then logs in.
- After the first login with Google or e-post, show a bottom sheet: "Vil du bruke Face ID neste gang?" with "Ja, slå på" and "Ikke nå".
- The user stays logged in. All login options are simulated (no real backend).

2. SETTINGS – NEW SECTION "Konto og sikkerhet"
- Text "Innlogget med Google · yalda@…"
- Toggle "Logg inn med Face ID" (on if the user said yes)
- Button "Logg ut" → returns to the login screen.

3. INVITE BY E-MAIL
- Change "Inviter et familiemedlem" so it opens a bottom sheet with an e-mail field and the button "Send invitasjon".
- After sending, show the member as "Mannen min · Invitasjon sendt", and a toast "Invitasjon sendt".

4. CALENDAR IS OPTIONAL AND OFF BY DEFAULT
- Remove calendar buttons ("Vis i Google-/Outlook-kalender" / "Legg til i kalender") wherever they appear now, including the share sheet in the week view.
- In Settings under "Deling", add a toggle "Vis måltider i Google-/Outlook-kalender", OFF by default.
- Only when the toggle is ON, show a row "Kopier kalenderlenke (iCal)" below it (toast: "Kalenderlenke kopiert"). When switched off again, the row disappears.

Change nothing else.
