# Scoutly AI - B2B Autonomous SDR Team 🚀

O **Scoutly** é uma plataforma avançada de automação de prospecção B2B (Outbound). Evoluiu de um simples CRM com automação de disparos para um sistema **Multi-Agent** (Equipe de Inteligência Artificial) capaz de buscar leads, raspar sites, entender as dores das empresas e redigir copies de altíssima conversão de forma 100% autônoma.

Construído para apoiar as vendas da **Vysify**.

---

## 🏗️ Arquitetura do Sistema (V3)

O Scoutly opera com um modelo de **Agentes de IA** independentes (no Backend Node.js) que formam um pipeline de processamento de Leads.

### A Equipe de IA (Agentes)
1. **🔍 Research Agent (Provider Interface)**: Agnóstico a provedores. Procura leads usando integrações (Google Maps, Apollo, etc).
2. **🧠 Company Intelligence Agent**: Visita o site da empresa prospectada, faz scraping (Cheerio) do HTML e gera um dossiê resumido sobre o que a empresa faz, diferenciais e ICP.
3. **🩺 Pain Finder Agent**: Analisa o dossiê e utiliza metodologias de vendas (SPIN Selling) para levantar 3 dores prováveis do Lead.
4. **⚖️ Scoring Agent (Rule Engine + AI)**: Mistura critérios absolutos (tamanho da empresa, se usa WhatsApp) com o parecer da IA para gerar o *Lead Score* e a **AI Strategy** (Tese de Investimento no Lead).
5. **✍️ Copywriter Agent**: Absorve as dores mapeadas e a Estratégia B2B para redigir um e-mail de prospecção hiper-personalizado e direto ao ponto.

### Motor de Campanhas Autônomo
As campanhas podem ser operadas com dois gatilhos:
- **Imediata (1x)**: Inicia o pipeline de imediato.
- **Diária (Cron Job)**: Executa autonomamente todo dia de manhã, prospectando até o limite diário definido.

---

## 💻 Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS, Vite (Dashboard e CRM Animado).
- **Backend**: Node.js, Express, SQLite (Banco de dados local veloz).
- **Automação & IA**: OpenAI SDK (GPT-4o-mini), Cheerio + Axios (Scraping), Node-Cron.
- **Disparos**: Resend (SMTP / E-mails), APIs customizadas de WhatsApp.

---

## 🚀 Como Executar Localmente

### 1. Configurando o Banco de Dados e Ambiente
No diretório `backend`, crie o arquivo `.env` com as chaves:
```env
PORT=3001
OPENAI_API_KEY=sua-chave-openai
RESEND_API_KEY=sua-chave-resend
WHATSAPP_API_TOKEN=seu-token-whatsapp
```

Instale as dependências e rode o servidor:
```bash
cd backend
npm install
node server.js
```
*(Na primeira execução, o arquivo `scoutly.db` será criado automaticamente).*

### 2. Rodando a Interface
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```

---

## 🌟 O Futuro (V4 Roadmap)
- Múltiplas contas SMTP nativas para escalabilidade de cold email.
- Webhooks para leitura de respostas (o Agente passará a ler os e-mails recebidos e enviar Links do Calendly sozinho).
- Expansão do módulo *Lead Providers* (LinkedIn Scraping, Crunchbase).
