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
  Sun,
  Edit2,
  Trash2,
  Pause,
  Zap,
  Menu
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
  companyContext: string;
  aiInstructions?: string;
  calendarLink?: string;
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
  targetProducts: string[];
  limitDaily: number;
  frequency: 'immediate' | 'daily';
  status: 'idle' | 'running' | 'completed' | 'active' | 'paused';
  progress: number;
  currentStep: string;
  searchCriteria?: { channel?: 'email' | 'whatsapp' | 'telegram' | 'sms' };
  fallbackChannel?: 'none' | 'email' | 'whatsapp' | 'telegram' | 'sms';
  customInstructions?: string;
  runHours?: number[];
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'crm' | 'products' | 'profile' | 'memory' | 'logs' | 'import' | 'opportunities'>(() => {
    return (localStorage.getItem('scoutly_active_tab') as any) || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('scoutly_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      fetch(`${API_BASE}/leads`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLeads(data.map(l => ({
              id: String(l.id),
              companyName: l.company_name || l.companyName || '',
              website: l.website || '',
              score: l.score || 0,
              scoreReason: l.score_reason || l.scoreReason || '',
              contactName: l.contact_name || l.contactName || '',
              contactRole: l.contact_role || l.contactRole || '',
              status: l.status,
              personalizedMessage: l.personalized_message || l.personalizedMessage || ''
            })));
          }
        })
        .catch(err => console.warn('Polling error leads:', err));

      fetch(`${API_BASE}/outreach-logs`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setOutreachLogs(data);
          }
        })
        .catch(err => console.warn('Polling error logs:', err));

      fetch(`${API_BASE}/opportunities`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setIntentLeads(data.intentLeads || []);
            setSocialMatches(data.socialMatches || []);
          }
        })
        .catch(err => console.warn('Polling error opportunities:', err));
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<OutreachLog | null>(null);
  const [isAgentWorking, setIsAgentWorking] = useState(false);
  const [agentStatusText, setAgentStatusText] = useState('');
  
  const [intentLeads, setIntentLeads] = useState<any[]>([]);
  const [socialMatches, setSocialMatches] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [prospectingId, setProspectingId] = useState<string | null>(null);

  const fetchOpportunities = async () => {
    try {
      const res = await fetch(`${API_BASE}/opportunities`);
      const data = await res.json();
      setIntentLeads(data.intentLeads || []);
      setSocialMatches(data.socialMatches || []);
    } catch (e) {
      console.error('Erro ao carregar oportunidades:', e);
    }
  };

  const subscribeToPushNotifications = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[Push] Notificações push não suportadas neste navegador.');
        return;
      }
      
      const registration = await navigator.serviceWorker.ready;
      
      // Request VAPID public key
      const keyRes = await fetch(`${API_BASE}/push/vapid-key`);
      const { publicKey } = await keyRes.json();
      
      if (!publicKey) return;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[Push] Permissão de notificação negada pelo usuário.');
        return;
      }

      // Helper to convert urlBase64ToUint8Array
      const padding = '='.repeat((4 - publicKey.length % 4) % 4);
      const base64 = (publicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      });

      // Register subscription on backend
      await fetch(`${API_BASE}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });

      console.log('[Push] PWA inscrito com sucesso nas notificações push!');
    } catch (err: any) {
      console.warn('[Push] Erro ao registrar push notifications:', err?.message || String(err));
    }
  };

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleLead) return;
    
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === scheduleLead.id ? { ...l, status: 'booked' } : l));
    const leadName = scheduleLead.contactName;
    const leadId = scheduleLead.id;
    setScheduleLead(null);
    
    try {
      const response = await fetch(`${API_BASE}/leads/${leadId}/book`, { method: 'POST' });
      if (response.ok) {
        alert(`Reunião agendada com sucesso com ${leadName}! O Webhook para o Vysify foi disparado.`);
      }
    } catch (e) {
      console.error('Erro ao agendar reunião no servidor', e);
    }
  };

  const [apiKeys, setApiKeys] = useState({
    openai: localStorage.getItem('scoutly_openai_key') || '',
    gemini: localStorage.getItem('scoutly_gemini_key') || '',
    anthropic: localStorage.getItem('scoutly_anthropic_key') || '',
    apollo: localStorage.getItem('scoutly_apollo_key') || '',
    hunter: localStorage.getItem('scoutly_hunter_key') || '',
    resend: localStorage.getItem('scoutly_resend_key') || '',
    resendFrom: localStorage.getItem('scoutly_resend_from') || '',
    whatsappToken: localStorage.getItem('scoutly_whatsapp_token') || '',
    whatsappInstance: localStorage.getItem('scoutly_whatsapp_instance') || '',
    evolutionApiUrl: localStorage.getItem('scoutly_evolution_url') || '',
    evolutionApiKey: localStorage.getItem('scoutly_evolution_key') || '',
    evolutionInstance: localStorage.getItem('scoutly_evolution_instance') || '',
    telegramToken: localStorage.getItem('scoutly_telegram_token') || '',
    telegramChatId: localStorage.getItem('scoutly_telegram_chat_id') || '',
    linkedinCookie: localStorage.getItem('scoutly_linkedin_cookie') || '',
    twilioAccountSid: localStorage.getItem('scoutly_twilio_sid') || '',
    twilioAuthToken: localStorage.getItem('scoutly_twilio_token') || '',
    twilioPhoneNumber: localStorage.getItem('scoutly_twilio_phone') || '',
    vysifyWebhookUrl: localStorage.getItem('scoutly_webhook_url') || '',
    vysifyApiKey: localStorage.getItem('scoutly_vysify_api_key') || '',
    googleMapsApiKey: localStorage.getItem('scoutly_google_maps_key') || ''
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
        localStorage.setItem('scoutly_openai_key', apiKeys.openai);
        localStorage.setItem('scoutly_gemini_key', apiKeys.gemini);
        localStorage.setItem('scoutly_anthropic_key', apiKeys.anthropic);
        localStorage.setItem('scoutly_apollo_key', apiKeys.apollo);
        localStorage.setItem('scoutly_hunter_key', apiKeys.hunter);
        localStorage.setItem('scoutly_resend_key', apiKeys.resend);
        localStorage.setItem('scoutly_resend_from', apiKeys.resendFrom);
        localStorage.setItem('scoutly_whatsapp_token', apiKeys.whatsappToken);
        localStorage.setItem('scoutly_whatsapp_instance', apiKeys.whatsappInstance);
        localStorage.setItem('scoutly_evolution_url', apiKeys.evolutionApiUrl);
        localStorage.setItem('scoutly_evolution_key', apiKeys.evolutionApiKey);
        localStorage.setItem('scoutly_evolution_instance', apiKeys.evolutionInstance);
        localStorage.setItem('scoutly_telegram_token', apiKeys.telegramToken);
        localStorage.setItem('scoutly_telegram_chat_id', apiKeys.telegramChatId);
        localStorage.setItem('scoutly_linkedin_cookie', apiKeys.linkedinCookie);
        localStorage.setItem('scoutly_twilio_sid', apiKeys.twilioAccountSid);
        localStorage.setItem('scoutly_twilio_token', apiKeys.twilioAuthToken);
        localStorage.setItem('scoutly_twilio_phone', apiKeys.twilioPhoneNumber);
        localStorage.setItem('scoutly_webhook_url', apiKeys.vysifyWebhookUrl);
        localStorage.setItem('scoutly_vysify_api_key', apiKeys.vysifyApiKey);
        localStorage.setItem('scoutly_google_maps_key', apiKeys.googleMapsApiKey);
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
    companyContext: '',
    aiInstructions: '',
    calendarLink: ''
  });

  const [products, setProducts] = useState<Product[]>([]);


  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    features: '',
    targetBuyer: '',
    pricingPlans: ''
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

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
    targetProducts: [],
    limitDaily: 50,
    frequency: 'immediate',
    searchCriteria: { channel: 'whatsapp' },
    fallbackChannel: 'none',
    customInstructions: '',
    runHours: [9, 13, 16]
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
  const API_BASE = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    // Load Company Profile
    fetch(`${API_BASE}/profile`)
      .then(res => res.json())
      .then(data => {
        if (data && data.company_name) {
          setCompanyProfile({
            name: data.company_name,
            domain: data.company_domain || '',
            companyContext: data.company_context || '',
            aiInstructions: data.ai_instructions || '',
            calendarLink: data.calendar_link || ''
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
            targetProducts: (function() {
              try { return JSON.parse(c.target_product || '[]'); } catch { return [c.target_product || 'Scoutly Agent Core']; }
            })(),
            limitDaily: c.limit_daily,
            frequency: c.frequency || 'immediate',
            status: c.status,
            progress: c.progress,
            currentStep: c.current_step,
            searchCriteria: { channel: c.channel || 'whatsapp' },
            fallbackChannel: c.fallback_channel || 'none',
            runHours: c.run_hours ? (typeof c.run_hours === 'string' ? JSON.parse(c.run_hours) : c.run_hours) : [9, 13, 16]
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
            resendFrom: data.resend_from || '',
            whatsappToken: data.whatsapp_token || '',
            whatsappInstance: data.whatsapp_instance || '',
            evolutionApiUrl: data.evolution_api_url || '',
            evolutionApiKey: data.evolution_api_key || '',
            evolutionInstance: data.evolution_instance || '',
            telegramToken: data.telegram_token || '',
            telegramChatId: data.telegram_chat_id || '',
            linkedinCookie: data.linkedin_cookie || '',
            twilioAccountSid: data.twilio_account_sid || '',
            twilioAuthToken: data.twilio_auth_token || '',
            twilioPhoneNumber: data.twilio_phone_number || '',
            vysifyWebhookUrl: data.vysify_webhook_url || '',
            vysifyApiKey: data.vysify_api_key || '',
            googleMapsApiKey: data.google_maps_api_key || ''
          });
        }
      })
      .catch(() => console.error('Erro ao carregar chaves de API.'));

    fetch(`${API_BASE}/memory`)
      .then(res => res.json())
      .then(data => setAiMemory(Array.isArray(data) ? data : []))
      .catch(() => console.error('Erro ao carregar memória.'));

    fetchOpportunities();
    subscribeToPushNotifications();
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
          company_context: companyProfile.companyContext,
          ai_instructions: companyProfile.aiInstructions,
          calendar_link: companyProfile.calendarLink
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
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  const handleEditCampaign = (camp: Campaign) => {
    setEditingCampaignId(camp.id);
    setNewCampaign({
      name: camp.name,
      segment: camp.segment,
      prospectingArea: {
        countries: camp.prospectingArea?.countries || [],
        states: camp.prospectingArea?.states || [],
        cities: camp.prospectingArea?.cities || ''
      },
      language: camp.language || 'Português',
      targetProducts: camp.targetProducts || [],
      limitDaily: camp.limitDaily || 50,
      frequency: camp.frequency || 'immediate',
      searchCriteria: camp.searchCriteria || { channel: 'whatsapp' },
      fallbackChannel: camp.fallbackChannel || 'none',
      customInstructions: camp.customInstructions || '',
      runHours: camp.runHours || [9, 13, 16]
    });
  };

  const startCampaign = async (campaignId: string) => {
    const campToStart = campaigns.find(c => c.id === campaignId);
    if (!campToStart) return;

    // Optimistic UI update
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'running', progress: 5 } : c));
    setRunningCampaignId(campaignId);

    // Chama o backend — persiste search_criteria no banco e dispara imediatamente
    try {
      await fetch(`${API_BASE}/campaigns/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaignId,
          searchCriteria: {
            segment: campToStart.segment,
            countries: campToStart.prospectingArea.countries,
            states: campToStart.prospectingArea.states,
            cities: campToStart.prospectingArea.cities,
            targetProducts: campToStart.targetProducts,
            channel: campToStart.searchCriteria?.channel || 'whatsapp',
            fallback_channel: campToStart.fallbackChannel || 'none',
            language: campToStart.language || 'Português',
            customInstructions: campToStart.customInstructions || ''
          }
        })
      });
    } catch {
      console.log('Backend indisponível — rodando em modo demo.');
    }
  };

  const stopCampaign = async (campaignId: string) => {
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'paused' } : c));
    try {
      await fetch(`${API_BASE}/campaigns/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });
    } catch {
      console.log('Erro ao pausar no servidor.');
    }
  };

  const runCampaignNow = async (campaignId: string) => {
    // Helper to map DB campaigns to frontend state format
    const mapCampaigns = (list: any[]) => {
      return list.map(c => ({
        id: String(c.id),
        name: c.name,
        segment: c.segment,
        prospectingArea: {
          countries: (typeof c.countries === 'string') ? (JSON.parse(c.countries || '[]')) : (c.countries || []),
          states: (typeof c.states === 'string') ? (JSON.parse(c.states || '[]')) : (c.states || []),
          cities: c.cities || ''
        },
        language: c.language,
        targetProducts: (function() {
          try { return typeof c.target_product === 'string' ? JSON.parse(c.target_product || '[]') : (c.target_product || []); } catch { return [c.target_product || 'Scoutly Agent Core']; }
        })(),
        limitDaily: c.limit_daily,
        frequency: c.frequency || 'immediate',
        status: c.status,
        progress: c.progress,
        currentStep: c.current_step,
        searchCriteria: { channel: c.channel || 'whatsapp' },
        fallbackChannel: c.fallback_channel || 'none',
        runHours: c.run_hours ? (typeof c.run_hours === 'string' ? JSON.parse(c.run_hours) : c.run_hours) : [9, 13, 16]
      }));
    };

    // Optimistic UI status update
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'running' } : c));
    try {
      const response = await fetch(`${API_BASE}/campaigns/run-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Refresh status
        setTimeout(async () => {
          const res = await fetch(`${API_BASE}/campaigns`);
          if (res.ok) {
            const list = await res.json();
            setCampaigns(mapCampaigns(list));
          }
        }, 3000);
      } else {
        alert(data.error || 'Falha ao rodar campanha');
        // Revert status
        const res = await fetch(`${API_BASE}/campaigns`);
        if (res.ok) {
          const list = await res.json();
          setCampaigns(mapCampaigns(list));
        }
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao rodar campanha');
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    try {
      await fetch(`${API_BASE}/campaigns/${campaignId}`, {
        method: 'DELETE'
      });
    } catch {
      console.log('Erro ao excluir no servidor.');
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Deseja realmente limpar todos os logs de disparo e redefinir o pipeline local? Isso apagará o histórico atual.')) return;
    try {
      await fetch(`${API_BASE}/outreach-logs`, { method: 'DELETE' });
      setOutreachLogs([]);
      setLeads([]);
    } catch {
      console.log('Erro ao limpar logs no servidor.');
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

  useEffect(() => {
    const interval = setInterval(() => {
      // Polling leve para sincronizar dados em background a cada 10 segundos
      fetch(`${API_BASE}/campaigns`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCampaigns(prev => prev.map(c => {
              const serverCamp = data.find(sc => String(sc.id) === c.id);
              if (serverCamp) {
                return {
                  ...c,
                  status: serverCamp.status,
                  progress: serverCamp.progress,
                  currentStep: serverCamp.current_step
                };
              }
              return c;
            }));
          }
        }).catch(() => {});

      fetch(`${API_BASE}/leads`)
        .then(r => r.json())
        .then(leadsData => {
          if (Array.isArray(leadsData)) setLeads(leadsData);
        }).catch(() => {});

      fetch(`${API_BASE}/outreach-logs`)
        .then(r => r.json())
        .then(logsData => {
          if (Array.isArray(logsData)) setOutreachLogs(logsData);
        }).catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const addMockLead = (camp: Campaign) => {
    const selectedProdName = camp.targetProducts[0] || 'Scoutly Agent Core';
    const selectedProd = products.find(p => p.name === selectedProdName) || products[0];
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
    
    if (editingProductId) {
      setProducts(prev => prev.map(p => p.id === editingProductId ? { id: editingProductId, ...newProduct } : p));
      try {
        await fetch(`${API_BASE}/products/${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newProduct.name,
            description: newProduct.description,
            features: newProduct.features,
            target_buyer: newProduct.targetBuyer,
            pricing_plans: newProduct.pricingPlans
          })
        });
        setNewProduct({ name: '', description: '', features: '', targetBuyer: '', pricingPlans: '' });
        setEditingProductId(null);
      } catch {
        console.log('Error updating product on server. Saved locally.');
      }
    } else {
      const tempId = `p_${Date.now()}`;
      setProducts(prev => [...prev, { id: tempId, ...newProduct }]);
      try {
        await fetch(`${API_BASE}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: tempId,
            name: newProduct.name,
            description: newProduct.description,
            features: newProduct.features,
            target_buyer: newProduct.targetBuyer,
            pricing_plans: newProduct.pricingPlans
          })
        });
      } catch {
        console.log('Saved product in frontend sandbox');
      }
      setNewProduct({ name: '', description: '', features: '', targetBuyer: '', pricingPlans: '' });
    }
  };

  const handleEditProduct = (prod: Product) => {
    setNewProduct({
      name: prod.name,
      description: prod.description,
      features: prod.features,
      targetBuyer: prod.targetBuyer,
      pricingPlans: prod.pricingPlans
    });
    setEditingProductId(prod.id);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    } catch {
      console.error('Erro ao excluir no servidor.');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.segment || newCampaign.prospectingArea.countries.length === 0) return;

    if (editingCampaignId) {
      // Optimistic local update
      setCampaigns(prev => prev.map(c => c.id === editingCampaignId ? {
        ...c,
        name: newCampaign.name,
        segment: newCampaign.segment,
        prospectingArea: newCampaign.prospectingArea,
        language: newCampaign.language,
        targetProducts: newCampaign.targetProducts,
        limitDaily: newCampaign.limitDaily,
        frequency: newCampaign.frequency,
        searchCriteria: newCampaign.searchCriteria,
        fallbackChannel: newCampaign.fallbackChannel,
        customInstructions: newCampaign.customInstructions
      } : c));

      // Save to Backend API
      try {
        await fetch(`${API_BASE}/campaigns/${editingCampaignId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newCampaign.name,
            segment: newCampaign.segment,
            countries: newCampaign.prospectingArea.countries,
            states: newCampaign.prospectingArea.states,
            cities: newCampaign.prospectingArea.cities,
            language: newCampaign.language,
            target_product: JSON.stringify(newCampaign.targetProducts),
            limit_daily: newCampaign.limitDaily,
            frequency: newCampaign.frequency,
            channel: newCampaign.searchCriteria?.channel || 'whatsapp',
            fallback_channel: newCampaign.fallbackChannel || 'none',
            run_hours: newCampaign.runHours || [9, 13, 16],
            search_criteria: {
              segment: newCampaign.segment,
              countries: newCampaign.prospectingArea.countries,
              states: newCampaign.prospectingArea.states,
              cities: newCampaign.prospectingArea.cities,
              targetProducts: newCampaign.targetProducts,
              channel: newCampaign.searchCriteria?.channel || 'whatsapp',
              fallback_channel: newCampaign.fallbackChannel || 'none',
              language: newCampaign.language,
              customInstructions: newCampaign.customInstructions || ''
            }
          })
        });
      } catch (err) {
        console.error(err);
      }

      setEditingCampaignId(null);
    } else {
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
            id: tempId,
            name: newCampaign.name,
            segment: newCampaign.segment,
            countries: newCampaign.prospectingArea.countries,
            states: newCampaign.prospectingArea.states,
            cities: newCampaign.prospectingArea.cities,
            language: newCampaign.language,
            target_product: JSON.stringify(newCampaign.targetProducts),
            limit_daily: newCampaign.limitDaily,
            frequency: newCampaign.frequency,
            channel: newCampaign.searchCriteria?.channel,
            fallback_channel: newCampaign.fallbackChannel || 'none',
            custom_instructions: newCampaign.customInstructions,
            run_hours: newCampaign.runHours || [9, 13, 16]
          })
        });
      } catch {
        console.log('Campaign saved in frontend sandbox mode');
      }
    }

    setNewCampaign({
      name: '',
      segment: '',
      prospectingArea: { countries: [], states: [], cities: '' },
      language: 'Português',
      targetProducts: [],
      limitDaily: 50,
      frequency: 'immediate',
      searchCriteria: { channel: 'whatsapp' },
      fallbackChannel: 'none',
      customInstructions: '',
      runHours: [9, 13, 16]
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
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 w-80 bg-card border-r border-border flex flex-col justify-between shrink-0 z-50 shadow-xl transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
                <NavItem icon={TrendingUp} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
                <NavItem icon={Users} label="Pipeline & CRM" active={activeTab === 'crm'} onClick={() => { setActiveTab('crm'); setIsMobileMenuOpen(false); }} badge={<span className="ml-auto text-[10px] bg-slate-100 text-muted-foreground px-2 py-0.5 rounded-full font-bold border border-border/50">{leads.length}</span>} />
                <NavItem icon={Target} label="Radar de Intenção" active={activeTab === 'opportunities'} onClick={() => { setActiveTab('opportunities'); setIsMobileMenuOpen(false); }} badge={(intentLeads.length + socialMatches.length) > 0 ? <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold border border-indigo-200/50">{(intentLeads.length + socialMatches.length)}</span> : undefined} />
                <NavItem icon={MessageSquare} label="Logs de Disparo" active={activeTab === 'logs'} onClick={() => { setActiveTab('logs'); setIsMobileMenuOpen(false); }} />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] px-4 block mb-3">Operação e Campanhas</span>
              <div className="space-y-1.5">
                <NavItem icon={Play} label="Campanhas IA" active={activeTab === 'campaigns'} onClick={() => { setActiveTab('campaigns'); setIsMobileMenuOpen(false); }} badge={runningCampaignId ? <span className="w-2 h-2 rounded-full bg-indigo-600 ml-auto animate-pulse" /> : undefined} />
                <NavItem icon={Upload} label="Importar Leads" active={activeTab === 'import'} onClick={() => { setActiveTab('import'); setIsMobileMenuOpen(false); }} />
                <NavItem icon={Package} label="Produtos" active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setIsMobileMenuOpen(false); }} />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] px-4 block mb-3">Ajustes & Inteligência</span>
              <div className="space-y-1.5">
                <NavItem icon={BrainCircuit} label="Memória & IA" active={activeTab === 'memory'} onClick={() => { setActiveTab('memory'); setIsMobileMenuOpen(false); }} />
                <NavItem icon={Building2} label="Perfil da Startup" active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }} />
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
        <header className="h-24 border-b border-border px-6 lg:px-10 flex items-center justify-between bg-card/50 backdrop-blur-md shrink-0 relative z-20 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-foreground hover:bg-muted rounded-xl transition"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg lg:text-xl font-extrabold text-foreground tracking-tight uppercase">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'campaigns' && 'Campanhas Autônomas'}
              {activeTab === 'crm' && 'Pipeline & CRM'}
              {activeTab === 'opportunities' && 'Radar de Oportunidades & Intenção'}
              {activeTab === 'products' && 'Catálogo de Produtos'}
              {activeTab === 'profile' && 'Configuração da Startup'}
              {activeTab === 'memory' && 'Memória & Aprendizado'}
              {activeTab === 'logs' && 'Logs de Disparos'}
              {activeTab === 'import' && 'Importar Leads'}
            </h1>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <span className="hidden md:flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3.5 py-2 rounded-full font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Agente Ativo
            </span>
            <span className="flex items-center gap-2 text-xs bg-primary/10 text-primary border border-primary/20 px-2 lg:px-3.5 py-2 rounded-full font-bold shadow-sm">
              <BrainCircuit className="w-4 h-4 text-primary" />
              HybridScorer Online
            </span>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-10 bg-background/50">
          
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
                      O Scoutly está configurado para prospectar no contexto de <strong className="text-foreground font-bold">{companyProfile.name || 'sua empresa'}</strong>, focando no produto <strong className="text-foreground font-bold">{products[0]?.name || 'Nenhum cadastrado'}</strong>. O motor de scoring <span className="text-primary font-bold">HybridScorer</span> combina regras personalizáveis com LLM para qualificar leads em tempo real.
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Empresas Encontradas', value: leads.length, suffix: '', trend: 'Tempo Real', trendUp: true, icon: Target, color: '#6366f1' },
                  { label: 'Mensagens Enviadas', value: leads.filter(l => ['sent', 'opened', 'responded', 'booked'].includes(l.status)).length, suffix: '', trend: 'Cadência IA', trendUp: true, icon: Send, color: '#4f46e5' },
                  { label: 'Taxa de Resposta', value: leads.length > 0 ? Math.round((leads.filter(l => ['responded', 'booked'].includes(l.status)).length / leads.length) * 100) : 0, suffix: '%', trend: 'Engajamento', trendUp: true, icon: Eye, color: '#f59e0b' },
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
                    {leads.length > 0 ? leads.slice().reverse().slice(0, 3).map((lead) => (
                      <button key={lead.id} onClick={() => { setSelectedLead(lead); setActiveTab('crm'); }}
                        className="w-full p-5 rounded-2xl bg-muted/30 border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 flex items-center justify-between text-left group shadow-sm">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-foreground text-sm tracking-wide">{lead.companyName}</span>
                            <ScoreBadge score={lead.score} />
                          </div>
                          <span className="block text-xs text-muted-foreground mt-1 font-semibold">{lead.contactName} ({lead.contactRole})</span>
                          <p className="text-xs text-muted-foreground italic mt-2.5 line-clamp-1 leading-relaxed">"{lead.scoreReason || 'Nenhuma análise de IA disponível'}"</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <StatusBadge status={lead.status} />
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </button>
                    )) : (
                      <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-muted/10">
                        <p className="text-xs font-semibold">Nenhuma atividade de IA registrada. Inicie uma prospecção para visualizar os leads aqui.</p>
                      </div>
                    )}
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
                    <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-muted/10">
                      <p className="text-xs font-semibold">O módulo de Testes A/B (IA Auto-Otimizadora) está em fase beta.</p>
                      <p className="text-[10px] mt-2">Em breve o Scoutly dividirá os leads automaticamente para testar prompts diferentes e encontrar a melhor conversão.</p>
                    </div>
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
                    {editingCampaignId ? (
                      <Edit2 className="w-4.5 h-4.5 text-indigo-600" />
                    ) : (
                      <Plus className="w-4.5 h-4.5 text-indigo-600" />
                    )}
                    <span>{editingCampaignId ? 'Editar Campanha' : 'Nova Campanha Autônoma'}</span>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          value={newCampaign.searchCriteria?.channel || 'whatsapp'}
                          onChange={e => setNewCampaign({
                            ...newCampaign,
                            searchCriteria: {
                              ...newCampaign.searchCriteria!,
                              channel: e.target.value as 'email' | 'whatsapp' | 'telegram' | 'sms'
                            }
                          })}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition"
                        >
                          <option value="whatsapp">📱 WhatsApp (Recomendado)</option>
                          <option value="sms">💬 SMS via Twilio</option>
                          <option value="telegram">✈️ Telegram Direct</option>
                          <option value="email">⚠️ E-mail (deduzido via domínio)</option>
                        </select>
                        {(newCampaign.searchCriteria?.channel === 'email' || !newCampaign.searchCriteria?.channel) && (
                          <p className="mt-1.5 text-[10px] text-amber-600 font-medium flex items-center gap-1">
                            <span>⚠️</span> E-mail deduzido pelo domínio. Pode haver bounces.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Canal Secundário (Fallback)</label>
                        <select
                          value={newCampaign.fallbackChannel || 'none'}
                          onChange={e => setNewCampaign({
                            ...newCampaign,
                            fallbackChannel: e.target.value as 'none' | 'email' | 'whatsapp' | 'telegram' | 'sms'
                          })}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition"
                        >
                          <option value="none">❌ Nenhum (Não re-disparar)</option>
                          <option value="whatsapp" disabled={newCampaign.searchCriteria?.channel === 'whatsapp'}>📱 WhatsApp</option>
                          <option value="sms" disabled={newCampaign.searchCriteria?.channel === 'sms'}>💬 SMS via Twilio</option>
                          <option value="email" disabled={newCampaign.searchCriteria?.channel === 'email'}>📧 E-mail</option>
                          <option value="telegram" disabled={newCampaign.searchCriteria?.channel === 'telegram'}>✈️ Telegram Direct</option>
                        </select>
                        <p className="mt-1.5 text-[9px] text-slate-400 font-medium leading-normal">
                          Caso a tentativa no canal principal falhe (ex: número sem WhatsApp ou falha de SMS), o robô tentará enviar pelo meio secundário.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Produtos a Serem Divulgados</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 bg-background border border-border p-3 rounded-xl">
                        {products.length === 0 ? (
                           <span className="text-xs text-muted-foreground">Nenhum produto cadastrado.</span>
                        ) : (
                          products.map(p => (
                            <label key={p.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-muted/50 rounded-lg transition-colors">
                              <input 
                                type="checkbox"
                                checked={newCampaign.targetProducts?.includes(p.name)}
                                onChange={e => {
                                  const list = newCampaign.targetProducts || [];
                                  if (e.target.checked) {
                                    setNewCampaign({...newCampaign, targetProducts: [...list, p.name]});
                                  } else {
                                    setNewCampaign({...newCampaign, targetProducts: list.filter(name => name !== p.name)});
                                  }
                                }}
                                className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500 bg-background"
                              />
                              <span className="text-sm font-semibold text-foreground">{p.name}</span>
                            </label>
                          ))
                        )}
                      </div>
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

                    {/* Agendador Interno de Horários de Disparo */}
                    {newCampaign.frequency === 'daily' && (
                      <div className="p-5 bg-card/60 border border-border rounded-xl space-y-3">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          🕒 Horários de Execução Automática (Selecione um ou mais)
                        </label>
                        <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                          Escolha as horas do dia em que a campanha será acionada automaticamente pelo servidor (Fuso horário do servidor).
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1.5">
                          {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                            const isSelected = (newCampaign.runHours || []).includes(hour);
                            return (
                              <button
                                key={hour}
                                type="button"
                                onClick={() => {
                                  const hours = newCampaign.runHours || [];
                                  if (isSelected) {
                                    setNewCampaign({
                                      ...newCampaign,
                                      runHours: hours.filter(h => h !== hour)
                                    });
                                  } else {
                                    setNewCampaign({
                                      ...newCampaign,
                                      runHours: [...hours, hour].sort((a, b) => a - b)
                                    });
                                  }
                                }}
                                className={`py-2 rounded-lg text-xs font-bold transition-all border text-center ${
                                  isSelected 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-background hover:bg-muted text-foreground border-border'
                                }`}
                              >
                                {String(hour).padStart(2, '0')}:00
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 mt-2">
                      {editingCampaignId && (
                        <button 
                          type="button"
                          onClick={() => {
                            setEditingCampaignId(null);
                            setNewCampaign({
                              name: '',
                              segment: '',
                              prospectingArea: { countries: [], states: [], cities: '' },
                              language: 'Português',
                              targetProducts: [],
                              limitDaily: 50,
                              frequency: 'immediate',
                              searchCriteria: { channel: 'whatsapp' },
                              fallbackChannel: 'none',
                              customInstructions: '',
                              runHours: [9, 13, 16]
                            });
                          }}
                          className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-205 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all duration-200 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5"
                        >
                          Cancelar Edição
                        </button>
                      )}
                      <button 
                        type="submit"
                        disabled={newCampaign.prospectingArea.countries.length === 0}
                        className={`py-3.5 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-slate-900/10 flex items-center justify-center gap-1.5 ${
                          editingCampaignId ? "flex-[2] bg-indigo-600 hover:bg-indigo-700" : "w-full bg-[#0F172A] hover:bg-slate-800"
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 text-white" />
                        {editingCampaignId ? 'Salvar Alterações' : 'Criar Campanha'}
                      </button>
                    </div>
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
                                : camp.status === 'active'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : camp.status === 'paused'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-slate-100 text-muted-foreground border-border'
                            }`}>
                              {camp.status === 'running' 
                                ? 'Executando' 
                                : camp.status === 'completed' 
                                ? 'Finalizada' 
                                : camp.status === 'active'
                                ? 'Ativa (Agendada)'
                                : camp.status === 'paused'
                                ? 'Pausada'
                                : 'Aguardando'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground font-semibold">
                            <span><strong>Segmento:</strong> {camp.segment}</span>
                            <span><strong>Região:</strong> {buildRegionLabel(camp.prospectingArea)}</span>
                            <span><strong>Produtos:</strong> {camp.targetProducts?.length > 0 ? camp.targetProducts.join(', ') : 'Nenhum (Geral)'}</span>
                            <span><strong>Canal Principal:</strong> {camp.searchCriteria?.channel ? camp.searchCriteria.channel.toUpperCase() : 'WHATSAPP'}</span>
                            {camp.fallbackChannel && camp.fallbackChannel !== 'none' && (
                              <span><strong>Fallback:</strong> <span className="text-indigo-650 font-black uppercase">{camp.fallbackChannel}</span></span>
                            )}
                            {camp.frequency === 'daily' && (
                               <span className="w-full mt-1.5 flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                 <strong>🕒 Agendamentos de Disparo:</strong> {camp.runHours && camp.runHours.length > 0 ? camp.runHours.map(h => `${String(h).padStart(2, '0')}:00`).join(', ') : 'Nenhum'}
                               </span>
                             )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {(camp.status === 'idle' || camp.status === 'paused') && (
                            <button 
                              onClick={() => startCampaign(camp.id)}
                              title="Iniciar campanha"
                              className="flex items-center justify-center p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
                            >
                              <Play className="w-4 h-4 text-white fill-white" />
                            </button>
                          )}

                          {(camp.status === 'active' || camp.status === 'running') && (
                            <button 
                              onClick={() => stopCampaign(camp.id)}
                              title="Pausar campanha"
                              className="flex items-center justify-center p-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm transition"
                            >
                              <Pause className="w-4 h-4 text-white fill-white" />
                            </button>
                          )}

                          {camp.status !== 'running' && (
                            <button 
                              onClick={() => runCampaignNow(camp.id)}
                              title="Rodar agora (Execução manual)"
                              className="flex items-center justify-center p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition"
                            >
                              <Zap className="w-4 h-4 text-white fill-white" />
                            </button>
                          )}

                          <button 
                            onClick={() => handleEditCampaign(camp)}
                            title="Editar campanha"
                            className="flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-550 rounded-lg shadow-sm transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => deleteCampaign(camp.id)}
                            title="Excluir campanha"
                            className="flex items-center justify-center p-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-500 hover:border-red-200 rounded-lg shadow-sm transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                      {editingProductId ? 'Atualizar Produto' : 'Salvar Produto'}
                    </button>
                    {editingProductId && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingProductId(null);
                          setNewProduct({ name: '', description: '', features: '', targetBuyer: '', pricingPlans: '' });
                        }}
                        className="w-full py-3.5 bg-transparent border border-border hover:bg-slate-50 dark:hover:bg-zinc-900 text-foreground rounded-xl text-sm font-bold transition-all duration-200 mt-2"
                      >
                        Cancelar Edição
                      </button>
                    )}
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
                        <div className="flex gap-2">
                          <button onClick={() => handleEditProduct(prod)} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProduct(prod.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                          <span key={i} className="text-xs bg-slate-100 dark:bg-zinc-800 border border-border text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full font-bold">
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

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Contexto Mestre da Empresa</label>
                      <textarea 
                        rows={8}
                        placeholder="Ex: Nós somos a Acme Corp. Vendemos software de RH para médias empresas (50-500 funcs). Nosso diferencial é a implantação em 48 horas e preço 30% menor que o líder de mercado. Quero que a IA escreva com um tom de voz descontraído, direto e consultivo."
                        value={companyProfile.companyContext || ''}
                        onChange={e => setCompanyProfile({...companyProfile, companyContext: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                      />
                      <p className="text-[10px] text-muted-foreground mt-1.5">*Cole aqui o seu pitch de vendas, explique o que você faz, para quem vende e como a IA deve se comportar.</p>
                    </div>

                    <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100">
                      <h4 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                        <i className="fi fi-br-magic-wand text-primary"></i>
                        Ajustes Dinâmicos
                      </h4>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Link do Calendário (Google/Calendly)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: https://cal.com/seu-nome/30min"
                        value={companyProfile.calendarLink || ''}
                        onChange={e => setCompanyProfile({...companyProfile, calendarLink: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Instruções Dinâmicas / Lembretes para a IA</label>
                      <textarea 
                        rows={3}
                        placeholder="Ex: Esta semana, informe os leads que estamos com 50% de desconto na implantação. / Focar na dor X ao invés de Y."
                        value={companyProfile.aiInstructions || ''}
                        onChange={e => setCompanyProfile({...companyProfile, aiInstructions: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition" 
                      />
                      <p className="text-[10px] text-muted-foreground mt-1.5">*Este aviso será lido e priorizado pelo Agente Copywriter em todas as mensagens geradas a partir de agora.</p>
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
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Google Maps API Key (Busca de Negócios Locais)</label>
                      <p className="text-[10px] text-muted-foreground mb-2">Chave da Google Places API (GCP) para extrair nome, site e telefone do Google Maps.</p>
                      <input 
                        type="password" 
                        value={apiKeys.googleMapsApiKey}
                        onChange={e => setApiKeys({...apiKeys, googleMapsApiKey: e.target.value})}
                        placeholder="AIzaSy..."
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

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">E-mail Remetente Resend (Deve estar verificado no Resend)</label>
                      <input 
                        type="text" 
                        value={apiKeys.resendFrom}
                        onChange={e => setApiKeys({...apiKeys, resendFrom: e.target.value})}
                        placeholder="Ex: contato@seudominio.com"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-4">💬 Mensageria Outbound</span>
                    </div>

                    {/* WhatsApp via Evolution API (compartilhado com Vysify) */}
                    <div className="p-4 bg-green-50/60 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">📱</span>
                        <span className="text-xs font-black text-green-800 uppercase tracking-widest">WhatsApp — Evolution API</span>
                        <span className="ml-auto text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Compartilhado com Vysify</span>
                      </div>
                      <p className="text-[10px] text-green-700/80 mb-4 leading-relaxed">Cole aqui as mesmas credenciais configuradas no painel do <strong>Vysify (Super Admin → Evolution API)</strong>. O Scoutly enviará pelo mesmo número — as respostas chegam direto na Inbox do Vysify.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-green-900 uppercase tracking-wider mb-2">URL do Servidor Evolution API</label>
                          <input
                            type="text"
                            value={apiKeys.evolutionApiUrl}
                            onChange={e => setApiKeys({...apiKeys, evolutionApiUrl: e.target.value})}
                            placeholder="https://evolution-api-production-xxxx.up.railway.app"
                            className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-green-500 transition placeholder:text-slate-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-green-900 uppercase tracking-wider mb-2">Global API Key</label>
                          <input
                            type="password"
                            value={apiKeys.evolutionApiKey}
                            onChange={e => setApiKeys({...apiKeys, evolutionApiKey: e.target.value})}
                            placeholder="Chave global da Evolution API"
                            className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-green-500 transition placeholder:text-slate-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-green-900 uppercase tracking-wider mb-2">Nome da Instância</label>
                          <input
                            type="text"
                            value={apiKeys.evolutionInstance}
                            onChange={e => setApiKeys({...apiKeys, evolutionInstance: e.target.value})}
                            placeholder="vysify-clxyz123abc"
                            className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-green-500 transition placeholder:text-slate-400"
                          />
                        </div>
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

                    {/* SMS via Twilio (compartilhado com Vysify) */}
                    <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">💬</span>
                        <span className="text-xs font-black text-blue-800 uppercase tracking-widest">SMS — Twilio</span>
                        <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">Compartilhado com Vysify</span>
                      </div>
                      <p className="text-[10px] text-blue-700/80 mb-4 leading-relaxed">Cole aqui as mesmas credenciais configuradas no painel do <strong>Vysify (Super Admin → Twilio)</strong>. O Scoutly enviará SMS pelo mesmo número — as respostas chegam direto na Inbox do Vysify.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Twilio Account SID</label>
                          <input
                            type="password"
                            value={apiKeys.twilioAccountSid}
                            onChange={e => setApiKeys({...apiKeys, twilioAccountSid: e.target.value})}
                            placeholder="AC..."
                            className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-blue-500 transition placeholder:text-slate-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Twilio Auth Token</label>
                          <input
                            type="password"
                            value={apiKeys.twilioAuthToken}
                            onChange={e => setApiKeys({...apiKeys, twilioAuthToken: e.target.value})}
                            placeholder="Auth Token..."
                            className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-blue-500 transition placeholder:text-slate-400"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Número Twilio</label>
                          <input
                            type="text"
                            value={apiKeys.twilioPhoneNumber}
                            onChange={e => setApiKeys({...apiKeys, twilioPhoneNumber: e.target.value})}
                            placeholder="+1234567890"
                            className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-blue-500 transition placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-4">🔗 Transferência de Leads (Webhook)</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Webhook de Destino (CRM Vysify)</label>
                      <p className="text-[10px] text-muted-foreground mb-2">Para onde os dados do lead serão enviados ao clicar em "Agendar Reunião".</p>
                      <input 
                        type="text" 
                        value={apiKeys.vysifyWebhookUrl}
                        onChange={e => setApiKeys({...apiKeys, vysifyWebhookUrl: e.target.value})}
                        placeholder="https://..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">API Key do Vysify</label>
                      <p className="text-[10px] text-muted-foreground mb-2">Chave de autenticação gerada no painel do Vysify (Configurações → API Keys). Necessária para o Scoutly poder enviar leads de forma segura.</p>
                      <input 
                        type="password" 
                        value={apiKeys.vysifyApiKey}
                        onChange={e => setApiKeys({...apiKeys, vysifyApiKey: e.target.value})}
                        placeholder="nk_..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-card transition placeholder:text-slate-400" 
                      />
                    </div>

                    <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                      <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">Sua URL de Webhook (Para colar no Vysify)</label>
                      <p className="text-[10px] text-indigo-700/80 mb-2 font-medium">Copie este endereço e cole no Vysify para ativar o Feedback Loop de Vendas Fechadas.</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          readOnly
                          value={`${API_BASE}/webhooks/vysify-feedback`}
                          className="w-full bg-white border border-indigo-200 rounded-lg px-4 py-2 text-sm text-indigo-900 focus:outline-none cursor-copy font-mono text-[11px]" 
                          onClick={(e) => {
                            (e.target as HTMLInputElement).select();
                            navigator.clipboard.writeText((e.target as HTMLInputElement).value);
                          }}
                        />
                      </div>
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
              <div className="flex justify-between items-center bg-card border border-border rounded-2xl p-7 shadow-sm">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground tracking-tight uppercase">Logs de Disparos Outbound</h2>
                  <p className="text-xs text-muted-foreground mt-1.5 font-semibold">Monitore e acompanhe cada mensagem enviada, status de entrega e erros de API em tempo real.</p>
                </div>
                {outreachLogs.length > 0 && (
                  <button 
                    onClick={handleClearLogs}
                    className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-750 text-xs font-bold rounded-xl border border-red-200 shadow-sm transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Limpar Histórico</span>
                  </button>
                )}
              </div>

              <GlassCard className=" overflow-hidden" glow={false}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left border-collapse">
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
                          <tr 
                            key={log.id} 
                            onClick={() => setSelectedLog(log)}
                            className="hover:bg-muted/30/50 transition duration-150 cursor-pointer"
                          >
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
                                <span className="block text-[9px] text-red-655 mt-1.5 max-w-[150px] truncate font-semibold">{log.error_message}</span>
                              )}
                            </td>
                            <td className="px-6 py-4.5 max-w-xs truncate italic text-muted-foreground">
                              {log.message_content}
                            </td>
                            <td className="px-6 py-4.5 text-slate-400 font-semibold">
                              {new Date(log.sent_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4.5 text-right">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
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

          {/* OPPORTUNITIES (GROWTH OPPORTUNITIES FEED) TAB */}
          {activeTab === 'opportunities' && (
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/40 border border-border p-6 rounded-2xl">
                <div>
                  <h3 className="text-base font-black text-foreground tracking-tight flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" />
                    Radar de Oportunidades & Intenção
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 font-semibold">
                    Monitoramento em tempo real de contratações corporativas e discussões em redes sociais relevantes para prospecção do Vysify.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setIsScanning(true);
                    try {
                      const response = await fetch(`${API_BASE}/opportunities/scan`, { method: 'POST' });
                      if (response.ok) {
                        await fetchOpportunities();
                        alert('Varredura concluída com sucesso!');
                      }
                    } catch (e) {
                      console.error(e);
                      alert('Falha ao rodar varredura.');
                    } finally {
                      setIsScanning(false);
                    }
                  }}
                  disabled={isScanning}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procurando Sinais...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Buscar Novas Vagas & Menções
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Intent Data (Hiring) */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      💼 Intent Data (Vagas de Emprego)
                    </h4>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-900 border border-border px-2 py-0.5 rounded-full font-bold">
                      {intentLeads.length} ativas
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                    {intentLeads.length === 0 ? (
                      <div className="bg-card/30 border border-border border-dashed p-10 rounded-2xl text-center text-xs text-muted-foreground font-semibold">
                        Nenhuma vaga de emprego com intenção detectada ainda. Clique em "Buscar" acima!
                      </div>
                    ) : (
                      intentLeads.map((item: any) => (
                        <GlassCard key={item.id} className="p-5 hover:border-indigo-500/30 transition-all duration-300">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200/50 px-2 py-0.5 rounded-full font-bold">
                                {item.metadata?.intentTrigger?.jobTitle || 'Contratação'}
                              </span>
                              <h4 className="text-sm font-extrabold text-foreground mt-2">{item.companyName}</h4>
                              <p className="text-[11px] text-muted-foreground mt-0.5 font-bold">{item.metadata?.intentTrigger?.location}</p>
                            </div>
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">Score: {item.score || 90}</span>
                          </div>

                          <div className="mt-4 p-3 bg-muted/30 rounded-xl border border-border/50 text-[11px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                            <span className="block text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Diagnóstico da IA:</span>
                            {item.metadata?.intentTrigger?.conclusion}
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-4">
                            <span className="text-[10px] text-muted-foreground font-bold">Produto sugerido: <strong className="text-indigo-500">{item.metadata?.intentTrigger?.targetProduct || 'Vysify CRM'}</strong></span>
                            <button
                              onClick={async () => {
                                setProspectingId(item.id);
                                try {
                                  const response = await fetch(`${API_BASE}/opportunities/prospect`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ leadId: item.id })
                                  });
                                  if (response.ok) {
                                    alert('Campanha de prospecção iniciada no WhatsApp e Email!');
                                    fetch(`${API_BASE}/leads`).then(r => r.json()).then(data => {
                                      if (Array.isArray(data)) {
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
                                    });
                                  }
                                } catch (e) {
                                  console.error(e);
                                  alert('Erro ao iniciar prospecção.');
                                } finally {
                                  setProspectingId(null);
                                }
                              }}
                              disabled={prospectingId === item.id}
                              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {prospectingId === item.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Processando...
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5" />
                                  Prospectar Agora
                                </>
                              )}
                            </button>
                          </div>
                        </GlassCard>
                      ))
                    )}
                  </div>
                </div>

                {/* Social Listening */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      💬 Social Listening (Menções Reddit)
                    </h4>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-900 border border-border px-2 py-0.5 rounded-full font-bold">
                      {socialMatches.length} ativas
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                    {socialMatches.length === 0 ? (
                      <div className="bg-card/30 border border-border border-dashed p-10 rounded-2xl text-center text-xs text-muted-foreground font-semibold">
                        Nenhum post sobre CRM ou Suporte detectado nas redes. Clique em "Buscar" acima!
                      </div>
                    ) : (
                      socialMatches.map((item: any) => (
                        <GlassCard key={item.id} className="p-5 hover:border-indigo-500/30 transition-all duration-300">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[9px] bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 border border-amber-200/50 px-2 py-0.5 rounded-full font-bold tracking-wide uppercase">
                                {item.matched_keyword}
                              </span>
                              <h4 className="text-xs font-black text-foreground mt-2">{item.author}</h4>
                              <p className="text-[10px] text-indigo-500 font-bold block mt-0.5">Reddit</p>
                            </div>
                          </div>

                          <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed whitespace-pre-line border-l-2 border-border pl-3">
                            {item.content}
                          </div>

                          <div className="mt-4 flex items-center justify-end">
                            <a
                              href={item.post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              Ver Publicação Original
                            </a>
                          </div>
                        </GlassCard>
                      ))
                    )}
                  </div>
                </div>
              </div>
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

          {/* Outreach Log Detail Modal */}
          {selectedLog && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
              <GlassCard className="shadow-xl rounded-2xl max-w-2xl w-full p-6 relative border border-border">
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-foreground transition"
                >
                  <X className="w-5 h-5" />
                </button>
 
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-foreground tracking-tight">
                    {selectedLog.lead?.companyName || 'Empresa Desconhecida'}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedLog.channel === 'email' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30' :
                    selectedLog.channel === 'whatsapp' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30' :
                    'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/30'
                  }`}>
                    {selectedLog.channel}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mt-1.5">
                  Decisor: <span className="text-slate-800 dark:text-slate-200">{selectedLog.lead?.contactName || 'Sem Contato'}</span> ({selectedLog.lead?.contactRole || 'Gestor'})
                </span>
 
                <div className="mt-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-muted/40 rounded-xl border border-border">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Destinatário de Envio</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block mt-1 font-mono">{selectedLog.recipient}</span>
                    </div>
                    <div className="p-3.5 bg-muted/40 rounded-xl border border-border">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Status de Envio</span>
                      {selectedLog.status === 'sent' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 mt-1">
                          Sucesso
                        </span>
                      ) : (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/30">
                            Falha
                          </span>
                          {selectedLog.error_message && (
                            <span className="block text-[9px] text-red-650 dark:text-red-400 mt-1 font-semibold leading-tight">{selectedLog.error_message}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
 
                  <div>
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Mensagem Enviada na Íntegra</h4>
                    <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-background border border-border p-4.5 rounded-xl font-medium whitespace-pre-line max-h-[250px] overflow-y-auto shadow-inner">
                      {selectedLog.message_content}
                    </div>
                  </div>
 
                  <div className="p-3.5 bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/50 rounded-xl text-[11px] text-indigo-950 dark:text-indigo-200 flex justify-between items-center gap-3">
                    <span className="font-semibold leading-relaxed">
                      💡 Gostou da mensagem gerada pela IA para este lead? Marque como Sucesso para ensinar o agente.
                    </span>
                    <button 
                      onClick={() => {
                        fetch(`${API_BASE}/memory/learn`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            leadId: selectedLog.lead_id,
                            companyName: selectedLog.lead?.companyName || 'Empresa',
                            messageContent: selectedLog.message_content
                          })
                        }).then(res => res.json()).then(() => {
                          alert('O Agente de IA analisou essa mensagem e aprendeu o padrão de sucesso!');
                          fetch(`${API_BASE}/memory`).then(r => r.json()).then(data => setAiMemory(data));
                        });
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition whitespace-nowrap shadow-sm text-[10px]"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Salvar Sucesso</span>
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => setSelectedLog(null)}
                    className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                  >
                    Fechar
                  </button>
                </div>
              </GlassCard>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
