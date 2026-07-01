const LeadProvider = require('./LeadProvider');

class GoogleMapsProvider extends LeadProvider {
    constructor() {
        super('GoogleMaps');
    }

    async searchLeads(criteria) {
        // Implementação Mockada (PoC) simulando integração real com a API do Google Maps Places
        console.log(`[GoogleMapsProvider] Buscando leads para critério: ${criteria.segment} em ${criteria.city}`);
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        name: `Clínica Odontológica Padrão - ${criteria.city}`,
                        website: 'https://clinica-exemplo.com.br',
                        phone: '+55 11 99999-1111',
                        vicinity: `Centro, ${criteria.city}`,
                        rating: 4.8
                    },
                    {
                        name: `Instituto de Odontologia Avançada`,
                        website: '', // Sem site
                        phone: '+55 11 98888-2222',
                        vicinity: `Jardins, ${criteria.city}`,
                        rating: 4.2
                    }
                ]);
            }, 1000);
        });
    }

    formatLead(rawLead) {
        return {
            id: 'gm_' + Date.now() + Math.floor(Math.random() * 1000),
            companyName: rawLead.name,
            website: rawLead.website || 'Desconhecido',
            contactName: 'Administração',
            contactRole: 'Gestor(a)',
            email: rawLead.website ? `contato@${rawLead.website.replace('https://', '')}` : '',
            phone: rawLead.phone,
            status: 'found',
            score: 0,
            scoreReason: 'Aguardando Avaliação',
            importedAt: new Date().toISOString()
        };
    }
}

module.exports = GoogleMapsProvider;
