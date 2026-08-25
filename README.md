# Vereins-Events

Anmeldeportal für Veranstaltungen mit Bus-Platzverwaltung, PayPal-Zahlung (an eine Privatperson) und Newsletter.

## Ablauf

1. Gäste melden sich ohne Account für eine Veranstaltung an (Name, E-Mail, Bus-Wahl mit Live-Platzanzeige).
2. Sie werden auf eine Zahlungsseite mit PayPal.me-Link weitergeleitet.
3. Der Admin markiert eingegangene Zahlungen im Admin-Bereich als "bezahlt".
4. Erst dann sinkt die freie Platzanzahl, es geht automatisch eine Bestätigungsmail raus, und bei Newsletter-Opt-in wird die E-Mail-Adresse in den Verteiler aufgenommen.
5. Der Admin kann jederzeit einen Newsletter an alle Abonnenten verschicken.

## Lokal starten

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
vercel dev
```

Für die volle Anwendung (Frontend **und** die Serverless-Functions unter `api/`) `vercel dev` direkt ausführen, nicht über `npm run dev` (das startet aus historischen Gründen nur `vite` für reine Frontend-Iteration ohne API — `vercel dev` darf laut Vercel nicht selbst als `dev`-Script in der `package.json` stehen, sonst gibt es einen "recursive invocation"-Fehler).

Ohne gesetzten `RESEND_API_KEY` werden E-Mails nicht wirklich verschickt, sondern nur in die Konsole geloggt — so lässt sich alles lokal testen, ohne einen Resend-Account zu brauchen.

## Erstmaliges Setup

1. **`.env` anlegen** (Kopie von `.env.example`) und `DATABASE_URL` sowie `SESSION_SECRET` eintragen (`openssl rand -hex 32` für den Secret).
2. **Admin-Passwort erzeugen:**
   ```bash
   npm run seed:admin -- "dein-passwort"
   ```
   Ausgabe als `ADMIN_PASSWORD_HASH` in `.env` eintragen, `ADMIN_USERNAME` frei wählen.
3. **Datenbank-Migration ausführen:** `npm run prisma:migrate`

## Produktiv-Deployment (Vercel)

1. Neues GitHub-Repository für dieses Projekt anlegen und pushen.
2. Kostenloses Postgres bei [Neon](https://neon.tech) anlegen, die **pooled connection string** kopieren.
3. Bei [Resend](https://resend.com) einen API-Key erzeugen und eine Absender-Domain verifizieren (für echten Massenversand nötig; `onboarding@resend.dev` ist nur für Tests).
4. Bei Vercel `Add New Project` → GitHub-Repo importieren. Vercel erkennt Vite automatisch.
5. Unter `Settings → Environment Variables` alle Werte aus `.env.example` eintragen (`DATABASE_URL`, `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `PUBLIC_BASE_URL` auf die echte Domain setzen).
6. `npm run prisma:deploy` gegen die Produktions-Datenbank laufen lassen (z.B. lokal mit der Produktions-`DATABASE_URL`), danach deployen.

## Später geplant

Eine Abstimmungsfunktion, mit der Gäste über künftige Veranstaltungen/Ausflüge abstimmen können, ist bewusst noch nicht enthalten.
