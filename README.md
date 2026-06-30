# Scoutly AI B2B Revenue SDR

Scoutly is an autonomous Sales Development Representative (SDR) powered by AI Agents designed to automate your entire B2B outbound prospecting pipeline—from discovery and enrichment to qualification scoring, copywriting, and smart scheduling.

---

> [!WARNING]
> ## PRIVATE PROPRIETARY SOFTWARE
> **This repository is confidential and proprietary. Unauthorized copying, distribution, or modifications of this project via any medium is strictly prohibited.**
> 
> **License Type:** Private / Proprietary (Non-Open Source)
> 
> *Copyright © 2026 Scoutly. All rights reserved.*

---

## Architecture Overview

Scoutly uses a decoupled architecture with a modern, reactive frontend interface and a robust queue-driven background processing backend:

### 1. Frontend (Vite + React + TypeScript + Tailwind CSS v4)
* **Interactive Control Center:** Monitor campaigns, qualified leads, and metrics in real-time.
* **Auto-Adaptive Localization:** Dynamically adjusts outreach copywriting language presets based on targeting countries.
* **Client-side Credentials:** Save LLM keys (OpenAI, Gemini, Anthropic) and integration keys (Apollo, Hunter, Resend) securely directly in `localStorage` without server persistency.

### 2. Backend (Laravel DDD structure)
* **Domain-Driven Design:** Built with isolated contexts (`Tenant`, `Company`, `Outbound`).
* **Sequential Queue Processing (Jobs):**
  1. `DiscoverLeadsJob` - Discovers prospects based on segments and location parameters.
  2. `EnrichWebsiteJob` - Visits websites and simulates finding target decision-makers.
  3. `CalculateLeadScoreJob` - Qualifies leads using commercial guidelines.
  4. `GeneratePersonalizedMessageJob` - Formulates custom contextual outreach email copies.
* **Outbound Safeguards:** The `OutboundSchedulerService` routes deliveries only during business hours using human-like random delays (2 to 15 minutes) to protect domain reputation.

---

## Getting Started

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* [Node.js](https://nodejs.org/) (for local frontend development)

### Local Development Setup

1. **Spin up Infrastructure Containers:**
   From the project root directory, run:
   ```bash
   docker compose up -d --build
   ```
   This initializes:
   * **App:** PHP 8.4-FPM container.
   * **Webserver:** Nginx.
   * **Database:** PostgreSQL 15.
   * **Cache & Queues:** Redis.
   * **Queue Monitor:** Laravel Horizon.

2. **Initialize Frontend Assets:**
   Navigate into the `frontend` folder and run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Database Migrations:**
   Inside the backend application container, run:
   ```bash
   docker exec -it scoutly-app php artisan migrate
   ```

4. **Queue Worker:**
   Start processing jobs:
   ```bash
   docker exec -it scoutly-app php artisan horizon
   ```
