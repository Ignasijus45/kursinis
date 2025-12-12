# Trello tipo projektų valdymo sistema

## 📋 Apžvalga

Tai mini Trello tipo projektų valdymo sistema, skirta komandos projektams ir uždaviniams valdyti.

## 🛠 Technologijos

### Backend
- **Node.js** + **Express.js** - REST API serveris
- **PostgreSQL** - Duomenų bazė
- **JWT** - Autentifikacija
- **bcryptjs** - Slaptažodžių šifravimas

### Frontend
- **React 18** - UI biblioteka
- **Vite** - Build tool
- **Axios** - HTTP klientas
- **React Router** - Navifacija

## 📁 Projekto struktūra

```
kursinis/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js       # DB konfiguracija ir schema
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT autentifikacija
│   │   ├── routes/
│   │   │   ├── users.js          # Naudotojų endpointai
│   │   │   ├── projects.js       # Projektų endpointai
│   │   │   └── tasks.js          # Uždavinių endpointai
│   │   └── server.js             # Pagrindinis serveris
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── LoginForm.jsx
    │   │   ├── ProjectForm.jsx
    │   │   └── ProjectBoard.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   └── ProjectsPage.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   └── index.js
    │   ├── styles/
    │   │   └── app.css
    │   ├── App.jsx
    │   ├── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 📊 Duomenų bazės schema

### Lentelės
- **users** - Naudotojai (su role: user, admin, owner)
- **projects** - Projektai
- **project_members** - Projektų nariai (su role: owner, member, viewer)
- **boards** - Lentos (Kanban stulpeliai)
- **tasks** - Uždaviniai (su assigned_to ir due_date)
- **comments** - Komentarai
- **attachments** - Priedai
- **audit_logs** - Veiklos žurnalas (visų akcijų registracija)

## 🚀 Paleidimas

### 1. PostgreSQL duomenų bazės nustatymas
```bash
# Sukurti duomenų bazę
createdb trello_db

# Arba atidaryti psql
psql -U postgres
CREATE DATABASE trello_db;
 
# Užtikrinti, kad būtų įjungtas `pgcrypto` plėtinys (naudojamas gen_random_uuid())
# Atidarius psql vykdykite:
# \c trello_db
# CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Naudojant Docker (rekomenduojama lokaliam vystymui)

Šis projektas palaiko PostgreSQL per Docker. Tai leidžia lengvai paleisti DB ir pgAdmin be vietinės DB instaliacijos.

1. Paleisti konteinerius:

```bash
docker-compose up -d
```

2. Patikrinti, kad DB veikia ir sukurti `pgcrypto` plėtinį (jei reikia):

```bash
# Sukurti pgcrypto plėtinį duomenų bazėje
docker exec -it trello-db psql -U postgres -d trello_db -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

3. Prieiga prie `pgAdmin` (jei naudojate): atidarykite `http://localhost:8080` ir prisijunkite (el. paštas: `admin@local`, slaptažodis: `admin`).

4. Paruošti backend (paleidimas lokaliai, jungiantis prie Docker Postgres):

```bash
cd backend
npm install
cp .env.example .env
# Užtikrinkite, kad .env turi DB_HOST=localhost ir teisingus DB prisijungimo duomenis
npm run migrate
npm run dev
```

Pastaba: `docker-compose.yml` eksponuoja Postgres prievadą `5432`, todėl aplikacija, paleista lokaliai, gali jungtis per `localhost:5432`.

### 2. Backend nustatymas
```bash
cd backend
npm install

# Sukurti .env failą iš .env.example
cp .env.example .env

# Inicijuoti duomenų bazę
npm run migrate

# Paleisti serverį
npm run dev
```

Serveris bus paleistas: `http://localhost:5000`

### 3. Frontend nustatymas
```bash
cd frontend
npm install

# Paleisti dev serverį
npm run dev
```

Frontend bus paleistas: `http://localhost:5173`

## 🔌 REST API Endpointai

### Naudotojai (/api/users)
- `POST /register` - Registracija
- `POST /login` - Prisijungimas
- `GET /:id` - Gauti profilio informaciją
- `PUT /:id` - Atnaujinti profilį

### Projektai (/api/projects)
- `POST /` - Sukurti projektą
- `GET /` - Gauti mano projektus
- `GET /:id` - Gauti konkretų projektą
- `PUT /:id` - Atnaujinti projektą
- `DELETE /:id` - Ištrinti projektą
- `GET /:id/members` - Gauti projektų narius
- `POST /:id/members` - Pridėti narį

### Uždaviniai (/api/tasks)
- `POST /` - Sukurti uždavinį
- `GET /project/:projectId` - Gauti visus uždavinius iš projekto (su filtravimo parama: `?assigned_to=uuid&status=todo&priority=high&due_before=2025-12-31`)
- `GET /:id` - Gauti konkretų uždavinį su komentarais
- `PUT /:id` - Atnaujinti uždavinį (palaikoma: title, description, status, priority, assigned_to, due_date)
- `DELETE /:id` - Ištrinti uždavinį
- `POST /:id/comments` - Pridėti komentarą

### Lentos (/api/tasks/board)
- `POST /` - Sukurti lentą

### Veiklos žurnalas (/api/audit)
- `GET /project/:projectId` - Gauti projektų veiklos žurnalą
- `GET /user/:userId` - Gauti vartotojo veiklos žurnalą (tik pats vartotojas gali matyti)

## 🔐 Autentifikacija

Sistemo naudoja JWT tokeno pagrindu autentifikaciją. Token turi būti perduodamas `Authorization` header'yje:

```
Authorization: Bearer <token>
```

## 📝 Pavyzdžiai

### Registracija
```json
POST /api/users/register
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "full_name": "Full Name"
}
```

### Prisijungimas
```json
POST /api/users/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Sukurti projektą
```json
POST /api/projects
{
  "title": "Mano projektas",
  "description": "Projekto aprašymas",
  "color": "#3498db"
}
```

## 🎯 Būsimos funkcionalumo

- [ ] Drag & drop uždaviniams perkelti
- [ ] Real-time puslapių atnaujinimai (WebSocket)
- [ ] Failų priedų sistema
- [ ] Notifikacijos
- [ ] Labai (tags) sistemā
- [ ] Veiklos žurnalas
- [ ] Eksportavimas į CSV/PDF
- [ ] Temų personalizavimas

## ✨ Implementuotos Funkcionalumo Dalys

### Vartotojai + Rolės
- ✅ **Vartotojų rolės** - `role` laukas lentelėje `users` (default: 'user', galimos: 'admin', 'owner')
- ✅ **Projektų narių rolės** - `project_members` su `role` lauku (owner, member, viewer)
- ✅ **Leidimų valdymas** - Tik savininkas gali redaguoti/trinti projektus, tik nariai gali prieiti

### Komentarai
- ✅ **Komentarų lentelė** - `comments` su task_id, user_id, content
- ✅ **Komentarų API** - `POST /api/tasks/:id/comments` - pridėti komentarą
- ✅ **Komentarų skaitymas** - `GET /api/tasks/:id` grąžina uždavinį su visais komentarais

### Terminai (Due Dates)
- ✅ **Due date laukas** - `tasks` lentelėje, DATE tipo
- ✅ **Terminų API** - `PUT /api/tasks/:id` palaikoma `due_date` parametras
- ✅ **Terminų filtravimas** - `GET /api/tasks/project/:projectId?due_before=2025-12-31&due_after=2025-01-01`

### Priskyrimas Vartotojams (Assignment)
- ✅ **assigned_to laukas** - `tasks` lentelėje, susietas su `users(id)`
- ✅ **Priskyrimų API** - `POST /` ir `PUT /:id` palaikomas `assigned_to` parametras
- ✅ **Priskyrimų filtravimas** - `GET /api/tasks/project/:projectId?assigned_to=user_uuid`

### Audit Log
- ✅ **audit_logs lentelė** - Visų akcijų registracija (create_task, update_task, delete_task, create_comment, create_project, update_project, delete_project, add_project_member, register_user, update_user)
- ✅ **Audit API** - `GET /api/audit/project/:projectId` (projektų veikla), `GET /api/audit/user/:userId` (vartotojo veikla)
- ✅ **Audit logging** - Automatinis žurnalų rašymas visose CRUD operacijose

### Filtravimas
- ✅ **Uždavinių filtravimas** - `GET /api/tasks/project/:projectId` su query parametrais:
  - `?assigned_to=uuid` - Rodyti tik priskyrtus konkrečiam vartotojui
  - `?status=todo|in_progress|done` - Filtruoti pagal statusą
  - `?priority=low|medium|high` - Filtruoti pagal prioritetą
  - `?due_before=2025-12-31` - Uždaviniai iki datos
  - `?due_after=2025-01-01` - Uždaviniai po datos

## 📄 Licencija

MIT License

## 👨‍💻 Autorius

Sukurta kaip kursinis darbas
