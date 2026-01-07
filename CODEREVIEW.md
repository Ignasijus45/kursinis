# Kodo peržiūra (pagal pateiktą framework)

## 1. Kodo organizacija ir architektūra
- **Santrauka:** Resursai ir middleware išskaidyti į atskirus maršrutus (`backend/src/routes/*.js`), tačiau schema taikoma starto metu be versijuotų migracijų, o „action“ tipo endpointai (archive/import/export) silpnina REST nuoseklumą.
- **Stiprybės:** Aiški maršrutų segmentacija (projects/teams/boards/tasks/auth); middleware sluoksnis (`authMiddleware`, `auditLogger`).
- **Problemos:** Nėra versijuotų migracijų (schema kartojama starto metu, jau buvo klaida su `archived` indeksu); „action“ endpointai maišo verbus su resursais; mišri hard DELETE vs soft DELETE semantika.
- **Vertinimas:** Adequate.  
- **Pagrindimas:** Yra SoC/middleware (IEEE 1471), bet nuosekli architektūrinė praktika (Clean Architecture) pažeidžiama schema-on-boot ir veiksmų endpointais.

## 2. Kodo kokybė ir prižiūrimumas
- **Santrauka:** Vardai aiškūs, formatas nuoseklus, tačiau kartojasi validacijos, o `ProjectBoard.jsx` kompleksiškas dėl daug estado/klaidų valdymo.
- **Stiprybės:** Deskriptyvūs pavadinimai (`requireTeamMember`, `createTeamAndTask`), parametruotos užklausos; React komponentų struktūra aiški.
- **Problemos:** Pasikartojančios validacijos blokai (pavadinimo ilgis, tuštuma) – DRY pažeidimas; globalus `error` state fronte gali maskuoti kitas klaidas; komponentų sudėtingumas didėja.
- **Vertinimas:** Adequate.  
- **Pagrindimas:** Atitinka Clean Code dėl vardų/stiliaus, bet DRY ir sudėtingumo valdymas silpnesni.

## 3. Saugumo praktikos
- **Santrauka:** Parametrizuotos SQL, JWT auth ir prieigos tikrinimai yra, bet trūksta payload limitų, schemų validacijos, rate limiting ir CSRF apsaugos; import/export minimaliai tikrinami.
- **Stiprybės:** Parametruotos užklausos (pg) – SQLi prevencija; authMiddleware + project/team membership patikros jautriems veiksmams.
- **Problemos:** Nėra payload dydžio limitų/rate limiting (OWASP A10); import/export be schemos/enum/ilgio tikrinimo; nėra CSRF apsaugos; DELETE vis dar hard-delete be papildomų saugiklių.
- **Vertinimas:** Adequate/Weak.  
- **Pagrindimas:** Esminis auth/SQLi dengtas, bet input valida­cija ir apsaugos nuo piktnaudžiavimo ribotos (OWASP Top 10).

## 4. Klaidų tvarkymas ir robustiškumas
- **Santrauka:** Try/catch daugelyje handlerių, status kodai grąžinami, bet logai be konteksto, WIP tikrinimas be transakcijų.
- **Stiprybės:** 400/401/403/404/500 naudojami nuosekliai.
- **Problemos:** Loguose trūksta user/route konteksto; WIP check be transakcijos – lenktynėse gali nesilaikyti limito; klaidų žinutės dažnai generinės.
- **Vertinimas:** Adequate.  
- **Pagrindimas:** Bazinis klaidų tvarkymas yra, bet diagnostikos/atomikos trūksta (IEEE 1028).

## 5. DB dizainas ir praktikos
- **Santrauka:** Schema normalizuota, FK/indeksai yra, bet schema taikoma starto metu be migracijų; WIP/archived įvedimas sukėlė klaidą.
- **Stiprybės:** FK, unikalūs apribojimai (team_members UNIQUE), indeksai (board_id, team_id, archived).
- **Problemos:** Schema-on-boot jau lūžo; soft-delete vs hard-delete politika nenuosekli; WIP tikrinimas be transakcijų.
- **Vertinimas:** Adequate.  
- **Pagrindimas:** 3NF ir FK gerai, bet migracijų valdymas silpnas ir duomenų gyvavimo politika nenuosekli.

## 6. Testavimas ir QA
- **Santrauka:** Daug integracinių/edge testų (auth, teams, tasks, audit), tačiau nėra testų import/export, WIP lenktynėms ir archyvo edge case’ams.
- **Stiprybės:** Edge testai (tušti/ilgi pavadinimai, teisių testai), smoke testai, TEST_RESULTS.md žurnalas.
- **Problemos:** Nėra unit testų helperiams/validacijai; nėra testų import/export, payload limitams, daliniam archyvavimui.
- **Vertinimas:** Adequate.  
- **Pagrindimas:** Integracinių testų bazė gera (IEEE 829), bet padengimas naujoms funkcijoms ne pilnas.

## 7. Dokumentacija ir komentarai
- **Santrauka:** README, TEST_RESULTS, TASKS_REPORT/EXTRA_FEATURES informatyvūs, bet trūksta API spec ir architektūros schemų; komentarų nedaug.
- **Stiprybės:** Aiškus setup/servisų aprašymas, testų žurnalas, užduočių/bugų istorija.
- **Problemos:** Nėra OpenAPI/diagramos; komentarų stinga sudėtingesnėse vietose (WIP check, archyvavimo kaskados).
- **Vertinimas:** Adequate.  
- **Pagrindimas:** Bazinė dokumentacija gera (IEEE 1063), bet API/architektūra neformaliai aprašyta.

## 8. Našumas ir efektyvumas
- **Santrauka:** Indeksai įdiegti, užklausos parametrizuotos, bet import be limitų ir WIP be transakcijų gali kelti apkrovą/lenktynes.
- **Stiprybės:** Indeksai ant dažnų laukų, minimalus N+1 pavojus.
- **Problemos:** Import/export be dydžio limitų; WIP skaičiavimas be lock’ų; archyvavimo/unarchive kaskados gali masiškai keisti daug įrašų be kontrolės.
- **Vertinimas:** Adequate.  
- **Pagrindimas:** Pagrindiniai optimizacijų principai taikomi, bet nėra apsaugos nuo didelių payload’ų/races (ISO/IEC 25010).

## 9. Framework ir kalbos konvencijos
- **Santrauka:** Express/pg/React naudojami idiomatiškai, konfigūracija `.env`, tačiau migracijos ne pagal Node ekosistemos praktiką, fronto state valdymas kai kur neoptimalus.
- **Stiprybės:** Parametruotos SQL, middleware naudojimas, React DnD integracija, Vite konfigūracija.
- **Problemos:** Schema-on-boot vietoje migracijų; globalus error state fronte neatitinka modernesnių state valdymo praktikų.
- **Vertinimas:** Adequate.  
- **Pagrindimas:** Idiomatiškas naudojimas, bet migracijų/state spragos (Framework best practices).

## UI keitimų valdymas (kritika)
- **Klaidos ir būsenos:** Globalus `error` state gali užmaskuoti lygiagrečius nepavykimus; trūksta per-stulpelį/užduotį klaidų rodymo.
- **WIP/archyvo grįžtamasis ryšys:** Nėra WIP rodiklių, WIP blokavimas grąžina generinę žinutę; archyvas rodomas atskirai be indikatoriaus aktyviuose stulpeliuose.
- **Validacija kliente:** ImportBoardForm ir kai kurios formos turi minimalią validaciją; trūksta laukų ilgių/enum tikrinimo.
- **Vizualinis nuoseklumas:** Nepilnai suvienodinti klaidų/mygtukų stiliai; praverstų lengva dizaino sistema/utility klasės.
- **Patarimas:** Per-entity klaidų konteineriai, WIP indikatoriai header’iuose, išplėsta validacija ir vienodi UI komponentai.

---

## Galutinė santrauka
- **Bendras vertinimas:** Adequate – bazinė architektūra ir funkcionalumas veikia, bet migracijų, validacijos ir duomenų gyvavimo nuoseklumas silpnesni.
- **Kritinės problemos:** Schema-on-boot be migracijų; import/export be validacijos ir limitų; DELETE vs archive nenuoseklumas; WIP be transakcijų.
- **Rekomenduojami patobulinimai (prioritetas):**
  1) Įdiegti versijuotas migracijas; nustatyti payload/rate limitus ir schemos validaciją import/export.  
  2) Suderinti delete/soft-delete politiką; tranzakcijos/užraktai WIP operacijoms; apgalvoti archyvavimo kaskadas.  
  3) Pagerinti klaidų/logų kontekstą ir UI klaidų/WIP grįžtamąjį ryšį; pridėti WIP indikatorių.  
  4) Išplėsti testus import/export, archyvo edge case’ams, WIP lenktynėms.
- **Stiprybės:** Aiškūs CRUD maršrutai, JWT + middleware, parametruotos SQL, plati integracinių testų bazė, audit log ir activity feed, pilnas UI srautas su DnD/archyvavimu/import/export.
- **Palyginimas:** Atitinka vidutinį lygį: funkcionalumas ir struktūra geri, bet trūksta migracijų, griežtesnės validacijos ir nuoseklios duomenų gyvavimo politikos – tipiškos mažų komandų/agentų spragos.
