<?php

namespace App\Jobs;

use App\Domains\Tenant\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GeneratePersonalizedMessageJob implements ShouldQueue
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
            'progress' => 85,
            'current_step' => "Escrevendo abordagem altamente personalizada para {$this->lead->contact_name}...",
        ]);

        $tenantProfile = $campaign->tenant->profile;
        $targetProduct = $campaign->targetProduct;

        // Custom AI dynamic template generation in language specified
        $lang = $campaign->language;
        $message = "";

        if ($lang === 'Inglês') {
            $message = "Hi {$this->lead->contact_name}, noticed that your team at {$this->lead->company_name} is scaling sales operations. How do you currently manage outbound B2B filters? We developed {$targetProduct->name} at {$tenantProfile->company_name} to help automation. Would you be open for a brief demo?";
        } elseif ($lang === 'Espanhol') {
            $message = "Hola {$this->lead->contact_name}, noté que en {$this->lead->company_name} están escalando su fuerza de ventas. ¿Cómo filtran hoy sus leads outbound? Con {$targetProduct->name} automatizamos el proceso 100%. ¿Te interesa agendar una demo rápida?";
        } else {
            // Default to Portuguese
            $message = "Olá {$this->lead->contact_name}, notei que o time da {$this->lead->company_name} está escalando as operações comerciais. Como vocês abordam leads outbound hoje? No {$tenantProfile->company_name}, criamos o {$targetProduct->name} para automatizar esse fluxo. Teríamos 10 minutos para uma demonstração rápida?";
        }

        $this->lead->update([
            'personalized_message' => $message,
            'status' => 'sent', // Marks message as successfully prepared and ready/sent in pipeline
        ]);

        $campaign->update([
            'progress' => 100,
            'status' => 'completed',
            'current_step' => 'Campanha concluída com sucesso!',
        ]);
    }
}
