<?php

namespace App\Jobs;

use App\Domains\Tenant\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class CalculateLeadScoreJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Lead $lead;

    public function __construct(Lead $lead)
    {
        $this->lead = $lead;
    }

    public function handle(): void
    {
        $campaign = $this->lead->campaign;
        $campaign->update([
            'progress' => 65,
            'current_step' => "Calculando Lead Score para tomador de decisão da {$this->lead->company_name}...",
        ]);

        // Evaluate lead score using commercial target rules
        // In production, configure an API call to OpenAI/Gemini matching lead context and target product specs
        $targetProduct = $campaign->targetProduct;
        
        // Mocking an AI scoring logic
        $score = rand(45, 98);
        $reason = "Apresenta excelente fit comercial com o produto {$targetProduct->name}. ";
        if ($score >= 80) {
            $reason .= "Estrutura organizacional ativa com fit para o cargo de {$this->lead->contact_role} e alta relevância geográfica.";
        } else {
            $reason .= "A empresa parece possuir equipe comercial reduzida ou nicho de mercado tradicional demais para automação ativa.";
        }

        $this->lead->update([
            'score' => $score,
            'score_reason' => $reason,
        ]);

        if ($score >= 80) {
            // Highly qualified: generate personalized outreach copywriting
            GeneratePersonalizedMessageJob::dispatch($this->lead);
        } else {
            // Unqualified
            $this->lead->update(['status' => 'lost']);
        }
    }
}
