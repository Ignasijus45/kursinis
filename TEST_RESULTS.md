# Testų žurnalas (struktūra kaip TASKS_REPORT)

Čia fiksuojami testai ir jų rezultatai nuo testavimo starto.

## 115. Testų rezultatų failas (struktūra)
**Testo eiga:**
- Sukurtas centralizuotas `TEST_RESULTS.md` su gairėmis, kaip fiksuoti pavadinimą, komandą/įrankį ir rezultatą.
**Komanda/įrankis:** n/a
**Rezultatas:** Baigta; aprašyta log struktūra.
**Laikas:**
- Mąstymas: ~1 min.
- Įgyvendinimas: ~2 min.

## 116. Smoke test – Docker paleidimas nuo nulio
**Testo eiga:**
- Paleista `docker-compose down -v && docker-compose up -d --build` švariam startui.
- `docker-compose ps` patvirtino, kad backend 5001, frontend 5173, DB 5432, pgadmin 8080 veikia.
**Komanda/įrankis:** `docker-compose down -v && docker-compose up -d --build`
**Rezultatas:** Sėkminga; pilnas stack startuoja nuo nulio.
**Laikas:**
- Mąstymas: ~2 min.
- Įgyvendinimas: ~6 min.

## 117. Rankinis E2E (registracija → login → team → board'ai → task → DnD → komentaras → audit)
**Testo eiga:**
- Su nauju vartotoju atlikta registracija ir login (127.0.0.1:5001).
- Sukurta komanda, dvi board'os (Backlog, Doing), task; task perkeltas per PATCH `/tasks/:id/status`.
- Pridėtas komentaras, patikrintas audit `/audit/user/:id`.
- ID: TEAM `7bac3392-de11-4cd7-bf9c-f177175b472c`, BOARD1 `1334f97d-60c0-445c-89a2-1522399c8a90`, BOARD2 `3c20dfb5-c3bf-4929-a0ae-36d4acd2d029`, TASK `4715f727-eac8-40eb-a527-8cd67baa023e`.
**Komanda/įrankis:** `curl` scenarijus su Bearer token į backend 127.0.0.1:5001
**Rezultatas:** Sėkminga; end-to-end srautas veikia.
**Laikas:**
- Mąstymas: ~4 min.
- Įgyvendinimas: ~10 min.

## 118. DB persistencija po konteinerių restarto
**Testo eiga:**
- Paleista `docker-compose restart db backend frontend` nešalinant volume.
- Prisijungta su smoke vartotoju; `/teams` grąžino SmokeTeam-135524, `/teams/:id/boards` grąžino Backlog/Doing, `/tasks/board/3c20dfb5-...` grąžino užduotį su komentaru.
**Komanda/įrankis:** `docker-compose restart db backend frontend`
**Rezultatas:** Sėkminga; duomenys išlieka po restarto.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~7 min.

## 119. Edge – tušti pavadinimai (team/board/column/task)
**Testo eiga:**
- `backend/tests/edge-empty-fields.test.js` registruoja user, tikrina 400, kai pavadinimai tušti; sukuria valid team/board tarp tikrinimų.
**Komanda/įrankis:** `npm run test:edge:empty`
**Rezultatas:** Sėkminga; tušti pavadinimai atmetami 400.
**Laikas:**
- Mąstymas: ~4 min.
- Įgyvendinimas: ~8 min.

## 120. Edge – labai ilgi pavadinimai (>255)
**Testo eiga:**
- `backend/tests/edge-long-texts.test.js` tikrina, kad team/board/column/task pavadinimai >255 grąžina 400.
- Backend pridėtos 255 simbolių validacijos visose kūrimo/atnaujinimo vietose.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:edge:long`
**Rezultatas:** Sėkminga; ilgi pavadinimai blokuojami 400.
**Laikas:**
- Mąstymas: ~5 min.
- Įgyvendinimas: ~12 min.

## 121. Edge – projekto/komandos kūrimas su neegzistuojančiu user
**Testo eiga:**
- Patikrinta, kad pasenusio/neteisingo user id atveju grąžinamas 401, o ne 500 (pridėta user egzistavimo validacija).
**Komanda/įrankis:** Backend rebuild (tikrinant per API)
**Rezultatas:** Sėkminga; 500 dėl FK nebegaunama, gaunamas 401.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min.

## 122. Frontend registracijos payload eiliškumas
**Testo eiga:**
- Sutvarkytas `LoginForm` registracijos kvietimas, kad `email, username, password, full_name` būtų teisinga seka (anksčiau password nukeliaudavo kaip username).
**Komanda/įrankis:** Manual UI testas per frontend
**Rezultatas:** Sėkminga; registracija su 8+ simbolių slaptažodžiu veikia.
**Laikas:**
- Mąstymas: ~2 min.
- Įgyvendinimas: ~3 min.

## 123. Edge – specialūs simboliai / emoji
**Testo eiga:**
- `backend/tests/edge-special-chars.test.js` kuria team/board/column/task su emoji ir specialiais simboliais, tikrina 201.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:edge:special`
**Rezultatas:** Sėkminga; specialūs simboliai palaikomi.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~7 min.

## 124. Edge – dvigubas greitas task update (race)
**Testo eiga:**
- `backend/tests/edge-race-task-update.test.js`: du PUT į tą patį task'ą beveik vienu metu, tikrinama, kad abu 200 ir laimi paskutinis.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:edge:race`
**Rezultatas:** Sėkminga; race neduoda 500, išlieka paskutinis update.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~7 min.

## 125. Edge – komandos trynimas su lentomis/užduotimis (kaskados)
**Testo eiga:**
- `backend/tests/edge-delete-team-cascade.test.js` sukuria team/board/task, ištrina komandą, tikrina, kad board/tasks endpointai po to grąžina 404.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:edge:delete-team`
**Rezultatas:** Sėkminga; kaskados veikia, likučiai nepasiekiami.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min.

## 126. Teisės – ne narys bando gauti komandos lentas
**Testo eiga:**
- `backend/tests/edge-team-nonmember-board.test.js` registruoja du userius, vienas kuria team/board, kitas (nenarys) kviečia `GET /teams/:id/boards` ir turi gauti 403.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:edge:nonmember-board`
**Rezultatas:** Sėkminga; ne narys gauna 403.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min.

## 127. Teisės – komandos narys kuria lentą (tik OWNER gali)
**Testo eiga:**
- `backend/tests/edge-team-member-create-board.test.js`: owner kviečia invite, narys bando `POST /teams/:id/boards` ir turi gauti 403.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:edge:member-create-board`
**Rezultatas:** Sėkminga; lentas kurti gali tik OWNER.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min.

## 128. Teisės – narys bando pašalinti kitą narį
**Testo eiga:**
- `backend/tests/edge-team-member-remove-member.test.js`: savininkas pakviečia du narius, vienas narys bando `DELETE /teams/:id/members/:userId` kitam ir gauna 403.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:edge:member-remove-member`
**Rezultatas:** Sėkminga; narys negali šalinti kito nario.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min.

## 129. Auth testai – register/login/invalid token
**Testo eiga:**
- `backend/tests/auth-invalid-token.test.js` tikrina, kad suklastotas token grąžina 401.
- Paleisti `test:auth:register`, `test:auth:login`, `test:auth:invalid-token`.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:auth:register && ...:login && ...:invalid-token`
**Rezultatas:** Sėkminga; auth srautai ir neteisingas token padengti.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~5 min.

## 130. Komandų teisės – create/invite/remove
**Testo eiga:**
- `backend/tests/team-perms-create-invite-remove.test.js`: member negali invite/remove, owner gali; patvirtintas komandų kūrimas.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:team:perms-create-invite-remove`
**Rezultatas:** Sėkminga; teisių scenarijai padengti.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min.

## 131. Boards – create/list (projektas vs komanda)
**Testo eiga:**
- `backend/tests/boards-team-vs-project.test.js`: user kuria projektą + projektinę lentą, komandą + komandos lentą; tikrina, kad abu list endpointai grąžina lentas.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:boards:team-vs-project`
**Rezultatas:** Sėkminga; abiejų tipų lentos kuriamos ir gaunamos.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min.

## 132. Tasks – CRUD + move
**Testo eiga:**
- `backend/tests/tasks-crud-move.test.js`: komandai sukuriamos dvi board'os, task create/get/update/move (PATCH status) ir delete.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:tasks:crud-move`
**Rezultatas:** Sėkminga; pagrindiniai tasks srautai padengti.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min.

## 133. Komentarų teisės – create/delete
**Testo eiga:**
- `backend/tests/comments-perms.test.js`: tikrina, kad komandos/projekto nariai gali kurti/šalinti savo komentarus, outsider gauna 403; backend papildytas prieigos tikrinimu.
- Bandymas paleisti testą host aplinkoje baigėsi EPERM/ECONNRESET (tinklo blokavimas).
**Komanda/įrankis:** `npm run test:comments:perms` (nepavyko dėl aplinkos ribojimo)
**Rezultatas:** Neįvykdyta dėl aplinkos tinklo apribojimų; kodas paruoštas, testą reikia paleisti aplinkoje be blokavimo.
**Laikas:**
- Mąstymas: ~4 min.
- Įgyvendinimas: ~8 min.

## 134. Audit log – move/comment/invite
**Testo eiga:**
- `backend/tests/audit-log-actions.test.js`: owner sukuria team/board/task, pakviečia narį, perkelia task, prideda komentarą; tikrinama, kad audite yra add_team_member, move_task, create_comment.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:audit:actions`
**Rezultatas:** Sėkminga; audit fiksuoja kvietimą, task move ir komentarą.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min.

## 135. Frontend login flow (API pagrindu)
**Testo eiga:**
- `frontend/tests/login-flow.js`: register + login per API, tikrina, kad grįžta token ir user id.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001/api npm run test:login-flow`
**Rezultatas:** Sėkminga; frontend login srautas per API veikia.
**Laikas:**
- Mąstymas: ~2 min.
- Įgyvendinimas: ~5 min.

## 136. Board page – lentos ir užduotys gražinamos renderinimui
**Testo eiga:**
- `frontend/tests/board-page-renders.js`: registruoja user, sukuria komandą, lentą per `/api/teams/:id/boards`, sukuria užduotį per `/api/tasks`, tada tikrina, kad GET `/teams/:id/boards` grąžina lentą ir GET `/tasks/board/:boardId` grąžina tą užduotį.
- Pirmas bandymas blokavo 127.0.0.1 (EPERM), pakartota su leistinu tinklu.
**Komanda/įrankis:** `npm run test:board-page` (frontend; API_BASE_URL= http://127.0.0.1:5001)
**Rezultatas:** Sėkminga; lentų sąrašas ir užduotys grįžta (team `bf914a44-528f-4048-8fc3-0b02c9c8f0b0`, board `d4f09dcc-e8bd-41e8-be35-dcce5585fff7`, task `25cc39f3-82b6-40e2-a393-aa63ab7878c4`).
**Laikas:**
- Mąstymas: ~4 min.
- Įgyvendinimas: ~9 min. (script + pakartotinis paleidimas)

## 137. Drag&drop move handler (tasks CRUD + move)
**Testo eiga:**
- `backend/tests/tasks-crud-move.test.js`: registruoja user, kuria komandą ir dvi board'us, sukuria task, skaito, atnaujina, perkelia per PATCH `/tasks/:id/status` ir ištrina.
- Pirmas bandymas blokavo 127.0.0.1 (EPERM), pakartota su leistinu tinklu.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:tasks:crud-move`
**Rezultatas:** Sėkminga; move handler ir CRUD veikia (drag&drop scenarijus).
**Laikas:**
- Mąstymas: ~2 min.
- Įgyvendinimas: ~6 min. (paleidimas + pakartojimas)

## 138. Permission UI – „Create board“ nematomas Member’iui
**Testo eiga:**
- `frontend/tests/permission-ui-no-create-board.js`: owner sukuria komandą, pakviečia narį, nario kvietimas priimamas (role MEMBER), narys kviečia GET `/teams/:id/members` (rodo role) ir bando POST `/teams/:id/boards` – gauna 403.
- Logika patvirtina, kad role=MENBER, todėl UI pagal TeamPage logiką mygtuko nerodys; backend taip pat blokuoja kūrimą.
- Pirmas paleidimas blokavo 127.0.0.1 (EPERM), pakartota su leistinu tinklu.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:ui:no-create-board`
**Rezultatas:** Sėkminga; member negali kurti lentos, mygtukas neturėtų būti rodomas (team `76dd3176-8e60-4f30-97d2-171f1183099a`, member `ddd3d06a-55d5-47a5-901a-0f30ed318adf`).
**Laikas:**
- Mąstymas: ~4 min.
- Įgyvendinimas: ~8 min. (script + pakartotinis paleidimas)

## 139. Bug bounty – pakeitus teamId URL’e (kitos komandos ID) duomenys negaunami
**Testo eiga:**
- `backend/tests/bugbounty-team-access.test.js`: vartotojas A sukuria komandą ir board, vartotojas B turi kitą komandą, bet bandydamas GET `/teams/:id/members`, `/teams/:id/boards` ar `/tasks/board/:boardId` su A ID gauna 403.
- Pirmas paleidimas blokavo 127.0.0.1 (EPERM), pakartota su leistinu tinklu.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:bugbounty:team-access`
**Rezultatas:** Sėkminga; autorizacija nepraleidžia prie kitos komandos (teamA `92ea1807-7ed9-42d5-b3e4-8532dfef894c`, boardA `fde36f60-910d-4ff4-a9ed-ea7f66ed3c61`, outsider `3c886000-2dfa-4a7d-a80e-33c7934ce54e`).
**Laikas:**
- Mąstymas: ~4 min.
- Įgyvendinimas: ~8 min. (script + pakartotinis paleidimas)

## 140. Bug bounty – request be tokeno / neteisingas tokenas
**Testo eiga:**
- `backend/tests/auth-unauthorized.test.js`: GET `/projects` be tokeno turi grąžinti 401.
- `backend/tests/auth-invalid-token.test.js`: fake Authorization token turi grąžinti 401.
- Abu paleidimai iškart blokavo 127.0.0.1 (EPERM), pakartota su leistinu tinklu.
**Komanda/įrankis:** `npm run test:auth:unauthorized` ir `API_BASE_URL=http://127.0.0.1:5001 npm run test:auth:invalid-token`
**Rezultatas:** Sėkminga; be tokeno ir su neteisingu tokenu protected endpointai grąžina 401.
**Laikas:**
- Mąstymas: ~2 min.
- Įgyvendinimas: ~5 min. (paleidimai + pakartojimai)

## 141. Bug bounty – bandymas atspėti taskId ir ištrinti kitą lentą
**Testo eiga:**
- `backend/tests/bugbounty-task-delete-guess.test.js`: Owner sukuria komandą/board/task, outsider (kitos komandos narys) bando DELETE `/tasks/:id` su kitos komandos taskId – turi gauti 403.
- Pirmas paleidimas blokavo 127.0.0.1 (EPERM), pakartota su leistinu tinklu.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:bugbounty:task-delete`
**Rezultatas:** Sėkminga; išorinis vartotojas negali ištrinti kitos komandos užduoties (team `6e9c08ee-05d1-4fce-be73-14ef89c63c90`, board `b1a9a20e-3c15-4769-a7ef-9b91e83702de`, task `23e73db2-1e25-4a5e-96fc-a5cdfd933229`, outsider `05a95dc1-cb91-4a40-90a7-4ca0180f21c2`).
**Laikas:**
- Mąstymas: ~4 min.
- Įgyvendinimas: ~8 min. (script + pakartotinis paleidimas)

## 142. Duomenų vientisumas – greiti „drag&drop“ move (spam)
**Testo eiga:**
- `backend/tests/edge-race-task-move.test.js`: sukuria komandą, dvi board'us ir task; siunčia dvi move užklausas beveik vienu metu (A→B poz0 ir B→A poz0); po to tikrina, kad task grįžo į Board A ir turi poziciją 0.
- Pirmas paleidimas blokavo 127.0.0.1 (EPERM), pakartota su leistinu tinklu.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:edge:race-move`
**Rezultatas:** Sėkminga; paskutinis move laimi, pozicija teisinga (boardA `066285bd-7b5e-4e9d-8a66-818d4555c6ae`, boardB `5607672b-ffc2-445b-8094-5ef3f05baf34`, task `4a2c51f2-7f31-403f-9728-ae18106f1c01`).
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~7 min. (script + pakartotinis paleidimas)

## 143. Trinamas stulpelis su užduotimis (kaskada vs blokas)
**Testo eiga:**
- `backend/tests/edge-delete-board-with-tasks.test.js`: owner sukuria komandą ir board, prideda 2 tasks; DELETE `/columns/:id` ir po to GET `/tasks/board/:id` turi grąžinti 404.
- Pirmas paleidimas blokavo 127.0.0.1 (EPERM), pakartota su leistinu tinklu.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:edge:delete-board-with-tasks`
**Rezultatas:** Sėkminga; lentos šalinimas pašalina ir tasks (404 po trynimo), board `9d5bf9f9-410a-4f9f-9776-64691e4c6230`.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~7 min. (script + pakartotinis paleidimas)

## 144. Bug bounty – vartotojo trynimas (užduotys/komentarai/audit)
**Testo eiga:**
- `backend/tests/bugbounty-user-delete.test.js`: registruotas user, bandoma DELETE `/api/users/:id` su tuo pačiu tokenu; sistemoje nėra naudotojo trynimo endpointo, tikimės 404/405.
- Kaskados tasks/comments/audit nepatikrintos, nes trynimas nepalaikomas.
- Pirmas paleidimas blokavo 127.0.0.1 (EPERM), pakartota su leistinu tinklu.
**Komanda/įrankis:** `API_BASE_URL=http://127.0.0.1:5001 npm run test:bugbounty:user-delete`
**Rezultatas:** Nepalaikoma funkcija; gautas 404 (user `ee5ef0bd-203a-435a-9b48-69115fbd164d`), trynimo endpointas neegzistuoja, todėl kaskados nepatikrintos.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~5 min. (script + pakartotinis paleidimas)

## 145. Stabilumas – DB konteineris išjungtas, backend reakcija
**Testo eiga:**
- Sustabdytas DB konteineris (`docker-compose stop db`), backend paliktas veikti.
- Pabandytas POST `/api/auth/register` su nauju vartotoju; atsakymas JSON `{"message":"Klaida registruojant naudotoją"}` su 500.
- DB atstatytas `docker-compose start db` po testo.
**Komanda/įrankis:** `docker-compose stop db` → `curl ... /api/auth/register` → `docker-compose start db` (API_BASE_URL=http://127.0.0.1:5001)
**Rezultatas:** Backend grąžina 500 ir bendrą klaidos žinutę; registracija neveikia be DB (tikėtina, tačiau galėtų būti aiškesnė 503/DB klaida).
**Laikas:**
- Mąstymas: ~2 min.
- Įgyvendinimas: ~4 min. (stop + request + start)

## 146. Cold start – frontend kai backend tik kyla
**Testo eiga:**
- Visi konteineriai išjungti `docker-compose down`, tada `docker-compose up -d --build` (švarus startas).
- Iškart po starto: frontend per `http://127.0.0.1:5173` grąžino 200 (Vite shell), backend health `http://127.0.0.1:5001/api/health` grąžino 200 „Serveris veikia“.
- Backend loguose matyti migracija ir startas be klaidų; frontend loguose – Vite ready.
**Komanda/įrankis:** `docker-compose down && docker-compose up -d --build`; `curl http://127.0.0.1:5173`; `curl http://127.0.0.1:5001/api/health`
**Rezultatas:** Frontend neužlūžta per cold start; tiek frontend shell, tiek backend health atsako 200 netrukus po `up`.
**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min. (down+up+patikros)
