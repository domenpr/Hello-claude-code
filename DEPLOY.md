# 🚀 Navodila za Deploy s Telefona (Android)

Ta projekt je pripravljen za enostaven deployment na različne platforme. Vse je konfigurirano, potrebuješ samo izbrati platformo in slediti korakom.

## ⚡ Hitri pregled platform

| Platforma | Cena | Hitrost | Priporočilo |
|-----------|------|---------|-------------|
| **Railway** | Brezplačno 5$/mesec | Zelo hitro | ⭐ NAJBOLJŠE za začetnike |
| **Render** | Brezplačno | Počasneje | Dobro za testiranje |
| **Vercel** | Brezplačno | Hitro | Odlično za frontend |

---

## 1️⃣ Railway (PRIPOROČENO)

### Zakaj Railway?
- ✅ Najenostavnejši deployment
- ✅ Avtomatski SSL certifikati
- ✅ Brezplačen kredit $5/mesec
- ✅ Hiter in zanesljiv

### Koraki s telefona:

1. **Namesti aplikacijo Railway**
   - Odpri brskalnik na telefonu
   - Pojdi na: https://railway.app
   - Klikni "Login" → "Login with GitHub"

2. **Ustvari nov projekt**
   - Klikni "New Project"
   - Izberi "Deploy from GitHub repo"
   - Izberi repozitorij: `Hello-claude-code`
   - Izberi branch: `claude/init-nodejs-webapp-3YXIz`

3. **Počakaj na deployment**
   - Railway bo avtomatsko zaznal `railway.json`
   - Deployment traja ~2 minuti
   - Ko je končano, klikni "View Logs"

4. **Generiraj javno URL**
   - V projektu pojdi na "Settings"
   - Klikni "Generate Domain"
   - Tvoja aplikacija je LIVE! 🎉

5. **URL izgleda tako:**
   ```
   https://your-app.up.railway.app
   ```

---

## 2️⃣ Render

### Zakaj Render?
- ✅ 100% brezplačno (za testiranje)
- ✅ Enostavna uporaba
- ⚠️ Počasnejši (aplikacija "zaspi" po 15 min neaktivnosti)

### Koraki s telefona:

1. **Pojdi na Render**
   - Odpri: https://render.com
   - Klikni "Get Started for Free"
   - "Sign in with GitHub"

2. **Ustvari Web Service**
   - Klikni "New +" → "Web Service"
   - Izberi repozitorij: `Hello-claude-code`
   - Izberi branch: `claude/init-nodejs-webapp-3YXIz`

3. **Konfiguracija (Render zazna vse avtomatsko iz `render.yaml`)**
   - Name: `hello-claude-code`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: **Free**

4. **Deploy**
   - Klikni "Create Web Service"
   - Počakaj 3-5 minut
   - URL: `https://hello-claude-code.onrender.com`

---

## 3️⃣ Vercel

### Zakaj Vercel?
- ✅ Najboljši za frontend in API routes
- ✅ Zelo hiter
- ✅ Odličen CDN
- ⚠️ Malo bolj zapleten za Express

### Koraki s telefona:

1. **Pojdi na Vercel**
   - Odpri: https://vercel.com
   - Klikni "Sign Up" → "Continue with GitHub"

2. **Uvozi projekt**
   - Klikni "Add New..." → "Project"
   - Izberi repozitorij: `Hello-claude-code`
   - Izberi branch: `claude/init-nodejs-webapp-3YXIz`

3. **Konfiguracija**
   - Project Name: `hello-claude-code`
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: prazno (pusti prazno)
   - Output Directory: prazno

4. **Deploy**
   - Klikni "Deploy"
   - Počakaj ~1 minuto
   - URL: `https://hello-claude-code.vercel.app`

---

## 🔧 Troubleshooting

### Aplikacija ne deluje?

1. **Preveri PORT variablo**
   - Vse platforme avtomatsko nastavijo PORT
   - Koda že uporablja `process.env.PORT || 3000`

2. **Preveri logs**
   - Railway: Project → "View Logs"
   - Render: Dashboard → "Logs"
   - Vercel: Deployment → "Function Logs"

3. **Preveri, če je branch push-an**
   ```bash
   git status
   git push -u origin claude/init-nodejs-webapp-3YXIz
   ```

### Build failed?

1. **Railway / Render:**
   - Preveri ali je `package.json` prisoten
   - Preveri ali je `npm install` uspešen

2. **Vercel:**
   - Vercel uporablja serverless - lahko je počasnejši za Express
   - Preveri `vercel.json` konfiguracijo

---

## 📱 Mobilne aplikacije platform

### Railway
- 🌐 Web: https://railway.app (dela odlično na mobitelu)

### Render
- 🌐 Web: https://render.com (dela odlično na mobitelu)
- 📱 Nimajo mobilne aplikacije, ampak spletna verzija je responsive

### Vercel
- 🌐 Web: https://vercel.com (dela odlično na mobitelu)
- 📱 Nimajo mobilne aplikacije, ampak spletna verzija je odlična

---

## 🎯 Priporočilo

**Za najlažji deployment s telefona:**

1. Uporabi **Railway** (najlažje, najhitrejše)
2. Če Railway ne dela, poskusi **Render** (brezplačno, a počasneje)
3. **Vercel** je super, ampak bolj primeren za statične strani

---

## ✅ Končni koraki

Po uspešnem deployment-u:

1. Testiraj URL v brskalniku
2. Delaj? 🎉 Aplikacija je LIVE!
3. Deli URL s prijatelji!

---

## 🔄 Avtomatski re-deployment

Vse tri platforme imajo **avtomatski deployment**:
- Ko push-neš spremembe na GitHub
- Platforme avtomatsko ponovno deployajo
- Ni potrebno ročno klikat "Deploy" ponovno

```bash
# Naredi spremembe
# Commita
git add .
git commit -m "Update aplikacije"
git push

# Počakaj 1-2 min → aplikacija je posodobljena! 🚀
```

---

**Vprašanja? Težave?** Poglej logse na platformi ali preveri, če je branch pravilno push-an na GitHub!
