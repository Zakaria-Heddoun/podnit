<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Generic delivery status webhook.
     *
     * Accepts push notifications from any delivery provider that sends
     * { tracking_number, status } (or compatible aliases).
     * Returns are NOT automatically triggered here; use the manual
     * POST /admin/orders/{id}/mark-returned endpoint instead.
     */
    public function deliveryWebhook(Request $request): JsonResponse
    {
        Log::info('Delivery webhook received', $request->all());

        // Extract tracking reference (BL ref for OZON)
        $trackingNumber = $request->input('tracking_number')
                       ?? $request->input('bl_ref')
                       ?? $request->input('ref')
                       ?? $request->input('code');

        // Extract status
        $status = $request->input('status')
               ?? $request->input('statut')
               ?? $request->input('last_status');

        if (!$trackingNumber || !$status) {
            Log::warning('Delivery webhook: missing tracking_number or status', $request->all());
            return response()->json(['error' => 'Missing required fields: tracking_number and status'], 400);
        }

        $order = Order::where('tracking_number', $trackingNumber)->first();

        if (!$order) {
            Log::warning("Delivery webhook: no order found for tracking ref {$trackingNumber}");
            return response()->json(['error' => 'Order not found'], 404);
        }

        $oldStatus = $order->status;

        $order->update([
            'shipping_status' => $status,
            'status'          => $status,
        ]);

        Log::info('Order status updated via webhook', [
            'order_number'       => $order->order_number,
            'tracking_number'    => $trackingNumber,
            'old_status'         => $oldStatus,
            'new_status'         => $status,
        ]);

        return response()->json([
            'success'      => true,
            'order_number' => $order->order_number,
            'status'       => $status,
        ]);
    }
}
