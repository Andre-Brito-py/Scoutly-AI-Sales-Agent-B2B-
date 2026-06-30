<?php

namespace App\Http\Controllers;

use App\Domains\Tenant\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReplyWebhookController
{
    public function handle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'reply_text' => 'required|string',
        ]);

        $lead = Lead::findOrFail($validated['lead_id']);
        $replyText = $validated['reply_text'];

        $campaign = $lead->campaign;
        
        // Use OpenAI GPT-4o-Mini to analyze response sentiment
        // In sandbox fallback mode, check string matching
        $sentiment = 'not_interested'; 
        
        // Find stored OpenAI key inside headers or config (fallback to mock)
        $openAiKey = $request->header('X-OpenAI-Key') ?? env('OPENAI_API_KEY');

        $targetProduct = $campaign->targetProduct;
        $tenantProfile = $campaign->tenant->profile;

        $pricingContext = $targetProduct ? ($targetProduct->pricing_plans ?? 'Planos sob consulta.') : 'Planos sob consulta.';
        $domainContext = $tenantProfile ? ($tenantProfile->company_domain ?? 'Acesse nosso site comercial.') : 'Acesse nosso site comercial.';

        if ($openAiKey) {
            $prompt = "Você é um SDR B2B que recebeu uma resposta de um prospect.\n"
                    . "Mensagem do prospect: \"{$replyText}\"\n\n"
                    . "Informações da sua empresa:\n"
                    . "- Nome da empresa: {$tenantProfile->company_name}\n"
                    . "- Domínio/Site: {$domainContext}\n"
                    . "- Tabela de preços e planos: {$pricingContext}\n\n"
                    . "Analise se o prospect está solicitando informações de planos/valores OU perguntando qual é a empresa/site.\n"
                    . "Retorne um objeto JSON contendo exatamente os seguintes campos:\n"
                    . "1. \"sentiment\": Classifique a resposta em \"interested\" (se quer marcar reunião, demonstrou interesse, ou quer saber mais), \"not_interested\" (se recusou ou pediu opt-out), ou \"out_of_office\".\n"
                    . "2. \"ai_reply\": Se o prospect perguntou sobre preços/planos ou sobre qual é a empresa/site, redija uma resposta curta de 1 frase respondendo à pergunta dele de forma direta usando as informações fornecidas e sugerindo marcar uma demo. Caso contrário, deixe este campo vazio.\n\n"
                    . "Retorne apenas o JSON. Não envie introdução ou Markdown.";

            try {
                $response = Http::withToken($openAiKey)->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [['role' => 'user', 'content' => $prompt]],
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => 0.2
                ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $content = json_decode($json['choices'][0]['message']['content'] ?? '{}', true);
                    $tag = trim(strtolower($content['sentiment'] ?? ''));
                    if (in_array($tag, ['interested', 'not_interested', 'out_of_office'])) {
                        $sentiment = $tag;
                    }
                    $aiReplyText = $content['ai_reply'] ?? '';
                    if (!empty($aiReplyText)) {
                        Log::info("Prepared AI reply response: " . $aiReplyText);
                    }
                }
            } catch (\Exception $e) {
                Log::error("Failed reply classification API call: " . $e->getMessage());
            }
        } else {
            // String matching fallback
            $lowerText = strtolower($replyText);
            if (str_contains($lowerText, 'sim') || str_contains($lowerText, 'quero') || str_contains($lowerText, 'marcar') || str_contains($lowerText, 'interesse')) {
                $sentiment = 'interested';
            }
        }

        // Update Lead CRM status
        $status = 'responded';
        if ($sentiment === 'interested') {
            $status = 'booked';
            
            // Register conversion to A/B test variant
            $abTest = $campaign->abTests()->where('variant_name', $lead->ab_variant)->first();
            if ($abTest) {
                $abTest->increment('conversion_count');
            }
        } elseif ($sentiment === 'not_interested') {
            $status = 'lost';
        }

        $lead->update([
            'status' => $status,
            'reply_sentiment' => $sentiment,
        ]);

        return response()->json([
            'message' => 'Lead reply sentiment classified successfully.',
            'lead_id' => $lead->id,
            'sentiment' => $sentiment,
            'new_status' => $status
        ]);
    }
}
