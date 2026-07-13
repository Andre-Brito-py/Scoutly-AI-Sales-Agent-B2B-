const LeadProvider = require('./LeadProvider');

class ApolloProvider extends LeadProvider {
    constructor(apiKey) {
        super('Apollo');
        this.apiKey = apiKey;
    }

    async searchLeads(criteria) {
        if (!this.apiKey) {
            console.warn('[ApolloProvider] Chave da API do Apollo.io ausente. Retornando contatos simulados.');
            return this.simulateSearch(criteria);
        }

        // Montando filtros via query params na URL ( Apollo POST exige query params e body {} )
        const queryParams = new URLSearchParams();
        queryParams.append('api_key', this.apiKey);
        
        // Limitar quantidade
        queryParams.append('per_page', '10');

        // Palavras-chave / Segmento
        if (criteria.segment) {
            queryParams.append('q_keywords', criteria.segment);
        }

        // Cargos (titles)
        if (criteria.titles) {
            // Se vier string separada por vírgula
            const titlesArray = criteria.titles.split(',').map(t => t.trim());
            titlesArray.forEach(title => {
                queryParams.append('person_titles[]', title);
            });
        }

        // Localizações (País, Estado, Cidade)
        const locations = [];
        if (criteria.city) locations.push(criteria.city);
        if (criteria.states && criteria.states.length > 0) locations.push(...criteria.states);
        if (criteria.countries && criteria.countries.length > 0) locations.push(...criteria.countries);

        locations.forEach(loc => {
            queryParams.append('person_locations[]', loc);
        });

        const url = `https://api.apollo.io/api/v1/mixed_people/api_search?${queryParams.toString()}`;
        console.log(`[ApolloProvider] Buscando leads no Apollo.io: ${criteria.segment} (${criteria.titles || 'Todos os cargos'})`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[ApolloProvider] Erro na API do Apollo (${response.status}):`, errText);
                return [];
            }

            const data = await response.json();
            return data.people || [];
        } catch (error) {
            console.error('[ApolloProvider] Falha na requisição ao Apollo.io:', error.message);
            return [];
        }
    }

    simulateSearch(criteria) {
        const titles = criteria.titles ? criteria.titles.split(',').map(t => t.trim()) : ['CEO', 'Founder', 'Diretor'];
        const domain = 'empresaexemplo.com';
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                  {
                    id: 'sim_peop_' + Math.floor(Math.random() * 100000),
                    first_name: 'Guilherme',
                    last_name: 'Almeida',
                    name: 'Guilherme Almeida',
                    title: titles[0] || 'CEO',
                    email: `guilherme.almeida@${domain}`,
                    organization: {
                        name: `${criteria.segment || 'Negócio'} Corporativo S/A`,
                        website_url: `https://www.${domain}`,
                        primary_domain: domain
                    }
                  },
                  {
                    id: 'sim_peop_' + Math.floor(Math.random() * 100000),
                    first_name: 'Renata',
                    last_name: 'Souza',
                    name: 'Renata Souza',
                    title: titles[1] || titles[0] || 'Founder',
                    email: `renata.souza@${domain}`,
                    organization: {
                        name: `${criteria.segment || 'Negócio'} Growth Partners`,
                        website_url: `https://www.${domain}`,
                        primary_domain: domain
                    }
                  }
                ]);
            }, 1200);
        });
    }

    formatLead(rawLead) {
        const orgName = rawLead.organization?.name || 'Empresa Privada';
        let website = rawLead.organization?.website_url || 'Desconhecido';
        
        // Se o site do Apollo vier sem protocolo
        if (website !== 'Desconhecido' && !website.startsWith('http://') && !website.startsWith('https://')) {
            website = 'https://' + website;
        }

        return {
            id: 'ap_' + (rawLead.id || Date.now() + Math.floor(Math.random() * 1000)),
            companyName: orgName,
            website: website,
            contactName: rawLead.name || `${rawLead.first_name || 'Contato'} ${rawLead.last_name || ''}`.trim(),
            contactRole: rawLead.title || 'Decisor B2B',
            email: rawLead.email || '',
            phone: 'Sem Telefone', // Apollo People API não traz telefone direto na busca gratuita
            status: 'found',
            score: 0,
            scoreReason: 'Aguardando Avaliação',
            importedAt: new Date().toISOString()
        };
    }
}

module.exports = ApolloProvider;
