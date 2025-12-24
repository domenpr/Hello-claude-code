# 🗄️ Database Setup - Health Tracker

Podrobna navodila za nastavitev PostgreSQL baze na Renderju in povezavo z aplikacijo.

---

## 📋 Pregled

Health Tracker uporablja **PostgreSQL** bazo za shranjevanje zdravstvenih podatkov. Ta dokument vsebuje:
1. Kako ustvariti Postgres bazo na Renderju
2. Kako pridobiti DATABASE_URL
3. Kako nastaviti environment variablo v aplikaciji
4. Kako pognati migrations

---

## 1️⃣ Ustvari PostgreSQL bazo na Renderju

### Koraki s telefona/računalnika:

1. **Pojdi na Render Dashboard**
   - Odpri: https://render.com
   - Sign in with GitHub (če še nisi)

2. **Ustvari novo PostgreSQL bazo**
   - Klikni "New +" → **"PostgreSQL"**

3. **Konfiguriraj bazo**
   - **Name**: `health-tracker-db` (ali karkoli želiš)
   - **Database**: `healthtracker` (avtomatsko)
   - **User**: `healthtracker` (avtomatsko)
   - **Region**: Izberi najbližjo regijo (npr. Frankfurt)
   - **PostgreSQL Version**: 16 (najnovejša)
   - **Instance Type**: **Free** (dovolj za začetek)

4. **Klikni "Create Database"**
   - Počakaj 1-2 minuti, da se baza ustvari

5. **Baza je ustvarjena!** ✅

---

## 2️⃣ Pridobi DATABASE_URL

Ko je baza ustvarjena, potrebuješ **Internal Database URL**.

### Kje najdeš DATABASE_URL:

1. Pojdi v Dashboard → Tvoja baza (npr. "health-tracker-db")
2. Scroll dol do sekcije **"Connections"**
3. Kopiraj **"Internal Database URL"** (ne External!)

**Format URL-ja:**
\`\`\`
postgresql://healthtracker:XXXXXXXXXXXXXX@dpg-xxxxx.frankfurt-postgres.render.com/healthtracker
\`\`\`

**POMEMBNO:** Uporabi **Internal Database URL**, ne External! Internal je hitrejši in brezplačen.

---

## 3️⃣ Nastavi Environment Variablo v Aplikaciji

Sedaj moraš DATABASE_URL povezati z aplikacijo.

### Na Renderju (Web Service):

1. **Pojdi v Dashboard → Tvoj Web Service** (npr. "hello-claude-code")

2. **Pojdi na "Environment"** (levo v meniju)

3. **Dodaj novo environment variablo:**
   - **Key**: \`DATABASE_URL\`
   - **Value**: Prilepi **Internal Database URL** iz koraka 2

4. **Dodaj še NODE_ENV:**
   - **Key**: \`NODE_ENV\`
   - **Value**: \`production\`

5. **Klikni "Save Changes"**

6. **Aplikacija se bo avtomatsko re-deployala** (počakaj 1-2 min)

### Primer Environment Variables:

\`\`\`
DATABASE_URL = postgresql://healthtracker:abc123xyz@dpg-xxxxx.frankfurt-postgres.render.com/healthtracker
NODE_ENV = production
\`\`\`

---

## 4️⃣ Poženi Database Migrations

Ko je baza povezana, moraš ustvariti tabele.

### Metoda 1: Ročno v Render SQL Query (PRIPOROČENO za prvi setup)

1. **Pojdi v Dashboard → Tvoja PostgreSQL baza**

2. **Klikni "Query" (v meniju)**

3. **Kopiraj celoten SQL iz \`migrations/001_create_entries.sql\` in ga prilepi:**

\`\`\`sql
CREATE TABLE IF NOT EXISTS entries (
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

CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp DESC);

COMMENT ON TABLE entries IS 'Zdravstveni vnosi uporabnika s časovnimi oznakami';
COMMENT ON COLUMN entries.energy IS 'Energija (1-5, kjer 5 pomeni največ energije)';
COMMENT ON COLUMN entries.mood IS 'Razpoloženje (1-5, kjer 5 pomeni najboljše razpoloženje)';
COMMENT ON COLUMN entries.stress IS 'Stres (1-5, kjer 5 pomeni največ stresa)';
COMMENT ON COLUMN entries.stomach_pain IS 'Bolečina v trebuhu (1-5, kjer 5 pomeni najhujšo bolečino)';
COMMENT ON COLUMN entries.stool IS 'Blato (1-5, kjer 4 pomeni idealno)';
COMMENT ON COLUMN entries.note IS 'Opombe in dodatni komentarji';
\`\`\`

4. **Klikni "Run Query"**

5. **Tabela je ustvarjena!** ✅

### Metoda 2: Avtomatsko prek npm skripta (lokalno ali na serverju)

Če imaš dostop do terminala:

\`\`\`bash
# Najprej nastavi DATABASE_URL lokalno
export DATABASE_URL="postgresql://user:password@host:port/database"

# Nato poženi migration
npm run migrate
\`\`\`

---

## 5️⃣ Preveri, da vse deluje

### Test 1: Health Check Endpoint

Odpri v brskalniku:
\`\`\`
https://your-app.onrender.com/api/health
\`\`\`

Če vse deluje, boš videl:
\`\`\`json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-12-24T12:00:00.000Z"
}
\`\`\`

### Test 2: Dodaj prvi vnos

1. Odpri aplikacijo: https://your-app.onrender.com
2. Izpolni obrazec in klikni "Shrani vnos"
3. Če vidiš "✅ Vnos uspešno shranjen!", je vse OK!

---

## 🔧 Troubleshooting

### Problem: "Database connection failed"

**Rešitev:**
1. Preveri, da je DATABASE_URL pravilno nastavljena (Internal, ne External)
2. Preveri, da si jo kopiral CELOTNO (včasih se konec odreže)
3. Pojdi na Render → PostgreSQL baza → Info in ponovno kopiraj URL

### Problem: "Table 'entries' does not exist"

**Rešitev:**
1. Pojdi v Render → PostgreSQL baza → Query
2. Zaženi migration SQL (korak 4, Metoda 1)

### Problem: "Error: password authentication failed"

**Rešitev:**
1. DATABASE_URL je narobe - ponovno kopiraj z Renderja
2. Preveri, da nimaš dodatnih presledkov pred/za URL

### Problem: Aplikacija se ne poveže z bazo

**Rešitev:**
1. Počakaj 2-3 minute - Render včasih potrebuje čas
2. Preveri Logs: Dashboard → Web Service → Logs
3. Išči napake kot "connection refused" ali "timeout"

---

## 📊 Schema Diagram

\`\`\`
entries table
├── id (SERIAL PRIMARY KEY)
├── timestamp (TIMESTAMP WITH TIME ZONE)
├── energy (INTEGER 1-5)
├── mood (INTEGER 1-5)
├── stress (INTEGER 1-5)
├── stomach_pain (INTEGER 1-5)
├── stool (INTEGER 1-5)
├── note (TEXT, nullable)
└── created_at (TIMESTAMP WITH TIME ZONE)

Indexes:
└── idx_entries_timestamp (timestamp DESC)
\`\`\`

---

## 🔐 Varnost

**POMEMBNO:**
- DATABASE_URL vsebuje geslo - **nikoli** je ne deli javno
- Ne commitaj .env datoteke v Git (že v .gitignore)
- Render avtomatsko šifrira environment variable
- Internal Database URL deluje samo znotraj Render omrežja

---

## ✅ Checklist za Setup

- [ ] Ustvarjena PostgreSQL baza na Renderju
- [ ] Kopiran Internal Database URL
- [ ] DATABASE_URL nastavljena v Web Service environment
- [ ] NODE_ENV=production nastavljen
- [ ] Migration SQL zagnana (tabela ustvarjena)
- [ ] /api/health endpoint vrača "connected"
- [ ] Uspešno dodan testni vnos preko forme

---

## 🚀 Dodatne možnosti

### Backup baze

Render Free PostgreSQL plan:
- **90 dni retenčna doba**
- Po 90 dneh se baza izbriše, če ni aktivnosti
- Za dolgoročno uporabo upgradeaj na Paid plan ($7/mesec)

### Povezava na lokalni razvoj

Za testiranje lokalno:

1. Kopiraj DATABASE_URL iz Renderja
2. Ustvari \`.env\` datoteko v projektu:
   \`\`\`
   DATABASE_URL=postgresql://...
   NODE_ENV=development
   \`\`\`
3. Poženi \`npm run dev\`

---

**Vprašanja? Težave?** Preveri Logs na Renderju ali išči napake v Browser Developer Console (F12).
