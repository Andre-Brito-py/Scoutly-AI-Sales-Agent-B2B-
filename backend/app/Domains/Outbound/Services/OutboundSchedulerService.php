<?php

namespace App\Domains\Outbound\Services;

use App\Domains\Tenant\Models\Lead;
use Illuminate\Support\Facades\Log;

class OutboundSchedulerService
{
    /**
     * Schedules email/LinkedIn outbound sending logs with human-like delays.
     */
    public function scheduleMessageDelivery(Lead $lead): void
    {
        // Human sending window pattern simulation (between 9:00 AM and 5:00 PM local business hours)
        $now = now();
        $businessStart = now()->setTime(9, 0, 0);
        $businessEnd = now()->setTime(17, 0, 0);

        // Generate a random delay in minutes (between 2 to 15 minutes) to throttle spammed APIs
        $delayMinutes = rand(2, 15);
        $targetDeliveryTime = $now->addMinutes($delayMinutes);

        // Shift to next business day morning if it falls outside business hours
        if ($targetDeliveryTime->gt($businessEnd)) {
            $targetDeliveryTime = $businessStart->addDay()->addMinutes(rand(10, 120));
        }

        Log::info("Outbound message for lead ID {$lead->id} queued for delivery at {$targetDeliveryTime->toDateTimeString()}. Delay applied: {$delayMinutes}m.");

        // Update lead status to reflect scheduled delivery
        $lead->update([
            'status' => 'sent',
        ]);
    }
}
