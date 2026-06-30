<?php

namespace App\Jobs;

use Illuminate\Support\Facades\Http;
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
    protected array $apiKeys;

    public function __construct(Lead $lead, array $apiKeys = [])
    {
        $this->lead = $lead;
        $this->apiKeys = $apiKeys;
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
        $lang = $campaign->language;

        $openAiKey = $this->apiKeys['openai'] ?? null;
        $message = "";

        // Meeting schedule link (change to your Cal.com / Calendly / Google Calendar appointment link)
        $calendarLink = "https://calendly.com/vysify-crm/demo";

        if ($openAiKey) {
            $prompt = "Escreva uma mensagem de email de abordagem fria (cold outreach) curta e objetiva, no idioma '{$lang}', com tom de voz '{$tenantProfile->brand_voice}'.\n"
                    . "O remetente é da empresa '{$tenantProfile->company_name}' ({$tenantProfile->description}), oferecendo o produto '{$targetProduct->name}' ({$targetProduct->description}) para a persona '{$this->lead->contact_role}' da empresa '{$this->lead->company_name}'.\n"
                    . "Explique brevemente um benefício ou dor que resolvemos para a persona.\n"
                    . "CTA final: Chamar para uma conversa rápida de 10 minutos sugerindo marcar no link: {$calendarLink}.\n"
                    . "Não envie cabeçalho, assunto ou rodapé. Envie apenas o corpo do texto de forma direta, sem aspas.";

            try {
                $response = Http::withToken($openAiKey)->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [['role' => 'user', 'content' => $prompt]],
                    'temperature' => 0.7
                ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $message = trim($json['choices'][0]['message']['content'] ?? "");
                }
            } catch (\Exception $e) {
                // Falls back to static templates below on failure
            }
        }

        // Static Template Fallbacks if OpenAI key is missing or failed
        if (empty($message)) {
            if ($lang === 'Inglês') {
                $message = "Hi {$this->lead->contact_name}, noticed that your team at {$this->lead->company_name} is scaling sales operations. How do you currently manage outbound B2B filters? We developed {$targetProduct->name} at {$tenantProfile->company_name} to help automation. Would you be open for a brief demo? Book here: {$calendarLink}";
            } elseif ($lang === 'Espanhol') {
                $message = "Hola {$this->lead->contact_name}, noté que en {$this->lead->company_name} están escalando su fuerza de ventas. ¿Cómo filtran hoy sus leads outbound? Con {$targetProduct->name} automatizamos el proceso 100%. ¿Te interesa agendar una demo rápida? Elige un horario: {$calendarLink}";
            } else {
                // Default to Portuguese
                $message = "Olá {$this->lead->contact_name}, notei que o time da {$this->lead->company_name} está buscando otimizar as operações comerciais. Como vocês abordam leads outbound hoje? No {$tenantProfile->company_name}, criamos o {$targetProduct->name} para automatizar esse fluxo. Teríamos 10 minutos para uma demonstração rápida? Agende aqui: {$calendarLink}";
            }
        }

        $this->lead->update([
            'personalized_message' => $message,
            'status' => 'sent',
        ]);

        // Dispatch outbound Resend delivery email if contact email and resend key exist
        if ($this->lead->contact_email && !empty($this->apiKeys['resend'])) {
            SendOutreachEmailJob::dispatch($this->lead, $this->apiKeys);
        }

        // Dispatch WhatsApp message if contact phone and whatsapp token exist
        if ($this->lead->contact_phone && !empty($this->apiKeys['whatsapp_token'])) {
            SendOutreachWhatsappJob::dispatch($this->lead, $this->apiKeys);
        }

        // Dispatch Telegram message if telegram token and chat ID exist
        if (!empty($this->apiKeys['telegram_token']) && !empty($this->apiKeys['telegram_chat_id'])) {
            SendOutreachTelegramJob::dispatch($this->lead, $this->apiKeys);
        }

        $campaign->update([
            'progress' => 100,
            'status' => 'completed',
            'current_step' => 'Campanha concluída com sucesso!',
        ]);
    }
}
