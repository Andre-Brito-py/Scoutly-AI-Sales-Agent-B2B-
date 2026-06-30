# Scoutly AI B2B Revenue SDR

Scoutly is an autonomous Sales Development Representative (SDR) powered by AI Agents designed to automate your entire B2B outbound prospecting pipeline—from discovery and enrichment to qualification scoring, copywriting, split A/B testing, multichannel message delivery, and response sentiment handling.

---

> [!WARNING]
> ## PRIVATE PROPRIETARY SOFTWARE
> **This repository is confidential and proprietary. Unauthorized copying, distribution, or modifications of this project via any medium is strictly prohibited.**
> 
> **License Type:** Private / Proprietary (Non-Open Source)
> 
> *Copyright © 2026 Scoutly. All rights reserved.*

---

## Architectural Deep-Dive

Scoutly uses a decoupled architecture with a modern, reactive frontend interface and a robust queue-driven background processing backend:

### 1. Frontend (Vite + React + TypeScript + Tailwind CSS v4)
* **Interactive Control Center:** Monitor active campaign loops, qualified leads pipelines, and CRM conversion metrics in real-time.
* **Auto-Adaptive Localization:** Dynamically adjusts outreach copywriting language presets (e.g., Portuguese, English, Spanish, German, French) based on targeting countries.
* **Client-side Credentials:** Save LLM keys (OpenAI, Gemini, Anthropic), search keys (Apollo, Hunter), messaging credentials (WhatsApp Token, Telegram Bot Token), and professional cookies (LinkedIn `li_at` cookie) securely directly in `localStorage` without server persistency.
* **A/B Testing Dashboard:** Dedicated widgets comparing Variant A (Value-focused pitch) against Variant B (Pain-focused pitch) with metrics for sends, conversions, and conversion rates.
* **Outreach Activity Logger:** Tab displaying real-time message logs (who received, channel badges, error traces, timestamp, and message body).

### 2. Backend (Laravel DDD structure)
* **Domain-Driven Design:** Built with isolated contexts (`Tenant`, `Company`, `Outbound`).
* **Sequential Queue Processing (Jobs Pipeline):**
  1. `DiscoverLeadsJob` - Discovers prospects using Apollo.io search API based on targeted segment criteria, countries, and titles (CEO, Founder, VP).
  2. `EnrichWebsiteJob` - Enriches contact emails utilizing Hunter.io domain search if not supplied by Apollo.
  3. `CalculateLeadScoreJob` - Qualifies fit using OpenAI GPT-4o-mini matching prospect data with **Vysify CRM**'s specifications.
  4. `GeneratePersonalizedMessageJob` - Formulates custom cold outreach text copies alternating between Variant A and Variant B configurations.
* **Multichannel Active Outbound Delivery:**
  * `SendOutreachEmailJob` - Dispatches emails via Resend API.
  * `SendOutreachWhatsappJob` - Sends text messages using Evolution API / Z-API endpoints to mobile phones.
  * `SendOutreachTelegramJob` - Dispatches message alerts to the Telegram Bot API.
* **Sentiment Analysis Response Webhook (`ReplyWebhookController`):**
  * Receives prospect replies.
  * Uses GPT-4o-mini to qualify sentiment: `interested` (triggers status update to `booked` and increments A/B variant conversion counts), `not_interested` (moves status to `lost`), or `out_of_office`.
  * Formulates automated responses to pricing inquiries (referencing product's pricing plans context) or company website requests (using startup's configured domain).
* **Outbound Safeguards:** The `OutboundSchedulerService` routes deliveries only during business hours using human-like random delays (2 to 15 minutes) to protect domain reputation.

---

## Database Schemas & Migrations

The relational model handles multitenancy and campaign flows:
1. `campaigns`: Holds targeted segments, languages, daily limits, and step progress.
2. `leads`: Mapped to campaigns. Tracks contact details (name, email, phone, role), lead scoring value, copy variant (A/B), and sentiment status.
3. `ab_tests`: Variant counts tracking send and conversion rates.
4. `outreach_logs`: Delivery history capturing channels, recipients, message content, and API error codes.

---

## Local Development Setup

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* [Node.js](https://nodejs.org/) (for local frontend development)

### Execution Steps

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
