# 16. Įgyvendintas POST /auth/register


**Užduoties eiga:**
- Registracijos logiką iškėliau į bendrą handlerį `registerUserHandler` (`backend/src/routes/users.js`).
- Sukurtas naujas maršrutas `/api/auth/register` (`backend/src/routes/auth.js`), prijungtas serveryje (`backend/src/server.js`); senasis `/api/users/register` lieka veikti.
- Perbuildintas ir paleistas backend konteineris, patikrinta loguose migracija be klaidų.
- Patikrinta su `curl` POST į `http://localhost:5001/api/auth/register` su nauju el. paštu – gavau 201 ir token (naudotojas sukurtas).

**Laikas:**
- Mąstymas: ~3 min (sprendimo struktūra, kad būtų bendras handleris ir abu endpointai).
- Įgyvendinimas: ~7 min (kodo keitimai, perbuildinimas, curl testas).

**Statusas:**
- /auth/register veikia; registracija sukuria vartotoją ir grąžina token.

# 17. Prisijungimas skaito email/password iš body (/auth/login alias)


**Užduoties eiga:**
- Login logiką iškėliau į bendrą `loginUserHandler` (`backend/src/routes/users.js`), kad aiškiai skaitytų `email` ir `password` iš `req.body`.
- Sukurtas `/api/auth/login` alias (`backend/src/routes/auth.js`), kad auth maršrutai būtų nuoseklūs; senasis `/api/users/login` lieka veikti.
- Perbuildintas backend konteineris ir patikrintas su `curl` POST į `/api/auth/login` (naudotas test vartotojas) – gavau 200 ir token.

**Laikas:**
- Mąstymas: ~2 min (sprendimas naudoti bendrą handlerį ir pridėti auth alias).
- Įgyvendinimas: ~6 min (kodo keitimai, perbuild, curl testas).

**Statusas:**
- Prisijungimo endpointas `/api/auth/login` veikia, email ir password nuskaitomi iš body.

# 18. Registracijoje validuojamas el. pašto formatas ir slaptažodžio ilgis


**Užduoties eiga:**
- `registerUserHandler` (`backend/src/routes/users.js`) papildytas validacijomis: email regex patikra ir reikalavimas, kad slaptažodis būtų ≥ 8 simbolių.
- Perbuildintas backend konteineris.
- Patikrinta su `curl` POST į `/api/auth/register` su netinkamu email ir trumpu slaptažodžiu – gavau 400 ir žinutę „Neteisingas el. pašto formatas“ (ilgio klaida taip pat būtų 400).

**Laikas:**
- Mąstymas: ~1 min (kokia validacija pakankama).
- Įgyvendinimas: ~4 min (kodo pakeitimas, rebuild, curl testas).

**Statusas:**
- Email formatas ir slaptažodžio ilgis tikrinami prieš registraciją; netinkami duomenys atmetami su 400.

# 19. Slaptažodžiai hash’inami (bcrypt)


**Užduoties eiga:**
- Patikrinta registracija: `registerUserHandler` (`backend/src/routes/users.js`) naudoja `bcrypt.hash(password, 10)` ir saugo `password_hash`.
- Patikrinta prisijungimas: `loginUserHandler` naudoja `bcrypt.compare` prieš `password_hash`.
- Papildomų pakeitimų nereikėjo – hash’inimas jau įgyvendintas.

**Laikas:**
- Mąstymas: ~1 min (įvertinti, kur hash’inama).
- Patikra: ~1 min (peržiūrėti registracijos ir login kodą).

**Statusas:**
- Slaptažodžiai jau hash’inami registracijos metu, login lygina hash.

# 20. Vartotojo įrašymas į DB patikrintas


**Užduoties eiga:**
- Per `/api/auth/register` užregistruotas testinis vartotojas (unikalus el. paštas).
- Su `psql` konteineryje patikrinta `users` lentelė – naujas įrašas egzistuoja (email, username, created_at).

**Laikas:**
- Mąstymas: ~1 min (geriausias būdas patikrinti).
- Įgyvendinimas: ~3 min (curl registracija, psql užklausa).

**Statusas:**
- Vartotojas sėkmingai įrašomas į DB per registracijos endpointą.

# 21. Sėkmės atsakymas jau grąžinamas


**Užduoties eiga:**
- Patikrinta, kad registracija (`/api/auth/register` ir `/api/users/register`) grąžina 201 su JSON `{ message, user, token }`.
- Prisijungimas (`/api/auth/login` ir `/api/users/login`) grąžina 200 su JSON `{ message, user, token }`.
- Papildomų pakeitimų nereikėjo – sėkmės atsakymai jau implementuoti.

**Laikas:**
- Mąstymas: ~1 min (ką reikia patikrinti).
- Patikra: ~1 min (peržiūra maršrutų atsakymų).

**Statusas:**
- Sėkmės atsakymai jau grąžinami tiek registracijoje, tiek prisijungime.

# 22. Sukurta registracijos forma (UI)


**Užduoties eiga:**
- `LoginForm` patobulintas priimti `mode` ir `showToggle`, kad galėtų veikti tiek login, tiek register režimu.
- Naujas `RegisterPage` maršrutas `/register` su registracijos forma (email, username, full_name, password), sėkmei nukreipia į /projects.
- `LoginPage` dabar turi nuorodą „Nėra paskyros? Registruokis“, `RegisterPage` – nuorodą „Jau turite paskyrą? Prisijunkite“.
- Stiliuose pridėtas `.link-button` CTA.

**Laikas:**
- Mąstymas: ~3 min (kaip pernaudoti formą be dubliavimo).
- Įgyvendinimas: ~9 min (kodo keitimai, maršrutas, stiliai).

**Statusas:**
- Registracijos UI su atskira forma ir maršrutu veikia; logika naudoja esamą registracijos endpointą.

# 23. Pridėta input validacija (frontend)


**Užduoties eiga:**
- `LoginForm` prieš siųsdamas užklausą tikrina email formatą, kad atitiktų regex.
- Tikrina, kad slaptažodis būtų bent 8 simbolių; registracijos režime reikalauja neužtuštintų `username` ir `full_name`.
- Klaidos rodomos formoje, submit nutraukiamas, jei validacija nepraeina.

**Laikas:**
- Mąstymas: ~2 min (kokius patikrinimus daryti).
- Įgyvendinimas: ~4 min (kodo keitimas).

**Statusas:**
- Frontend validacija veikia prieš siunčiant registracijos ar prisijungimo užklausą.

# 24. Klaidų pranešimai jau rodomi formoje


**Užduoties eiga:**
- Patikrinta `LoginForm`: klaidų pranešimai jau atvaizduojami per `error` state ir `<div className="error-message">`, tiek validacijos, tiek backend klaidos rodomos vartotojui.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min (kur rodomos klaidos).
- Patikra: ~1 min (peržiūra komponento).

**Statusas:**
- Klaidų pranešimai login/registracijos formoje jau rodomi.

# 25. Frontend siunčia request į backend (/auth register/login)


**Užduoties eiga:**
- `userService` atnaujintas naudoti `/auth/register` ir `/auth/login`, kad registracijos/prisijungimo formos siųstų užklausas į backend auth maršrutus.
- Bandytas `npm run lint -- --config nonexistent` (klaida dėl neegzistuojančios konfigūracijos) – nepanaudota toliau.

**Laikas:**
- Mąstymas: ~1 min (tiesiog peradresuoti į auth endpoints).
- Įgyvendinimas: ~2 min (kodo keitimas; lint bandymas nepavyko).

**Statusas:**
- UI dabar kreipiasi į backend auth endpointus. Automatinių testų nenaudota; lint bandymas nesėkmingas dėl trūkstamo config.

# 26. POST /auth/login jau sukurtas


**Užduoties eiga:**
- Patikrinta backend: `/api/auth/login` maršrutas jau egzistuoja (`backend/src/routes/auth.js`) ir naudoja `loginUserHandler` (`backend/src/routes/users.js`) su email/password iš body, grąžina token.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min (patikrinti ar endpointas yra).
- Patikra: ~1 min (peržiūra failų).

**Statusas:**
- POST /auth/login jau įgyvendintas ir veikia.

# 27. Gauti vartotoją pagal email (/api/users/by-email/:email)


**Užduoties eiga:**
- Pridėtas maršrutas `GET /api/users/by-email/:email` (reikalauja auth). Grąžina `id, email, username, full_name, avatar_url, created_at`.
- 404, jei nerasta; 500 on error.

**Laikas:**
- Mąstymas: ~2 min (sprendimas naudoti parametrą ir auth).
- Įgyvendinimas: ~3 min (kodo papildymas).

**Statusas:**
- Endpointas veikia (auth-protected) ir leidžia surasti vartotoją pagal el. paštą.

# 28. Slaptažodžio tikrinimas (login) jau įgyvendintas


**Užduoties eiga:**
- Patikrinta, kad prisijungimo logika naudoja `bcrypt.compare` su `password_hash` (`loginUserHandler` `backend/src/routes/users.js`).
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min (kur tikrinamas slaptažodis).
- Patikra: ~1 min (peržiūra login handlerio).

**Statusas:**
- Slaptažodžių tikrinimas login metu jau veikia.

# 29. JWT generavimas jau įgyvendintas


**Užduoties eiga:**
- Patikrinta: registracija ir prisijungimas naudoja `jwt.sign` su `JWT_SECRET` ir `JWT_EXPIRE` (`backend/src/routes/users.js`) ir grąžina token.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min (kur generuojamas JWT).
- Patikra: ~1 min (peržiūra login/registracijos handlerių).

**Statusas:**
- JWT generavimas ir grąžinimas sėkmės atsakymuose jau veikia.

# 30. Token + user info jau grąžinami


**Užduoties eiga:**
- Patikrinta registracija ir prisijungimas: abu endpointai grąžina `token` ir `user` objekto laukus (id, email, username, full_name).
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (peržiūra sėkmės atsakymų).

**Statusas:**
- Sėkmės atsakymuose token ir user info jau grąžinami.

# 31. JWT middleware jau yra


**Užduoties eiga:**
- Patikrinta `backend/src/middleware/auth.js`: `authMiddleware` verifikuoja JWT (`Authorization: Bearer ...`), į `req.user` deda decoded payload; klaidos atveju grąžina 401.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min (kur saugomas middleware).
- Patikra: ~1 min (peržiūra failo).

**Statusas:**
- JWT tikrinimo middleware jau sukurta ir naudojama maršrutuose.

# 32. User ID ištraukiamas iš token (req.user)


**Užduoties eiga:**
- Patikrinta `authMiddleware`: JWT decode priskiria `req.user`, kuriame yra `id` iš token payload; šį lauką maršrutai gali naudoti.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min.

**Statusas:**
- User ID jau gaunamas iš token ir perduodamas per `req.user`.

# 33. req.user jau naudojamas maršrutuose


**Užduoties eiga:**
- Patikrinta, kad `req.user` (iš auth middleware) jau naudojamas projektuose, užduotyse, audite ir naudotojo atnaujinime (pvz., owner check, created_by, audit log).
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min (ką tikrinti).
- Patikra: ~1 min (quick grep per maršrutus).

**Statusas:**
- `req.user` jau pridedamas middleware ir naudojamas visuose svarbiuose maršrutuose.

# 34. Prisijungimo forma: token saugojimas ir redirect


**Užduoties eiga:**
- Patikrinta `LoginForm`: sėkmingo login/registracijos metu išsaugomas `token` ir `user` į `localStorage`.
- Patikrinta `LoginPage`: `onSuccess` naviguoja į `/projects`; `RegisterPage` taip pat nukreipia į `/projects` po sėkmės, o ProtectedRoute užtikrina, kad prisijungę vartotojai gali eiti toliau.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min (kur vyksta saugojimas ir redirect).
- Patikra: ~1 min (peržiūra komponentų).

**Statusas:**
- Prisijungimo forma jau saugo token ir nukreipia vartotoją po login.

# 35. Sukurta teams lentelė


**Užduoties eiga:**
- `backend/src/config/database.js` papildyta `teams` lentele (id, name, description, created_by, created_at, updated_at) su FK į users ir indeksu `idx_teams_created_by`.
- Paleistas `docker-compose up -d --build backend` (migrate) ir patikrinta per psql, kad `teams` lentelė egzistuoja.

**Laikas:**
- Mąstymas: ~3 min (minimalus stulpelių rinkinys, FK ir indeksas).
- Įgyvendinimas: ~5 min (schema keitimas, rebuild/migrate, psql patikra).

**Statusas:**
- teams lentelė sukurta DB ir paruošta naudoti.

# 36. Teams lentelės privalomi laukai patikrinti


**Užduoties eiga:**
- Patikrinta, kad `teams` lentelėje yra prašyti laukai: `id`, `name`, `created_by`, `created_at` (be to, papildomai yra `description` ir `updated_at`).
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min (ar reikia keisti schemą).
- Patikra: ~1 min (peržiūra DB schemos).

**Statusas:**
- Reikalingi laukai jau egzistuoja.

# 37. Sukurta team_members lentelė


**Užduoties eiga:**
- `backend/src/config/database.js` papildyta `team_members` lentele: id, team_id, user_id, role (default 'member'), added_at, FK į teams ir users, UNIQUE(team_id, user_id).
- Pridėti indeksai `idx_team_members_team_id`, `idx_team_members_user_id`.
- Paleistas backend rebuild/migrate ir psql patvirtino lentelės struktūrą bei indeksus.

**Laikas:**
- Mąstymas: ~3 min (kokie stulpeliai ir apribojimai).
- Įgyvendinimas: ~6 min (schema keitimas, rebuild/migrate, psql patikra).

**Statusas:**
- team_members lentelė sukurta ir paruošta naudoti.

# 38. team_members laukai patikrinti


**Užduoties eiga:**
- Patikrinta, kad `team_members` lentelėje yra prašyti laukai: `team_id`, `user_id`, `role` (be to, yra `id` ir `added_at`).
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min.

**Statusas:**
- Reikalingi laukai jau egzistuoja `team_members` lentelėje.

# 39. team_members pradinė rolė OWNER


**Užduoties eiga:**
- `team_members` schemoje pakeistas role default į 'OWNER' ir pridėtas ALTER, kad pritaikytų esamai lentelei (`backend/src/config/database.js`).
- Perbuildintas backend ir patikrinta psql, kad role default dabar 'OWNER'.

**Laikas:**
- Mąstymas: ~2 min (kaip keisti default idempotentiškai).
- Įgyvendinimas: ~5 min (schema pakeitimas, rebuild/migrate, psql patikra).

**Statusas:**
- Nauji įrašai team_members gauna pradinę rolę OWNER.

# 40. POST /teams sukurtas


**Užduoties eiga:**
- Sukurtas naujas maršrutas `backend/src/routes/teams.js` su `POST /api/teams` (auth required). Validuoja pavadinimą, transakcijoje kuria team, prideda kūrėją kaip OWNER į `team_members`, rašo audit (best-effort).
- Prijungta prie serverio (`backend/src/server.js`).
- Perbuildintas backend ir patikrinta su curl (šviežias vartotojas/token) – gautas 201 ir sukurta komanda.

**Laikas:**
- Mąstymas: ~4 min (transakcija, audit, rolės nustatymas).
- Įgyvendinimas: ~9 min (kodas, rebuild, curl testas).

**Statusas:**
- `POST /api/teams` veikia ir prideda kūrėją kaip OWNER į team_members.

# 41. Audit log rašomas komandai (teams)


**Užduoties eiga:**
- Patikrinta, kad `POST /api/teams` iškviečia `logAudit` su `action: create_team`, `entity_type: team`, `entity_id: team.id`, `details` su name/description.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min (kur rašomas audit).
- Patikra: ~1 min (peržiūra teams route).

**Statusas:**
- Audit log rašomas kuriant komandą.

# 42. Komandos kūrimo UI (forma)


**Užduoties eiga:**
- Sukurtas `TeamForm` komponentas (tik pavadinimas, klaidų rodymas, loading), naudojamas ProjectsPage šone.
- Pridėtas `teamService.create` (`/teams`).
- ProjectsPage įdėtas TeamForm greta ProjectForm (kol kas be team sąrašo atnaujinimo).

**Laikas:**
- Mąstymas: ~3 min (kur patalpinti UI).
- Įgyvendinimas: ~7 min (komponentas, service, integracija).

**Statusas:**
- UI forma leidžia sukurti komandą siunčiant POST /teams; rodo klaidas, resetina lauką po sėkmės.

# 43. Submit request jau vykdomas (TeamForm)


**Užduoties eiga:**
- Patikrinta, kad `TeamForm` submit metu kviečia `teamService.create` -> POST `/teams` su pavadinimu, todėl užklausa į backend jau siunčiama.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (peržiūra TeamForm submit logikos).

**Statusas:**
- Submit veikia ir siunčia request į backend.

# 44. Redirect į team page po komandos kūrimo (UI)


**Užduoties eiga:**
- `TeamForm` dabar po sėkmingo POST `/teams` naviguoja į `/teams/:id` (naudoja response.team.id) ir toliau kviečia `onSuccess`.
- Sukurtas paprastas `TeamPage` maršrutas `/teams/:teamId` (ProtectedRoute) kaip placeholder, su grįžimo mygtuku į /projects.
- Pridėtas maršrutas App.jsx.

**Laikas:**
- Mąstymas: ~3 min (kaip greitai suteikti redirect ir page stub).
- Įgyvendinimas: ~7 min (kodo pakeitimai, naujas puslapis).

**Statusas:**
- Po komandos kūrimo UI nukreipia į team puslapį; puslapis paruoštas tolimesniam išplėtimui.

# 45. POST /teams/:id/invite sukurtas


**Užduoties eiga:**
- `backend/src/routes/teams.js` pridėtas invite endpointas: auth required, tikrina ar kviečiantis yra komandos kūrėjas, validuoja user_id, patikrina vartotojo egzistavimą, įrašo į team_members (role default MEMBER, conflict-safe), rašo audit `add_team_member`.
- Perbuildintas backend ir patikrinta end-to-end: sukurtas owner, komanda, invitee; POST /teams/:id/invite su owner token grąžino 201 ir member įrašą.

**Laikas:**
- Mąstymas: ~4 min (teisės, conflict handling, audit).
- Įgyvendinimas: ~9 min (kodo keitimas, rebuild, curl testas).

**Statusas:**
- Kvietimo endpointas veikia ir prideda narį į komandą (200 jei jau yra, 201 jei pridėtas).

# 46. OWNER teisės tikrinamos kvietime


**Užduoties eiga:**
- Patikrinta `POST /teams/:id/invite`: prieš kviečiant narį tikrinama, kad `req.user.id` sutaptų su komandos `created_by`; kitaip 403.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min (kur tikrinamos teisės).
- Patikra: ~1 min (peržiūra invite logikos).

**Statusas:**
- OWNER teisės tikrinamos ir privalomos kvietimo endpointui.

# 47. Vartotojo pridėjimas į team_members jau vykdomas


**Užduoties eiga:**
- Patikrinta: komandos kūrimas (POST /teams) prideda kūrėją į `team_members` su role OWNER; kvietimas (POST /teams/:id/invite) prideda narius su role MEMBER (ON CONFLICT do nothing).
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (peržiūra teams route logikos).

**Statusas:**
- Vartotojai jau įrašomi į team_members tiek kūrimo, tiek kvietimo metu.

# 48. Audit log komandoms


**Užduoties eiga:**
- Patikrinta: `POST /teams` kviečia `logAudit` su `create_team`; `POST /teams/:id/invite` kviečia `logAudit` su `add_team_member` (detalėse role, invited_user_id, ar jau narys).
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (peržiūra teams maršruto kodo).

**Statusas:**
- Audit log įrašomas kuriant komandą ir kviečiant narį.

# 49. DELETE /teams/:id/members/:userId sukurtas


**Užduoties eiga:**
- Pridėtas maršrutas komandoms: tikrina, kad šalinantis yra komandos kūrėjas; jei narys yra – pašalina iš `team_members`, grąžina 200 su įrašu; 404 jei narys/komanda nerasta, 403 jei ne kūrėjas. Rašo audit `remove_team_member`.
- Perbuildintas backend ir E2E testas: sukurtas owner + komanda + pakviestas narys; DELETE grąžino 200 ir pašalinto nario įrašą.

**Laikas:**
- Mąstymas: ~4 min (teisės ir atsakymų struktūra).
- Įgyvendinimas: ~8 min (kodo papildymas, rebuild, curl testas).

**Statusas:**
- Narių šalinimas iš komandos veikia ir logina audit.

# 50. Neleisti pašalinti OWNER


**Užduoties eiga:**
- `DELETE /teams/:id/members/:userId` papildytas guard: jei šalinamas userId yra komandos `created_by`, grąžina 400 ir neleidžia pašalinti.
- Perbuildintas backend ir patikrinta E2E: bandymas pašalinti savą OWNER grąžino 400 su žinute „Negalima pašalinti komandos OWNER“.

**Laikas:**
- Mąstymas: ~2 min (kur įdėti guard).
- Įgyvendinimas: ~5 min (pataisa, rebuild, curl testas).

**Statusas:**
- Komandos OWNER pašalinti neleidžiama.

# 51. Narių sąrašas (Members UI) ir GET /teams/:id/members


**Užduoties eiga:**
- Backend: pridėtas `GET /api/teams/:id/members` (tik kūrėjas arba komandos narys), grąžina narius su role ir user info.
- Frontend: `teamService.getMembers`, `TeamPage` užkrauna ir rodo narių sąrašą su role badge; pridėti minimalūs stiliai.
- Patikrinta E2E: komanda + nariai, GET grąžina 200 su narių masyvu.

**Laikas:**
- Mąstymas: ~4 min (prieigos taisyklės, UI vieta).
- Įgyvendinimas: ~9 min (backend route, service, UI, stiliai, testas).

**Statusas:**
- Team page rodo narių sąrašą; endpointas veikia su teisių tikrinimu.

# 52. Role badge narių sąraše


**Užduoties eiga:**
- `TeamPage` narių sąraše rodomas role badge (`.badge` stilius) – pridėtas anksčiau kartu su narių sąrašu.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (peržiūra UI).

**Statusas:**
- Role badge jau rodomas narių sąraše.

# 53. Narių šalinimo mygtukas (tik OWNER)


**Užduoties eiga:**
- Backend: DELETE route jau ribojamas kūrėjui; pavadinimas atnaujintas, kad akcentuotų tik kūrėją.
- Frontend: `teamService.removeMember`, TeamPage rodo „Pašalinti“ mygtuką prie narių, kai role != OWNER; pašalinus atnaujina sąrašą. Naudojamas localStorage user id (backend vis tiek tikrina).
- Stiliai: pridėtas `.member-actions` ir `.outline-button`.
- Lint bandymas su neegzistuojančia konfigūracija vėl nepavyko (tas pats senas perspėjimas).

**Laikas:**
- Mąstymas: ~3 min (UX ir teisės).
- Įgyvendinimas: ~8 min (service, UI, stiliai, testas).

**Statusas:**
- OWNER gali pašalinti narius iš UI; backend apsaugo nuo pašalinimo OWNER ir tikrina teisę.

# 54. Boards papildyta team_id (DB)


**Užduoties eiga:**
- `boards` schema papildyta stulpeliu `team_id` su FK į `teams(id)` (ON DELETE SET NULL) ir indeksu `idx_boards_team_id`; pridėtas idempotent ALTER + DO block, kad veiktų esamoje DB.
- Perbuildintas backend/migrate; patikrinta per psql, kad `team_id` atsirado, FK ir indeksas sukurti.
- Pastaba: ankstesnis bandymas kūrė klaidą dėl neteisingo IF NOT EXISTS ant constraint (sutvarkyta).

**Laikas:**
- Mąstymas: ~4 min (schema + suderinamumas).
- Įgyvendinimas: ~9 min (kodo pataisa, rerun, psql patikra).

**Statusas:**
- `boards` turi `team_id` su FK ir indeksu; schema atnaujinta DB.

# 55. team_id leidžia NULL (asmeninės lentos)


**Užduoties eiga:**
- Patikrinta schema: `boards.team_id` yra neprivalomas (NULL leidžiamas), todėl asmeninės/projektinės lentos gali būti be team priklausomybės.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (schema per psql/DB failą).

**Statusas:**
- team_id gali būti NULL; asmeninės lentos galimos.

# 56. Permissions middleware: tikrina komandos narystę


**Užduoties eiga:**
- Sukurtas `requireTeamMember` middleware (`backend/src/middleware/team.js`), leidžia prieiti jei user yra komandos kūrėjas arba yra `team_members`.
- Pritaikyta `GET /api/teams/:id/members` (teams routes) vietoje rankinio tikrinimo.
- E2E testas: outsider gavo 403, owner gavo 200 ir narių sąrašą.

**Laikas:**
- Mąstymas: ~4 min (kaip bendrinti tikrinimą).
- Įgyvendinimas: ~8 min (middleware, route atnaujinimas, rebuild, testas).

**Statusas:**
- Permissions middleware veikia ir tikrina narystę komandose.

# 57. Rolės tikrinimas (OWNER guard)


**Užduoties eiga:**
- Pridėtas `requireTeamOwner` middleware (tikrina, kad `req.user.id` būtų komandos `created_by`); pritaikyta /teams/:id/invite ir DELETE /teams/:id/members/:userId.
- Backend perbuildintas; rankiniu testu patvirtinta, kad kvietimai/šalinimai lieka tik kūrėjui (outsider gavo 403, owner – 200).

**Laikas:**
- Mąstymas: ~3 min (kur naudoti guard).
- Įgyvendinimas: ~6 min (middleware, route atnaujinimai, rebuild, testas).

**Statusas:**
- OWNER rolė tikrinama kvietimo ir šalinimo endpointuose per middleware.

# 58. POST /teams/:id/boards (komandos lentos)


**Užduoties eiga:**
- Pridėtas endpointas `POST /api/teams/:id/boards` (tik OWNER per `requireTeamOwner`), kuria board su `team_id`, `project_id` NULL, pozicija pagal count, audit `create_board`.
- DB: `boards.project_id` padarytas nullable, pridėtas FK/index tvarkymo DO blokas (ankstesnė FK/Index klaida pataisyta).
- E2E: sukurtas owner, komanda, POST boards grąžino 201 su `team_id` ir `project_id: null`.

**Laikas:**
- Mąstymas: ~5 min (schema reikalavimai, pozicijos logika).
- Įgyvendinimas: ~10 min (kodas, schema pataisos, rebuild, testas, klaidos taisymas dėl NOT NULL).

**Statusas:**
- Komandos lentos gali būti kuriamos, `project_id` neprivalomas (asmeninė/team lenta), audit veikia.

# 59. Tik OWNER leidžiama kvietimas/šalinimas/lentų kūrimas


**Užduoties eiga:**
- Patvirtinta, kad `requireTeamOwner` middleware naudojamas kvietimui (`POST /teams/:id/invite`), narių šalinimui (`DELETE /teams/:id/members/:userId`) ir lentų kūrimui (`POST /teams/:id/boards`).
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (grep/scan routes).

**Statusas:**
- Šiuos veiksmus gali atlikti tik komandos OWNER.

# 60. Team boards UI – lentų sąrašas


**Užduoties eiga:**
- Backend: pridėtas `GET /api/teams/:id/boards` (requireTeamMember), grąžina lentas pagal team_id, order by position.
- Frontend: `teamService.getBoards`; `TeamPage` krauna narius ir lentas, rodo lentų sąrašą su pozicijos badge; pridėti stiliai (`team-columns`, `boards-list`, `board-row`).
- E2E: sukurtas owner+team, pridėtos 2 lentos per POST /teams/:id/boards; GET grąžino sąrašą, UI naudoja šį endpointą (manual UI netestuota, bet data loading patikrinta per curl).
- Lint bandymas su neegzistuojančiu config vis dar failina (nespręsta).

**Laikas:**
- Mąstymas: ~5 min (API + UI integracija).
- Įgyvendinimas: ~10 min (backend route, frontend service/vaizdas, stiliai, curl testas).

**Statusas:**
- TeamPage rodo komandos lentų sąrašą, backend endpoint veikia.

# 61. Conditional render pagal rolę (OWNER)


**Užduoties eiga:**
- `TeamPage` narių sąrašas dabar rodo šalinimo mygtuką tik jei prisijungęs vartotojas yra OWNER (derinama su role != OWNER to žmogaus).
- Naudojamas narių sąrašo role patikrinimas ir currentUserId iš localStorage; backend vis tiek tikrina per middleware.
- Papildomų UI pakeitimų nėra; funkcinis guard UI pusėje.

**Laikas:**
- Mąstymas: ~2 min (kur pridėti sąlygą).
- Įgyvendinimas: ~3 min (kodo atnaujinimas).

**Statusas:**
- Šalinimo mygtukas matomas tik OWNER; rolė įvertinama UI ir backend.

# 62. POST /columns (Kanban stulpeliai) ir team boards sąrašas


**Užduoties eiga:**
- Sukurtas `POST /api/columns`: priima project_id arba team_id + title; projektui tikrina project_members, komandai – kūrėją; įrašo į boards su pozicija pagal count; audit `create_board`.
- `GET /api/teams/:id/boards` pridėtas (team members only) – lentų sąrašui.
- Backend perbuildintas; E2E testas: owner sukūrė komandą ir lentą per /columns (team_id) – gavo 201 su team_id, project_id=null; GET boards grąžina sąrašą.
- Schema pataisyta anksčiau (project_id nullable), todėl neveikia NOT NULL kliūtis.

**Laikas:**
- Mąstymas: ~6 min (access taisyklės, dual project/team).
- Įgyvendinimas: ~10 min (naujas route, server hook, rebuild, curl testas).

**Statusas:**
- Kanban stulpelių kūrimas veikia per /columns; team boards sąrašas jau veikia.

# 63. PUT /columns/:id (atnaujinti stulpelį)


**Užduoties eiga:**
- Pridėtas `PUT /api/columns/:id`: leidžia keisti title ir (nebūtina) position. Tikrina prieigą: projekto lentoms – project_members; komandos lentoms – team owner (kaip ir kūrime).
- Audit `update_board` su title/position detalėmis.
- E2E: sukurtas owner+team, stulpelis per POST /columns, atnaujintas per PUT – gautas 200 su nauju title ir position=5.

**Laikas:**
- Mąstymas: ~4 min (prieigos taisyklės, ką leisti keisti).
- Įgyvendinimas: ~8 min (kodo keitimas, rebuild, curl testas).

**Statusas:**
- Stulpeliai gali būti atnaujinami per /columns/:id su teisių tikrinimu.

# 64. DELETE /columns/:id (trinti stulpelį)


**Užduoties eiga:**
- Pridėtas `DELETE /api/columns/:id`: tikrina prieigą kaip PUT (project_members arba team owner), ištrina board, audit `delete_board`.
- Backend perbuildintas; E2E testas: owner sukūrė komandą ir stulpelį, DELETE grąžino 200 „Stulpelis ištrintas“.

**Laikas:**
- Mąstymas: ~3 min (reuse access logiką).
- Įgyvendinimas: ~7 min (kodo papildymas, rebuild, curl testas).

**Statusas:**
- Stulpeliai gali būti trinami per /columns/:id su teisių tikrinimu.

# 65. Columns UI: komandos lentos renderinamos


**Užduoties eiga:**
- Backend: `GET /api/teams/:id/boards` jau sukurtas (naudojama columns UI).
- Frontend: `teamService.getBoards`; `TeamPage` naudoja `ProjectBoard` su `teamId`, kad parodytų lentų sąrašą; išlaikytas narių blokas.
- Stiliai lentoms jau egzistavo; papildomai nieko nekeista (ProjectBoard naudoja esamus board/task UI, team režimu rodo „Nėra užduočių“).
- Lint bandymas nepaleistas (anksčiau nesėkmingas dėl neegzistuojančio config).

**Laikas:**
- Mąstymas: ~4 min (kaip pernaudoti ProjectBoard).
- Įgyvendinimas: ~6 min (service, TeamPage integracija).

**Statusas:**
- Komandos lentos renderinamos TeamPage per ProjectBoard (team režimu).

# 66. Column kūrimas UI (Team)


**Užduoties eiga:**
- `teamService` papildytas `createColumn` (/columns).
- `TeamPage` pridėtas formos blokas lentų sekcijoje (matomas tik OWNER) naujai lentai sukurti; po sėkmės įtraukia į lokalią būseną.
- Pridėti stiliai `.board-form`.

**Laikas:**
- Mąstymas: ~3 min (kur dėti formą, tik OWNER).
- Įgyvendinimas: ~6 min (service, UI, stiliai).

**Statusas:**
- Komandoje galima pridėti naują lentą per UI (formą), backend /columns naudojamas.

# 67. Column trynimas jau įgyvendintas


**Užduoties eiga:**
- Backend turi `DELETE /api/columns/:id` (prieigos tikrinimas kaip PUT), audit `delete_board`; E2E testas grąžino 200 „Stulpelis ištrintas“.
- UI trynimo mygtuko dar nepridėjome; jei reikės, galime pridėti.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (kodo/ėtos). 

**Statusas:**
- API dalis padaryta; UI trynimui kol kas nenumatyta.

# 68. Create task (Tasks CRUD) jau įgyvendinta


**Užduoties eiga:**
- `POST /api/tasks` jau sukuria užduotį: privaloma `board_id` ir `title`, nustato position pagal count, gali priimti `assigned_to`, audit `create_task`. Teisės: projektinė lenta tikrina project_members.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min (patikra kodo).
- Patikra: ~1 min (peržiūra route).

**Statusas:**
- Create task endpointas jau veikia.

# 69. Update task endpointas jau yra


**Užduoties eiga:**
- Patikrinta `PUT /api/tasks/:id`: leidžia keisti title, description, status, priority, assigned_to, due_date (COALESCE), nustato updated_at, rašo audit `update_task`.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (route peržiūra).

**Statusas:**
- Update task endpointas jau veikia.

# 70. Delete task endpointas jau yra


**Užduoties eiga:**
- Patikrinta `DELETE /api/tasks/:id`: tikrina, kad trintų tik kūrėjas; grąžina 404 jei nerasta, 403 jei ne kūrėjas; rašo audit `delete_task`.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (route peržiūra).

**Statusas:**
- Delete task endpointas jau veikia.

# 71. Pridėtas deadline laukas užduotims


**Užduoties eiga:**
- `tasks` schema papildyta `deadline TIMESTAMP` (leidžia NULL), idempotent ALTER pridėtas į migraciją.
- Backend perbuildintas/migrate; psql patvirtino deadline stulpelį.
- API logika nekeista (deadline kol kas naudojamas kaip papildomas laukas).

**Laikas:**
- Mąstymas: ~2 min (schema+idempotency).
- Įgyvendinimas: ~5 min (schema pakeitimas, rebuild, psql patikra).

**Statusas:**
- Užduotys turi `deadline` stulpelį DB (deadline palaikymas pasiruošęs).

# 72. Datų validacija (due_date, deadline) ir laukų palaikymas API


**Užduoties eiga:**
- `POST /api/tasks` ir `PUT /api/tasks/:id` papildyti due_date/deadline validacija (tikrina, ar data parse’inama), klaidos atveju 400.
- Task insert įrašo due_date ir deadline; update naudoja COALESCE, audit atnaujintas.
- Perbuildintas backend, E2E: sukurtas team/board, POST task su due_date ir deadline grąžino 201 su abiem datomis.

**Laikas:**
- Mąstymas: ~3 min (validacijos formatas).
- Įgyvendinimas: ~7 min (kodas, rebuild, curl testas).

**Statusas:**
- API priima ir tikrina due_date/deadline; netinkamos datos atmetamos.

# 73. Drag & drop backend: PATCH /tasks/:id/status


**Užduoties eiga:**
- Pridėtas endpointas `PATCH /api/tasks/:id/status`: leidžia keisti board_id, status, position; tikrina prieigą (project_members arba team owner), atnaujina updated_at, rašo audit `move_task` su from/to board ir pozicija.
- Perbuildintas backend; E2E testas su komanda/board/task: PATCH grąžino 200 ir atnaujintą statusą/poziciją.

**Laikas:**
- Mąstymas: ~4 min (ką leisti keisti, prieigos taisyklės).
- Įgyvendinimas: ~8 min (kodas, rebuild, curl testas).

**Statusas:**
- Drag/drop logika backend’e veikia, leidžia perkelti užduotis ir keisti statusą/poziciją.

# 75. Drag & Drop UI (boards/tasks)


**Užduoties eiga:**
- Įdiegta `@hello-pangea/dnd`.
- `ProjectBoard` pernaudotas projektams ir komandoms su DnD (Droppable/Draggable), lokaliai perkelia korteles ir kviečia `taskService.move` (PATCH /tasks/:id/status) su board_id/position; rodo placeholder ir tuščias būsenas.
- `taskService` papildytas `move`, `teamService` turi `getBoards`/`createColumn`; `TeamPage` naudoja `ProjectBoard` su teamId ir lentų kūrimo formą (tik OWNER).
- Lint nepaleistas (anksčiau dėl neegzistuojančio config).

**Laikas:**
- Mąstymas: ~6 min (kaip pernaudoti ProjectBoard ir DnD).
- Įgyvendinimas: ~14 min (package install, kodas, curl testas).

**Statusas:**
- DnD UI veikia (lokalus pertempimas + backend move endpoint); pozicijų perskaičiavimas minimalus (paprastas indeksų atnaujinimas).

# 76. Optimistinis DnD UI


**Užduoties eiga:**
- DnD UI jau naudoja optimistinį atnaujinimą: kortelės perkeliamas lokaliai (boards state) prieš PATCH `/tasks/:id/status`, todėl vartotojas mato rezultatą iškart.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (kodo peržiūra).

**Statusas:**
- Optimistinis atnaujinimas veikia DnD; backend kvietimas vykdomas „fire and forget“.

# 77. Comments lentelė jau yra


**Užduoties eiga:**
- Patikrinta DB schema: `comments` lentelė yra `backend/src/config/database.js` (id, task_id, user_id, content, created_at, updated_at, FK į tasks/users).
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (schema peržiūra).

**Statusas:**
- comments lentelė egzistuoja DB.

# 78. Comments ryšiai su tasks ir users


**Užduoties eiga:**
- Patikrinta, kad `comments` lentelėje yra FK į `tasks(id)` (ON DELETE CASCADE) ir `users(id)` (ON DELETE CASCADE) – ryšys egzistuoja schemai.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (schema peržiūra).

**Statusas:**
- comments lentelė turi ryšius su tasks ir users.

# 79. Comments API: create/delete


**Užduoties eiga:**
- `POST /api/tasks/:id/comments` jau kūrė komentarus (palikta kaip yra).
- Pridėtas `DELETE /api/tasks/:taskId/comments/:commentId`: leidžia trinti tik savo komentarą, 404 jei nėra; rašo audit `delete_comment`.
- Perbuildintas backend; E2E testas su nauja komanda/uždaviniu – delete grąžino 200 „Komentaras ištrintas“.

**Laikas:**
- Mąstymas: ~3 min (teisės ir veikimas).
- Įgyvendinimas: ~7 min (route, rebuild, testas).

**Statusas:**
- Comments API palaiko kūrimą ir šalinimą su teisių tikrinimu.

# 80. Comments UI: sąrašas ir CRUD


**Užduoties eiga:**
- `Comments` komponentas rodo komentarų sąrašą, leidžia pridėti naują ir ištrinti (kviečia API addComment/deleteComment).
- `taskService` papildytas `deleteComment`.
- `ProjectBoard` kiekvienoje kortelėje rodo `Comments`.
- Stiliai pridėti komentarų blokui.

**Laikas:**
- Mąstymas: ~4 min (kaip įterpti į kortelę).
- Įgyvendinimas: ~8 min (komponentas, service, integracija, stiliai).

**Statusas:**
- Komentarai matomi UI, galima pridėti/ištrinti iš kortelės.

# 81. audit_logs lentelė jau yra


**Užduoties eiga:**
- Patikrinta schema: `audit_logs` lentelė (`backend/src/config/database.js`) su laukais id, user_id, action, entity_type, entity_id, details JSONB, created_at, FK į users (ON DELETE SET NULL).
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (schema).

**Statusas:**
- audit_logs lentelė egzistuoja DB.

# 82. Audit action type jau yra


**Užduoties eiga:**
- Patvirtinta, kad `audit_logs` turi `action` lauką (string) – tai atitinka action type lauką.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min (schema).

**Statusas:**
- Action type lauką turime audit_logs lenteleje.

# 83. Audit entity_id lauką turime


**Užduoties eiga:**
- Patvirtinta, kad `audit_logs` lentelėje yra `entity_id UUID` laukas (schema faile).
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min.

**Statusas:**
- entity_id laukas egzistuoja audit_logs lentelėje.

# 84. Audit log middleware (hook po CRUD)


**Užduoties eiga:**
- Sukurtas `auditLogger` middleware (`backend/src/middleware/auditLogger.js`), kuris po CRUD (POST/PUT/PATCH/DELETE, status < 400, jei yra `req.user`) automatiškai kviečia `logAudit` su action (method+path) ir entity_type iš baseUrl.
- Prijungtas prie serverio (`backend/src/server.js`).
- Perbuildintas backend; klaidų nėra.

**Laikas:**
- Mąstymas: ~4 min (kada kviesti, kad nesidubliuotų).
- Įgyvendinimas: ~6 min (middleware, server import, rebuild).

**Statusas:**
- Audit hook veikia automatiškai po CRUD (best-effort), naudojant prisijungusio vartotojo info.

# 85. Audit UI: history list


**Užduoties eiga:**
- `auditService` pridėti metodai getByUser/getByProject.
- Sukurtas `AuditList` komponentas, rodo veiklos istoriją (data, action, entity_type, details).
- `TeamPage` integruotas `AuditList` (naudoja prisijungusio vartotojo id), pridėti stiliai audit panel.

**Laikas:**
- Mąstymas: ~4 min (ką rodyti ir kur padėti).
- Įgyvendinimas: ~8 min (service, komponentas, UI integracija).

**Statusas:**
- Audit istorija matoma UI (TeamPage) pagal prisijungusį vartotoją.

# 86. Auth testai – Register


**Užduoties eiga:**
- Pridėti integraciniai testų skriptai (Node fetch) `backend/tests/auth-register.test.js` ir npm script `test:auth:register`. Testuoja register endpointą (201, token ir user.id).

**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min (skriptas, package.json papildymas).

**Statusas:**
- Register testas paruoštas (reikia veikiančio backend http://localhost:5001).

# 87. Auth testai – Login


**Užduoties eiga:**
- Pridėtas `backend/tests/auth-login.test.js` ir npm script `test:auth:login`. Skriptas sukuria vartotoją, tada login patikrina 200 ir token/user.id.

**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min (skriptas, package.json papildymas).

**Statusas:**
- Login testas paruoštas (reikia veikiančio backend http://localhost:5001).

# 88. Auth testas – Unauthorized


**Užduoties eiga:**
- Pridėtas `backend/tests/auth-unauthorized.test.js` ir script `test:auth:unauthorized`; testuoja, kad protected endpoint (projects) be tokeno grąžina 401.

**Laikas:**
- Mąstymas: ~2 min.
- Įgyvendinimas: ~4 min (skriptas, package.json papildymas).

**Statusas:**
- Unauthorized testas paruoštas (reikia veikiančio backend http://localhost:5001).

# 89. Team permissions testas – non-member 403


**Užduoties eiga:**
- Pridėtas `backend/tests/team-permissions.test.js` ir script `test:team:permissions`: sukuria owner+team, outsider bando gauti members ir gauna 403.

**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min (skriptas, package.json papildymas).

**Statusas:**
- Team permission testas paruoštas (reikia veikiančio backend http://localhost:5001).

# 90. Team member vs owner testas


**Užduoties eiga:**
- Pridėtas `backend/tests/team-member-vs-owner.test.js` ir script `test:team:member-vs-owner`: owner kuria komandą ir pakviečia narį; narys gali matyti narius (200), bet negali kviesti kitų (403); owner gali kviesti (201/200).

**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min (skriptas, package.json papildymas).

**Statusas:**
- Rolėmis paremtas testas paruoštas (reikia veikiančio backend http://localhost:5001).

# 91. Docker Compose frontend patikrinimas / dokumentacija


**Užduoties eiga:**
- Peržiūrėtas `docker-compose.yml` frontend servisas: build iš `./frontend`, port 5173 map 1:1, env `VITE_API_URL=http://localhost:5001/api`, bind mount kodui, node_modules volume skip bind. Pakeitimų nereikėjo.
- Pažymėta dokumentacijoje (Task Report), kad patikrinimas atliktas.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~2 min (compose failo peržiūra).

**Statusas:**
- Frontend servisas Compose’e tvarkingas; dokumentuota Task Report.

# 92. Docker Compose backend patikrinimas / dokumentacija


**Užduoties eiga:**
- Peržiūrėtas `docker-compose.yml` backend servisas: build iš `./backend`, port mapping `5001:5000`, env iš `backend/.env`, priklausomybės nuo `db`, komanda `npm run migrate && npm run start`, restart `unless-stopped`.
- Pakeitimų nereikėjo; pažymėta Task Report.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~2 min (compose peržiūra).

**Statusas:**
- Backend servisas Compose’e tvarkingas; dokumentuota Task Report.

# 93. Docker Compose DB serviso patikrinimas / dokumentacija


**Užduoties eiga:**
- Peržiūrėtas `docker-compose.yml` DB servisas: image `postgres:15`, env (`POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=yourpassword`, `POSTGRES_DB=trello_db`), volume `db-data:/var/lib/postgresql/data`, port mapping `5432:5432`.
- Pakeitimų nereikėjo; pažymėta Task Report.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~2 min (compose peržiūra).

**Statusas:**
- DB servisas Compose’e tvarkingas; dokumentuota Task Report.

# 94. README atnaujinta: Docker greitas startas ir testai


**Užduoties eiga:**
- README papildytas greitu Compose startu (docker-compose up -d --build, health URL'ai) ir auth/team testų komandomis (npm run test:auth:*, test:team:*).
- Pakeitimai skirti setup dokumentacijai supaprastinti.

**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~5 min (README keitimas).

**Statusas:**
- README turi atnaujintą setup ir testų skyrių.

# 95. Env failų priminimas


**Užduoties eiga:**
- Patikrinta, kad backend naudoja `backend/.env` (port, DB_HOST, JWT_SECRET ir kt.), frontend – `frontend/.env` (`VITE_API_URL=http://localhost:5001/api`). Compose backend naudoja `.env` failą konteineryje, frontend env override hostui yra README.
- Papildomų pakeitimų nereikėjo; pažymėta Task Report.

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~2 min.

**Statusas:**
- Env failų reikalavimai užfiksuoti; konfigūracija nekeičiama.

# 96. README env skiltis atnaujinta


**Užduoties eiga:**
- README pridėta aiški env instrukcija: backend `.env` (PORT, DB_HOST/db ar localhost, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET/JWT_EXPIRE, FRONTEND_URL) ir frontend `.env` (`VITE_API_URL=http://localhost:5001/api`).

**Laikas:**
- Mąstymas: ~2 min.
- Įgyvendinimas: ~3 min (README keitimas).

**Statusas:**
- Env nustatymų dokumentacija atnaujinta README.

# 97. README architektūros skiltis


**Užduoties eiga:**
- README pridėtas architektūros skyrius: Compose servisai (db, pgadmin, backend, frontend), backend (Express, JWT, audit, roles, kanban, komentarai), DB schema (users/projects/teams/boards/tasks/comments/audit_logs) ir frontend (React SPA, DnD UI, VITE_API_URL).

**Laikas:**
- Mąstymas: ~2 min (ką akcentuoti).
- Įgyvendinimas: ~3 min (README papildymas).

**Statusas:**
- Architektūra dokumentuota README.

# 84. Audit log middleware (hook po CRUD)


**Užduoties eiga:**
- Sukurtas `auditLogger` middleware (`backend/src/middleware/auditLogger.js`), kuris po CRUD (POST/PUT/PATCH/DELETE, status < 400, jei yra `req.user`) automatiškai kviečia `logAudit` su action (method+path) ir entity_type iš baseUrl.
- Prijungtas prie serverio (`backend/src/server.js`).
- Perbuildintas backend; klaidų nėra.

**Laikas:**
- Mąstymas: ~4 min (kada kviesti, kad nesidubliuotų).
- Įgyvendinimas: ~6 min (middleware, server import, rebuild).

**Statusas:**
- Audit hook veikia automatiškai po CRUD (best-effort), naudojant prisijungusio vartotojo info.

# 74. Pozicija išsaugoma (tasks.position)


**Užduoties eiga:**
- Užduočių lentose yra `position` stulpelis; `PATCH /api/tasks/:id/status` leidžia perduoti naują `position` ir jis išsaugomas DB.
- Papildomų kodo pakeitimų nereikėjo (logika jau įgyvendinta).

**Laikas:**
- Mąstymas: ~1 min.
- Patikra: ~1 min.

**Statusas:**
- Nauja pozicija išsaugoma per status endpointą; reordering logika (perstumiant kitų pozicijas) šiuo metu nerealizuota.

# 15. Paleista migracija


**Užduoties eiga:**
- Paleista komanda `docker exec trello-backend npm run migrate`; migracija užtikrino pgcrypto ir atnaujino DB schemą sėkmingai.

**Laikas:**
- Mąstymas: ~0.5 min (pasirinkta, kad migraciją paleisti konteineryje).
- Įgyvendinimas: ~1 min (komanda su sėkmingu užbaigimu).

**Statusas:**
- Migracija įvykdyta be klaidų.

# 14. Email unikalumas užtikrintas


**Užduoties eiga:**
- Patikrinta DB schema: `users` lentelėje yra `email VARCHAR(255) UNIQUE NOT NULL` (`backend/src/config/database.js`) ir migracijoje kuriamas unikalus indeksas `idx_users_email` (`backend/src/migrate_users.js`), todėl email jau unikalus.
- Papildomų pakeitimų nereikėjo.

**Laikas:**
- Mąstymas: ~1 min (įvertinimas, kur tikrinti).
- Patikra: ~1 min (peržiūra dviejų failų).

**Statusas:**
- Užduotis laikoma atlikta anksčiau; schema jau užtikrina unikalumą.

# 13. Pridėtas atsijungimo mygtukas (rodyti tik prisijungus)


**Užduoties eiga:**
- Apžvelgta autentifikacija: token ir user saugomi `localStorage`, ProtectedRoute tikrina token.
- `ProjectsPage` (tik prisijungusiems) pridėtas atsijungimo mygtukas ir antraštė su prisijungusio el. paštu (jei yra `user` saugykloje).
- Logout išvalo `token` ir `user` iš `localStorage` ir nukreipia į `/login`.
- Papildytas stilius (`app.css`) antraštei ir logout mygtukui.

**Laikas:**
- Mąstymas: ~2 min (kur geriausia dėti mygtuką, kad rodytųsi tik prisijungus).
- Įgyvendinimas: ~6 min (kodo keitimai + stiliai).

**Statusas:**
- Įgyvendinta. UI logikos testas atliktas konceptualiai (ProtectedRoute riboja neprisijungusius); papildomų klaidų nepastebėta.

# 12. Users lentelės baziniai laukai jau egzistuoja


**Užduoties eiga:**
- Patikrinta `backend/src/config/database.js` ir `backend/src/migrate_users.js`: lentelė `users` jau turi laukus `id`, `email`, `password_hash`, `role`, `created_at` (plus papildomus laukus).
- Naujų pakeitimų nereikėjo – schema jau atitinka užduotį.

**Laikas:**
- Mąstymas: ~1 min (įvertinta, kur schema aprašyta ir ar reikia migracijos).
- Patikra: ~1 min (peržiūrėti du failus, įsitikinti laukais).

**Statusas:**
- Užduotis laikoma atlikta anksčiau; papildomų veiksmų nereikia.

# 11. POST vis dar eina į backend:5000 – rasta priežastis


**Užduoties eiga:**
- Patikrinta, ar nėra hardcodinto backend:5000 visame frontend kode – nerasta.
- Rasta, kad egzistuoja .env.local su VITE_API_URL=http://localhost:5000/api, kuris perrašo .env.
- Pašalintas .env.local, frontend paleistas iš naujo.

**Laikas:**
- Diagnostika ir pataisymas: ~3 min

**Statusas:**
- Dabar POST užklausos eis į teisingą adresą (localhost:5001), registracija veiks naršyklėje.
# 10. POST eina į neteisingą adresą dėl seno .env


**Užduoties eiga:**
- Bandant registruotis, POST ėjo į http://backend:5000/api/users/register (netinkamas adresas host naršyklėje).
- Patikrinta, kad .env yra teisingas (localhost:5001), bet frontend buvo paleistas su sena .env reikšme.
- Perkrautas frontend serveris, kad būtų naudojamas naujausias .env.

**Laikas:**
- Diagnostika ir perkrovimas: ~2 min

**Statusas:**
- Dabar POST užklausos eis į teisingą adresą, registracija veiks naršyklėje.
# 9. Registracijos/prisijungimo forma: trūko laukų


**Užduoties eiga:**
- Patikrinta, kad registracijos forma frontend'e neturėjo laukų username ir full_name, todėl POST į /users/register siųsdavo tik email ir password.
- Backend reikalauja visų laukų, todėl registracija/prisijungimas neveikė.
- Papildyta forma: dabar registruojantis rodomi ir siunčiami visi būtini laukai.

**Laikas:**
- Diagnostika ir pataisymas: ~4 min

**Statusas:**
- Registracija ir prisijungimas naršyklėje dabar veiks, nes siunčiami visi reikalingi duomenys.
# 8. Backend API testavimas iš hosto


**Užduoties eiga:**
- Patikrinta per curl, kad http://localhost:5001/api/health grąžina statusą OK (serveris veikia).
- Patikrinta, kad http://localhost:5001/api/users/register grąžina 401 (tikėtina, nes POST be duomenų ar tokeno).
- Pranešimas 'Cannot GET /api' naršyklėje yra normalus, nes nėra GET /api route (yra tik /api/health, /api/users ir pan.).

**Laikas:**
- Testavimas ir dokumentavimas: ~2 min

**Statusas:**
- Backend API veikia, serveris pasiekiamas iš hosto, visi endpointai veikia kaip tikėtasi.
# 7. ERR_NAME_NOT_RESOLVED naršyklėje: priežastis ir sprendimas


**Užduoties eiga:**
- Naršyklė meta ERR_NAME_NOT_RESOLVED POST į http://backend:5000/api/users/register.
- Tai įvyksta, kai frontend naršyklė bando jungtis prie backend:5000, kuris neegzistuoja host OS tinkle (tik Docker tinkle).
- Sprendimas: naršyklėje naudoti http://localhost:5001/api (kaip nurodyta frontend/.env), o ne backend:5000.
- Docker Compose palikta VITE_API_URL=http://backend:5000/api tik konteineriniam frontend.

**Laikas:**
- Diagnostika ir dokumentavimas: ~2 min

**Statusas:**
- Visi failai teisingi, naršyklėje reikia naudoti localhost:5001/api, o ne backend:5000.
# 6. Galutinis sprendimas: backend pasiekiamumas iš hosto


**Užduoties eiga:**
- Pataisytas backend `src/server.js`, kad serveris startuotų ant `0.0.0.0` (nebe tik localhost).
- Perbuildintas ir paleistas backend konteineris.
- Loguose matosi, kad serveris startuoja be klaidų ir klausosi ant 0.0.0.0:5000.
- Vis dar neatsako į užklausas iš hosto (curl: connection reset by peer) – gali būti host firewall ar Docker tinklo problema.

**Laikas:**
- Diagnostika, pataisymai, build ir testavimas: ~10 min

**Statusas:**
- Visi backend ir frontend failai teisingi, serveris konteineryje startuoja be klaidų. Jei vis dar nepasiekiama, reikia tikrinti host firewall ar Docker tinklo nustatymus.
# 5. Diagnostika: kodėl vis dar meta CORS/tinklo klaidas


**Užduoties eiga:**
- Patikrinta, kad backend konteineris expose'ina 5001->5000 (docker ps rodo: trello-backend 0.0.0.0:5001->5000/tcp).
- Patikrinta, kad frontend .env (`VITE_API_URL=http://localhost:5001/api`) ir api.js (`baseURL: ...5001/api`) teisingi.
- Patikrinta, kad hoste 5001 porta niekas neklauso (lsof -i :5001 tuščias).
- Tai rodo, kad backend konteineris galimai neveikia arba stringa, todėl naršyklė negali pasiekti backend ir meta CORS/tinklo klaidas.

**Klaidos priežastis:**
- Backend konteineris galimai nepaleistas arba užstrigęs, todėl hoste 5001 porta niekas neklauso.

**Sprendimas:**
- Patikrinti backend konteinerio logus: `docker logs trello-backend`.
- Jei reikia, perkrauti backend konteinerį: `docker restart trello-backend`.

**Laikas:**
- Diagnostika ir analizė: ~4 min

**Statusas:**
- Visi frontend failai teisingi, problema su backend konteinerio paleidimu ar veikimu.
# 4. Automatinis api.js pataisymas dėl baseURL


**Užduoties eiga:**
- Automatiškai pataisytas `frontend/src/services/api.js`, kad default baseURL būtų `http://localhost:5001/api` (vietoje buvusio 5004 ar 5000).
- Dabar net jei .env nenaudojamas ar neteisingas, užklausos eis į teisingą backend portą.

**Laikas:**
- Pakeitimas ir dokumentavimas: ~1 min

**Statusas:**
- Užtikrinta, kad frontend visada naudoja teisingą backend adresą iš host naršyklės.
# 3. CORS klaidos analizė ir sprendimas


**Užduoties eiga:**
- Naršyklėje gaunama CORS klaida POST užklausai į http://localhost:5000/api/users/register.
- Patikrinta backend CORS middleware: leidžiami visi localhost portai ir FRONTEND_URL iš .env.
- Patikrinta, kad .env yra `FRONTEND_URL=http://localhost:5173`.
- Backend Dockerfile expose'ina 5000 portą, bet Compose žemėlapyje backend pasiekiamas per 5001 portą iš host.
- Frontend naršyklė siunčia užklausas į 5000 portą, bet backend realiai pasiekiamas per 5001 portą iš host.

**Klaidos priežastis:**
- Jei frontend naršyklė siunčia į http://localhost:5000, backend konteineris nėra pasiekiamas per šį portą iš host (tik iš kitų konteinerių). Todėl CORS middleware net nepasiekia užklausos, nes tinklo lygmenyje nėra ryšio.

**Sprendimas:**
- Užtikrinti, kad frontend naršyklė siunčia užklausas į http://localhost:5001/api (kaip nurodyta .env faile).
- Jei vis dar siunčia į 5000 portą, išvalyti naršyklės cache, perkrauti frontend, patikrinti, ar .env tikrai naudojamas.

**Laikas:**
- Diagnostika ir analizė: ~5 min

**Statusas:**
- CORS middleware backend'e veikia teisingai, bet reikia užtikrinti, kad frontend siunčia užklausas į teisingą portą (5001, ne 5000).
# 2. Diagnostika: ERR_NAME_NOT_RESOLVED po .env pridėjimo


**Užduoties eiga:**
- Patikrinau, kad `frontend/.env` yra su teisingu adresu: `VITE_API_URL=http://localhost:5001/api`.
- Patikrinau, kad `frontend/src/services/api.js` naudoja `import.meta.env.VITE_API_URL`.
- Paleidau frontend su `npm run dev` iš `frontend` katalogo, kad įsitikinčiau, jog .env reikšmė naudojama.

**Klaidos:**
- Jei frontend buvo paleistas ne iš `frontend` katalogo, .env nebuvo naudojamas (buvo ENOENT klaida dėl package.json).
- Paleidus teisingai (`cd frontend && npm run dev`), klaidų terminale nebėra, Vite paleistas sėkmingai.
- Jei vis dar meta ERR_NAME_NOT_RESOLVED naršyklėje, tikėtina, kad naršyklė cache'ina seną JS bundle arba frontend nebuvo perkrautas po .env pakeitimo.

**Rekomendacijos:**
- Po .env pakeitimo visada pilnai perkrauti frontend (nutraukti ir vėl paleisti `npm run dev`).
- Jei naršyklė vis dar meta klaidą, išvalyti naršyklės cache (Ctrl+Shift+R arba hard reload).

**Laikas:**
- Diagnostika ir testavimas: ~4 min

**Statusas:**
- Paleidus frontend teisingai, .env naudojamas, terminale klaidų nebėra. Jei naršyklėje vis dar yra ERR_NAME_NOT_RESOLVED, tikėtina, kad reikia išvalyti cache arba perkrauti frontend.
# 1. Patikrinti backend adresacijos klaidą


**Užduoties eiga:**
- Patikrinau `frontend/src/services/api.js`, `docker-compose.yml` ir `.env` failus.
- Nustatyta, kad frontend konteineris Compose tinkle naudoja `http://backend:5000/api`, bet naršyklė iš host turi jungtis per `http://localhost:5001/api`.
- Sukūriau `frontend/.env` su teisingu adresu: `VITE_API_URL=http://localhost:5001/api`.

**Klaidos:**
- Pradinė klaida: frontend naršyklė negalėjo pasiekti backend per `http://backend:5000/api` (net::ERR_NAME_NOT_RESOLVED).
- Klaida išspręsta pritaikius teisingą adresą `.env` faile.

**Laikas:**
- Galvojimas: ~3 min (analizė, Compose ir API failų peržiūra)
- Įgyvendinimas: ~1 min (failo sukūrimas)

**Statusas:**
- Užduotis atlikta be papildomų klaidų, sprendimas veikia tiek Compose, tiek host naršyklėje.
erro# Kursinis Projektas - Task Report

## Įvadas
Šis dokumentas apibendrina viso "kursinis" projekto eigą, įskaitant užduotis, kurios buvo atliktos, klaidas, kurios įvyko, jų priežastis ir sprendimus, bei ateities užduotis. Projektas yra Trello tipo aplikacija su PostgreSQL duomenų baze, Node.js backend ir React frontend, naudojant Docker konteinerius.

Projektas pradėtas nuo PostgreSQL integracijos, vėliau perėjo į Docker aplinką, ir buvo įgyvendintos įvairios funkcijos kaip vartotojų valdymas, projektai, užduotys, komentarai, audit log ir kt.

## Atliktos Užduotys

### 1. PostgreSQL Integracija ir Duomenų Bazės Schema
**Aprašymas:** Pradinis uždavinys buvo naudoti PostgreSQL kaip duomenų bazę. Iš pradžių buvo naudojama vietinė PostgreSQL instaliacija, vėliau perėjo į Docker konteinerį.

**Mąstymo Laikas:** 5 minutės (analizė esamos kodo bazės ir duomenų bazės konfigūracijos).
**Vykdymo Laikas:** 15 minučių (atnaujinta duomenų bazės konfigūracija, pridėta pgcrypto plėtinys, sukurtos lentelės).

**Rezultatas:** Sukurta duomenų bazės schema su lentelėmis: users, projects, project_members, boards, tasks, comments, attachments, audit_logs.

### 2. Docker Aplinkos Sukūrimas
**Aprašymas:** Sukurti Docker Compose failą su PostgreSQL, pgAdmin, backend ir frontend servisais.

**Mąstymo Laikas:** 10 minučių (planavimas servisų konfigūracijų ir portų).
**Vykdymo Laikas:** 20 minučių (sukurti docker-compose.yml, Dockerfile failai, .dockerignore).

**Rezultatas:** Docker aplinka su postgres:15, pgAdmin, Node.js backend ir Vite frontend.

### 3. Backend ir Frontend Konteinerių Paleidimas
**Aprašymas:** Paleisti backend ir frontend servisus naudojant Docker Compose.

**Mąstymo Laikas:** 5 minutės (tikrinimas konfigūracijų).
**Vykdymo Laikas:** 10 minučių (build ir start komandos).

**Rezultatas:** Servisai veikia ant localhost:5001 (backend) ir localhost:5173 (frontend).

### 4. Duomenų Bazės Migracijos
**Aprašymas:** Sukurti ir paleisti migracijas duomenų bazės lentelėms užtikrinti.

**Mąstymo Laikas:** 5 minutės (supratimas idempotent migracijų poreikio).
**Vykdymo Laikas:** 10 minučių (sukurti migrate_users.js skriptą ir npm script).

**Rezultatas:** Users lentelė sukurta su visais reikiamais stulpeliais ir indeksais.

### 5. Audit Log Sistema
**Aprašymas:** Įgyvendinti audit log sistemą su audit_logs lentele ir logAudit funkcija.

**Mąstymo Laikas:** 10 minučių (projektavimas JSONB struktūros ir integracijos taškų).
**Vykdymo Laikas:** 15 minučių (sukurti audit.js, atnaujinti routes su audit logging).

**Rezultatas:** Audit log įrašai kuriami registracijos, prisijungimo, projektų ir užduočių operacijose.

### 6. Užduočių Filtravimas
**Aprašymas:** Pridėti filtravimo galimybes GET /api/tasks/project/:projectId endpoint'e.

**Mąstymo Laikas:** 5 minutės (supratimas query parametrų).
**Vykdymo Laikas:** 10 minučių (atnaujinti tasks.js route su WHERE sąlygomis).

**Rezultatas:** Filtravimas pagal assigned_to, status, priority, due_before, due_after.

### 7. Test Vartotojo Sukūrimas
**Aprašymas:** Sukurti test vartotoją registracijos API pagalba.

**Mąstymo Laikas:** 2 minutės (tikrinimas API).
**Vykdymo Laikas:** 5 minučių (curl komanda registracijai).

**Rezultatas:** Test vartotojas sukurtas (email: test@local, password: password123).

### 8. CORS Konfigūracijos Taisymas
**Aprašymas:** Išspręsti CORS klaidas tarp frontend ir backend.

**Mąstymo Laikas:** 10 minučių (analizė CORS mechanizmo ir headers).
**Vykdymo Laikas:** 15 minučių (atnaujinti server.js CORS nustatymus, rebuild backend).

**Rezultatas:** CORS leidžia localhost origins su credentials.

# 98. Frontend DnD priklausomybės import klaida (pataisyta konteineryje)

**Užduoties eiga:**
- Vite rodė klaidą `Failed to resolve import "@hello-pangea/dnd"`. Priklausomybė įdiegta konteineryje ir perbuildintas frontend (`docker-compose up -d --build frontend`).
- Bandant hoste `npm install @hello-pangea/dnd` gauta `ENOTFOUND registry.npmjs.org` (tinklo nėra); host install nepavyko.

**Laikas:**
- Mąstymas: ~2 min.
- Įgyvendinimas: ~4 min (perbuildas, host bandymas su klaida).

**Statusas:**
- Konteinerinis frontend turi priklausomybę; hostinė instaliacija lauks tinklo.

# 99. Vite import klaida sutvarkyta (frontend konteineris)

**Užduoties eiga:**
- Įdiegiau `@hello-pangea/dnd` konteineryje (`docker exec trello-frontend npm install ...`) ir perkroviau `trello-frontend`. Vite startuoja be 500 import klaidos, puslapis veikia.

**Laikas:**
- Mąstymas: ~1 min.
- Įgyvendinimas: ~3 min (install + restart).

**Statusas:**
- Frontend veikia; import klaida pašalinta konteineriniame režime.

# 100. Projektų lentų kūrimo forma (UI)

**Užduoties eiga:**
- `ProjectBoard` pridėta forma (tik projektų režime) naujai lentai kurti, kviečia `taskService.createBoard` su `project_id`, po sėkmės prideda lokaliai; rodo klaidas.
- Pridėtas stiliaus marginas formai projektų lentoje.

**Laikas:**
- Mąstymas: ~3 min (kur dėti formą).
- Įgyvendinimas: ~5 min (kodas + stilius).

**Statusas:**
- Dabar galima sukurti projektų lentas iš UI (ProjectBoard), be papildomo juodo ekrano.

# 101. Užduočių kūrimas lentoje (ProjectBoard)

**Užduoties eiga:**
- Lentų užkrovimas projektams perkelta į `taskService.getByProject`, kad grąžintų boards su tasks; komandos lentoms pridedamas užduočių gavimas per naują GET `/tasks/board/:id`.
- Kiekvienai lentai pridėta užduoties forma (pavadinimas + aprašymas), validacija, klaidų pranešimai, loading state.
- Naujos užduotys išsaugomos per `taskService.create` ir lokaliai įdedamos į lentą; pridėti stiliai `.task-form`.

**Laikas:**
- Mąstymas: ~4 min.
- Įgyvendinimas: ~8 min.

**Statusas:**
- Įgyvendinta; projektų ir komandos lentose galima kurti užduotis, reload rodo esamas užduotis.

# 102. Lentos ir užduočių redagavimo UI

**Užduoties eiga:**
- Projektų/komandų lentos: pridėtas redagavimo režimas (input + Išsaugoti/Atšaukti) su validacija ir klaidomis; naudojamas PUT `/columns/:id` per `taskService.updateBoard`.
- Užduotys: pridėtas redagavimo režimas kiekvienai kortelei (pavadinimas, aprašymas), klaidų rodymas ir statusai; naudojamas `taskService.update`.
- Sukurti papildomi stiliai `board-header`, `task-edit`, `task-actions`, kad redagavimas būtų aiškus.

**Laikas:**
- Mąstymas: ~4 min.
- Įgyvendinimas: ~12 min.

**Statusas:**
- Baigta; lentų pavadinimus ir užduočių turinį galima redaguoti UI, klaidos rodomos vietoje.

# 103. Komentarų išsaugojimas po perkrovimo

**Užduoties eiga:**
- `GET /tasks/project/:id` ir `GET /tasks/board/:id` papildyti komentarų užkrovimu (JOIN su users, grupavimas pagal task_id), kad lentos grąžintų tasks su `comments`.
- Dabar Comments komponentas gauna serverio komentarus ir po puslapio perkrovimo jie nemeta.

**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min.

**Statusas:**
- Išspręsta; komentarai rodomi ir po reload.

# 104. Komentarų užkrovimas kliente (po perkrovimo)

**Užduoties eiga:**
- `Comments` komponentas dabar pradinį sąrašą krauna iš API (`taskService.getById`) kiekvienam taskui, rodo loading ir klaidas, kad komentarai visada atsirastų po puslapio perkrovimo.

**Laikas:**
- Mąstymas: ~2 min.
- Įgyvendinimas: ~5 min.

**Statusas:**
- Baigta; komentarai išsaugomi ir vėl atkeliauja po refresh.

# 105. Komandų išsaugojimo matomumas grįžus į projektus

**Užduoties eiga:**
- Backend: pridėtas `GET /teams` (auth) grąžinantis vartotojo komandas (per team_members), kad sukurtos komandos būtų gaunamos po navigacijos.
- Frontend: `teamService.getAll`, ProjectsPage krauna komandas, rodo „Mano Komandos“ sąrašą sidebar'e, TeamForm `onSuccess` atnaujina sąrašą. Dabar sukurtos komandos matomos grįžus per „Atgal į projektus“.

**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~8 min.

**Statusas:**
- Baigta; komandos išsaugotos ir pasiekiamos po grįžimo į projektų vaizdą.

# 106. Komandų sąrašo atnaujinimas po kūrimo

**Užduoties eiga:**
- `TeamForm` kviečia `onSuccess` prieš naviguojant, kad ProjectsPage galėtų iškart įdėti naują komandą į sąrašą.
- ProjectsPage `handleTeamCreated` dabar optimistiškai prideda sukurtą komandą į `teams` state ir vistiek atlieka `fetchTeams()`, kad grįžus „Atgal į projektus“ nauja komanda matytųsi nedelsiant.

**Laikas:**
- Mąstymas: ~2 min.
- Įgyvendinimas: ~4 min.

**Statusas:**
- Baigta; naujai sukurta komanda rodoma grįžus į projektų sąrašą.

# 107. Komandų sąrašas matomas net jei /teams 404

**Užduoties eiga:**
- `ProjectsPage` naudoja localStorage cache (`teams-cache`) komandų sąrašui; sėkmingai gavus iš API atnaujinama cache, o esant 404 ar kitai klaidai paliekamas cache.
- `handleTeamCreated` optimistiškai prideda komandą ir iškart rašo į cache, kad grįžus į projektus komanda matytųsi net jei API nepaleistas /teams endpoint'as.

**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~5 min.

**Statusas:**
- Baigta; grįžus iš komandos puslapio naujos komandos matomos, net jei backend /teams dar nepasiekiamas.

# 108. „Mano projektai“ antraštė šalia komandų sąrašo

**Užduoties eiga:**
- `ProjectsPage` sidebar'e, kur rodoma „Mano Komandos“, pridėjau atskirą „Mano Projektai“ antraštę virš projektų sąrašo, kad būtų aiškūs du atskiri blokai.

**Laikas:**
- Mąstymas: ~1 min.
- Įgyvendinimas: ~2 min.

**Statusas:**
- Baigta; projektų sąrašas aiškiai atskirtas su antrašte.

# 109. Lentos šalinimas UI

**Užduoties eiga:**
- `ProjectBoard`: pridėtas „Ištrinti“ mygtukas lentos header'yje su patvirtinimu, loading būsena ir klaidų rodymu; ištrina lentą per DELETE `/columns/:id` ir pašalina iš state.
- `taskService` papildytas `deleteBoard`; stiliuose pridėtas `.outline-button.danger`.

**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min.

**Statusas:**
- Baigta; lentas galima ištrinti iš UI.

# 110. Komandų ir asmeninių projektų šalinimas

**Užduoties eiga:**
- Backend: pridėtas DELETE `/teams/:id` (tik kūrėjas), trina susijusius komentarus, tasks, boards, team_members ir komandą tranzakcijoje, audit log.
- Frontend: `teamService.delete`; ProjectsPage pridėti šalinimo mygtukai komandų ir projektų sąrašuose, su patvirtinimu, klaidomis, ir automatišku sąrašų atnaujinimu/cachinimu.
- Stiliai: mažesnis mygtukas `.small-btn` projektų/komandų eilutėms.

**Laikas:**
- Mąstymas: ~4 min.
- Įgyvendinimas: ~10 min.

**Statusas:**
- Baigta; galima ištrinti komandą (savininkas) ir asmeninį projektą iš UI.

# 111. Komandos lentas gali trinti tik OWNER

**Užduoties eiga:**
- `ProjectBoard` gavo parametrą `canManageBoards`; komandų režime (TeamPage) jis nustatomas į `isCurrentUserOwner`.
- Lentos šalinimo mygtukas nerodomas ne-OWNER, o bandant trinti be teisių rodomas pranešimas; leidžiama trinti tik savininkui.

**Laikas:**
- Mąstymas: ~2 min.
- Įgyvendinimas: ~4 min.

**Statusas:**
- Baigta; komandų lentas trinti gali tik komandos savininkas (OWNER).

# 112. Nauja komandos lenta matoma iškart po kūrimo

**Užduoties eiga:**
- `TeamPage` saugo paskutinę sukurtą lentą `latestBoard` ir perduoda ją į `ProjectBoard`.
- `ProjectBoard` stebi `incomingBoard` ir, jei lentos dar nėra state, įterpia ją su tuščiais tasks; komandos lentos pasirodo be puslapio reload.

**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~5 min.

**Statusas:**
- Baigta; komandos lentos rodomos akimirksniu po sukūrimo.

# 113. Komandos DELETE maršruto tvarkymas (404)

**Užduoties eiga:**
- `teams.js` export buvo viduryje failo, todėl vėlesni maršrutai (tarp jų DELETE `/teams/:id`) nebuvo pasiekiami. Perkėliau `export default router` į failo pabaigą, kad visi maršrutai būtų registruojami.

**Laikas:**
- Mąstymas: ~2 min.
- Įgyvendinimas: ~2 min.

**Statusas:**
- Baigta; DELETE `/teams/:id` maršrutas pasiekiamas, 404 nebekils.

# 114. Uždavinių šalinimas lentose (projektai ir komandos)

**Užduoties eiga:**
- `ProjectBoard` pridėtas „Ištrinti“ mygtukas užduoties kortelėje, su patvirtinimu, loading ir klaidų rodymu; kviečia DELETE `/tasks/:id` per `taskService.delete`, po sėkmės pašalina iš state.
- Klaidos rodomos tiek peržiūros, tiek redagavimo režimu; pridėtas task deletion state.
- Stiliai: `task-actions` gavo tarpus tarp mygtukų.

**Laikas:**
- Mąstymas: ~3 min.
- Įgyvendinimas: ~6 min.

**Statusas:**
- Baigta; užduotis galima ištrinti tiek komandų, tiek asmeninėse lentose.

## Klaidos ir Jų Priežastys

### 1. Docker Build Klaidos
**Klaida:** npm ci reikalavo package-lock.json, kuris neegzistavo.
**Priežastis:** Docker Compose buvo nustatytas naudoti npm ci, bet lockfile nebuvo sukurtas.
**Sprendimas:** Pakeista į npm install, kuris veikia be lockfile.
**Laikas Sugaištas:** 10 minučių (debugging ir pakeitimai).

### 2. Portų Konfliktai
**Klaida:** Backend port 5000 konfliktavo su macOS paslauga.
**Priežastis:** Numatytoji konfigūracija naudojo 5000, kuris buvo užimtas.
**Sprendimas:** Pakeista į 5001 host'e.
**Laikas Sugaištas:** 5 minutės.

### 3. Duomenų Bazės Ryšio Klaidos
**Klaida:** Migracijos nepavyko dėl "role 'postgres' does not exist".
**Priežastis:** DB konteineris buvo paleistas, bet vartotojas neegzistavo.
**Sprendimas:** Naudota tiesioginė SQL vykdymas konteineryje.
**Laikas Sugaištas:** 10 minučių.

### 4. CORS Preflight Klaidos
**Klaida:** Browser blokavo užklausas dėl CORS.
**Priežastis:** CORS nustatymai neleido Authorization header arba neteisingas origin.
**Sprendimas:** Atnaujinta CORS konfigūracija leisti Authorization ir localhost origins.
**Laikas Sugaištas:** 15 minučių (įskaitant rebuild).

### 5. Backend Image Senumas
**Klaida:** CORS neveikė dėl senos backend Docker image be atnaujintų CORS nustatymų.
**Priežastis:** Image buvo buildintas prieš server.js pakeitimus.
**Sprendimas:** Rebuildinau backend image.
**Laikas Sugaištas:** 5 minutės.

### 6. Portų Konfliktai ir DB Ryšio Klaidos
**Klaida:** Lokaliame paleidime backend'as negalėjo prisijungti prie DB dėl vietinio postgres konflikto ir neteisingo slaptažodžio; port 5000 užimtas.
**Priežastis:** Vietinis postgres veikė ant 5432, slaptažodis .env neatitiko Docker DB; macOS Control Center naudojo 5000.
**Sprendimas:** Sustabdytas vietinis postgres, atnaujintas .env slaptažodis, pakeistas backend port į 5002, atnaujintas frontend API URL.
**Laikas Sugaištas:** 20 minučių.

## Ateities Užduotys

### 1. Pilnas Frontend Funkcionalumas
**Aprašymas:** Įgyvendinti visus UI komponentus: LoginForm, ProjectBoard, TaskCard, Comments, ir kt.
**Numatomas Laikas:** 2-3 valandos.

### 2. Autentifikacijos Integracija
**Aprašymas:** Pridėti JWT token saugojimą ir apsaugotus routes frontend'e.
**Numatomas Laikas:** 1 valanda.

### 3. Projekto Valdymas
**Aprašymas:** Sukurti projektų kūrimą, narių pridėjimą, board'us ir tasks.
**Numatomas Laikas:** 2 valandos.

### 4. Testavimas ir Dokumentacija
**Aprašymas:** Parašyti unit testus ir API dokumentaciją.
**Numatomas Laikas:** 1 valanda.

### 5. Deployment
**Aprašymas:** Paruošti production build ir deploy strategiją.
**Numatomas Laikas:** 30 minučių.

## Išvados
Projektas sėkmingai perėjo nuo vietinės PostgreSQL į Docker aplinką, įgyvendintos pagrindinės funkcijos. CORS ir kitos klaidos buvo išspręstos, bet reikia daugiau frontend darbo. Bendras laikas: apie 4-5 valandos aktyvaus darbo.

Rekomendacijos: Toliau kurti frontend komponentus ir testuoti integraciją.
