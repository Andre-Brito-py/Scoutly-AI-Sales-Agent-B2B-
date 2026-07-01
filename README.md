# Scoutly AI - B2B Autonomous SDR Team 🚀

O **Scoutly** é uma plataforma avançada de automação de prospecção B2B (Outbound). Evoluiu de um simples CRM com automação de disparos para um sistema **Multi-Agent** (Equipe de Inteligência Artificial) capaz de buscar leads, raspar sites, entender as dores das empresas e redigir copies de altíssima conversão de forma 100% autônoma.

Construído para apoiar as vendas da **Vysify**.

---

## 🏗️ Arquitetura do Sistema (V3.1)

O Scoutly opera com um modelo de **Agentes de IA** independentes (no Backend Node.js) que formam um pipeline de processamento de Leads.

### A Equipe de IA (Agentes)
1. **🔍 Research Agent (Provider Interface)**: Agnóstico a provedores. Procura leads usando integrações (Google Maps, Apollo, etc) e cruza as buscas combinando segmentação, idioma e região estritamente definidos na Campanha.
2. **🧠 Company Intelligence Agent**: Visita o site da empresa prospectada, faz scraping (Cheerio) do HTML e gera um dossiê resumido sobre o que a empresa faz, diferenciais e ICP.
3. **🩺 Pain Finder Agent**: Analisa o dossiê e utiliza metodologias de vendas (SPIN Selling) para levantar 3 dores prováveis do Lead.
4. **⚖️ Scoring Agent (Rule Engine + AI)**: Mistura critérios absolutos (tamanho da empresa, se usa WhatsApp) com o parecer da IA para gerar o *Lead Score* e a **AI Strategy** (Tese de Investimento no Lead).
5. **✍️ Copywriter Agent**: Absorve as dores mapeadas, a Estratégia B2B e as características do **Produto Ofertado** para redigir um e-mail de prospecção hiper-personalizado no idioma escolhido.
6. **🧠 Memory Agent (RAG Local)**: Avalia feedbacks das mensagens enviadas (Reuniões Fechadas) extraindo "Regras de Ouro" de persuasão que passam a ser utilizadas obrigatoriamente pelos Copywriters no futuro (Self-Learning).

### Cérebro Internacional & Segurança de Chaves
As configurações críticas do sistema evoluíram para permitir Múltiplos Inquilinos de forma segura:
* O Front-end agora salva as **API Keys** (OpenAI, Resend) diretamente no Banco de Dados SQLite interno. Os Agentes inicializam suas mentes carregando a chave do banco dinamicamente, abandonando dependência exclusiva de `.env`.
* O Motor permite a internacionalização completa. Ao rodar campanhas para o mercado exterior, os robôs obedecerão o Idioma exigido de forma nativa.

---

## 💻 Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS, Vite (Dashboard animado e Interface de Configurações).
- **Backend**: Node.js, Express, SQLite (Tabelas: campanhas, produtos, tenant_profiles, api_keys, ai_memory).
- **Automação & IA**: OpenAI SDK (GPT-4o/mini), Cheerio + Axios (Scraping), Node-Cron.
- **Disparos**: Resend (SMTP / E-mails), APIs customizadas de WhatsApp.

---

## 🚀 Como Executar Localmente

### 1. Inicializando o Motor (Backend)
Vá para a pasta `backend`, instale e inicie o motor. (Não é mais necessário criar arquivo `.env` para as chaves principais de inteligência, você pode configurá-las direto pela tela da aplicação).
```bash
cd backend
npm install
node server.js
```
*(Na primeira execução, o arquivo `scoutly.db` será criado e estruturado).*

### 2. Rodando a Interface (Frontend)
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```
👉 Acesse a aba de **Configurações** na plataforma e digite suas credenciais (OpenAI, Resend) para que os agentes saiam do modo `[MOCK]` (Simulação) e ganhem vida real.

---

## 🌟 O Futuro (V4 Roadmap)
- Múltiplas contas SMTP nativas para escalabilidade de cold email.
- Webhooks para leitura automática de respostas (o Agente passará a ler os e-mails recebidos, classificar intenção e enviar Calendly sozinho, retroalimentando o Memory Agent).
- Integração nativa de WhatsApp Massivo.
