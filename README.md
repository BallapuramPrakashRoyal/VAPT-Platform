# VAPT Web Application


![License](https://img.shields.io/badge/license-MIT-blue.svg)

A full-stack Vulnerability Assessment and Penetration Testing (VAPT) platform with
configurable scanning modules, structured vulnerability reporting, and dashboard
analytics.

**Stack:** Node.js, Express.js, MongoDB, React.js (Vite), Docker, Nmap, OWASP ZAP.

**Live demo:** _add your deployed URL here once hosted_
**Demo video:** _add a 60–90s walkthrough link here (Loom/YouTube unlisted works well)_

## Why I built this

Most student security projects either wrap a single CLI tool in a form, or fake the
scan results. This one runs real tools (nmap, OWASP ZAP) end-to-end, stores
normalized results in MongoDB, and turns them into a reportable dashboard — the same
shape as commercial tools like Qualys or Nessus, scoped down to something buildable
solo. I designed the module system to be extensible (each scan type is an isolated
service + async job), added input validation to prevent the backend itself from
becoming a command-injection vector, and required explicit authorization
confirmation before any scan can run, since that's a real constraint any production
security tool has to handle.

> ⚠️ **Legal use only.** This tool performs active network and web scans. Only ever
> point it at systems you own or have explicit written authorization to test.
> Unauthorized scanning is illegal in most jurisdictions. Use
> [`scanme.nmap.org`](https://nmap.org/book/testing.html) — Nmap's official legal
> test target — to try it safely.

## Features

- **Port & Service Scan** — Nmap-based scan of the top 100 ports with service/version
  detection.
- **Web Vulnerability Scan** — OWASP ZAP spider + active scan surfaces XSS, SQLi,
  insecure headers, and more, mapped to severity levels.
- **Subdomain & DNS Enumeration** — Certificate Transparency lookup (crt.sh) plus
  live DNS resolution.
- **Structured reporting** — every scan produces a normalized JSON result set stored
  in MongoDB (ports, subdomains, vulnerabilities + severity summary).
- **Dashboard analytics** — live-updating scan status, severity breakdown chart, and
  per-module result tables.
- **Consent gate** — a scan cannot be created without confirming authorization for
  the target, and target input is validated/sanitized before it ever reaches nmap or
  ZAP.

## Architecture

```
vapt-platform/
├── backend/            Express API (port 5000)
│   ├── models/Scan.js       Mongoose schema for scans + results
│   ├── services/             portScanService, subdomainService, webVulnService
│   ├── controllers/          orchestrates async module execution
│   └── middleware/           target validation, error handling
├── frontend/           React (Vite) SPA (port 5173 dev / 80 via nginx in prod)
│   └── src/pages/            Dashboard, NewScan, ScanDetail
└── docker-compose.yml  mongo + zap + backend + frontend, wired together
```

Scans run asynchronously: `POST /api/scans` creates the record and immediately
returns while the selected modules run in the background; the frontend polls
`GET /api/scans/:id` every few seconds until the scan finishes.

## Local development (without Docker)

Prerequisites: Node 18+, MongoDB running locally, `nmap` installed
(`sudo apt install nmap` / `brew install nmap`), and optionally a local OWASP ZAP
daemon if you want to test the web vuln module.

```bash
# Backend
cd backend
cp .env.example .env      # edit MONGO_URI / ZAP settings if needed
npm install
npm run dev                # http://localhost:5000

# Frontend (in a second terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173
```

## Run everything with Docker (recommended)

This spins up MongoDB, the OWASP ZAP daemon, the backend, and the frontend together
— nmap and ZAP are already installed inside the containers, so nothing extra to set
up locally.

```bash
docker compose up --build
```

Then open **http://localhost** (frontend) — it proxies API calls to the backend
automatically. To try it, use target `scanme.nmap.org`.

## API reference

| Method | Route            | Description                              |
|--------|------------------|-------------------------------------------|
| POST   | `/api/scans`     | Create a scan (`target`, `label`, `modules`, `consent`) |
| GET    | `/api/scans`     | List all scans (summary only)             |
| GET    | `/api/scans/:id` | Get one scan with full results            |
| DELETE | `/api/scans/:id` | Delete a scan                             |

## Credits
Designed and Developed by Ballapuram Prakash Royal.
