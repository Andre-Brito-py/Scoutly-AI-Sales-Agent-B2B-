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
  MessageSquare,
  Sparkles,
  Bot,
  Target,
  Eye,
  Calendar,
  Activity,
  ChevronRight,
  Send,
  X,
  AlertTriangle,
  Upload,
  Moon,
  Sun
} from 'lucide-react';

// --- TYPES ---
interface Product {
  id: string;
  name: string;
  description: string;
  features: string;
  targetBuyer: string;
  pricingPlans: string;
}

interface CompanyProfile {
  name: string;
  domain?: string;
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
  frequency: 'immediate' | 'daily';
  status: 'idle' | 'running' | 'completed';
  progress: number;
  currentStep: string;
  searchCriteria?: { channel?: 'email' | 'whatsapp' | 'telegram' };
  customInstructions?: string;
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
  email?: string;
  phone?: string;
  social?: string;
  importedAt?: string;
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

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────
const GlassCard = ({ children, className = '', glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) => (
  <div className={`relative rounded-[24px] bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 ${glow ? 'shadow-primary/20 border-primary/20' : ''} ${className}`}>
    {children}
  </div>
);

const NavItem = ({ icon: Icon, label, active, onClick, badge }: { icon: React.ComponentType<{ className?: string }>; label: string; active: boolean; onClick: () => void; badge?: React.ReactNode }) => (
  <button onClick={onClick}
    className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-xl text-[14px] font-bold tracking-wide transition-all duration-200 group relative ${
      active ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
    }`}>
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full shadow-md shadow-primary/30" />}
    <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
    <span className="flex-1 text-left">{label}</span>
    {badge}
  </button>
);

const ProgressBar = ({ value, color }: { value: number; color?: string }) => (
  <div className="w-full h-2 rounded-full overflow-hidden bg-slate-100">
    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color || '#6366f1' }} />
  </div>
);

const ScoreBadge = ({ score }: { score: number }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
    score >= 80 
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20' 
      : score >= 50 
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20' 
        : 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20'
  }`}>
    Score: {score}
  </span>
);

const StatusBadge = ({ status }: { status: string }) => {
  const labels: Record<string, { text: string; style: string }> = {
    found: { text: 'Encontrado', style: 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20' },
    enriched: { text: 'Enriquecido', style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
    sent: { text: 'Enviado', style: 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20' },
    opened: { text: 'Abriu', style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
    responded: { text: 'Respondeu', style: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
    booked: { text: 'Reunião', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20' },
    lost: { text: 'Perdido', style: 'bg-muted/50 text-muted-foreground border-border' }
  };
  const config = labels[status] || { text: status, style: 'bg-muted/50 text-muted-foreground border-border' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${config.style}`}>
      {config.text}
    </span>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem('scoutly_logged_in') === '1');
  const [inputPassword, setInputPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'crm' | 'products' | 'profile' | 'memory' | 'logs' | 'import'>('dashboard');
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
  const [isAgentWorking, setIsAgentWorking] = useState(false);
  const [agentStatusText, setAgentStatusText] = useState('');

  // --- CUTE AGENT ANIMATION COMPONENT ---
  const AgentWorkingOverlay = () => {
    if (!isAgentWorking) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-card border border-border p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center animate-in zoom-in duration-300">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative bg-indigo-600 w-24 h-24 rounded-full flex items-center justify-center shadow-lg border-4 border-background overflow-hidden">
              {/* Cute Robot Face */}
              <div className="flex flex-col items-center gap-1 mt-2">
                <div className="flex gap-3">
                  <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                </div>
                <div className="w-8 h-2 bg-white/50 rounded-full mt-2"></div>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-black text-foreground tracking-tight mb-2">Equipe de IA Trabalhando...</h3>
          <p className="text-sm text-muted-foreground font-semibold">{agentStatusText}</p>
          <div className="w-full bg-muted rounded-full h-1.5 mt-6 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse w-full"></div>
          </div>
        </div>
      </div>
    );
  };
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [scheduleLead, setScheduleLead] = useState<Lead | null>(null);
  const [scheduleData, setScheduleData] = useState({ date: '', time: '', platform: 'Google Meet', notes: '' });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('scoutly_theme') === 'dark' || 
      (!localStorage.getItem('scoutly_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('scoutly_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('scoutly_theme', 'light');
    }
  }, [isDarkMode]);

  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleLead) return;
    setLeads(prev => prev.map(l => l.id === scheduleLead.id ? { ...l, status: 'booked' } : l));
    setScheduleLead(null);
    alert(`Reunião agendada com sucesso com ${scheduleLead.contactName}!`);
  };

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

  const saveApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiKeys)
      });
      if (response.ok) {
        alert('Chaves de API salvas no servidor!');
      } else {
        alert('Erro ao salvar no servidor.');
      }
    } catch {
      alert('Erro de conexão ao salvar chaves.');
    }
  };

  // --- PERSISTED STATE / INITIAL SEEDS ---
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: '',
    domain: '',
    industry: '',
    description: '',
    valueProposition: '',
    targetAudience: '',
    brandVoice: ''
  });

  const [products, setProducts] = useState<Product[]>([]);


  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    features: '',
    targetBuyer: '',
    pricingPlans: ''
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

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [newCampaign, setNewCampaign] = useState<Omit<Campaign, 'id' | 'status' | 'progress' | 'currentStep'>>({
    name: '',
    segment: '',
    prospectingArea: { countries: [], states: [], cities: '' },
    language: 'Português',
    targetProduct: 'Scoutly Agent Core',
    limitDaily: 50,
    frequency: 'immediate',
    searchCriteria: { channel: 'email' },
    customInstructions: ''
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

  const [leads, setLeads] = useState<Lead[]>([]);
  const [aiMemory, setAiMemory] = useState<any[]>([]);

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
            domain: data.company_domain || '',
            industry: data.industry,
            description: data.description,
            valueProposition: data.value_proposition,
            targetAudience: data.target_audience,
            brandVoice: data.brand_voice
          });
        }
      })
      .catch(() => console.error('Erro ao carregar perfil.'));

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
            targetBuyer: p.target_buyer || '',
            pricingPlans: p.pricing_plans || ''
          })));
        }
      })
      .catch(() => console.error('Erro ao carregar produtos.'));

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
            targetProduct: c.target_product || 'Scoutly Agent Core',
            limitDaily: c.limit_daily,
            frequency: c.frequency || 'immediate',
            status: c.status,
            progress: c.progress,
            currentStep: c.current_step
          })));
        }
      })
      .catch(() => console.error('Erro ao carregar campanhas.'));

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
      .catch(() => console.error('Erro ao carregar leads.'));

    // Load Outreach Logs
    fetch(`${API_BASE}/outreach-logs`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOutreachLogs(data);
        }
      })
      .catch(() => console.error('Erro ao carregar outreach logs.'));

    // Load API Keys
    fetch(`${API_BASE}/keys`)
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setApiKeys({
            openai: data.openai || '',
            gemini: data.gemini || '',
            anthropic: data.anthropic || '',
            apollo: data.apollo || '',
            hunter: data.hunter || '',
            resend: data.resend || '',
            whatsappToken: data.whatsapp_token || '',
            whatsappInstance: data.whatsapp_instance || '',
            telegramToken: data.telegram_token || '',
            telegramChatId: data.telegram_chat_id || '',
            linkedinCookie: data.linkedin_cookie || ''
          });
        }
      })
      .catch(() => console.error('Erro ao carregar chaves de API.'));

    fetch(`${API_BASE}/memory`)
      .then(res => res.json())
      .then(data => setAiMemory(Array.isArray(data) ? data : []))
      .catch(() => console.error('Erro ao carregar memória.'));
  }, []);

  // Sync profile saving to backend
  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyProfile.name,
          company_domain: companyProfile.domain,
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
    const campToStart = campaigns.find(c => c.id === campaignId);
    if (!campToStart) return;

    // Optimistic UI update
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'running', progress: 5 } : c));
    setRunningCampaignId(campaignId);

    // Call Node.js Backend Engine
    try {
      await fetch(`${API_BASE}/campaigns/start`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaignId: campaignId,
          frequency: campToStart.frequency,
          searchCriteria: {
            segment: campToStart.segment,
            city: campToStart.prospectingArea.cities || 'São Paulo', // Default fallback
            channel: campToStart.searchCriteria?.channel || 'email',
            customInstructions: campToStart.customInstructions || ''
          }
        })
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
          target_buyer: newProduct.targetBuyer,
          pricing_plans: newProduct.pricingPlans
        })
      });
    } catch {
      console.log('Saved product in frontend sandbox');
    }

    setNewProduct({ name: '', description: '', features: '', targetBuyer: '', pricingPlans: '' });
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.segment || newCampaign.prospectingArea.countries.length === 0) return;

    const tempId = `c_${Date.now()}`;
    
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
          target_product: newCampaign.targetProduct,
          limit_daily: newCampaign.limitDaily,
          frequency: newCampaign.frequency,
          channel: newCampaign.searchCriteria?.channel,
          custom_instructions: newCampaign.customInstructions
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
      limitDaily: 50,
      frequency: 'immediate',
      searchCriteria: { channel: 'email' },
      customInstructions: ''
    });
    setActiveTab('campaigns');
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-6 relative overflow-hidden font-sans transition-colors duration-300">
        {/* Decorative Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="w-full max-w-md relative z-10">
          <GlassCard className="p-10 shadow-2xl shadow-primary/5 bg-card/80 backdrop-blur-xl animate-fadeIn" glow>
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-md shadow-primary/10">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">SCOUTLY</h1>
              <p className="text-xs text-primary font-bold tracking-[0.2em] uppercase mt-1">AI Revenue SDR Platform</p>
            </div>

            <form onSubmit={e => { e.preventDefault(); if (inputPassword === 'Guilmon@123') { sessionStorage.setItem('scoutly_logged_in', '1'); setIsLoggedIn(true); } else setLoginError(true); }}>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Senha de Acesso</label>
              <input
                type="password" value={inputPassword}
                onChange={e => { setInputPassword(e.target.value); setLoginError(false); }}
                placeholder="••••••••••"
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition mb-4 placeholder:text-muted-foreground"
                autoFocus
              />
              {loginError && <p className="text-destructive text-xs mb-4 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Senha incorreta. Tente novamente.</p>}
              <button type="submit" className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-bold transition-all duration-200 shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]">
                Entrar na Plataforma
              </button>
            </form>
            <p className="text-center text-[11px] text-muted-foreground mt-6 font-medium">Senha demo: <span className="text-foreground font-mono font-bold bg-muted px-1.5 py-0.5 rounded">Guilmon@123</span></p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans antialiased transition-colors duration-300">
      <AgentWorkingOverlay />

      {/* ════════════════ SIDEBAR ════════════════ */}
      <aside className="w-80 bg-card border-r border-border flex flex-col justify-between shrink-0 relative z-10 shadow-sm transition-colors duration-300">
        <div>
          {/* Logo */}
          <div className="px-7 py-7 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm relative shrink-0">
                  <Sparkles className="w-5 h-5 text-primary absolute animate-pulse" />
                </div>
                <div>
                  <div className="font-black text-xl tracking-widest text-foreground">SCOUTLY</div>
                  <div className="text-[9px] text-primary font-bold tracking-[0.25em] uppercase mt-0.5">AI Revenue SDR</div>
                </div>
              </div>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nav */}
          <div className="px-3 py-6 space-y-7">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] px-4 block mb-3">Visão Geral</span>
              <div className="space-y-1.5">
                <NavItem icon={TrendingUp} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavItem icon={Users} label="Pipeline & CRM" active={activeTab === 'crm'} onClick={() => setActiveTab('crm')} badge={<span className="ml-auto text-[10px] bg-slate-100 text-muted-foreground px-2 py-0.5 rounded-full font-bold border border-border/50">{leads.length}</span>} />
                <NavItem icon={MessageSquare} label="Logs de Disparo" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] px-4 block mb-3">Operação e Campanhas</span>
              <div className="space-y-1.5">
                <NavItem icon={Play} label="Campanhas IA" active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')} badge={runningCampaignId ? <span className="w-2 h-2 rounded-full bg-indigo-600 ml-auto animate-pulse" /> : undefined} />
                <NavItem icon={Upload} label="Importar Leads" active={activeTab === 'import'} onClick={() => setActiveTab('import')} />
                <NavItem icon={Package} label="Produtos" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] px-4 block mb-3">Ajustes & Inteligência</span>
              <div className="space-y-1.5">
                <NavItem icon={BrainCircuit} label="Memória & IA" active={activeTab === 'memory'} onClick={() => setActiveTab('memory')} />
                <NavItem icon={Building2} label="Perfil da Startup" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
              </div>
            </div>
          </div>
        </div>

        {/* User card */}
        <div className="px-4 py-6 border-t border-border bg-card">
          <div className="flex items-center space-x-3.5 p-4 rounded-xl bg-muted/50 border border-border shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-sm font-black text-white shadow-md shadow-primary/20 shrink-0">A</div>
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="text-sm font-bold text-foreground truncate">André</div>
              <div className="text-xs text-muted-foreground truncate mt-0.5">{companyProfile.name}</div>
            </div>
            <button onClick={() => { sessionStorage.removeItem('scoutly_logged_in'); setIsLoggedIn(false); }} className="text-xs text-primary hover:text-primary/80 font-bold transition ml-2 shrink-0">Sair</button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 bg-background transition-colors duration-300 relative">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        {/* TOP BAR */}
        <header className="h-24 border-b border-border px-10 flex items-center justify-between bg-card/50 backdrop-blur-md shrink-0 relative z-20 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-foreground tracking-tight uppercase">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'campaigns' && 'Campanhas Autônomas'}
              {activeTab === 'crm' && 'Pipeline & CRM'}
              {activeTab === 'products' && 'Catálogo de Produtos'}
              {activeTab === 'profile' && 'Configuração da Startup'}
              {activeTab === 'memory' && 'Memória & Aprendizado'}
              {activeTab === 'logs' && 'Logs de Disparos'}
              {activeTab === 'import' && 'Importar Leads'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3.5 py-2 rounded-full font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Agente Ativo
            </span>
            <span className="flex items-center gap-2 text-xs bg-primary/10 text-primary border border-primary/20 px-3.5 py-2 rounded-full font-bold shadow-sm">
              <BrainCircuit className="w-4 h-4 text-primary" />
              HybridScorer Online
            </span>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <div className="flex-1 overflow-y-auto p-10 bg-background/50">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-fadeIn">
              
              {/* Context Callout */}
              <GlassCard className="p-7 bg-primary/5 border border-primary/20 shadow-sm" glow={false}>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground tracking-wide">Contexto de Treinamento Ativo</h4>
                    <p className="text-xs text-muted-foreground mt-2 max-w-4xl leading-relaxed">
                      O Scoutly está configurado para prospectar no contexto de <strong className="text-foreground font-bold">{companyProfile.name}</strong> ({companyProfile.industry}), focando no produto <strong className="text-foreground font-bold">{products[0]?.name || 'Nenhum cadastrado'}</strong>. O motor de scoring <span className="text-primary font-bold">HybridScorer</span> combina regras personalizáveis com LLM para qualificar leads em tempo real.
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Empresas Encontradas', value: leads.length * 15, suffix: '', trend: '+12%', trendUp: true, icon: Target, color: '#6366f1' },
                  { label: 'Mensagens Enviadas', value: leads.filter(l => l.status !== 'found' && l.status !== 'enriched').length * 8, suffix: '', trend: 'Cadência IA', trendUp: true, icon: Send, color: '#4f46e5' },
                  { label: 'Taxa de Abertura', value: 74.2, suffix: '%', trend: '+4.1%', trendUp: true, icon: Eye, color: '#f59e0b' },
                  { label: 'Reuniões Agendadas', value: leads.filter(l => l.status === 'booked').length, suffix: '', trend: 'Conversão Ideal', trendUp: true, icon: Calendar, color: '#10b981' }
                ].map(({ label, value, suffix, trend, trendUp, icon: Icon, color }) => (
                  <GlassCard key={label} className="p-6 bg-card border border-border shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                        <Icon className="w-5.5 h-5.5" style={{ color }} />
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        trendUp ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {trend}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">{label}</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-black text-foreground tracking-tight">{value}</span>
                        {suffix && <span className="text-sm text-muted-foreground font-bold ml-0.5">{suffix}</span>}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>

              {/* Main Dashboard Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Active Agent Activity Feed */}
                <GlassCard className="lg:col-span-2 p-7 bg-card border border-border shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">Atividade do Agente em Tempo Real</h3>
                    <span className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1.5 rounded-full font-bold shadow-sm">
                      <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />Tempo Real
                    </span>
                  </div>

                  <div className="space-y-4">
                    {leads.slice(0, 3).map((lead) => (
                      <button key={lead.id} onClick={() => { setSelectedLead(lead); setActiveTab('crm'); }}
                        className="w-full p-5 rounded-2xl bg-muted/30 border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 flex items-center justify-between text-left group shadow-sm">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-foreground text-sm tracking-wide">{lead.companyName}</span>
                            <ScoreBadge score={lead.score} />
                          </div>
                          <span className="block text-xs text-muted-foreground mt-1 font-semibold">{lead.contactName} ({lead.contactRole})</span>
                          <p className="text-xs text-muted-foreground italic mt-2.5 line-clamp-1 leading-relaxed">"{lead.scoreReason}"</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <StatusBadge status={lead.status} />
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setActiveTab('crm')} 
                    className="mt-6 w-full text-center text-xs text-primary hover:text-primary/80 font-bold flex items-center justify-center space-x-1.5 transition"
                  >
                    <span>Ver Pipeline de Leads Completo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </GlassCard>

                {/* A/B Copywriting Variant Comparison Card */}
                <GlassCard className="p-7 bg-card border border-border shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">Performance de Teste A/B</h3>
                    <span className="text-[9px] bg-primary/10 text-primary font-extrabold px-2.5 py-1.5 rounded-full border border-primary/20 tracking-wider">ATIVO</span>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { label: 'Variante A', sublabel: 'Pitch de Valor', desc: 'CTA de valor de negócio direto sugerindo ganhos de ROI no Vysify CRM.', conv: 14.5, shots: 62, meetings: 9, winner: false },
                      { label: 'Variante B', sublabel: 'Foco em Dor', desc: 'Abordagem consultiva focando no maior gargalo de funil que a empresa tem.', conv: 22.8, shots: 57, meetings: 13, winner: true }
                    ].map(v => (
                      <div key={v.label} className={`p-5 rounded-2xl border transition-all duration-300 ${v.winner ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/30 border-border'}`}>
                        <div className="flex justify-between items-start mb-1.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">{v.label} ({v.sublabel})</span>
                              {v.winner && <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wide">Vencedor</span>}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 block leading-relaxed">{v.desc}</span>
                          </div>
                          <span className={`text-base font-black ${v.winner ? 'text-emerald-500' : 'text-foreground'}`}>{v.conv}%</span>
                        </div>
                        <div className="mt-3.5">
                          <ProgressBar value={v.conv * 4} color={v.winner ? '#10b981' : '#6366f1'} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-border/50 text-left">
                          <div>
                            <span className="block text-[9px] text-muted-foreground uppercase font-bold">Disparos</span>
                            <span className="text-xs font-bold text-foreground">{v.shots} leads</span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-muted-foreground uppercase font-bold">Respostas</span>
                            <span className="text-xs font-bold text-emerald-500">{v.meetings} reuniões</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setActiveTab('logs')} 
                    className="mt-6 w-full py-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 animate-pulse"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                    Análise e Logs de Disparos
                  </button>
                </GlassCard>

              </div>

            </div>
          )}

          {/* CAMPAIGNS TAB */}
          {activeTab === 'campaigns' && (
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-fadeIn">
              
              {/* Campaign Creation & Config */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Form */}
                <GlassCard className="p-7 ">
                  <h3 className="text-sm font-extrabold text-foreground mb-6 flex items-center space-x-2.5 uppercase tracking-wide">
                    <Plus className="w-4.5 h-4.5 text-indigo-600" />
                    <span>Nova Campanha Autônoma</span>
                  </h3>

                  <form onSubmit={handleCreateCampaign} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Nome da Campanha</label>
                      <input 
                        type="text" 
                        value={newCampaign.name}
                        onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                        placeholder="Ex: SaaS Growth São Paulo"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Segmento Alvo</label>
                      <input 
                        type="text" 
                        value={newCampaign.segment}
                        onChange={e => setNewCampaign({...newCampaign, segment: e.target.value})}
                        placeholder="Ex: Agências de Tecnologia, Clínicas Estéticas"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                        required
                      />
                    </div>

                    {/* ── GEO-TARGETING ── */}
                    <div className="border border-border rounded-2xl p-5 space-y-4 bg-muted/30/50">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">📍 Área de Prospecção</span>

                      {/* Countries */}
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-2.5">Países <span className="text-slate-400 font-medium">(selecione um ou mais)</span></label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(COUNTRY_DATA).map(([code, { label, flag }]) => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => toggleCountry(code)}
                              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-150 shadow-sm ${
                                newCampaign.prospectingArea.countries.includes(code)
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                  : 'bg-card border-border text-muted-foreground hover:border-slate-300 hover:text-foreground'
                              }`}
                            >
                              <span>{flag}</span>
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* States */}
                      {availableStates.length > 0 && (
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground mb-2.5">
                            Estado / Província <span className="text-slate-400 font-medium">(opcional)</span>
                          </label>
                          <div className="max-h-40 overflow-y-auto pr-1 space-y-3.5 custom-scroll">
                            {newCampaign.prospectingArea.countries.map(code => (
                              COUNTRY_DATA[code]?.states.length ? (
                                <div key={code} className="border-t border-border/60 pt-2.5 first:border-0 first:pt-0">
                                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-2">{COUNTRY_DATA[code].flag} {COUNTRY_DATA[code].label}</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {COUNTRY_DATA[code].states.map(state => (
                                      <button
                                        key={state}
                                        type="button"
                                        onClick={() => toggleState(state)}
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all duration-150 ${
                                          newCampaign.prospectingArea.states.includes(state)
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                            : 'bg-card border-border text-muted-foreground hover:text-foreground'
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
                          <label className="block text-xs font-bold text-muted-foreground mb-2.5">
                            Cidades <span className="text-slate-400 font-medium">(opcional, separadas por vírgula)</span>
                          </label>
                          <input 
                            type="text" 
                            value={newCampaign.prospectingArea.cities}
                            onChange={e => setNewCampaign({...newCampaign, prospectingArea: {...newCampaign.prospectingArea, cities: e.target.value}})}
                            placeholder="Ex: São Paulo, Campinas, Rio de Janeiro"
                            className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
                          />
                        </div>
                      )}

                      {/* Area Summary */}
                      {newCampaign.prospectingArea.countries.length > 0 && (
                        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 shadow-sm">
                          <span className="text-[10px] font-black text-indigo-600 uppercase block mb-1">Escopo configurado</span>
                          <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                            {buildRegionLabel(newCampaign.prospectingArea)}
                          </p>
                          {newCampaign.prospectingArea.states.length === 0 && (
                            <span className="text-[10px] text-amber-600 mt-1.5 block font-bold">⚠ Sem estado selecionado: agentes atuarão no país inteiro</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Idioma</label>
                        <select 
                          value={newCampaign.language}
                          onChange={e => setNewCampaign({...newCampaign, language: e.target.value})}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition"
                        >
                          <option value="Português">Português</option>
                          <option value="Inglês">Inglês</option>
                          <option value="Espanhol">Espanhol</option>
                          <option value="Alemão">Alemão</option>
                          <option value="Francês">Francês</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Canal Principal</label>
                        <select 
                          value={newCampaign.searchCriteria?.channel || 'email'}
                          onChange={e => setNewCampaign({
                            ...newCampaign, 
                            searchCriteria: {
                              ...newCampaign.searchCriteria!,
                              channel: e.target.value as 'email' | 'whatsapp' | 'telegram'
                            }
                          })}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition"
                        >
                          <option value="email">E-mail Corporativo</option>
                          <option value="whatsapp">WhatsApp (B2B)</option>
                          <option value="telegram">Telegram Direct</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Produto a Ser Divulgado</label>
                      <select 
                        value={newCampaign.targetProduct}
                        onChange={e => setNewCampaign({...newCampaign, targetProduct: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex justify-between">
                        Instruções Especiais / Promoções
                        <span className="text-indigo-500/70 lowercase font-semibold text-[10px]">Opcional</span>
                      </label>
                      <textarea 
                        rows={2}
                        value={newCampaign.customInstructions || ''}
                        onChange={e => setNewCampaign({...newCampaign, customInstructions: e.target.value})}
                        placeholder="Ex: Estamos na Black Friday, ofereça 50% de desconto usando o cupom BLACK50"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Limite Diário</label>
                        <input 
                          type="number" 
                          value={newCampaign.limitDaily}
                          onChange={e => setNewCampaign({...newCampaign, limitDaily: parseInt(e.target.value) || 50})}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Frequência</label>
                        <select 
                          value={newCampaign.frequency}
                          onChange={e => setNewCampaign({...newCampaign, frequency: e.target.value as 'immediate' | 'daily'})}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition"
                        >
                          <option value="immediate">Rodar Agora (1x)</option>
                          <option value="daily">Job Diário (Autônomo)</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={newCampaign.prospectingArea.countries.length === 0}
                      className="w-full py-3.5 bg-[#0F172A] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all duration-200 mt-2 shadow-md shadow-slate-900/10 flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 text-white" />
                      Criar Campanha
                    </button>
                  </form>
                </GlassCard>

                {/* Campaigns List */}
                <div className="lg:col-span-2 space-y-5">
                  {campaigns.map(camp => (
                    <GlassCard key={camp.id} className="p-7 ">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h4 className="font-extrabold text-foreground text-sm tracking-wide">{camp.name}</h4>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider ${
                              camp.status === 'running' 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                                : camp.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-slate-100 text-muted-foreground border-border'
                            }`}>
                              {camp.status === 'running' ? 'Executando' : camp.status === 'completed' ? 'Finalizada' : 'Aguardando'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground font-semibold">
                            <span><strong>Segmento:</strong> {camp.segment}</span>
                            <span><strong>Região:</strong> {buildRegionLabel(camp.prospectingArea)}</span>
                            <span><strong>Produto:</strong> {camp.targetProduct}</span>
                          </div>
                        </div>

                        {camp.status === 'idle' && (
                          <button 
                            onClick={() => startCampaign(camp.id)}
                            className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
                          >
                            <Play className="w-3 h-3 text-white" />
                            <span>Iniciar</span>
                          </button>
                        )}
                      </div>

                      {/* Progress bar / AI output */}
                      {(camp.status === 'running' || camp.status === 'completed') && (
                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <div className="flex justify-between text-xs text-muted-foreground mb-2.5 font-bold">
                            <span className="flex items-center space-x-1.5 text-indigo-600">
                              {camp.status === 'running' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              <span>{camp.currentStep}</span>
                            </span>
                            <span>{camp.progress}%</span>
                          </div>
                          <ProgressBar value={camp.progress} color={camp.status === 'completed' ? '#10b981' : '#6366f1'} />
                        </div>
                      )}
                    </GlassCard>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* CRM PIPELINE TAB */}
          {activeTab === 'crm' && (
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center bg-card border border-border rounded-2xl p-7 shadow-sm">
                <div>
                  <h3 className="text-base font-extrabold text-foreground tracking-tight uppercase">Pipeline de Vendas Automatizado</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 font-semibold">Gerencie e qualifique cada lead prospectado pela IA em tempo real.</p>
                </div>
                <div className="text-xs text-muted-foreground font-bold bg-slate-100/80 border border-border/50 px-4 py-2.5 rounded-xl shadow-sm">
                  💡 Clique em um lead para visualizar a personalização da IA
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                
                {/* Column 1: Encontrados */}
                <div className="space-y-4 bg-muted/30/70 p-4.5 rounded-2xl border border-border/50 min-h-[600px] flex flex-col shadow-sm">
                  <div className="flex justify-between items-center bg-card px-4 py-3 rounded-xl border border-border shadow-sm border-l-4 border-blue-500">
                    <span className="text-xs font-bold text-slate-700">Encontrados</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100 font-black">
                      {leads.filter(l => l.status === 'found' || l.status === 'enriched').length}
                    </span>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[680px] pr-1">
                    {leads.filter(l => l.status === 'found' || l.status === 'enriched').map(lead => (
                      <button key={lead.id} onClick={() => setSelectedLead(lead)}
                        className="w-full text-left p-4.5 bg-card border border-border hover:border-blue-400 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 block group">
                        <span className="block text-xs font-extrabold text-foreground group-hover:text-blue-600 transition-colors">{lead.companyName}</span>
                        <span className="block text-[10px] text-slate-400 font-semibold mt-1.5">{lead.contactRole || 'Sem contato identificado'}</span>
                        <div className="flex justify-between items-center mt-4">
                          <ScoreBadge score={lead.score} />
                          <span className="text-[10px] text-slate-400 font-mono font-bold truncate max-w-[110px]">{lead.website.replace('https://', '').replace('www.', '')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 2: Outreach */}
                <div className="space-y-4 bg-muted/30/70 p-4.5 rounded-2xl border border-border/50 min-h-[600px] flex flex-col shadow-sm">
                  <div className="flex justify-between items-center bg-card px-4 py-3 rounded-xl border border-border shadow-sm border-l-4 border-indigo-500">
                    <span className="text-xs font-bold text-slate-700">Outreach / Enviado</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100 font-black">
                      {leads.filter(l => l.status === 'sent' || l.status === 'opened').length}
                    </span>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[680px] pr-1">
                    {leads.filter(l => l.status === 'sent' || l.status === 'opened').map(lead => (
                      <button key={lead.id} onClick={() => setSelectedLead(lead)}
                        className="w-full text-left p-4.5 bg-card border border-border hover:border-indigo-400 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 block group">
                        <span className="block text-xs font-extrabold text-foreground group-hover:text-indigo-600 transition-colors">{lead.companyName}</span>
                        <span className="block text-[10px] text-slate-400 font-semibold mt-1.5">{lead.contactName}</span>
                        <div className="mt-2.5 p-3.5 bg-muted/30 border border-slate-100 rounded-xl text-[10px] text-muted-foreground leading-normal italic line-clamp-2">
                          "{lead.personalizedMessage}"
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <ScoreBadge score={lead.score} />
                          <span className="text-[10px] text-indigo-600 font-bold uppercase">{lead.status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 3: Respondido */}
                <div className="space-y-4 bg-muted/30/70 p-4.5 rounded-2xl border border-border/50 min-h-[600px] flex flex-col shadow-sm">
                  <div className="flex justify-between items-center bg-card px-4 py-3 rounded-xl border border-border shadow-sm border-l-4 border-amber-500">
                    <span className="text-xs font-bold text-slate-700">Respondido</span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-100 font-black">
                      {leads.filter(l => l.status === 'responded').length}
                    </span>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[680px] pr-1">
                    {leads.filter(l => l.status === 'responded').map(lead => (
                      <button key={lead.id} onClick={() => setSelectedLead(lead)}
                        className="w-full text-left p-4.5 bg-card border border-border hover:border-amber-400 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 block group">
                        <span className="block text-xs font-extrabold text-foreground group-hover:text-amber-600 transition-colors">{lead.companyName}</span>
                        <span className="block text-[10px] text-slate-400 font-semibold mt-1.5">{lead.contactName}</span>
                        <div className="mt-2.5 p-3.5 bg-muted/30 border border-slate-100 rounded-xl text-[10px] text-muted-foreground leading-normal italic line-clamp-2">
                          "{lead.personalizedMessage}"
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <ScoreBadge score={lead.score} />
                          <span className="text-[10px] text-amber-600 font-bold uppercase">Respondeu</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 4: Reunião Marcada */}
                <div className="space-y-4 bg-muted/30/70 p-4.5 rounded-2xl border border-border/50 min-h-[600px] flex flex-col shadow-sm">
                  <div className="flex justify-between items-center bg-card px-4 py-3 rounded-xl border border-border shadow-sm border-l-4 border-emerald-500">
                    <span className="text-xs font-bold text-slate-700">Reunião (Meeting)</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100 font-black">
                      {leads.filter(l => l.status === 'booked').length}
                    </span>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[680px] pr-1">
                    {leads.filter(l => l.status === 'booked').map(lead => (
                      <button key={lead.id} onClick={() => setSelectedLead(lead)}
                        className="w-full text-left p-4.5 bg-card border border-border hover:border-emerald-400 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 block group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-full blur-sm" />
                        <span className="block text-xs font-extrabold text-foreground group-hover:text-emerald-600 transition-colors">{lead.companyName}</span>
                        <span className="block text-[10px] text-slate-400 font-semibold mt-1.5">{lead.contactName} ({lead.contactRole})</span>
                        <div className="mt-2.5 p-3.5 bg-muted/30 border border-slate-100 rounded-xl text-[10px] text-muted-foreground leading-normal italic line-clamp-2">
                          "{lead.personalizedMessage}"
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <ScoreBadge score={lead.score} />
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Marcada
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-fadeIn">
              
              <GlassCard className="p-6 bg-indigo-50/40 border border-indigo-100/65 flex items-start gap-5 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200/50 flex items-center justify-center shrink-0 shadow-sm">
                  <Package className="w-5.5 h-5.5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Treinamento do Produto</h4>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-semibold">
                    Cadastre os produtos e serviços que sua startup comercializa. O Agente Redator irá minerar esses recursos, listando as principais funcionalidades e a dor que cada uma resolve para escrever mensagens altamente personalizadas para o Lead.
                  </p>
                </div>
              </GlassCard>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Form to Add Product */}
                <GlassCard className="p-7 ">
                  <h3 className="text-sm font-extrabold text-foreground mb-6 uppercase tracking-wide">Adicionar Novo Produto</h3>
                  
                  <form onSubmit={handleAddProduct} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Nome do Produto</label>
                      <input 
                        type="text" 
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        placeholder="Ex: Scoutly Enterprise API"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Descrição Comercial</label>
                      <textarea 
                        rows={3}
                        value={newProduct.description}
                        onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                        placeholder="Explique o que o produto faz..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Funcionalidades Principais</label>
                      <textarea 
                        rows={2}
                        value={newProduct.features}
                        onChange={e => setNewProduct({...newProduct, features: e.target.value})}
                        placeholder="Ex: Dashboard de métricas, integração HubSpot, etc."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Perfil do Comprador Ideal (Persona)</label>
                      <input 
                        type="text" 
                        value={newProduct.targetBuyer}
                        onChange={e => setNewProduct({...newProduct, targetBuyer: e.target.value})}
                        placeholder="Ex: VPs de Vendas, CMOs, CEOs"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Planos & Preços (Explicativo para IA)</label>
                      <textarea 
                        rows={2}
                        value={newProduct.pricingPlans}
                        onChange={e => setNewProduct({...newProduct, pricingPlans: e.target.value})}
                        placeholder="Ex: Starter: R$ 99/mês (5 funis), Pro: R$ 249/mês (ilimitado)"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all duration-200 shadow-md shadow-slate-900/10"
                    >
                      Salvar Produto
                    </button>
                  </form>
                </GlassCard>

                {/* Products List */}
                <div className="lg:col-span-2 space-y-5">
                  {products.map(prod => (
                    <GlassCard key={prod.id} className="p-7 ">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-foreground text-base">{prod.name}</h4>
                          <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block mt-1.5">
                            Persona Alvo: {prod.targetBuyer}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-4 leading-relaxed font-semibold">
                        {prod.description}
                      </p>

                      {prod.pricingPlans && (
                        <div className="mt-4 p-4 rounded-xl bg-background border border-border/80 text-xs">
                          <span className="font-bold text-foreground block mb-1.5">💰 Planos & Valores Cadastrados:</span>
                          <span className="text-muted-foreground block leading-relaxed font-semibold">{prod.pricingPlans}</span>
                        </div>
                      )}

                      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                        {prod.features.split(',').map((f, i) => (
                          <span key={i} className="text-xs bg-slate-100 border border-border text-slate-650 px-3 py-1 rounded-full font-bold">
                            {f.trim()}
                          </span>
                        ))}
                      </div>
                    </GlassCard>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* PROFILE / SETTINGS TAB */}
          {activeTab === 'profile' && (
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-fadeIn">
              
              <GlassCard className="p-6 bg-indigo-50/40 border border-indigo-100/65 flex items-start gap-5 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200/50 flex items-center justify-center shrink-0 shadow-sm">
                  <Building2 className="w-5.5 h-5.5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Instruções de Marca e Filosofia</h4>
                  <p className="text-xs text-slate-650 mt-2 leading-relaxed font-semibold">
                    Configure os dados fundamentais sobre a sua empresa/startup. Essas informações funcionam como as "diretrizes de contexto" (Knowledge Base) para as ferramentas de IA, moldando como elas definem objeções e se portam em conversas.
                  </p>
                </div>
              </GlassCard>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Profile Form */}
                <GlassCard className="p-8 ">
                  <h3 className="text-sm font-extrabold text-foreground mb-6 uppercase tracking-wide">Cadastro da Startup (Treinamento do Agente)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Nome da Startup / Empresa</label>
                      <input 
                        type="text" 
                        value={companyProfile.name}
                        onChange={e => setCompanyProfile({...companyProfile, name: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Domínio do Negócio (Opcional)</label>
                      <input 
                        type="text" 
                        value={companyProfile.domain}
                        onChange={e => setCompanyProfile({...companyProfile, domain: e.target.value})}
                        placeholder="https://vysify.com"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Mercado / Segmento</label>
                      <input 
                        type="text" 
                        value={companyProfile.industry}
                        onChange={e => setCompanyProfile({...companyProfile, industry: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">O que a Empresa faz? (Explicação Geral)</label>
                      <textarea 
                        rows={3}
                        value={companyProfile.description}
                        onChange={e => setCompanyProfile({...companyProfile, description: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Proposta de Valor Principal</label>
                      <textarea 
                        rows={2}
                        value={companyProfile.valueProposition}
                        onChange={e => setCompanyProfile({...companyProfile, valueProposition: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Público-Alvo Ideal</label>
                      <input 
                        type="text" 
                        value={companyProfile.targetAudience}
                        onChange={e => setCompanyProfile({...companyProfile, targetAudience: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tom de Voz da IA</label>
                      <input 
                        type="text" 
                        value={companyProfile.brandVoice}
                        onChange={e => setCompanyProfile({...companyProfile, brandVoice: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={handleSaveProfile}
                      className="px-6 py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-slate-900/10"
                    >
                      Salvar Configurações & Atualizar Agentes
                    </button>
                  </div>
                </GlassCard>

                {/* API Keys Form */}
                <GlassCard className="p-8 ">
                  <h3 className="text-sm font-extrabold text-foreground mb-4 uppercase tracking-wide">Credenciais & Chaves de API (Salvas localmente)</h3>
                  <p className="text-xs text-muted-foreground mb-6 leading-relaxed font-semibold">
                    Insira as chaves dos modelos de linguagem que deseja utilizar. Elas são armazenadas apenas no seu navegador (localStorage) e enviadas nas requisições sem persistir no servidor.
                  </p>

                  <form onSubmit={saveApiKeys} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">OpenAI API Key</label>
                      <input 
                        type="password" 
                        value={apiKeys.openai}
                        onChange={e => setApiKeys({...apiKeys, openai: e.target.value})}
                        placeholder="sk-..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Gemini API Key</label>
                      <input 
                        type="password" 
                        value={apiKeys.gemini}
                        onChange={e => setApiKeys({...apiKeys, gemini: e.target.value})}
                        placeholder="AIzaSy..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Anthropic Claude Key</label>
                      <input 
                        type="password" 
                        value={apiKeys.anthropic}
                        onChange={e => setApiKeys({...apiKeys, anthropic: e.target.value})}
                        placeholder="sk-ant-..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-4">🔗 Integrações e Leads Reais</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Apollo.io API Key (Busca de Leads)</label>
                      <input 
                        type="password" 
                        value={apiKeys.apollo}
                        onChange={e => setApiKeys({...apiKeys, apollo: e.target.value})}
                        placeholder="apikeys_..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Hunter.io API Key (Validação de E-mails)</label>
                      <input 
                        type="password" 
                        value={apiKeys.hunter}
                        onChange={e => setApiKeys({...apiKeys, hunter: e.target.value})}
                        placeholder="Hunter API Key..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Resend API Key (Infraestrutura de Disparo SMTP)</label>
                      <input 
                        type="password" 
                        value={apiKeys.resend}
                        onChange={e => setApiKeys({...apiKeys, resend: e.target.value})}
                        placeholder="re_..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-4">💬 Mensageria Outbound</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">WhatsApp Token (Z-API / Evolution)</label>
                        <input 
                          type="password" 
                          value={apiKeys.whatsappToken}
                          onChange={e => setApiKeys({...apiKeys, whatsappToken: e.target.value})}
                          placeholder="Token da API..."
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">WhatsApp URL da Instância</label>
                        <input 
                          type="text" 
                          value={apiKeys.whatsappInstance}
                          onChange={e => setApiKeys({...apiKeys, whatsappInstance: e.target.value})}
                          placeholder="https://api.evolution.com/v1"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Telegram Bot Token</label>
                        <input 
                          type="password" 
                          value={apiKeys.telegramToken}
                          onChange={e => setApiKeys({...apiKeys, telegramToken: e.target.value})}
                          placeholder="Bot Token..."
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Telegram Chat ID / Canal</label>
                        <input 
                          type="text" 
                          value={apiKeys.telegramChatId}
                          onChange={e => setApiKeys({...apiKeys, telegramChatId: e.target.value})}
                          placeholder="@seu_chat_id"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-4">🔗 Automação Profissional (LinkedIn)</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">LinkedIn Cookie (li_at)</label>
                      <input 
                        type="password" 
                        value={apiKeys.linkedinCookie}
                        onChange={e => setApiKeys({...apiKeys, linkedinCookie: e.target.value})}
                        placeholder="AQEDAR..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                      />
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                      <button 
                        type="submit"
                        className="px-6 py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition shadow-md shadow-slate-900/10"
                      >
                        Salvar Chaves de API
                      </button>
                    </div>
                  </form>
                </GlassCard>

              </div>

            </div>
          )}

          {/* MEMORY TAB */}
          {activeTab === 'memory' && (
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-fadeIn">
              <GlassCard className="p-6 bg-indigo-50/40 border border-indigo-100/65 flex items-start gap-5 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200/50 flex items-center justify-center shrink-0 shadow-sm">
                  <BrainCircuit className="w-5.5 h-5.5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Memória de Conversão & Vetores</h4>
                  <p className="text-xs text-slate-650 mt-2 leading-relaxed font-semibold">
                    O Scoutly analisa as conversas passadas que geraram reuniões marcadas para retroalimentar seu modelo RAG de prospecção.
                  </p>
                </div>
              </GlassCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GlassCard className="p-7 ">
                  <h4 className="text-sm font-extrabold text-foreground mb-5 flex items-center space-x-2.5 uppercase tracking-wide">
                    <ThumbsUp className="w-4.5 h-4.5 text-emerald-600" />
                    <span>Abordagens de Alto Impacto (Retidas)</span>
                  </h4>
                  <div className="space-y-3.5">
                    {aiMemory.filter(m => m.type === 'approach').length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Nenhuma abordagem retida ainda.</p>
                    ) : (
                        aiMemory.filter(m => m.type === 'approach').map(m => (
                            <div key={m.id} className="p-5 rounded-2xl bg-background border border-border/80">
                              <span className="text-[10px] text-emerald-600 font-bold uppercase">Abordagem Vencedora</span>
                              <p className="text-xs text-muted-foreground mt-2.5 italic leading-relaxed font-semibold">
                                "{m.content}"
                              </p>
                              <span className="block text-[10px] text-slate-400 mt-2.5 font-bold">{m.context} • {new Date(m.created_at).toLocaleDateString()}</span>
                            </div>
                        ))
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-7 ">
                  <h4 className="text-sm font-extrabold text-foreground mb-5 flex items-center space-x-2.5 uppercase tracking-wide">
                    <History className="w-4.5 h-4.5 text-indigo-600" />
                    <span>Insights de Aprendizado Autônomo</span>
                  </h4>
                  <div className="space-y-3.5 text-xs text-muted-foreground font-semibold leading-relaxed">
                    {aiMemory.filter(m => m.type === 'insight').length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Nenhum insight gerado ainda.</p>
                    ) : (
                        aiMemory.filter(m => m.type === 'insight').map(m => (
                            <div key={m.id} className="p-4 bg-background border border-border rounded-2xl">
                              🟢 <strong>Nova Regra:</strong> {m.content}
                              <span className="block text-[10px] text-slate-400 mt-2 font-bold">{m.context}</span>
                            </div>
                        ))
                    )}
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {/* OUTREACH LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-xl font-extrabold text-foreground tracking-tight uppercase">Logs de Disparos Outbound</h2>
                <p className="text-xs text-muted-foreground mt-1.5 font-semibold">Monitore e acompanhe cada mensagem enviada, status de entrega e erros de API em tempo real.</p>
              </div>

              <GlassCard className=" overflow-hidden" glow={false}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                        <th className="px-6 py-4.5">Lead</th>
                        <th className="px-6 py-4.5">Destinatário</th>
                        <th className="px-6 py-4.5">Canal</th>
                        <th className="px-6 py-4.5">Status</th>
                        <th className="px-6 py-4.5">Mensagem Enviada</th>
                        <th className="px-6 py-4.5">Data/Hora</th>
                        <th className="px-6 py-4.5">Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-650 font-semibold">
                      {outreachLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic">
                            Nenhuma atividade de disparo registrada até o momento.
                          </td>
                        </tr>
                      ) : (
                        outreachLogs.map(log => (
                          <tr key={log.id} className="hover:bg-muted/30/50 transition duration-150">
                            <td className="px-6 py-4.5 font-bold text-foreground">
                              {log.lead?.companyName || 'Empresa Desconhecida'}
                              <span className="block text-[10px] text-slate-400 font-semibold">{log.lead?.contactName || 'Sem Contato'}</span>
                            </td>
                            <td className="px-6 py-4.5 font-mono text-muted-foreground">{log.recipient}</td>
                            <td className="px-6 py-4.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                log.channel === 'email' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                log.channel === 'whatsapp' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                'bg-sky-50 text-sky-700 border border-sky-100'
                              }`}>
                                {log.channel}
                              </span>
                            </td>
                            <td className="px-6 py-4.5">
                              {log.status === 'sent' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  Sucesso
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100" title={log.error_message}>
                                  Falha
                                </span>
                              )}
                              {log.error_message && (
                                <span className="block text-[9px] text-red-600 mt-1.5 max-w-[150px] truncate">{log.error_message}</span>
                              )}
                            </td>
                            <td className="px-6 py-4.5 max-w-xs truncate italic text-muted-foreground" title={log.message_content}>
                              {log.message_content}
                            </td>
                            <td className="px-6 py-4.5 text-slate-400 font-semibold">
                              {new Date(log.sent_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4.5 text-right">
                                <button 
                                    onClick={() => {
                                        fetch(`${API_BASE}/memory/learn`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                leadId: log.lead_id,
                                                companyName: log.lead?.companyName || 'Empresa',
                                                messageContent: log.message_content
                                            })
                                        }).then(res => res.json()).then(() => {
                                            alert('O Agente de IA analisou essa mensagem e aprendeu o padrão de sucesso!');
                                            fetch(`${API_BASE}/memory`).then(r => r.json()).then(data => setAiMemory(data));
                                        });
                                    }}
                                    className="p-1.5 rounded-md hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                                    title="Marcar como Sucesso / Ensinar IA"
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          )}

          {/* IMPORT LEADS TAB */}
          {activeTab === 'import' && (
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-fadeIn">
              <GlassCard className="p-7 ">
                <div className="flex items-start gap-5 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200/50 flex items-center justify-center shrink-0 shadow-sm">
                    <Upload className="w-5.5 h-5.5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wide">Importação Rápida de Leads</h3>
                    <p className="text-xs text-muted-foreground mt-2 font-semibold">Coloque leads individuais ou simule para testar as regras do scoring.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Form */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Nome da Empresa</label>
                      <input 
                        type="text" 
                        id="import-companyName"
                        placeholder="Ex: ACME Corporation"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Site da Empresa</label>
                      <input 
                        type="text" 
                        id="import-website"
                        placeholder="Ex: https://acme.com"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Nome do Decisor</label>
                        <input 
                          type="text" 
                          id="import-contactName"
                          placeholder="Ex: André Silva"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Cargo</label>
                        <input 
                          type="text" 
                          id="import-contactRole"
                          placeholder="Ex: Diretor de Vendas"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={async () => {
                        const comp = (document.getElementById('import-companyName') as HTMLInputElement)?.value;
                        const web = (document.getElementById('import-website') as HTMLInputElement)?.value;
                        const name = (document.getElementById('import-contactName') as HTMLInputElement)?.value;
                        const role = (document.getElementById('import-contactRole') as HTMLInputElement)?.value;

                        if (!comp || !web) {
                          alert('Por favor, informe pelo menos o Nome da Empresa e o Site.');
                          return;
                        }

                        const newL: Lead = {
                          id: 'l' + Date.now(),
                          companyName: comp,
                          contactName: name || 'Decisor Indefinido',
                          contactRole: role || 'Gestor',
                          email: `contato@${web.replace('https://','').replace('http://','').replace('www.','')}`,
                          phone: '+55 11 99999-9999',
                          website: web,
                          score: 0,
                          scoreReason: 'Aguardando avaliação da IA...',
                          personalizedMessage: 'Gerando mensagem...',
                          status: 'found',
                          importedAt: new Date().toISOString()
                        };

                        setLeads(prev => [newL, ...prev]);
                        
                        try {
                          // Inicia animação
                          setIsAgentWorking(true);
                          setAgentStatusText('Iniciando o Research Agent (Mineração)...');
                          
                          // Salva o lead no Banco de Dados SQLite
                          await fetch(API_BASE + '/leads', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newL)
                          });

                          setAgentStatusText('Company Intelligence Agent lendo o site...');

                          // Chama a rota de Score da IA
                          const res = await fetch(API_BASE + '/score', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newL)
                          });
                          const aiResult = await res.json();
                          
                          setAgentStatusText('Pain Finder e Copywriter finalizando dossiê...');
                          
                          // Atualiza o estado com a resposta da IA
                          setLeads(prev => prev.map(l => l.id === newL.id ? {
                            ...l,
                            score: aiResult.score,
                            scoreReason: aiResult.reason,
                            personalizedMessage: aiResult.message,
                            status: 'enriched'
                          } : l));
                          
                          setIsAgentWorking(false);
                        } catch(e) {
                          console.error(e);
                          setIsAgentWorking(false);
                          alert('Erro ao processar o lead pela IA.');
                        }
                        setActiveTab('crm');

                        // limpa
                        if (document.getElementById('import-companyName')) (document.getElementById('import-companyName') as HTMLInputElement).value = '';
                        if (document.getElementById('import-website')) (document.getElementById('import-website') as HTMLInputElement).value = '';
                        if (document.getElementById('import-contactName')) (document.getElementById('import-contactName') as HTMLInputElement).value = '';
                        if (document.getElementById('import-contactRole')) (document.getElementById('import-contactRole') as HTMLInputElement).value = '';
                      }}
                      className="w-full py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition shadow-md shadow-slate-900/10"
                    >
                      Processar & Adicionar ao CRM
                    </button>
                  </div>

                  <div className="bg-background border border-border rounded-2xl p-7 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-2.5">Simulação em Lote via Planilha</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                        Para operações profissionais de escala, você pode importar suas listas mineradas via Excel ou Apollo em lote.
                      </p>
                      
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center bg-card mt-6 shadow-sm">
                        <Upload className="w-9 h-9 text-slate-400 mx-auto mb-3" />
                        <span className="block text-xs font-bold text-slate-700">Arraste seu arquivo .CSV ou .XLSX</span>
                        <span className="block text-[10px] text-slate-400 mt-1.5 font-semibold">Limite máximo de 5.000 linhas por lote</span>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        alert('Esta ação simula o processamento de 25 novos leads qualificados via Apollo.io!');
                        const simulated: Lead[] = [
                          {
                            id: 'sim-1',
                            companyName: 'TechSolutions Global',
                            contactName: 'Carlos Eduardo',
                            contactRole: 'CTO',
                            email: 'carlos@techsolutions.com',
                            phone: '+55 11 98888-7777',
                            website: 'https://techsolutions.com',
                            score: 94,
                            scoreReason: 'Empresa em alto crescimento no segmento de tecnologia e desenvolvimento de software, com decisor de compras direto.',
                            personalizedMessage: 'Olá Carlos, tudo bem? Vi que a TechSolutions tem expandido o time técnico. Nossa infraestrutura de vendas corporativas ajuda times a escalarem a entrega de software sem gargalos.',
                            status: 'found',
                            importedAt: new Date().toISOString()
                          },
                          {
                            id: 'sim-2',
                            companyName: 'Fintech Spark',
                            contactName: 'Luciana Mello',
                            contactRole: 'Head de Vendas',
                            email: 'luciana@fintechspark.com',
                            phone: '+55 11 97777-6666',
                            website: 'https://fintechspark.io',
                            score: 87,
                            scoreReason: 'Fintech buscando automação de processos comerciais. Persona de vendas exata do Vysify.',
                            personalizedMessage: 'Olá Luciana, vi seu foco no crescimento da Spark Fintech. Nós desenvolvemos soluções exclusivas que cortam o tempo operacional das mesas de SDR em até 40%.',
                            status: 'found',
                            importedAt: new Date().toISOString()
                          }
                        ];
                        setLeads(prev => [...simulated, ...prev]);
                        setActiveTab('crm');
                      }}
                      className="mt-6 w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-350 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-muted-foreground" />
                      Simular Importação Apollo.io (Leads Mock)
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Lead Detail / AI Intelligence Modal */}
          {selectedLead && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <GlassCard className="shadow-xl rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-muted-foreground transition"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-foreground tracking-tight">{selectedLead.companyName}</h3>
                  <ScoreBadge score={selectedLead.score} />
                </div>
                <span className="text-xs text-slate-400 font-bold block mt-1">{selectedLead.website}</span>

                <div className="mt-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/30 rounded-xl border border-border">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Decisor de Compra</span>
                      <span className="text-xs font-bold text-slate-700 block mt-1">{selectedLead.contactName}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">{selectedLead.contactRole || 'Gestor'}</span>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-xl border border-border">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Contato</span>
                      <span className="text-xs font-bold text-slate-700 block mt-1">{selectedLead.email}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">{selectedLead.phone || 'Sem telefone'}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Parecer e Qualificação da IA</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl font-semibold">
                      {selectedLead.scoreReason}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Mensagem Outbound Personalizada</h4>
                    <div className="text-xs text-slate-700 leading-normal bg-background border border-border p-3.5 rounded-xl italic font-semibold whitespace-pre-line">
                      "{selectedLead.personalizedMessage}"
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between gap-3">
                  <button 
                    onClick={() => {
                      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: 'lost' } : l));
                      setSelectedLead(null);
                    }}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Marcar como Perdido
                  </button>

                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          await fetch(API_BASE + '/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              lead_id: selectedLead.id,
                              channel: 'email',
                              recipient: selectedLead.email,
                              subject: 'Explorando sinergias com a ' + selectedLead.companyName,
                              message_content: selectedLead.personalizedMessage,
                              campaign_id: 'c1' // placeholder
                            })
                          });
                          alert('E-mail disparado com sucesso via Resend!');
                          setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: 'sent' } : l));
                          setSelectedLead(null);
                        } catch(e) { alert('Erro no disparo'); }
                      }}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Disparar E-mail
                    </button>
                    
                    <button 
                      onClick={async () => {
                        try {
                          await fetch(API_BASE + '/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              lead_id: selectedLead.id,
                              channel: 'whatsapp',
                              recipient: selectedLead.phone,
                              message_content: selectedLead.personalizedMessage
                            })
                          });
                          alert('WhatsApp enviado com sucesso!');
                          setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: 'sent' } : l));
                          setSelectedLead(null);
                        } catch(e) { alert('Erro no disparo'); }
                      }}
                      className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      WhatsApp
                    </button>

                    <button 
                      onClick={async () => {
                        try {
                          await fetch(API_BASE + '/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              lead_id: selectedLead.id,
                              channel: 'telegram',
                              recipient: selectedLead.social || '@empresa',
                              message_content: selectedLead.personalizedMessage
                            })
                          });
                          alert('Mensagem enviada via Telegram!');
                          setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: 'sent' } : l));
                          setSelectedLead(null);
                        } catch(e) { alert('Erro no disparo'); }
                      }}
                      className="px-5 py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      Telegram
                    </button>

                    <button 
                      onClick={() => {
                        setScheduleLead(selectedLead);
                        setSelectedLead(null);
                      }}
                      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Agendar
                    </button>
                    
                    <button 
                      onClick={() => setSelectedLead(null)}
                      className="px-5 py-3 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Schedule Meeting Modal */}
          {scheduleLead && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <GlassCard className="shadow-xl rounded-2xl max-w-md w-full p-6 relative">
                <button 
                  onClick={() => setScheduleLead(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-muted-foreground transition"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Agendar Reunião</h3>
                <span className="text-xs text-muted-foreground font-semibold">Decisor: {scheduleLead.contactName} ({scheduleLead.companyName})</span>

                <form onSubmit={handleScheduleMeeting} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Data</label>
                    <input 
                      type="date" 
                      required
                      value={scheduleData.date}
                      onChange={e => setScheduleData({ ...scheduleData, date: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Horário</label>
                    <input 
                      type="time" 
                      required
                      value={scheduleData.time}
                      onChange={e => setScheduleData({ ...scheduleData, time: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Plataforma</label>
                    <select 
                      value={scheduleData.platform}
                      onChange={e => setScheduleData({ ...scheduleData, platform: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="Ligação Telefônica">Ligação Telefônica</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Notas / Link de Reunião</label>
                    <textarea 
                      rows={2}
                      value={scheduleData.notes}
                      onChange={e => setScheduleData({ ...scheduleData, notes: e.target.value })}
                      placeholder="Adicione notas adicionais..."
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <button 
                      type="button"
                      onClick={() => setScheduleLead(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                    >
                      Confirmar Reunião
                    </button>
                  </div>
                </form>
              </GlassCard>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
