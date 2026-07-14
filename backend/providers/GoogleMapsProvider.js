const LeadProvider = require('./LeadProvider');

class GoogleMapsProvider extends LeadProvider {
    constructor(apiKey) {
        super('GoogleMaps');
        this.apiKey = apiKey;
    }

    async searchLeads(criteria, limit = 10) {
        if (!this.apiKey) {
            console.warn('[GoogleMapsProvider] Chave da API ausente. Retornando leads simulados.');
            return this.simulateSearch(criteria);
        }

        const countryLabel = (criteria.countries && criteria.countries.length > 0) ? criteria.countries.join(', ') : '';
        const stateLabel = (criteria.states && criteria.states.length > 0) ? criteria.states.join(', ') : '';
        const region = [criteria.city, stateLabel, countryLabel].filter(Boolean).join(', ');
        const query = `${criteria.segment} in ${region}`;

        console.log(`[GoogleMapsProvider] Buscando na API oficial: ${query} (limite: ${limit})`);

        try {
            // 1. Text Search para achar os lugares
            const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
            const searchResponse = await fetch(textSearchUrl);
            const searchData = await searchResponse.json();

            if (searchData.status !== 'OK') {
                console.error('[GoogleMapsProvider] Erro na Text Search:', searchData.status, searchData.error_message);
                return [];
            }

            const results = searchData.results.slice(0, limit); // Limitar dinamicamente para respeitar o limite diário ou padrão
            const enrichedLeads = [];

            for (const place of results) {
                // 2. Place Details para pegar telefone e site
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,vicinity,rating&key=${this.apiKey}`;
                const detailsResponse = await fetch(detailsUrl);
                const detailsData = await detailsResponse.json();

                if (detailsData.status === 'OK') {
                    const d = detailsData.result;
                    enrichedLeads.push({
                        name: d.name || place.name,
                        website: d.website || '',
                        phone: d.formatted_phone_number || '',
                        vicinity: d.vicinity || place.formatted_address || '',
                        rating: d.rating || place.rating || 0
                    });
                }
            }

            return enrichedLeads;
        } catch (error) {
            console.error('[GoogleMapsProvider] Falha ao consultar API:', error.message);
            return [];
        }
    }

    simulateSearch(criteria) {
        const countryLabel = (criteria.countries && criteria.countries.length > 0) ? criteria.countries.join(', ') : 'BR';
        const stateLabel = (criteria.states && criteria.states.length > 0) ? criteria.states.join(', ') : '';
        const region = [criteria.city, stateLabel, countryLabel].filter(Boolean).join(', ');

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
                        website: '', 
                        phone: '+55 11 98888-2222',
                        vicinity: `Distrito, ${region}`,
                        rating: 4.2
                    }
                ]);
            }, 1000);
        });
    }

    formatLead(rawLead) {
        let cleanWebsite = rawLead.website ? rawLead.website.replace('https://', '').replace('http://', '').split('/')[0] : '';
        let emailGuess = cleanWebsite ? `contato@${cleanWebsite}` : '';

        return {
            id: 'gm_' + Date.now() + Math.floor(Math.random() * 1000),
            companyName: rawLead.name,
            website: rawLead.website || 'Desconhecido',
            contactName: 'Administração',
            contactRole: 'Gestor(a)',
            email: emailGuess,
            phone: rawLead.phone || 'Sem Telefone',
            status: 'found',
            score: 0,
            scoreReason: 'Aguardando Avaliação',
            importedAt: new Date().toISOString()
        };
    }
}

module.exports = GoogleMapsProvider;
