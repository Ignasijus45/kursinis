# Kodo peržiūros pastabos (išplėsta)

## Kas veikia gerai
- **Autentikacija ir middleware:** JWT su `authMiddleware` veikia nuosekliai, daugelyje maršrutų taikoma prieigos kontrolė (project_members/team_members), yra audit logger.
- **CRUD struktūra:** Pagrindiniai resursai (projects, teams, boards, tasks, comments) turi aiškius GET/POST/PUT/PATCH/DELETE maršrutus, status kodai ir validacijos pagrindiniai atvejai grįžta korektiškai (400/401/403/404/500).
- **UI funkcionalumas:** DnD bibliotekos naudojimas, lentų/užduočių kūrimas, redagavimas, komentarų rodymas, archyvavimas/atkūrimas, import/export – apima pilną naudotojo srautą.
- **Testų aprėptis:** Yra daug integracinių testų (auth, teams/boards/tasks edge case’ai, audit), smoke testų ir rankinių scenarijų dokumentacija `TEST_RESULTS.md`.
- **Audit/aktyvumo sekimas:** Yra audit log ir UI activity feed, leidžiantis matyti paskutinius veiksmus, plius saugomas audito kontekstas.

## UI keitimų valdymas (kritika)
- **Klaidos ir būsenos sklaida:** `ProjectBoard` ir kiti komponentai naudoja globalų `error` state, todėl lygiagretūs nepavykimai (archivavimas/move) gali užmaskuoti vienas kitą. Klaidos ne visada rodomos prie konkretaus stulpelio/užduoties.
- **WIP/archyvo grįžtamasis ryšys:** WIP blokavimai duoda bendrą žinutę, nėra rodomas esamas WIP skaičius/limit. Archyvuoti elementai rodomi atskiroje skiltyje, bet nėra indikatorius aktyviame stulpelyje.
- **Validacija klientinėje pusėje:** ImportBoardForm ir kai kurios formos (board/task create) turi minimalią validaciją; trūksta laukų ilgių/enum tikrinimo prieš siunčiant.
- **Vizualinis nuoseklumas:** Nors baziniai stiliai suvienodinti, dalis UI (klaidų pranešimai, mygtukų stiliai skirtingose formose) dar nėra pilnai konsoliduoti. Galima įvesti komponentų bibliotekos/temos sluoksnį.
- **Patarimas:** Įvesti per-entity klaidų konteinerius (per board/task), rodyti WIP indikatorius stulpelio header’yje, praplėsti klientinę validaciją ir suvienodinti formų/mygtukų stilių per utility klases ar mažą dizaino sistemą.

## Backend
- **Schemos valdymas (`backend/src/config/database.js`):** Schema taikoma kiekvieno starto metu; versijuotų migracijų nebuvimas jau sukėlė klaidą (indeksas prieš stulpelį). Įveskite migracijų įrankį (knex/node-pg-migrate/Prisma) ir venkite pilno DDL kartojimo kiekvieno starto metu.
- **Soft delete vs delete:** Lentoms/užduotims yra `archived`, bet DELETE vis dar pilnai šalina įrašus. Mišri semantika klaidina – apsispręskite dėl vienos politikos ir nuosekliai taikykite API lygyje.
- **Archyvavimo nuoseklumas:** `columns.js` archyvuoja/atarchyvuoja visas užduotis, prarandant ankstesnę kiekvienos užduoties būseną. Jei reikia dalinio archyvavimo, venkite masinio atarchyvavimo arba saugokite buvusias reikšmes.
- **Prieigos kontrolė:** Komandų lentų užduočių archyvavimas/kėlimas reikalauja komandos savininko, kai kitos komandos operacijos leidžiamos nariams. Patikrinkite verslo taisyklę; jei nariai gali archyvuoti/judinti, sušvelninkite tikrinimą iki narystės.
- **Import/Export (`backend/src/routes/export.js`):** Mažai validacijos – pasitikima klientų JSON, nėra limitų užduočių skaičiui/dydžiui, nėra schemos tikrinimo (pavadinimų ilgis, status/priority enumai). Pridėkite payload validaciją ir dydžio ribas.
- **WIP laikymasis (`tasks.js`):** WIP tikrinimas daromas skaičiuojant be transakcijos; lygiagretūs veiksmai gali viršyti limitą. Naudokite transakciją arba patariamąją užraktą lentos ID.
- **Logai/klaidos:** Klaidos grąžina bendrą 500 be konteksto. Įdiekite struktūruotą logavimą (vartotojo ID, maršrutas, parametrai).

## Frontend
- **Klaidų sritis (`frontend/src/components/ProjectBoard.jsx`):** Globalus `error` naudojamas visoms operacijoms, todėl lygiagretūs nepavykimai uždengia vienas kitą. Naudokite atskirus klaidų laukus per lentą/užduotį, WIP klaidas rodykite šalia stulpelio.
>- **WIP/Archyvo UX:** Archyvuoti elementai slepiami DnD sąrašuose, bet WIP dabartinis/limit neparodomas, WIP blokavimas rodo generinę žinutę. Rodykite stulpelio WIP skaitiklius ir aiškesnį grįžtamąjį ryšį.
- **Importo validacija (`frontend/src/components/ImportBoardForm.jsx`):** Daroma tik JSON parse; pridėkite kliento pusės tikrinimą privalomiems laukams, ilgiams, enumams, kad sumažintumėte serverio klaidas.
- **API parametrai:** `include_archived` yra globalus perjungiklis; gal verta per-lentos kontrolės ar mažinti payload didelėms archyvų apimtims.

## Saugumas ir našumas
- **Payload dydis/ribojimas:** Import/export neturi payload dydžio limitų ar rate limiting. Nustatykite `express.json({ limit })`, tikrinkite masyvų ilgį, pridėkite bazinį rate limiting prie auth/import/export/mutacijų.
- **Duomenų atskleidimas:** Export grąžina pilnus užduočių/komentarų įrašus; jei rolės skiriasi, filtruokite laukus arba užmaskuokite PII.

## Patikimumas/operacijos
- **Starto priklausomybės:** Serveris krenta dėl schemos bėdų; su migracijomis ir health-check’ais startuokite tik po sėkmingų migracijų ir pateikite aiškias health klaidas.
- **Testų spragos:** Nėra automatizuotų testų import/export validacijai, archive/unarchive edge case’ams (dalinis archyvavimas), WIP lenktynėms, dideliems payload’ams.

## Rekomendacijos
- Įdiekite versijuotas migracijas ir atsisakykite pilnos schemos kartojimo starto metu.
- Suderinkite delete vs archive semantiką; jei renkiesi soft delete, atsisakyk hard DELETE lentoms/užduotims.
- Pridėkite schemos validaciją ir dydžio limitus import/export; validuokite ir kliento pusėje.
- Pagerinkite WIP laikymosi užtikrinimą (transakcijos/užraktai) ir UX (WIP skaitikliai, klaidų rodymas vietoje).
- Įdiekite struktūruotą logavimą su vartotojo/maršruto kontekstu ir bazinį rate limiting jautriems endpointams.
