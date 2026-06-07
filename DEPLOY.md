# Host PADS Parkinson Care online

The app runs as **one URL** (React UI + `/api` backend on the same port).

## Option A — Public link with ngrok (recommended)

### One-time setup

1. Create a free account at [ngrok.com](https://ngrok.com)
2. Copy your authtoken from [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Add to `backend/.env`:
   ```
   NGROK_AUTHTOKEN=your_token_here
   ```
4. Install ngrok (if needed):
   ```bash
   brew install ngrok/ngrok/ngrok
   ```

### Start public hosting

1. **Stop** the dev server if running: `Ctrl+C` on `./run.sh`
2. Run:

```bash
chmod +x host-online.sh run-production.sh
./host-online.sh
```

3. Copy the **Public URL** printed (e.g. `https://xxxx.ngrok-free.app`) and open it on any device.

Your `backend/.env` API keys are used for LLM and voice on the tunneled server.

---

## Option B — Same Wi‑Fi only (no tunnel)

```bash
./run-production.sh
```

Open `http://<your-mac-ip>:8000` on another device on the same network.

---

## Option C — Permanent hosting on Render (free tier)

1. Push this project to **GitHub** (do **not** commit `backend/.env`).
2. Go to [render.com](https://render.com) → **New** → **Blueprint** → connect the repo.
3. Add API keys in Render **Environment**.
4. Deploy.

---

## Demo logins

| Role | Email |
|------|--------|
| Doctor | `doctor.mueller` |
| Patient | `patient.004` |
| Caretaker | `anna.weber` |
| Chemist | `chemist.lam` |

Password: `pads2024`
