import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Package, 
  Play, 
  Plus, 
  CheckCircle, 
  BrainCircuit, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  ThumbsUp,
  History
} from 'lucide-react';

// --- TYPES ---
interface Product {
  id: string;
  name: string;
  description: string;
  features: string;
  targetBuyer: string;
}

interface CompanyProfile {
  name: string;
  industry: string;
  description: string;
  valueProposition: string;
  targetAudience: string;
  brandVoice: string;
}

interface Campaign {
  id: string;
  name: string;
  segment: string;
  region: string;
  language: string;
  targetProduct: string;
  limitDaily: number;
  status: 'idle' | 'running' | 'completed';
  progress: number;
  currentStep: string;
}

interface Lead {
  id: string;
  companyName: string;
  website: string;
  score: number;
  scoreReason: string;
  contactName: string;
  contactRole: string;
  status: 'found' | 'enriched' | 'sent' | 'opened' | 'responded' | 'booked' | 'lost';
  personalizedMessage: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'crm' | 'products' | 'profile' | 'memory'>('dashboard');

  const [apiKeys, setApiKeys] = useState({
    openai: localStorage.getItem('scoutly_openai_key') || '',
    gemini: localStorage.getItem('scoutly_gemini_key') || '',
    anthropic: localStorage.getItem('scoutly_anthropic_key') || ''
  });

  const saveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('scoutly_openai_key', apiKeys.openai);
    localStorage.setItem('scoutly_gemini_key', apiKeys.gemini);
    localStorage.setItem('scoutly_anthropic_key', apiKeys.anthropic);
    alert('Chaves de API salvas localmente!');
  };

  // --- PERSISTED STATE / INITIAL SEEDS ---
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: 'Scoutly',
    industry: 'Sales Tech & Artificial Intelligence',
    description: 'Um SDR autônomo baseado em agentes de IA que automatiza toda a prospecção B2B, desde encontrar leads até agendar a demonstração.',
    valueProposition: 'Gerar reuniões de vendas qualificadas de forma 100% autônoma, reduzindo o custo de aquisição e acelerando o pipeline de vendas.',
    targetAudience: 'Startups SaaS, agências de marketing, e empresas de tecnologia B2B.',
    brandVoice: 'Profissional, inovadora, assertiva e focada em resultados objetivos.'
  });

  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Scoutly Agent Core',
      description: 'Agente virtual autônomo que trabalha 24/7 pesquisando, qualificando e abordando tomadores de decisão.',
      features: 'Enriquecimento profundo de sites, scoring de leads com IA baseada em fit, copywriting dinâmico baseado em inteligência competitiva.',
      targetBuyer: 'Diretores de Vendas, Head de Growth, founders de Startups.'
    }
  ]);

  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    features: '',
    targetBuyer: ''
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: 'c1',
      name: 'Prospecção - Clínicas Médicas SP',
      segment: 'Clínicas Médicas / Estética',
      region: 'São Paulo, Brasil',
      language: 'Português',
      targetProduct: 'Scoutly Agent Core',
      limitDaily: 50,
      status: 'completed',
      progress: 100,
      currentStep: 'Campanha finalizada'
    },
    {
      id: 'c2',
      name: 'SaaS Startups - US Outreach',
      segment: 'Startups de Software B2B',
      region: 'Estados Unidos',
      language: 'Inglês',
      targetProduct: 'Scoutly Agent Core',
      limitDaily: 100,
      status: 'idle',
      progress: 0,
      currentStep: 'Pronto para iniciar'
    }
  ]);

  const [newCampaign, setNewCampaign] = useState<Omit<Campaign, 'id' | 'status' | 'progress' | 'currentStep'>>({
    name: '',
    segment: '',
    region: '',
    language: 'Português',
    targetProduct: 'Scoutly Agent Core',
    limitDaily: 50
  });

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 'l1',
      companyName: 'Acme SaaS Corp',
      website: 'https://acmesaas.com',
      score: 95,
      scoreReason: 'Alto volume de contratações de vendas, site moderno em React, sem chatbot ativo de prospecção.',
      contactName: 'Sarah Jenkins',
      contactRole: 'VP of Sales',
      status: 'booked',
      personalizedMessage: 'Olá Sarah, notei que o time da Acme SaaS está escalando as operações em SP. Como vocês abordam leads outbound hoje? Vi que usam soluções de email tradicionais, o Scoutly pode automatizar 100% desse filtro...'
    },
    {
      id: 'l2',
      companyName: 'Alpha Marketing',
      website: 'https://alphamkt.io',
      score: 82,
      scoreReason: 'Forte presença digital, foco em inbound, mas site carece de formulários de contato otimizados.',
      contactName: 'Carlos Silva',
      contactRole: 'Founder',
      status: 'responded',
      personalizedMessage: 'Oi Carlos, vi seu post recente sobre escalabilidade na Alpha Marketing. Criamos abordagens sob medida para agências que desejam lotar o funil comercial sem contratar mais SDRs...'
    },
    {
      id: 'l3',
      companyName: 'Beta Logistics',
      website: 'https://betalogistics.com.br',
      score: 45,
      scoreReason: 'Baixa presença digital, sem indicação de uso de tecnologia B2B moderna, nicho muito tradicional.',
      contactName: 'Roberto Mendes',
      contactRole: 'Diretor Comercial',
      status: 'lost',
      personalizedMessage: ''
    }
  ]);

  // --- SIMULATION OF RUNNING CAMPAIGN ---
  const [runningCampaignId, setRunningCampaignId] = useState<string | null>(null);

  const startCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'running', progress: 5 } : c));
    setRunningCampaignId(campaignId);
  };

  useEffect(() => {
    if (!runningCampaignId) return;

    const steps = [
      'Buscando empresas no segmento...',
      'Visitando sites e enriquecendo dados de contato...',
      'Identificando tomadores de decisão (CEO, Sales Directors)...',
      'Calculando Lead Score baseado no perfil do produto selecionado...',
      'Escrevendo e personalizando mensagens de outreach com IA...',
      'Disparando mensagens personalizadas e iniciando fluxos de cadência...',
      'Campanha concluída com sucesso!'
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      setCampaigns(prev => {
        return prev.map(c => {
          if (c.id === runningCampaignId) {
            const nextProgress = Math.min(c.progress + 15, 100);
            if (nextProgress >= 100) {
              clearInterval(interval);
              setRunningCampaignId(null);
              // Add a mockup qualified lead when campaign finishes
              addMockLead(c);
              return {
                ...c,
                status: 'completed',
                progress: 100,
                currentStep: 'Campanha finalizada!'
              };
            }
            const currentStepMsg = steps[stepIndex] || 'Enviando contatos...';
            stepIndex++;
            return {
              ...c,
              progress: nextProgress,
              currentStep: currentStepMsg
            };
          }
          return c;
        });
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [runningCampaignId]);

  const addMockLead = (camp: Campaign) => {
    // Generate AI dynamic message based on user profile and product
    const selectedProd = products.find(p => p.name === camp.targetProduct) || products[0];
    const generatedMsg = `Olá, notei que sua empresa atua no segmento de ${camp.segment} na região de ${camp.region}. Com base no ${companyProfile.name}, nós oferecemos o ${selectedProd?.name || 'nosso produto'}, que ${selectedProd?.description || 'ajuda sua operação'}. Podemos agendar um papo rápido?`;

    const newLead: Lead = {
      id: `l_${Date.now()}`,
      companyName: `${camp.segment.split(' ')[0]} Enterprise`,
      website: `https://test-${camp.segment.toLowerCase().replace(/\s/g, '')}.com`,
      score: Math.floor(Math.random() * 20) + 80, // High score
      scoreReason: `Excelente adequação para o produto ${selectedProd?.name}. Apresenta fit de segmento (${camp.segment}) e região (${camp.region}).`,
      contactName: 'Amanda Oliveira',
      contactRole: 'Diretora Comercial',
      status: 'opened',
      personalizedMessage: generatedMsg
    };

    setLeads(prev => [newLead, ...prev]);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.description) return;
    setProducts(prev => [...prev, { id: `p_${Date.now()}`, ...newProduct }]);
    setNewProduct({ name: '', description: '', features: '', targetBuyer: '' });
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.segment) return;
    setCampaigns(prev => [...prev, {
      id: `c_${Date.now()}`,
      ...newCampaign,
      status: 'idle',
      progress: 0,
      currentStep: 'Pronto para iniciar'
    }]);
    setNewCampaign({
      name: '',
      segment: '',
      region: '',
      language: 'Português',
      targetProduct: products[0]?.name || 'Scoutly Agent Core',
      limitDaily: 50
    });
  };

  return (
    <div className="flex h-screen bg-[#08080C] text-gray-100 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0D0D15] border-r border-[#1C1C28] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-[#1C1C28] flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                SCOUTLY
              </span>
              <span className="block text-[10px] text-indigo-400 font-semibold tracking-widest uppercase">
                AI Revenue SDR
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-[#181825] text-white font-medium shadow-inner border-l-2 border-indigo-500'
                  : 'text-gray-400 hover:bg-[#11111B] hover:text-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                activeTab === 'campaigns'
                  ? 'bg-[#181825] text-white font-medium shadow-inner border-l-2 border-indigo-500'
                  : 'text-gray-400 hover:bg-[#11111B] hover:text-gray-200'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Campanhas IA</span>
              {runningCampaignId && (
                <span className="ml-auto w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('crm')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                activeTab === 'crm'
                  ? 'bg-[#181825] text-white font-medium shadow-inner border-l-2 border-indigo-500'
                  : 'text-gray-400 hover:bg-[#11111B] hover:text-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pipeline & CRM</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                activeTab === 'products'
                  ? 'bg-[#181825] text-white font-medium shadow-inner border-l-2 border-indigo-500'
                  : 'text-gray-400 hover:bg-[#11111B] hover:text-gray-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Meus Produtos</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-[#181825] text-white font-medium shadow-inner border-l-2 border-indigo-500'
                  : 'text-gray-400 hover:bg-[#11111B] hover:text-gray-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Perfil da Startup</span>
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                activeTab === 'memory'
                  ? 'bg-[#181825] text-white font-medium shadow-inner border-l-2 border-indigo-500'
                  : 'text-gray-400 hover:bg-[#11111B] hover:text-gray-200'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Memória & Aprendizado</span>
            </button>
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-[#1C1C28] flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            A
          </div>
          <div className="overflow-hidden">
            <span className="block text-xs font-semibold text-gray-200 truncate">André</span>
            <span className="block text-[10px] text-gray-500 truncate">Workspace: {companyProfile.name}</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A10]">
        
        {/* TOP BAR */}
        <header className="h-16 border-b border-[#1C1C28] px-8 flex items-center justify-between bg-[#0C0C14]">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold tracking-wide text-white capitalize">
              {activeTab === 'profile' ? 'Configuração da Startup' : activeTab === 'products' ? 'Catálogo de Produtos' : activeTab}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-2 text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-medium">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Agente Autônomo Ativo</span>
            </span>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Context Callout */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-900/20 via-indigo-900/5 to-transparent border border-indigo-500/20 flex items-start space-x-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Contexto de Treinamento Ativo</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-3xl leading-relaxed">
                    O Scoutly está configurado para prospectar no contexto de <strong>{companyProfile.name}</strong> ({companyProfile.industry}), focando no produto <strong>{products[0]?.name || 'Nenhum cadastrado'}</strong>. As abordagens, avaliações de score e critérios de filtro do agente de IA responderão dinamicamente a esse escopo.
                  </p>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#0E0E18] border border-[#1C1C28] p-5 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
                  <span className="text-xs text-gray-400 font-medium block">Empresas Encontradas</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-bold text-white">{leads.length * 15}</span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" /> +12%
                    </span>
                  </div>
                </div>

                <div className="bg-[#0E0E18] border border-[#1C1C28] p-5 rounded-xl relative overflow-hidden">
                  <span className="text-xs text-gray-400 font-medium block">Mensagens Enviadas</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-bold text-white">{leads.filter(l => l.status !== 'found' && l.status !== 'enriched').length * 8}</span>
                    <span className="text-xs text-indigo-400 font-medium block">Cadência IA</span>
                  </div>
                </div>

                <div className="bg-[#0E0E18] border border-[#1C1C28] p-5 rounded-xl relative overflow-hidden">
                  <span className="text-xs text-gray-400 font-medium block">Taxa de Abertura</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-bold text-white">74.2%</span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" /> +4.1%
                    </span>
                  </div>
                </div>

                <div className="bg-[#0E0E18] border border-[#1C1C28] p-5 rounded-xl relative overflow-hidden">
                  <span className="text-xs text-gray-400 font-medium block">Reuniões Agendadas</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-bold text-white">{leads.filter(l => l.status === 'booked').length}</span>
                    <span className="text-xs text-emerald-500 font-semibold block">Conversão Ideal</span>
                  </div>
                </div>
              </div>

              {/* Main Dashboard Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Active Agent Activity Feed */}
                <div className="lg:col-span-2 bg-[#0E0E18] border border-[#1C1C28] rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Atividade do Agente em Tempo Real</h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    <div className="space-y-4">
                      {leads.slice(0, 3).map((lead) => (
                        <div key={lead.id} className="p-4 rounded-lg bg-[#12121E] border border-[#1F1F30] flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-white text-sm">{lead.companyName}</span>
                              <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                                lead.score >= 80 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-red-950/50 text-red-400 border border-red-500/20'
                              }`}>
                                Score: {lead.score}
                              </span>
                            </div>
                            <span className="block text-xs text-gray-400 mt-1">{lead.contactName} ({lead.contactRole})</span>
                            <p className="text-xs text-indigo-300 italic mt-2 line-clamp-1">"{lead.scoreReason}"</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-[#1B1B2B] text-gray-300">
                            {lead.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('crm')} 
                    className="mt-6 w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-center space-x-1.5"
                  >
                    <span>Ver Pipeline de Leads Completo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Company Context Summary Card */}
                <div className="bg-[#0E0E18] border border-[#1C1C28] rounded-xl p-6 space-y-6">
                  <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Diretrizes de Negócio Ativas</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase block tracking-wider">Startup / Empresa</span>
                      <span className="text-sm font-medium text-white block mt-0.5">{companyProfile.name}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase block tracking-wider">Proposta de Valor</span>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">
                        {companyProfile.valueProposition}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase block tracking-wider">Produto Oferecido</span>
                      <div className="p-3 rounded-lg bg-[#12121E] border border-[#1F1F30] mt-1">
                        <span className="text-xs font-semibold text-white block">{products[0]?.name || 'Nenhum'}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5 truncate">{products[0]?.description}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('profile')} 
                    className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-semibold transition duration-200"
                  >
                    Editar Contexto & Produto
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* CAMPAIGNS TAB */}
          {activeTab === 'campaigns' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Campaign Creation & Config */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Form */}
                <div className="bg-[#0E0E18] border border-[#1C1C28] rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-indigo-400" />
                    <span>Nova Campanha Autônoma</span>
                  </h3>

                  <form onSubmit={handleCreateCampaign} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Nome da Campanha</label>
                      <input 
                        type="text" 
                        value={newCampaign.name}
                        onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                        placeholder="Ex: SaaS Growth São Paulo"
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Segmento Alvo</label>
                      <input 
                        type="text" 
                        value={newCampaign.segment}
                        onChange={e => setNewCampaign({...newCampaign, segment: e.target.value})}
                        placeholder="Ex: Agências de Tecnologia, Clínicas Estéticas"
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">País/Região</label>
                        <input 
                          type="text" 
                          value={newCampaign.region}
                          onChange={e => setNewCampaign({...newCampaign, region: e.target.value})}
                          placeholder="Ex: Brasil, EUA"
                          className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Idioma</label>
                        <select 
                          value={newCampaign.language}
                          onChange={e => setNewCampaign({...newCampaign, language: e.target.value})}
                          className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Português">Português</option>
                          <option value="Inglês">Inglês</option>
                          <option value="Espanhol">Espanhol</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Produto a Ser Divulgado</label>
                      <select 
                        value={newCampaign.targetProduct}
                        onChange={e => setNewCampaign({...newCampaign, targetProduct: e.target.value})}
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Limite Diário de Abordagens</label>
                      <input 
                        type="number" 
                        value={newCampaign.limitDaily}
                        onChange={e => setNewCampaign({...newCampaign, limitDaily: parseInt(e.target.value) || 50})}
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition duration-200 mt-2 shadow-lg shadow-indigo-500/20"
                    >
                      Criar Campanha
                    </button>
                  </form>
                </div>

                {/* Campaigns List */}
                <div className="lg:col-span-2 space-y-4">
                  {campaigns.map(camp => (
                    <div key={camp.id} className="bg-[#0E0E18] border border-[#1C1C28] rounded-xl p-6 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h4 className="font-semibold text-white">{camp.name}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              camp.status === 'running' 
                                ? 'bg-indigo-950 text-indigo-400 border border-indigo-500/30' 
                                : camp.status === 'completed'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                : 'bg-gray-800 text-gray-400'
                            }`}>
                              {camp.status === 'running' ? 'Executando' : camp.status === 'completed' ? 'Finalizada' : 'Aguardando'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                            <span><strong>Segmento:</strong> {camp.segment}</span>
                            <span><strong>Região:</strong> {camp.region}</span>
                            <span><strong>Produto:</strong> {camp.targetProduct}</span>
                          </div>
                        </div>

                        {camp.status === 'idle' && (
                          <button 
                            onClick={() => startCampaign(camp.id)}
                            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition"
                          >
                            <Play className="w-3 h-3" />
                            <span>Iniciar</span>
                          </button>
                        )}
                      </div>

                      {/* Progress bar / AI output */}
                      {(camp.status === 'running' || camp.status === 'completed') && (
                        <div className="mt-6 pt-4 border-t border-[#1C1C28]/80">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span className="flex items-center space-x-1.5 text-indigo-400">
                              {camp.status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
                              <span>{camp.currentStep}</span>
                            </span>
                            <span>{camp.progress}%</span>
                          </div>
                          <div className="w-full bg-[#12121E] h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-full transition-all duration-500" 
                              style={{ width: `${camp.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* CRM PIPELINE TAB */}
          {activeTab === 'crm' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0E0E18] border border-[#1C1C28] rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Pipeline de Vendas Automatizado</h3>
                  <div className="text-xs text-gray-400">
                    Clique em um lead para visualizar a personalização da IA
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* Column 1: Encontrados */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-[#12121E] px-3 py-2 rounded-lg border-l-2 border-blue-500">
                      <span className="text-xs font-semibold text-gray-300">Encontrados</span>
                      <span className="text-[10px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded font-bold">
                        {leads.filter(l => l.status === 'found' || l.status === 'enriched').length}
                      </span>
                    </div>
                    {leads.filter(l => l.status === 'found' || l.status === 'enriched').map(lead => (
                      <div key={lead.id} className="p-3 bg-[#0B0B12] border border-[#1C1C28] rounded-lg">
                        <span className="block text-xs font-bold text-white">{lead.companyName}</span>
                        <span className="block text-[10px] text-gray-400 mt-1">{lead.contactRole}</span>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-[9px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded">Score: {lead.score}</span>
                          <span className="text-[9px] text-gray-500">{lead.website.replace('https://', '')}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Column 2: Mensagem Enviada / Aberta */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-[#12121E] px-3 py-2 rounded-lg border-l-2 border-indigo-500">
                      <span className="text-xs font-semibold text-gray-300">Outreach / Enviado</span>
                      <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-bold">
                        {leads.filter(l => l.status === 'sent' || l.status === 'opened').length}
                      </span>
                    </div>
                    {leads.filter(l => l.status === 'sent' || l.status === 'opened').map(lead => (
                      <div key={lead.id} className="p-3 bg-[#0B0B12] border border-[#1C1C28] rounded-lg">
                        <span className="block text-xs font-bold text-white">{lead.companyName}</span>
                        <span className="block text-[10px] text-gray-400 mt-1">{lead.contactName}</span>
                        
                        <div className="mt-2 p-2 bg-[#12121F] border border-[#1F1F35] rounded text-[10px] text-gray-400 leading-normal italic line-clamp-2">
                          "{lead.personalizedMessage}"
                        </div>

                        <div className="flex justify-between items-center mt-3">
                          <span className="text-[9px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded">Score: {lead.score}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">{lead.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Column 3: Respondido */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-[#12121E] px-3 py-2 rounded-lg border-l-2 border-amber-500">
                      <span className="text-xs font-semibold text-gray-300">Respondido</span>
                      <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded font-bold">
                        {leads.filter(l => l.status === 'responded').length}
                      </span>
                    </div>
                    {leads.filter(l => l.status === 'responded').map(lead => (
                      <div key={lead.id} className="p-3 bg-[#0B0B12] border border-[#1C1C28] rounded-lg">
                        <span className="block text-xs font-bold text-white">{lead.companyName}</span>
                        <span className="block text-[10px] text-gray-400 mt-1">{lead.contactName}</span>
                        
                        <div className="mt-2 p-2 bg-[#12121F] border border-[#1F1F35] rounded text-[10px] text-gray-400 leading-normal italic">
                          "{lead.personalizedMessage}"
                        </div>

                        <div className="flex justify-between items-center mt-3">
                          <span className="text-[9px] bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded">Score: {lead.score}</span>
                          <span className="text-[10px] text-amber-400 font-semibold">Respondeu</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Column 4: Reunião Marcada */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-[#12121E] px-3 py-2 rounded-lg border-l-2 border-emerald-500">
                      <span className="text-xs font-semibold text-gray-300">Marcadas (Meeting)</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-bold">
                        {leads.filter(l => l.status === 'booked').length}
                      </span>
                    </div>
                    {leads.filter(l => l.status === 'booked').map(lead => (
                      <div key={lead.id} className="p-3 bg-[#0B0B12] border border-[#1C1C28] rounded-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-full blur-sm" />
                        <span className="block text-xs font-bold text-white">{lead.companyName}</span>
                        <span className="block text-[10px] text-gray-400 mt-1">{lead.contactName} ({lead.contactRole})</span>
                        
                        <div className="mt-2 p-2 bg-[#12121F] border border-[#1F1F35] rounded text-[10px] text-gray-400 leading-normal italic line-clamp-3">
                          "{lead.personalizedMessage}"
                        </div>

                        <div className="flex justify-between items-center mt-3">
                          <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded">Score: {lead.score}</span>
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Marcada
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-start space-x-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Treinamento do Produto</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Cadastre os produtos e serviços que sua startup comercializa. O Agente Redator irá minerar esses recursos, listando as principais funcionalidades e a dor que cada uma resolve para escrever mensagens altamente personalizadas para o Lead.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Form to Add Product */}
                <div className="bg-[#0E0E18] border border-[#1C1C28] rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Adicionar Novo Produto</h3>
                  
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Nome do Produto</label>
                      <input 
                        type="text" 
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        placeholder="Ex: Scoutly Enterprise API"
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Descrição Comercial</label>
                      <textarea 
                        rows={3}
                        value={newProduct.description}
                        onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                        placeholder="Explique o que o produto faz..."
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Funcionalidades Principais</label>
                      <textarea 
                        rows={2}
                        value={newProduct.features}
                        onChange={e => setNewProduct({...newProduct, features: e.target.value})}
                        placeholder="Ex: Dashboard de métricas, integração HubSpot, etc."
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Perfil do Comprador Ideal (Persona)</label>
                      <input 
                        type="text" 
                        value={newProduct.targetBuyer}
                        onChange={e => setNewProduct({...newProduct, targetBuyer: e.target.value})}
                        placeholder="Ex: VPs de Vendas, CMOs, CEOs"
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition duration-200 mt-2 shadow-lg shadow-indigo-500/20"
                    >
                      Salvar Produto
                    </button>
                  </form>
                </div>

                {/* Products List */}
                <div className="lg:col-span-2 space-y-4">
                  {products.map(prod => (
                    <div key={prod.id} className="bg-[#0E0E18] border border-[#1C1C28] rounded-xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white text-base">{prod.name}</h4>
                          <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider block mt-0.5">
                            Persona Alvo: {prod.targetBuyer}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-300 mt-4 leading-relaxed">
                        {prod.description}
                      </p>

                      <div className="mt-4 pt-4 border-t border-[#1C1C28] flex flex-wrap gap-2">
                        {prod.features.split(',').map((f, i) => (
                          <span key={i} className="text-xs bg-[#12121E] border border-[#1F1F30] text-gray-300 px-3 py-1 rounded-full">
                            {f.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* PROFILE / SETTINGS TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-start space-x-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Instruções de Marca e Filosofia</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Configure os dados fundamentais sobre a sua empresa/startup. Essas informações funcionam como as "diretrizes de contexto" (Knowledge Base) para as ferramentas de IA, moldando como elas definem objeções e se portam em conversas.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl">
                
                {/* Profile Form */}
                <div className="bg-[#0E0E18] border border-[#1C1C28] rounded-xl p-8">
                  <h3 className="text-sm font-semibold text-white mb-6">Cadastro da Startup (Treinamento do Agente)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Nome da Startup / Empresa</label>
                      <input 
                        type="text" 
                        value={companyProfile.name}
                        onChange={e => setCompanyProfile({...companyProfile, name: e.target.value})}
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Mercado / Segmento</label>
                      <input 
                        type="text" 
                        value={companyProfile.industry}
                        onChange={e => setCompanyProfile({...companyProfile, industry: e.target.value})}
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">O que a Empresa faz? (Explicação Geral)</label>
                      <textarea 
                        rows={3}
                        value={companyProfile.description}
                        onChange={e => setCompanyProfile({...companyProfile, description: e.target.value})}
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Proposta de Valor Principal</label>
                      <textarea 
                        rows={2}
                        value={companyProfile.valueProposition}
                        onChange={e => setCompanyProfile({...companyProfile, valueProposition: e.target.value})}
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Público-Alvo Ideal</label>
                      <input 
                        type="text" 
                        value={companyProfile.targetAudience}
                        onChange={e => setCompanyProfile({...companyProfile, targetAudience: e.target.value})}
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Tom de Voz da IA</label>
                      <input 
                        type="text" 
                        value={companyProfile.brandVoice}
                        onChange={e => setCompanyProfile({...companyProfile, brandVoice: e.target.value})}
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[#1C1C28] flex justify-end">
                    <button 
                      onClick={() => {
                        alert('Contexto de treinamento atualizado!');
                        setActiveTab('dashboard');
                      }}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition duration-200 shadow-lg shadow-indigo-500/20"
                    >
                      Salvar Configurações & Atualizar Agentes
                    </button>
                  </div>
                </div>

                {/* API Keys Form */}
                <div className="bg-[#0E0E18] border border-[#1C1C28] rounded-xl p-8">
                  <h3 className="text-sm font-semibold text-white mb-6">Credenciais & Chaves de API (Salvas localmente)</h3>
                  <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                    Insira as chaves dos modelos de linguagem que deseja utilizar. Elas são armazenadas apenas no seu navegador (localStorage) e enviadas nas requisições sem persistir no servidor.
                  </p>

                  <form onSubmit={saveApiKeys} className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">OpenAI API Key</label>
                      <input 
                        type="password" 
                        value={apiKeys.openai}
                        onChange={e => setApiKeys({...apiKeys, openai: e.target.value})}
                        placeholder="sk-..."
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Gemini API Key</label>
                      <input 
                        type="password" 
                        value={apiKeys.gemini}
                        onChange={e => setApiKeys({...apiKeys, gemini: e.target.value})}
                        placeholder="AIzaSy..."
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Anthropic Claude Key</label>
                      <input 
                        type="password" 
                        value={apiKeys.anthropic}
                        onChange={e => setApiKeys({...apiKeys, anthropic: e.target.value})}
                        placeholder="sk-ant-..."
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <div className="mt-8 pt-6 border-t border-[#1C1C28] flex justify-end">
                      <button 
                        type="submit"
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition duration-200 shadow-lg shadow-indigo-500/20"
                      >
                        Salvar Chaves de API
                      </button>
                    </div>
                  </form>
                </div>

              </div>

            </div>
          )}

          {/* MEMORY TAB */}
          {activeTab === 'memory' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-start space-x-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Memória de Conversão & Vetores</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    O Scoutly analisa as conversas passadas que geraram reuniões marcadas para retroalimentar seu modelo RAG de prospecção.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0E0E18] border border-[#1C1C28] rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-400" />
                    <span>Abordagens de Alto Impacto (Retidas)</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-[#12121E] border border-[#1F1F30]">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">Taxa de Conversão: 89%</span>
                      <p className="text-xs text-gray-300 mt-2 italic leading-relaxed">
                        "...vi seu post recente sobre escalabilidade na Alpha Marketing. Criamos abordagens sob medida para agências que desejam..."
                      </p>
                      <span className="block text-[10px] text-gray-500 mt-2">Usado em: Campanhas B2B Brasil</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0E0E18] border border-[#1C1C28] rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
                    <History className="w-4 h-4 text-indigo-400" />
                    <span>Insights de Aprendizado Autônomo</span>
                  </h4>
                  <div className="space-y-3 text-xs text-gray-300">
                    <div className="p-3 bg-[#12121E] border border-[#1C1C28] rounded-lg">
                      🟢 <strong>Preferência de CTA:</strong> Perguntas sobre o gargalo comercial convertem 2x mais do que enviar links diretos de agenda na primeira mensagem.
                    </div>
                    <div className="p-3 bg-[#12121E] border border-[#1C1C28] rounded-lg">
                      🟢 <strong>Melhor Horário:</strong> Abordagens enviadas entre 10h e 11h30 (horário local do lead) recebem respostas 35% mais rápido.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
