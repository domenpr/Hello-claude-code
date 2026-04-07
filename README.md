# 🏥 Health Tracker

Osebni zdravstveni tracker za sledenje energiji, razpoloženju, stresu, bolečinam v trebuhu in prebavi. 3× dnevno vnašaj podatke in spremljaj svoj napredek s pomočjo grafov.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)

---

## ✨ Funkcionalnosti

- 📝 **Enostaven vnos podatkov** - 3× dnevno spremljaj svoje zdravje
- 📊 **Grafični prikazi** - Interaktivni grafi z Chart.js
- 🗄️ **PostgreSQL baza** - Varno shranjevanje podatkov
- 📱 **Responsive dizajn** - Deluje na telefonu in računalniku
- 🚀 **REST API** - Pripravljeno za mobilno aplikacijo
- ☁️ **Cloud ready** - Deploy na Railway, Render ali Vercel

---

## 📊 Kaj lahko spremljaš

| Parameter | Opis | Lestvica |
|-----------|------|----------|
| ⚡ **Energija** | Raven energije skozi dan | 1-5 (1=nizka, 5=visoka) |
| 😊 **Razpoloženje** | Splošno počutje in razpoloženje | 1-5 (1=slabo, 5=odlično) |
| 😰 **Stres** | Stopnja stresa | 1-5 (1=brez, 5=zelo) |
| 🤕 **Bolečine** | Bolečine v trebuhu | 1-5 (1=brez, 5=hude) |
| 💩 **Prebava** | Kvaliteta blata (4 = idealno) | 1-5 |
| 📋 **Opombe** | Dodatni komentarji | Prosto besedilo |

---

## 🚀 Quick Start

### Lokalno

1. **Kloniraj repo**
   \`\`\`bash
   git clone https://github.com/domenpr/Hello-claude-code.git
   cd Hello-claude-code
   \`\`\`

2. **Namesti odvisnosti**
   \`\`\`bash
   npm install
   \`\`\`

3. **Nastavi environment variablo**
   \`\`\`bash
   cp .env.example .env
   # Uredi .env in dodaj DATABASE_URL
   \`\`\`

4. **Poženi migrations**
   \`\`\`bash
   npm run migrate
   \`\`\`

5. **Zaženi aplikacijo**
   \`\`\`bash
   npm start
   # Ali v dev mode:
   npm run dev
   \`\`\`

6. **Odpri v brskalniku**
   \`\`\`
   http://localhost:3000
   \`\`\`

---

## ☁️ Deployment

Aplikacija je pripravljena za deployment na več platformah.

### Railway (PRIPOROČENO)

Podrobna navodila: **[DEPLOY.md](./DEPLOY.md)**

**Hitri koraki:**
1. Pojdi na https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Izberi ta repo
4. Ustvari PostgreSQL bazo
5. Nastavi DATABASE_URL environment variablo
6. Deploy! 🚀

### Render

Podrobna navodila: **[DEPLOY.md](./DEPLOY.md)**

**Hitri koraki:**
1. Pojdi na https://render.com
2. "New +" → "Web Service"
3. Izberi ta repo
4. Ustvari PostgreSQL bazo
5. Nastavi DATABASE_URL v environment
6. Deploy! 🚀

### Database Setup

**POMEMBNO:** Preberi **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** za podrobna navodila o nastavitvi PostgreSQL baze na Renderju.

---

## 🛠️ Tehnologije

### Backend
- **Node.js** (18+)
- **Express.js** - Web framework
- **PostgreSQL** - Baza podatkov
- **pg** - PostgreSQL driver
- **dotenv** - Environment variablepovezani

### Frontend
- **Vanilla JavaScript** - Brez dodatnih frameworkov
- **Chart.js** - Grafični prikazi
- **Fetch API** - Komunikacija z backend-om
- **CSS3** - Responsive dizajn

---

## 📚 API Dokumentacija

### Endpoints

#### POST /api/entries
Ustvari nov zdravstveni vnos.

**Request Body:**
\`\`\`json
{
  "energy": 4,
  "mood": 5,
  "stress": 2,
  "stomach_pain": 1,
  "stool": 4,
  "note": "Danes se počutim odlično!"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Vnos uspešno shranjen",
  "entry": {
    "id": 1,
    "timestamp": "2025-12-24T12:00:00.000Z",
    "energy": 4,
    "mood": 5,
    "stress": 2,
    "stomach_pain": 1,
    "stool": 4,
    "note": "Danes se počutim odlično!",
    "created_at": "2025-12-24T12:00:00.000Z"
  }
}
\`\`\`

#### GET /api/entries
Pridobi vnose (opcijsko filtriranje po časovnem obdobju).

**Query Parameters:**
- \`from\` - Začetni datum (ISO 8601)
- \`to\` - Končni datum (ISO 8601)
- \`limit\` - Maksimalno število vnosov (default: 100)

**Primer:**
\`\`\`
GET /api/entries?limit=10
GET /api/entries?from=2025-12-01&to=2025-12-31
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "count": 10,
  "entries": [...]
}
\`\`\`

#### GET /api/summary
Pridobi statistiko za obdobje.

**Query Parameters:**
- \`from\` - Začetni datum (opcijsko)
- \`to\` - Končni datum (opcijsko)

**Response:**
\`\`\`json
{
  "success": true,
  "summary": {
    "total_entries": 45,
    "period": {
      "from": "2025-12-01T00:00:00.000Z",
      "to": "2025-12-24T23:59:59.000Z"
    },
    "energy": {
      "avg": "3.67",
      "min": 1,
      "max": 5
    },
    "mood": {
      "avg": "4.12",
      "min": 2,
      "max": 5
    },
    ...
  }
}
\`\`\`

#### GET /api/health
Health check endpoint za preverjanje povezave z bazo.

**Response:**
\`\`\`json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-12-24T12:00:00.000Z"
}
\`\`\`

---

## 🗄️ Database Schema

\`\`\`sql
CREATE TABLE entries (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  stress INTEGER NOT NULL CHECK (stress >= 1 AND stress <= 5),
  stomach_pain INTEGER NOT NULL CHECK (stomach_pain >= 1 AND stomach_pain <= 5),
  stool INTEGER NOT NULL CHECK (stool >= 1 AND stool <= 5),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entries_timestamp ON entries(timestamp DESC);
\`\`\`

---

## 📱 Screenshots

### Vnos podatkov
Preprost obrazec z sliderji za hitro vnašanje podatkov.

### Grafi
- Linijski graf za energijo, stres in bolečine
- Stolpični graf za prebavo (zelena = idealno)

### Seznam vnosov
Pregled zadnjih 10 vnosov s časovnimi oznakami.

---

## 🔧 Development

### Struktura projekta

\`\`\`
Hello-claude-code/
├── src/
│   ├── index.js          # Express server + HTML frontend
│   ├── routes.js         # API routes
│   └── db.js             # Database connection pool
├── migrations/
│   ├── 001_create_entries.sql  # Database schema
│   └── run.js            # Migration runner
├── .env.example          # Environment variable template
├── package.json
├── README.md
├── DEPLOY.md             # Deployment guide
└── DATABASE_SETUP.md     # Database setup guide
\`\`\`

### Skripte

- \`npm start\` - Zaženi produkcijski server
- \`npm run dev\` - Zaženi razvojni server (z auto-reload)
- \`npm run migrate\` - Poženi database migrations

### Environment Variables

\`\`\`bash
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
PORT=3000
\`\`\`

---

## 🤝 Contributing

Pull requesti so dobrodošli! Za večje spremembe najprej odpri issue.

---

## 📄 License

ISC

---

## 🎯 Roadmap

- [ ] Izvoz podatkov v CSV
- [ ] Push notifikacije za vnos podatkov
- [ ] Multi-user support z avtentikacijo
- [ ] Mobilna aplikacija (React Native)
- [ ] AI analiza vzorcev in priporočila
- [ ] Povezava z wearables (Fitbit, Apple Watch)

---

## 💡 Ideje za uporabo

- **IBS tracking** - Spremljanje sindroma razdražljivega črevesja
- **Migrene** - Identifikacija sprožilcev
- **Energija** - Optimizacija spanja in prehrane
- **Mentalno zdravje** - Dolgoterminski tracking razpoloženja
- **Kronične bolezni** - Dnevnik simptomov

---

## 📞 Kontakt

Domenpr - [GitHub](https://github.com/domenpr)

**Built with Claude Code on Android** 🤖📱
