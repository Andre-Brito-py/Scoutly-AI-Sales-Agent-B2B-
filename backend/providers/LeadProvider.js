/**
 * Classe base para todos os provedores de Leads.
 * Define a interface (contrato) que todo minerador deve seguir.
 */
class LeadProvider {
    constructor(name) {
        this.name = name;
        if (this.constructor === LeadProvider) {
            throw new Error("Não é possível instanciar a classe abstrata LeadProvider diretamente.");
        }
    }

    /**
     * @param {Object} criteria Critérios de busca (segmento, cidade, cargo)
     * @returns {Promise<Array>} Retorna um array de objetos de Leads brutos
     */
    async searchLeads(criteria) {
        throw new Error("Método 'searchLeads' deve ser implementado nas classes filhas.");
    }

    /**
     * Formata um lead cru do provider para o formato padrão do Scoutly
     * @param {Object} rawLead
     * @returns {Object} Lead formatado
     */
    formatLead(rawLead) {
        throw new Error("Método 'formatLead' deve ser implementado nas classes filhas.");
    }
}

module.exports = LeadProvider;
