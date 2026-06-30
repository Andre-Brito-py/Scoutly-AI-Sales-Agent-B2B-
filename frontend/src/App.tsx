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
  Loader2, 
  ArrowRight,
  ThumbsUp,
  History,
  MessageSquare
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

interface ProspectingArea {
  countries: string[];
  states: string[];
  cities: string;
}

interface Campaign {
  id: string;
  name: string;
  segment: string;
  prospectingArea: ProspectingArea;
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

interface OutreachLog {
  id: string;
  lead_id: string;
  campaign_id: string;
  channel: 'email' | 'whatsapp' | 'telegram';
  recipient: string;
  message_content: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at: string;
  lead?: Lead;
  campaign?: Campaign;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'crm' | 'products' | 'profile' | 'memory' | 'logs'>('dashboard');
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);

  const [apiKeys, setApiKeys] = useState({
    openai: localStorage.getItem('scoutly_openai_key') || '',
    gemini: localStorage.getItem('scoutly_gemini_key') || '',
    anthropic: localStorage.getItem('scoutly_anthropic_key') || '',
    apollo: localStorage.getItem('scoutly_apollo_key') || '',
    hunter: localStorage.getItem('scoutly_hunter_key') || '',
    resend: localStorage.getItem('scoutly_resend_key') || '',
    whatsappToken: localStorage.getItem('scoutly_whatsapp_token') || '',
    whatsappInstance: localStorage.getItem('scoutly_whatsapp_instance') || '',
    telegramToken: localStorage.getItem('scoutly_telegram_token') || '',
    telegramChatId: localStorage.getItem('scoutly_telegram_chat_id') || '',
    linkedinCookie: localStorage.getItem('scoutly_linkedin_cookie') || ''
  });

  const saveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('scoutly_openai_key', apiKeys.openai);
    localStorage.setItem('scoutly_gemini_key', apiKeys.gemini);
    localStorage.setItem('scoutly_anthropic_key', apiKeys.anthropic);
    localStorage.setItem('scoutly_apollo_key', apiKeys.apollo);
    localStorage.setItem('scoutly_hunter_key', apiKeys.hunter);
    localStorage.setItem('scoutly_resend_key', apiKeys.resend);
    localStorage.setItem('scoutly_whatsapp_token', apiKeys.whatsappToken);
    localStorage.setItem('scoutly_whatsapp_instance', apiKeys.whatsappInstance);
    localStorage.setItem('scoutly_telegram_token', apiKeys.telegramToken);
    localStorage.setItem('scoutly_telegram_chat_id', apiKeys.telegramChatId);
    localStorage.setItem('scoutly_linkedin_cookie', apiKeys.linkedinCookie);
    alert('Chaves de API salvas localmente!');
  };

  // --- PERSISTED STATE / INITIAL SEEDS ---
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: 'Vysify',
    industry: 'Enterprise Software & Sales CRM',
    description: 'Um CRM moderno focado em otimização de pipeline e automações comerciais que ajuda times de venda a fechar mais negócios.',
    valueProposition: 'Acelerar o ciclo de vendas e estruturar a jornada comercial através de automações inteligentes e pipeline intuitivo.',
    targetAudience: 'Startups, agências de marketing, e PMEs em crescimento.',
    brandVoice: 'Profissional, focado em resultados, consultivo e tecnológico.'
  });

  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Vysify CRM Suite',
      description: 'Plataforma CRM completa com funis de venda, relatórios de performance de SDR e integrações comerciais.',
      features: 'Funil Kanban, relatórios em tempo real, automações de follow-up, API aberta',
      targetBuyer: 'Gestores de Vendas, Diretores Comerciais, CEOs e Fundadores de PMEs.'
    }
  ]);

  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    features: '',
    targetBuyer: ''
  });

  // --- GEO-TARGETING DATA ---
  const COUNTRY_DATA: Record<string, { label: string; flag: string; states: string[] }> = {
    BR: { label: 'Brasil', flag: '🇧🇷', states: ['Acre','Alagoas','Amapá','Amazonas','Bahia','Ceará','Distrito Federal','Espírito Santo','Goiás','Maranhão','Mato Grosso','Mato Grosso do Sul','Minas Gerais','Pará','Paraíba','Paraná','Pernambuco','Piauí','Rio de Janeiro','Rio Grande do Norte','Rio Grande do Sul','Rondônia','Roraima','Santa Catarina','São Paulo','Sergipe','Tocantins'] },
    US: { label: 'Estados Unidos', flag: '🇺🇸', states: ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'] },
    ES: { label: 'Espanha', flag: '🇪🇸', states: ['Andaluzia','Aragão','Astúrias','Ilhas Baleares','Canárias','Cantábria','Castela e Leão','Castela-La Mancha','Catalunha','Extremadura','Galícia','La Rioja','Comunidade de Madrid','Região de Múrcia','Navarra','País Basco','Comunidade Valenciana'] },
    PT: { label: 'Portugal', flag: '🇵🇹', states: ['Aveiro','Beja','Braga','Bragança','Castelo Branco','Coimbra','Évora','Faro','Guarda','Leiria','Lisboa','Portalegre','Porto','Santarém','Setúbal','Viana do Castelo','Vila Real','Viseu','Açores','Madeira'] },
    GB: { label: 'Reino Unido', flag: '🇬🇧', states: ['Inglaterra','Escócia','País de Gales','Irlanda do Norte'] },
    DE: { label: 'Alemanha', flag: '🇩🇪', states: ['Baden-Württemberg','Baviera','Berlim','Brandenburgo','Bremen','Hamburgo','Hesse','Mecklemburgo-Pomerânia Ocidental','Baixa Saxônia','Renânia do Norte-Vestfália','Renânia-Palatinado','Sarre','Saxônia','Saxônia-Anhalt','Schleswig-Holstein','Turíngia'] },
    FR: { label: 'França', flag: '🇫🇷', states: ['Île-de-France','Occitânia','Auvérnia-Ródano-Alpes','Nouvelle-Aquitaine','Hauts-de-France','Bretanha','Normandia','Pays de la Loire','Grand Est','Provença-Alpes-Costa Azul','Borgonha-Franco-Condado','Centro-Vale do Loire','Córsega'] },
    MX: { label: 'México', flag: '🇲🇽', states: ['Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas','Chihuahua','Cidade do México','Coahuila','Colima','Durango','Guanajuato','Guerrero','Hidalgo','Jalisco','Estado do México','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas'] },
    AR: { label: 'Argentina', flag: '🇦🇷', states: ['Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Terra do Fogo','Tucumán'] },
    CO: { label: 'Colômbia', flag: '🇨🇴', states: ['Bogotá','Antioquia','Atlântico','Bolívar','Boyacá','Caldas','Caquetá','Cauca','Cesar','Córdoba','Cundinamarca','Chocó','Huila','La Guajira','Magdalena','Meta','Nariño','Norte de Santander','Quindío','Risaralda','Santander','Sucre','Tolima','Valle del Cauca'] },
  };

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: 'c1',
      name: 'Prospecção - Clínicas Médicas SP',
      segment: 'Clínicas Médicas / Estética',
      prospectingArea: { countries: ['BR'], states: ['São Paulo'], cities: 'São Paulo, Campinas' },
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
      prospectingArea: { countries: ['US'], states: [], cities: '' },
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
    prospectingArea: { countries: [], states: [], cities: '' },
    language: 'Português',
    targetProduct: 'Scoutly Agent Core',
    limitDaily: 50
  });

  // Derive available states from selected countries
  const availableStates = newCampaign.prospectingArea.countries.flatMap(c => COUNTRY_DATA[c]?.states ?? []);

  const toggleCountry = (code: string) => {
    const current = newCampaign.prospectingArea.countries;
    const updated = current.includes(code) ? current.filter(c => c !== code) : [...current, code];
    // Reset states that no longer belong to selected countries
    const validStates = newCampaign.prospectingArea.states.filter(s =>
      updated.flatMap(cc => COUNTRY_DATA[cc]?.states ?? []).includes(s)
    );
    
    // Auto-detect default language from selected countries
    let autoLanguage = newCampaign.language;
    if (updated.length > 0) {
      const primaryCountry = updated[0];
      if (primaryCountry === 'US' || primaryCountry === 'GB') {
        autoLanguage = 'Inglês';
      } else if (primaryCountry === 'ES' || primaryCountry === 'MX' || primaryCountry === 'AR' || primaryCountry === 'CO') {
        autoLanguage = 'Espanhol';
      } else if (primaryCountry === 'PT' || primaryCountry === 'BR') {
        autoLanguage = 'Português';
      } else if (primaryCountry === 'DE') {
        autoLanguage = 'Alemão';
      } else if (primaryCountry === 'FR') {
        autoLanguage = 'Francês';
      }
    }
    
    setNewCampaign({ 
      ...newCampaign, 
      language: autoLanguage,
      prospectingArea: { ...newCampaign.prospectingArea, countries: updated, states: validStates } 
    });
  };

  const toggleState = (state: string) => {
    const current = newCampaign.prospectingArea.states;
    const updated = current.includes(state) ? current.filter(s => s !== state) : [...current, state];
    setNewCampaign({ ...newCampaign, prospectingArea: { ...newCampaign.prospectingArea, states: updated } });
  };

  const buildRegionLabel = (area: ProspectingArea): string => {
    const countryLabels = area.countries.map(c => COUNTRY_DATA[c]?.label ?? c);
    const parts: string[] = [];
    if (countryLabels.length) parts.push(countryLabels.join(', '));
    if (area.states.length) parts.push(`• ${area.states.join(', ')}`);
    if (area.cities.trim()) parts.push(`• ${area.cities}`);
    return parts.join(' ');
  };

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

  // --- API BACKEND SYNC AND LOADERS ---
  const API_BASE = '/api';

  useEffect(() => {
    // Load Company Profile
    fetch(`${API_BASE}/profile`)
      .then(res => res.json())
      .then(data => {
        if (data && data.company_name) {
          setCompanyProfile({
            name: data.company_name,
            industry: data.industry,
            description: data.description,
            valueProposition: data.value_proposition,
            targetAudience: data.target_audience,
            brandVoice: data.brand_voice
          });
        }
      })
      .catch(() => console.log('Using local fallback profile data'));

    // Load Products
    fetch(`${API_BASE}/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data.map(p => ({
            id: String(p.id),
            name: p.name,
            description: p.description,
            features: Array.isArray(p.features) ? p.features.join(', ') : (p.features || ''),
            targetBuyer: p.target_buyer || ''
          })));
        }
      })
      .catch(() => console.log('Using local fallback products catalog'));

    // Load Campaigns
    fetch(`${API_BASE}/campaigns`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCampaigns(data.map(c => ({
            id: String(c.id),
            name: c.name,
            segment: c.segment,
            prospectingArea: {
              countries: c.countries || [],
              states: c.states || [],
              cities: c.cities || ''
            },
            language: c.language,
            targetProduct: c.target_product ? c.target_product.name : 'Scoutly Agent Core',
            limitDaily: c.limit_daily,
            status: c.status,
            progress: c.progress,
            currentStep: c.current_step
          })));
        }
      })
      .catch(() => console.log('Using local fallback campaigns'));

    // Load Leads
    fetch(`${API_BASE}/leads`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLeads(data.map(l => ({
            id: String(l.id),
            companyName: l.company_name,
            website: l.website,
            score: l.score || 0,
            scoreReason: l.score_reason || '',
            contactName: l.contact_name || '',
            contactRole: l.contact_role || '',
            status: l.status,
            personalizedMessage: l.personalized_message || ''
          })));
        }
      })
      .catch(() => console.log('Using local fallback leads'));

    // Load Outreach Logs
    fetch(`${API_BASE}/outreach-logs`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOutreachLogs(data);
        }
      })
      .catch(() => {
        console.log('Using local fallback outreach logs');
        // Initial Seed Logs Mock
        setOutreachLogs([
          {
            id: 'log1',
            lead_id: 'l1',
            campaign_id: 'c1',
            channel: 'email',
            recipient: 'sarah.jenkins@acme.com',
            message_content: 'Olá Sarah, notei que o time da Acme SaaS está escalando as operações em SP...',
            status: 'sent',
            sent_at: '2026-06-30T10:15:00Z',
            lead: { id: 'l1', companyName: 'Acme SaaS Corp', website: 'https://acmesaas.com', score: 95, scoreReason: '', contactName: 'Sarah Jenkins', contactRole: 'VP of Sales', status: 'booked', personalizedMessage: '' }
          }
        ]);
      });
  }, []);

  // Sync profile saving to backend
  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyProfile.name,
          industry: companyProfile.industry,
          description: companyProfile.description,
          value_proposition: companyProfile.valueProposition,
          target_audience: companyProfile.targetAudience,
          brand_voice: companyProfile.brandVoice
        })
      });
      if (response.ok) {
        alert('Configurações salvas no servidor!');
      } else {
        alert('Erro ao salvar no servidor, salvo localmente!');
      }
    } catch {
      alert('Salvo localmente (modo sandbox offline)!');
    }
    setActiveTab('dashboard');
  };

  // --- SIMULATION OF RUNNING CAMPAIGN ---
  const [runningCampaignId, setRunningCampaignId] = useState<string | null>(null);

  const startCampaign = async (campaignId: string) => {
    // Optimistic UI update
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'running', progress: 5 } : c));
    setRunningCampaignId(campaignId);

    // Call Laravel Backend campaign worker dispatch trigger
    try {
      await fetch(`${API_BASE}/campaigns/${campaignId}/start`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OpenAI-Key': apiKeys.openai,
          'X-Apollo-Key': apiKeys.apollo,
          'X-Resend-Key': apiKeys.resend,
          'X-WhatsApp-Token': apiKeys.whatsappToken,
          'X-WhatsApp-Instance': apiKeys.whatsappInstance,
          'X-Telegram-Bot-Token': apiKeys.telegramToken,
          'X-Telegram-Chat-ID': apiKeys.telegramChatId,
          'X-LinkedIn-Cookie': apiKeys.linkedinCookie
        }
      });
    } catch {
      console.log('Running campaign in frontend demo fallback mode');
    }
  };

  useEffect(() => {
    if (!runningCampaignId) return;

    // Fast simulation check if API backend is not active
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
      // Keep polling backend status or fallback mock
      fetch(`${API_BASE}/campaigns`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const serverCamp = data.find(c => String(c.id) === runningCampaignId);
            if (serverCamp) {
              setCampaigns(prev => prev.map(c => String(c.id) === runningCampaignId ? {
                ...c,
                status: serverCamp.status,
                progress: serverCamp.progress,
                currentStep: serverCamp.current_step
              } : c));
              if (serverCamp.status === 'completed') {
                clearInterval(interval);
                setRunningCampaignId(null);
              }
            }
          }
        })
        .catch(() => {
          // Frontend fallback simulation if no API connection
          setCampaigns(prev => {
            return prev.map(c => {
              if (c.id === runningCampaignId) {
                const nextProgress = Math.min(c.progress + 15, 100);
                if (nextProgress >= 100) {
                  clearInterval(interval);
                  setRunningCampaignId(null);
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
        });
    }, 3000);

    return () => clearInterval(interval);
  }, [runningCampaignId]);

  const addMockLead = (camp: Campaign) => {
    const selectedProd = products.find(p => p.name === camp.targetProduct) || products[0];
    const regionLabel = buildRegionLabel(camp.prospectingArea);
    const generatedMsg = `Olá, notei que sua empresa atua no segmento de ${camp.segment} na região de ${regionLabel}. Com base no ${companyProfile.name}, nós oferecemos o ${selectedProd?.name || 'nosso produto'}, que ${selectedProd?.description || 'ajuda sua operação'}. Podemos agendar um papo rápido?`;

    const newLead: Lead = {
      id: `l_${Date.now()}`,
      companyName: `${camp.segment.split(' ')[0]} Enterprise`,
      website: `https://test-${camp.segment.toLowerCase().replace(/\s/g, '')}.com`,
      score: Math.floor(Math.random() * 20) + 80,
      scoreReason: `Excelente adequação para o produto ${selectedProd?.name}. Apresenta fit de segmento (${camp.segment}) e região (${regionLabel}).`,
      contactName: 'Amanda Oliveira',
      contactRole: 'Diretora Comercial',
      status: 'opened',
      personalizedMessage: generatedMsg
    };

    setLeads(prev => [newLead, ...prev]);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.description) return;
    
    // Save locally
    const tempId = `p_${Date.now()}`;
    setProducts(prev => [...prev, { id: tempId, ...newProduct }]);

    // Save to Backend API
    try {
      await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          features: newProduct.features.split(','),
          target_buyer: newProduct.targetBuyer
        })
      });
    } catch {
      console.log('Saved product in frontend sandbox');
    }

    setNewProduct({ name: '', description: '', features: '', targetBuyer: '' });
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.segment || newCampaign.prospectingArea.countries.length === 0) return;

    const tempId = `c_${Date.now()}`;
    // Find target product id matching selected name
    const matchProd = products.find(p => p.name === newCampaign.targetProduct) || products[0];

    // Create locally
    setCampaigns(prev => [...prev, {
      id: tempId,
      ...newCampaign,
      status: 'idle',
      progress: 0,
      currentStep: 'Pronto para iniciar'
    }]);

    // Save to Backend API
    try {
      await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampaign.name,
          segment: newCampaign.segment,
          countries: newCampaign.prospectingArea.countries,
          states: newCampaign.prospectingArea.states,
          cities: newCampaign.prospectingArea.cities,
          language: newCampaign.language,
          target_product_id: matchProd ? Number(matchProd.id) : 1,
          limit_daily: newCampaign.limitDaily
        })
      });
    } catch {
      console.log('Campaign saved in frontend sandbox mode');
    }

    setNewCampaign({
      name: '',
      segment: '',
      prospectingArea: { countries: [], states: [], cities: '' },
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
            <div className="w-9 h-9 rounded-lg bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/logo.png" alt="Scoutly Logo" className="w-full h-full object-cover" />
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

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                activeTab === 'logs'
                  ? 'bg-[#181825] text-white font-medium shadow-inner border-l-2 border-indigo-500'
                  : 'text-gray-400 hover:bg-[#11111B] hover:text-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Logs de Disparos</span>
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

                {/* A/B Copywriting Variant Comparison Card */}
                <div className="bg-[#0E0E18] border border-[#1C1C28] rounded-xl p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Performance de Teste A/B</h3>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">Ativo</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-[#12121E] border border-[#1F1F30]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white">Variante A (Pitch de Valor)</span>
                        <span className="text-[10px] text-indigo-400 font-bold">Conv. 14.5%</span>
                      </div>
                      <span className="text-[10px] text-gray-500">CTA de valor de negócio direto sugerindo ganhos de ROI no Vysify CRM.</span>
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#1C1C28]/50 text-left">
                        <div>
                          <span className="block text-[9px] text-gray-500 uppercase">Disparos</span>
                          <span className="text-xs font-semibold text-white">62 leads</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-gray-500 uppercase">Respostas</span>
                          <span className="text-xs font-semibold text-emerald-400">9 reuniões</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[#12121E] border border-[#1F1F30]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white">Variante B (Foco em Dor)</span>
                        <span className="text-[10px] text-indigo-400 font-bold">Conv. 22.8%</span>
                      </div>
                      <span className="text-[10px] text-gray-500">Abordagem consultiva focando no maior gargalo de funil que a empresa tem.</span>
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#1C1C28]/50 text-left">
                        <div>
                          <span className="block text-[9px] text-gray-500 uppercase">Disparos</span>
                          <span className="text-xs font-semibold text-white">57 leads</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-gray-500 uppercase">Respostas</span>
                          <span className="text-xs font-semibold text-emerald-400">13 reuniões</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('logs')} 
                    className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-semibold transition duration-200"
                  >
                    Análise e Logs de Disparos
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

                  <form onSubmit={handleCreateCampaign} className="space-y-5">
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

                    {/* ── GEO-TARGETING ── */}
                    <div className="border border-[#1F1F30] rounded-xl p-4 space-y-4 bg-[#0B0B12]">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">📍 Área de Prospecção</span>

                      {/* Countries */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-2">Países <span className="text-gray-600">(selecione um ou mais)</span></label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(COUNTRY_DATA).map(([code, { label, flag }]) => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => toggleCountry(code)}
                              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                                newCampaign.prospectingArea.countries.includes(code)
                                  ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-300'
                                  : 'bg-[#12121E] border-[#1F1F30] text-gray-400 hover:border-indigo-500/40 hover:text-gray-200'
                              }`}
                            >
                              <span>{flag}</span>
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* States - only shown when countries with states are selected */}
                      {availableStates.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-2">
                            Estado / Província <span className="text-gray-600">(opcional — sem seleção = âmbito nacional)</span>
                          </label>
                          <div className="max-h-36 overflow-y-auto pr-1 space-y-1 custom-scroll">
                            {newCampaign.prospectingArea.countries.map(code => (
                              COUNTRY_DATA[code]?.states.length ? (
                                <div key={code}>
                                  <span className="text-[10px] font-bold text-gray-600 uppercase block mb-1">{COUNTRY_DATA[code].flag} {COUNTRY_DATA[code].label}</span>
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {COUNTRY_DATA[code].states.map(state => (
                                      <button
                                        key={state}
                                        type="button"
                                        onClick={() => toggleState(state)}
                                        className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all duration-150 ${
                                          newCampaign.prospectingArea.states.includes(state)
                                            ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                                            : 'bg-[#0E0E18] border-[#1C1C28] text-gray-500 hover:text-gray-300 hover:border-indigo-500/30'
                                        }`}
                                      >
                                        {state}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : null
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cities */}
                      {newCampaign.prospectingArea.countries.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">
                            Cidades <span className="text-gray-600">(opcional, separadas por vírgula)</span>
                          </label>
                          <input 
                            type="text" 
                            value={newCampaign.prospectingArea.cities}
                            onChange={e => setNewCampaign({...newCampaign, prospectingArea: {...newCampaign.prospectingArea, cities: e.target.value}})}
                            placeholder="Ex: São Paulo, Campinas, Rio de Janeiro"
                            className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}

                      {/* Area Summary */}
                      {newCampaign.prospectingArea.countries.length > 0 && (
                        <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Escopo configurado</span>
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {buildRegionLabel(newCampaign.prospectingArea)}
                          </p>
                          {newCampaign.prospectingArea.states.length === 0 && (
                            <span className="text-[10px] text-amber-400 mt-1 block">⚠ Sem estado selecionado: agentes atuarão no país inteiro</span>
                          )}
                        </div>
                      )}
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
                        <option value="Alemão">Alemão</option>
                        <option value="Francês">Francês</option>
                      </select>
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
                      disabled={newCampaign.prospectingArea.countries.length === 0}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition duration-200 mt-2 shadow-lg shadow-indigo-500/20"
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
                            <span><strong>Região:</strong> {buildRegionLabel(camp.prospectingArea)}</span>
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
                      onClick={handleSaveProfile}
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

                    <div className="pt-4 border-t border-[#1C1C28]/50">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-4">🔗 Integrações e Leads Reais</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Apollo.io API Key (Busca de Leads)</label>
                      <input 
                        type="password" 
                        value={apiKeys.apollo}
                        onChange={e => setApiKeys({...apiKeys, apollo: e.target.value})}
                        placeholder="apikeys_..."
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Hunter.io API Key (Validação de E-mails)</label>
                      <input 
                        type="password" 
                        value={apiKeys.hunter}
                        onChange={e => setApiKeys({...apiKeys, hunter: e.target.value})}
                        placeholder="Hunter API Key..."
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Resend API Key (Infraestrutura de Disparo SMTP)</label>
                      <input 
                        type="password" 
                        value={apiKeys.resend}
                        onChange={e => setApiKeys({...apiKeys, resend: e.target.value})}
                        placeholder="re_..."
                        className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>

                    <div className="pt-4 border-t border-[#1C1C28]/50">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-4">💬 Mensageria Outbound</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">WhatsApp Token (Z-API / Evolution)</label>
                        <input 
                          type="password" 
                          value={apiKeys.whatsappToken}
                          onChange={e => setApiKeys({...apiKeys, whatsappToken: e.target.value})}
                          placeholder="Token da API..."
                          className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">WhatsApp URL da Instância</label>
                        <input 
                          type="text" 
                          value={apiKeys.whatsappInstance}
                          onChange={e => setApiKeys({...apiKeys, whatsappInstance: e.target.value})}
                          placeholder="https://api.evolution.com/v1"
                          className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Telegram Bot Token</label>
                        <input 
                          type="password" 
                          value={apiKeys.telegramToken}
                          onChange={e => setApiKeys({...apiKeys, telegramToken: e.target.value})}
                          placeholder="Bot Token..."
                          className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Telegram Chat ID / Canal</label>
                        <input 
                          type="text" 
                          value={apiKeys.telegramChatId}
                          onChange={e => setApiKeys({...apiKeys, telegramChatId: e.target.value})}
                          placeholder="@seu_chat_id"
                          className="w-full bg-[#12121E] border border-[#1F1F30] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#1C1C28]/50">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-4">💼 Automação Profissional (LinkedIn)</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">LinkedIn Cookie de Conexão (li_at)</label>
                      <input 
                        type="password" 
                        value={apiKeys.linkedinCookie}
                        onChange={e => setApiKeys({...apiKeys, linkedinCookie: e.target.value})}
                        placeholder="AQEDAR..."
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

          {/* OUTREACH LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Logs de Disparos Outbound</h2>
                  <p className="text-xs text-gray-400 mt-1">Monitore e acompanhe cada mensagem enviada, status de entrega e erros de API em tempo real.</p>
                </div>
              </div>

              <div className="bg-[#0D0D15] border border-[#1C1C28] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1C1C28] bg-[#0E0E18] text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Lead</th>
                        <th className="px-6 py-4">Destinatário</th>
                        <th className="px-6 py-4">Canal</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Mensagem Enviada</th>
                        <th className="px-6 py-4">Data/Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C1C28] text-xs text-gray-300">
                      {outreachLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                            Nenhuma atividade de disparo registrada até o momento.
                          </td>
                        </tr>
                      ) : (
                        outreachLogs.map(log => (
                          <tr key={log.id} className="hover:bg-[#11111B]/40 transition duration-150">
                            <td className="px-6 py-4 font-semibold text-white">
                              {log.lead?.companyName || 'Empresa Desconhecida'}
                              <span className="block text-[10px] text-gray-500 font-normal">{log.lead?.contactName || 'Sem Contato'}</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-gray-400">{log.recipient}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                log.channel === 'email' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                log.channel === 'whatsapp' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              }`}>
                                {log.channel}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {log.status === 'sent' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Sucesso
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20" title={log.error_message}>
                                  Falha
                                </span>
                              )}
                              {log.error_message && (
                                <span className="block text-[9px] text-red-400/80 mt-1 max-w-[150px] truncate">{log.error_message}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate italic text-gray-400" title={log.message_content}>
                              {log.message_content}
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {new Date(log.sent_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
