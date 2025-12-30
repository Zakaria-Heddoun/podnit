<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EliteSpeedService
{
    private string $baseUrl = 'https://Elitelivraison.com/api';
    private string $token;

    public function __construct()
    {
        $this->token = config('services.elitespeed.token');
    }

    /**
     * Create a new parcel in EliteSpeed
     * 
     * @param array $data payload for creation
     * @return array response from API
     */
    public function createParcel(array $data)
    {
        Log::info('EliteSpeed: Creating parcel', $data);

        // Required headers
        $headers = [
            'Accept' => 'application/json',
            'api-Token' => $this->token,
        ];

        // Ensure defaults for required fields if not present
        // (Though Controller should handle main validation/mapping)
        $data = array_merge([
            'from_stock' => 0,
            'change' => 0,
            'openpackage' => 0, // Default to 0? User can override by passing data
        ], $data);
        
        // POST to https://Elitelivraison.com/api/client/post/colis/add-colis
        $response = Http::withHeaders($headers)
            ->post("{$this->baseUrl}/client/post/colis/add-colis", $data);

        if ($response->successful()) {
            Log::info('EliteSpeed: Parcel created successfully', $response->json());
            return $response->json();
        }

        Log::error('EliteSpeed: Failed to create parcel', [
            'status' => $response->status(),
            'body' => $response->body()
        ]);
        
        throw new \Exception('Failed to create parcel on EliteSpeed: ' . $response->body());
    }

    /**
     * Track a parcel by code
     */
    public function trackParcel(string $code)
    {
        $headers = [
            'Accept' => 'application/json',
            'api-Token' => $this->token,
        ];

        // GET https://Elitelivraison.com/api/client/colis/track/{code}
        $response = Http::withHeaders($headers)
            ->get("{$this->baseUrl}/client/colis/track/{$code}");

        if ($response->successful()) {
            return $response->json();
        }

        return null;
    }

    /**
     * List parcels waiting for pickup (ramassage)
     */
    public function listPickupParcels()
    {
         $headers = [
            'Accept' => 'application/json',
            'api-Token' => $this->token,
        ];

        // GET https://Elitelivraison.com/api/client/colis/list-colis-ramassage/
        $response = Http::withHeaders($headers)
            ->get("{$this->baseUrl}/client/colis/list-colis-ramassage/");

        if ($response->successful()) {
            return $response->json();
        }
        
        throw new \Exception('Failed to fetch pickup list: ' . $response->body());
    }
}
