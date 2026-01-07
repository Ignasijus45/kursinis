# Extra Features (užduotys atskirai nuo TASKS_REPORT)

Čia fiksuojamos papildomos/„extra“ užduotys tokiu pačiu formatu kaip TASKS_REPORT. Naujas užduotis numeruok toliau (pvz., E1, E2...) ir užrašyk **Užduoties eigą**, **Laikas**, **Statusas**.

# E1. Activity feed iš audit log (paskutiniai 20 veiksmų komandoje)

**Užduoties eiga:**
- Backend: pridėtas `GET /api/audit/team/:teamId` (reikalauja narystės), kuris grąžina paskutinius 20 audit įrašų koSmandos kontekste (team, board, task, comment, member veiksmai; naudoja board/team filtravimą).
- Frontend: sukurtas `ActivityFeed` komponentas, kuris užkrauna komandos auditą ir rodo sąrašą; integruotas į `TeamPage` (audit panelėje po esamu AuditList).
- Stiliai: pridėti `.activity-feed` blokui, eilučių, meta ir details kodei (`frontend/src/styles/app.css`).
- Services: `auditService.getByTeam` naujas metodas.
- Quick sanity: paleistas `npm run test:board-page` (su leistinu tinklu) – praėjo po pakeitimų.

**Laikas:**
- Mąstymas: ~5 min. (kokį endpointą daryti ir kaip filtruoti komandos veiksmus).
- Įgyvendinimas: ~12 min. (backend SQL + frontend komponentas + stiliai + sanity test).

**Statusas:**
- Baigta; TeamPage dabar rodo paskutinius 20 komandos veiksmų iš audito, su narystės apsauga ir paprastu feed UI.

# E2. Activity feed filtras pagal action type

**Užduoties eiga:**
- `ActivityFeed` papildytas `select` filtru; veiksmai surenkami iš gautų audit įrašų, leidžiama pasirinkti konkretų `action` arba „Visi“.
- Filtras taikomas tik UI lygyje (be papildomo request), sąrašas persifiltruoja vietoje.
- Stiliai papildyti `.activity-filter` klasei.

**Laikas:**
- Mąstymas: ~2 min. (ar daryti backend query param ar UI filtrą – pasirinktas UI).
- Įgyvendinimas: ~4 min. (state + select + stiliai).

**Statusas:**
- Baigta; activity feed galima filtruoti pagal action tipą.

# E3. Archyvavimas (soft delete) užduotims ir lentoms

**Užduoties eiga:**
- DB: `boards` ir `tasks` gavo `archived BOOLEAN DEFAULT FALSE` (idempotentiniai ALTER + indeksai).
- Backend: naujas `PATCH /tasks/:id/archive` (prieigos tikrinimai kaip move/update), `PATCH /columns/:id/archive` (projektų nariai / komandos OWNER). Archyvuojant board'ą archyvuojamos ir visos jos tasks, audit log rašo `archive_board`/`archive_task` (ir unarchive).
- Filtravimas: task list endpointai dabar grąžina tik `archived=false` (projektų boards, board tasks), team boards list grąžina tik nearchyvuotas lentas.
- Frontend: `ProjectBoard` gavo archyvavimo mygtukus šalia delete tiek lentoms, tiek užduotims (mygtukai paslepia įrašą iš state po sėkmės); `taskService` ir board service papildyti archive metodais; nauji loader state'ai.
- Sanity: `npm run test:board-page` (su leistinu tinklu) prabėgo po pakeitimų.

**Laikas:**
- Mąstymas: ~6 min. (schema + prieigos modelis + UI vieta).
- Įgyvendinimas: ~15 min. (DB ALTER, backend endpointai/filtrai, frontend mygtukai/servisai, sanity testas).

**Statusas:**
- Baigta; užduotis ir lentas galima archyvuoti (soft delete) iš UI, sąrašai rodo tik nearchyvuotus, audit fiksuoja archyvavimą.

# E4. UI „Archived“ skiltis (rodyti/atkurti archyvuotus)

**Užduoties eiga:**
- Backend: list endpointai gauna `include_archived` paramą (projektų lentos + tasks, team boards, board tasks) – pagal nutylėjimą rodo tik nearchyvuotus, su parametru grąžina visus.
- Frontend: `ProjectBoard` pridėtas „Rodyti archyvuotus“ jungiklis; aktyvavus užkraunamos lentos/užduotys su `include_archived=true`.
  - Aktyvios lentos (Drag&Drop) rodo tik nearchyvuotus tasks.
  - Atidaromas blokas „Archyvuotos užduotys“ kiekvienai lentai su „Atkurti“; globali „Archyvuotos lentos“ sekcija su „Atkurti lentą“.
  - Archyvavimo handleriai atnaujina state su `archived` flag (nebeišmeta įrašų).
- Stiliai: pridėtos `.board-actions-header`, `.archived-block`, `.archived-boards` ir t. t. UI blokams.
- Sanity: `npm run test:board-page` (su leistinu tinklu) prabėgo po pakeitimų.

**Laikas:**
- Mąstymas: ~7 min. (parametrizuoti API vs atskiri endpointai, kaip atskirti aktyvius ir archyvuotus UI).
- Įgyvendinimas: ~16 min. (backend query param + filtrai, frontend toggle/sekcijos, stiliai, sanity).

**Statusas:**
- Baigta; vartotojas gali matyti ir atkurti archyvuotas lentas/užduotis per atskirą „Archived“ skiltį.

# E5. WIP limit stulpeliui (max task skaičius)

**Užduoties eiga:**
- DB: `boards` gavo lauką `wip_limit INT` (idempotentinis ALTER + indeksas), `tasks` ir `boards` archyvavimo laukai palikti.
- Backend: board kūrimas (projektų ir komandų) priima `wip_limit`; board update leidžia keisti wip_limit. Task create/move tikrina aktyvių (nearchyvuotų) task count prieš įterpiant/kelint: jei >= wip_limit, grąžina 400 „Viršytas WIP limitas“. List endpointai palaiko `include_archived` param.
- Frontend: `ProjectBoard` rodo WIP limitą ir leidžia perjungti archyvuotų rodymą; WIP logika naudojama serverio pusėje. (UI limit įvedimas/edit dar minimalus – naudoja backend lauką, limitas rodomas per serverio validaciją).
- Servisai: `taskService` ir `teamService` palaiko query params (pvz., `include_archived`).
- Sanity: `npm run test:board-page` (su leistinu tinklu) prabėgo po pakeitimų.

**Laikas:**
- Mąstymas: ~6 min.
- Įgyvendinimas: ~14 min. (DB, backend tikrinimai, frontend hook paramai, sanity).

**Statusas:**
- Baigta; stulpeliai gali turėti WIP limitą, nauji/move veiksmai neleidžia viršyti limito (400).

# E6. WIP viršijimo įspėjimas (UI)

**Užduoties eiga:**
- `ProjectBoard` drag&drop dabar, gavęs klaidą (pvz., WIP limit viršytas), parodo klaidos žinutę ir persinchronizuoja lentas/užduotis iš serverio (nebepaliekant lokalaus netinkamo state).
- `fetchTasks` iškelta į `useCallback`, kad būtų kviečiama ir po klaidų; DnD perkelimo klaidos atveju state peržaidžiamas su serverio duomenimis.

**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~5 min. (refactor fetch + klaidų apdorojimas).

**Statusas:**
- Baigta; viršijus WIP limitą ar kitai move klaidai, vartotojas pamato įspėjimą, UI grįžta į serverio būseną.

# E7. Export board į JSON (UI + API)

**Užduoties eiga:**
- Backend: naujas maršrutas `GET /api/export/board/:boardId` (tik project/team nariai), grąžina board su tasks ir komentarais JSON formatu.
- Frontend: `taskService.exportBoard` ir `ExportBoardButton` komponentas; pridėtas prie `ProjectBoard` lentos header'io (tiek edit, tiek view režime) – leidžia parsisiųsti JSON.
- Sanity: `npm run test:board-page` (su leistinu tinklu) prabėgo po pakeitimų.

**Laikas:**
- Mąstymas: ~4 min.
- Įgyvendinimas: ~10 min. (backend endpointas, UI mygtukas, servisai, sanity).

**Statusas:**
- Baigta; vartotojas gali eksportuoti lentą (su užduotimis ir komentarais) į JSON.

# E8. Import board iš JSON

**Užduoties eiga:**
- Backend: `POST /api/export/board` priima JSON (board + tasks), tikrina prieigą (project members arba team members), sukuria lentą ir įterpia tasks; audit `import_board`.
- Frontend: `taskService.importBoard` ir `ImportBoardForm` komponentas (įdėtas į `ProjectBoard`); galima įklijuoti eksportuotą JSON ir importuoti į pasirinktą projektą/komandą. Export mygtukas paliktas greta.
- Sanity: `npm run test:board-page` (su leistinu tinklu) prabėgo po pakeitimų.

**Laikas:**
- Mąstymas: ~5 min.
- Įgyvendinimas: ~12 min. (backend import, UI forma, servisai, sanity).

**Statusas:**
- Baigta; lentą galima importuoti iš JSON per UI formą.
