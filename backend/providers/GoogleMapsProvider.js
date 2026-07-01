const LeadProvider = require('./LeadProvider');

class GoogleMapsProvider extends LeadProvider {
    constructor() {
        super('GoogleMaps');
    }

    async searchLeads(criteria) {
        // criteria can have: segment, city, countries[], states[], language
        const countryLabel = (criteria.countries && criteria.countries.length > 0) ? criteria.countries.join(', ') : 'BR';
        const stateLabel = (criteria.states && criteria.states.length > 0) ? criteria.states.join(', ') : '';
        const region = [criteria.city, stateLabel, countryLabel].filter(Boolean).join(', ');

        console.log(`[GoogleMapsProvider] Buscando leads para critério: ${criteria.segment} na região: ${region}`);
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        name: `${criteria.segment} Padrão - ${region}`,
                        website: 'https://clinica-exemplo.com.br',
                        phone: '+55 11 99999-1111',
                        vicinity: `Centro, ${region}`,
                        rating: 4.8
                    },
                    {
                        name: `Instituto de ${criteria.segment} Avançada`,
                        website: '', // Sem site
                        phone: '+55 11 98888-2222',
                        vicinity: `Distrito, ${region}`,
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
