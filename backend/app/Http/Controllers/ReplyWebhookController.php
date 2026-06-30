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

        if ($openAiKey) {
            $prompt = "Classifique a seguinte resposta de email/mensagem recebida de um lead no contexto B2B:\n\n"
                    . "\"{$replyText}\"\n\n"
                    . "Escolha exatamente uma das seguintes tags de classificação:\n"
                    . "- interested (se o lead demonstrou interesse, quer saber mais, pediu apresentação ou agendamento)\n"
                    . "- not_interested (se o lead recusou, disse que não precisa, ou pediu para remover da lista)\n"
                    . "- out_of_office (se for mensagem automática de ausência)\n"
                    . "Retorne apenas a tag escolhida, sem pontuação.";

            try {
                $response = Http::withToken($openAiKey)->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [['role' => 'user', 'content' => $prompt]],
                    'temperature' => 0.0
                ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $tag = trim(strtolower($json['choices'][0]['message']['content'] ?? ''));
                    if (in_array($tag, ['interested', 'not_interested', 'out_of_office'])) {
                        $sentiment = $tag;
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
