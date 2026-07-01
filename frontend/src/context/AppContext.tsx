import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CompanyProfile, Product, Campaign, Lead, OutreachLog } from '../types';

interface AppState {
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  activeTab: 'dashboard' | 'campaigns' | 'crm' | 'products' | 'profile' | 'memory' | 'logs' | 'import';
  setActiveTab: (v: 'dashboard' | 'campaigns' | 'crm' | 'products' | 'profile' | 'memory' | 'logs' | 'import') => void;
  companyProfile: CompanyProfile;
  setCompanyProfile: (v: CompanyProfile) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  outreachLogs: OutreachLog[];
  setOutreachLogs: React.Dispatch<React.SetStateAction<OutreachLog[]>>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem('scoutly_logged_in') === '1');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'crm' | 'products' | 'profile' | 'memory' | 'logs' | 'import'>('dashboard');
  
  // Theme state
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

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Other state initializers...
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: 'Vysify',
    domain: 'https://vysify.com',
    industry: 'Enterprise Software & Sales CRM',
    description: 'Um CRM moderno focado em otimização de pipeline e automações comerciais que ajuda times de venda a fechar mais negócios.',
    valueProposition: 'Acelerar o ciclo de vendas e estruturar a jornada comercial através de automações inteligentes e pipeline intuitivo.',
    targetAudience: 'Startups, agências de marketing, e PMEs em crescimento.',
    brandVoice: 'Profissional, focado em resultados, consultivo e tecnológico.'
  });

  const [products, setProducts] = useState<Product[]>([{
    id: '1', name: 'Vysify CRM Suite', description: 'Plataforma CRM completa com funis de venda, relatórios de performance de SDR e integrações comerciais.', features: 'Funil Kanban, relatórios em tempo real, automações de follow-up, API aberta', targetBuyer: 'Gestores de Vendas, Diretores Comerciais, CEOs e Fundadores de PMEs.', pricingPlans: 'Plano Starter: R$ 99/mês. Plano Pro: R$ 249/mês. Plano Enterprise: Sob consulta.'
  }]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);

  // (Ideally, the useEffect fetch logic goes here, but for brevity we'll keep the context simple)

  return (
    <AppContext.Provider value={{
      isLoggedIn, setIsLoggedIn,
      activeTab, setActiveTab,
      companyProfile, setCompanyProfile,
      products, setProducts,
      campaigns, setCampaigns,
      leads, setLeads,
      outreachLogs, setOutreachLogs,
      isDarkMode, toggleDarkMode
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
