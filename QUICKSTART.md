# ⚡ Quick Start Guide - Health Tracker

Najhitrejši način za deployment Health Tracker aplikacije na Renderju **s telefona**.

---

## 📱 Deploy v 7 minutah (s telefona)

### Korak 1: Render Account (1 min)

1. Odpri: **https://render.com**
2. "Sign Up" → **"Continue with GitHub"**
3. Potrdi dostop

### Korak 2: PostgreSQL Baza (2 min)

1. V Render Dashboard: **"New +" → "PostgreSQL"**
2. Nastavi:
   - **Name**: `health-tracker-db`
   - **Region**: Frankfurt (ali najbližja)
   - **Instance Type**: **Free**
3. **"Create Database"**
4. Počakaj 1-2 minuti ⏳

### Korak 3: Kopiraj Database URL (1 min)

1. Ko je baza ustvarjena, pojdi v **Dashboard → health-tracker-db**
2. Scroll do **"Connections"**
3. Kopiraj **"Internal Database URL"** (ne External!)
   - Format: `postgresql://user:pass@host/dbname`

> **✨ Pomembno:** Aplikacija **avtomatsko ustvari tabelo** ob prvem zagonu!
> Ni potrebno ročno poganjati SQL - vse naredi sama! 🎉

### Korak 4: Deploy Web Service (3 min)

1. V Render Dashboard: **"New +" → "Web Service"**
2. **"Connect a repository"** → izberi **Hello-claude-code**
3. Nastavi:
   - **Name**: `health-tracker`
   - **Branch**: `claude/init-nodejs-webapp-3YXIz` (ali main)
   - **Runtime**: **Node**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**

4. **Environment Variables:**
   - Klikni **"Add Environment Variable"**
   - **Key**: `DATABASE_URL`
   - **Value**: Prilepi Internal Database URL iz koraka 3
   - Klikni **"Add Environment Variable"** ponovno
   - **Key**: `NODE_ENV`
   - **Value**: `production`

5. **"Create Web Service"**

6. Počakaj 2-3 minute ⏳
   - Aplikacija se bo deployala
   - **Tabela se bo avtomatsko ustvarila** ob prvem zagonu! ✅

### Korak 5: Preveri in Uporablji! (1 min)

1. Ko je deployment končan, klikni na URL (npr. `https://health-tracker.onrender.com`)
2. V Logs boš videl:
   ```
   🔧 Initializing database...
   ✅ Database initialized successfully
      - Table "entries" ready
      - Index "idx_entries_timestamp" ready
   🚀 Health Tracker teče na...
   ```
3. Preveri health endpoint: `/api/health` → `"database": "connected"` ✅
4. Odpri glavno stran in dodaj prvi vnos!
5. **DONE!** 🎉

---

## 🎯 Kaj sedaj?

### Dodaj na Home Screen (mobilni telefon)

**Android:**
1. Odpri aplikacijo v Chrome
2. Menu (⋮) → "Add to Home screen"
3. Potrdi
4. Ikona bo na home screen! 📱

**iPhone:**
1. Odpri aplikacijo v Safari
2. Klikni Share ikono
3. "Add to Home Screen"
4. Potrdi

### Uporabi 3× dnevno

- **Zjutraj** po zajtrku
- **Popoldan** po kosilu
- **Zvečer** pred spanjem

Aplikacija avtomatsko shrani podatke in prikazuje grafe trendov!

---

## ❓ Troubleshooting

### Problem: "Database connection failed"

**Rešitev:**
- Preveri DATABASE_URL - mora biti **Internal**, ne External
- Ponovno kopiraj URL z Renderja (celoten string!)
- Preveri da si nastavil tudi NODE_ENV=production

### Problem: "Database initialization failed"

**Rešitev:**
- Preveri Logs v Render Dashboard
- Preveri DATABASE_URL - mora biti pravilno formatiran
- Poskusi ponovno deployati (Manual Deploy)

### Problem: Deploy failed

**Rešitev:**
- Preveri Logs v Render Dashboard
- Preveri, da je branch pravilen
- Preveri, da sta obe environment variabli nastavljeni (DATABASE_URL in NODE_ENV)

---

## 📚 Dodatna dokumentacija

- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Podrobna navodila za database
- **[DEPLOY.md](./DEPLOY.md)** - Deployment na Railway/Render/Vercel
- **[README.md](./README.md)** - Celotna dokumentacija

---

## 🚀 Naslednji koraki

1. Dodaj aplikacijo na home screen
2. Vnašaj podatke 3× dnevno
3. Po nekaj dneh preveri grafe
4. Identificiraj vzorce in izboljšaj zdravje!

**Happy tracking!** 💪
