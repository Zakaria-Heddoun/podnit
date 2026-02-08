<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Handle EliteSpeed webhook for order status updates
     * 
     * This endpoint receives real-time status updates from EliteSpeed
     * when a parcel status changes
     */
    public function eliteSpeedWebhook(Request $request): JsonResponse
    {
        Log::info('EliteSpeed webhook received', $request->all());

        // Validate webhook token/signature if EliteSpeed provides one
        $webhookToken = $request->header('X-Webhook-Token') ?? $request->input('token');
        $expectedToken = config('services.elitespeed.webhook_token');

        if ($expectedToken && $webhookToken !== $expectedToken) {
            Log::warning('EliteSpeed webhook: Invalid token');
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Extract data from webhook payload
        // Adjust these fields based on actual EliteSpeed webhook structure
        $trackingNumber = $request->input('code_shippment') 
                       ?? $request->input('tracking_code') 
                       ?? $request->input('code');
        
        $status = $request->input('statut') 
               ?? $request->input('status') 
               ?? $request->input('last_status');
        
        // If status is nested in data array, extract it
        if (!$status && $request->has('data')) {
            $data = $request->input('data');
            if (is_array($data) && !empty($data)) {
                $latestEvent = is_array($data[0]) ? $data[0] : $data;
                $status = $latestEvent['status'] ?? null;
            }
        }

        if (!$trackingNumber || !$status) {
            Log::warning('EliteSpeed webhook: Missing required fields', $request->all());
            return response()->json(['error' => 'Missing required fields'], 400);
        }

        // Find order by tracking number
        $order = Order::where('tracking_number', $trackingNumber)->first();

        if (!$order) {
            Log::warning("EliteSpeed webhook: Order not found for tracking {$trackingNumber}");
            return response()->json(['error' => 'Order not found'], 404);
        }

        // Update shipping status
        $oldShippingStatus = $order->shipping_status;
        $oldStatus = $order->status;
        
        $order->shipping_status = $status;

        // Map EliteSpeed status to our internal status
        $newStatus = $this->mapEliteStatusToOrderStatus($status, $order->status);
        $order->status = $newStatus;

        // Check if it's a return status and restrict reshipping
        if ($order->isReturnStatus()) {
            $order->allow_reshipping = false;
        }

        $order->save();

        Log::info("Order status updated via webhook", [
            'order_number' => $order->order_number,
            'tracking_number' => $trackingNumber,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'old_shipping_status' => $oldShippingStatus,
            'new_shipping_status' => $status,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order status updated',
            'order_number' => $order->order_number,
            'status' => $newStatus
        ]);
    }

    /**
     * Map EliteSpeed status to our internal order status
     */
    private function mapEliteStatusToOrderStatus(string $eliteStatus, string $currentStatus): string
    {
        $eliteStatusLower = strtolower($eliteStatus);

        // Delivered/Paid statuses
        if (
            str_contains($eliteStatusLower, 'livré') ||
            str_contains($eliteStatusLower, 'delivered') ||
            str_contains($eliteStatusLower, 'payé') ||
            str_contains($eliteStatusLower, 'paid') ||
            str_contains($eliteStatusLower, 'vendeur remboursé')
        ) {
            return 'PAID';
        }

        // Return/Cancelled/Failed statuses
        if (
            str_contains($eliteStatusLower, 'retour') ||
            str_contains($eliteStatusLower, 'annul') ||
            str_contains($eliteStatusLower, 'refus') ||
            str_contains($eliteStatusLower, 'cancelled') ||
            str_contains($eliteStatusLower, 'change') ||
            str_contains($eliteStatusLower, 'échange') ||
            str_contains($eliteStatusLower, 'echange') ||
            str_contains($eliteStatusLower, 'manqué') ||
            str_contains($eliteStatusLower, 'pas de réponse') ||
            str_contains($eliteStatusLower, 'pas de reponse') ||
            str_contains($eliteStatusLower, 'hors zone') ||
            str_contains($eliteStatusLower, 'injoignable') ||
            str_contains($eliteStatusLower, 'colis non reçu') ||
            str_contains($eliteStatusLower, 'error colis') ||
            str_contains($eliteStatusLower, 'colis non change') ||
            str_contains($eliteStatusLower, 'faux destination') ||
            str_contains($eliteStatusLower, 'numero_erroné')
        ) {
            return 'RETURNED';
        }

        // In transit/Shipping statuses
        if (
            str_contains($eliteStatusLower, 'en cours') ||
            str_contains($eliteStatusLower, 'expédié') ||
            str_contains($eliteStatusLower, 'shipped') ||
            str_contains($eliteStatusLower, 'transit') ||
            str_contains($eliteStatusLower, 'livraison') ||
            str_contains($eliteStatusLower, 'en voyage') ||
            str_contains($eliteStatusLower, 'mise en distribution') ||
            str_contains($eliteStatusLower, 'reçu par livreur')
        ) {
            return 'SHIPPED';
        }

        // Preparing/Ready/Scheduled statuses
        if (
            str_contains($eliteStatusLower, 'préparation') ||
            str_contains($eliteStatusLower, 'ramassage') ||
            str_contains($eliteStatusLower, 'ramassé') ||
            str_contains($eliteStatusLower, 'pickup') ||
            str_contains($eliteStatusLower, 'prêt') ||
            str_contains($eliteStatusLower, 'réceptionné') ||
            str_contains($eliteStatusLower, 'en attente') ||
            str_contains($eliteStatusLower, 'programmé') ||
            str_contains($eliteStatusLower, 'reporté') ||
            str_contains($eliteStatusLower, 'interessé') ||
            str_contains($eliteStatusLower, 'demande de suivi') ||
            str_contains($eliteStatusLower, 'changement d\'adresse') ||
            str_contains($eliteStatusLower, 'changer livreur')
        ) {
            return 'DELIVERING';
        }

        // If no mapping found, keep current status
        return $currentStatus;
    }
}
