<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class OzonService
{
    private string $baseUrl = 'https://api.ozonexpress.ma/customers';
    private string $apiKey;
    private string $customerId;

    public function __construct()
    {
        $this->apiKey = config('services.ozon.api_key');
        $this->customerId = config('services.ozon.customer_id');
    }

    private function endpoint(string $path): string
    {
        return "{$this->baseUrl}/{$this->customerId}/{$this->apiKey}/{$path}";
    }

    /**
     * Fetch the OZON city list (cached 24h).
     * Returns array of lowercase name => city ID.
     */
    public function getCities(): array
    {
        return Cache::remember('ozon_cities', 86400, function () {
            $response = Http::get('https://api.ozonexpress.ma/cities');

            if (!$response->successful()) {
                throw new \Exception('OZON: Failed to fetch city list: ' . $response->body());
            }

            $cities = [];
            foreach ($response->json('CITIES', []) as $city) {
                $cities[strtolower($city['NAME'])] = (int) $city['ID'];
            }

            return $cities;
        });
    }

    /**
     * Resolve an OZON city ID from a free-form city name.
     * Tries exact match first, then prefix match.
     *
     * @throws \Exception if the city cannot be matched
     */
    public function resolveCityId(string $cityName): int
    {
        $cities = $this->getCities();
        $lower  = strtolower(trim($cityName));

        if (isset($cities[$lower])) {
            return $cities[$lower];
        }

        foreach ($cities as $name => $id) {
            if (str_starts_with($name, $lower) || str_starts_with($lower, $name)) {
                return $id;
            }
        }

        throw new \Exception("OZON: Cannot resolve city '{$cityName}' to an OZON city ID");
    }

    /**
     * Step 1 — Register a parcel in OZON.
     * Returns the OZON-assigned tracking number (e.g. "OZE123456789").
     *
     * @param int    $cityId      OZON city ID (from resolveCityId)
     * @param int    $stock       0 = ramassage (pickup), 1 = stock
     */
    public function createParcel(
        string  $receiver,
        string  $phone,
        string  $address,
        int     $cityId,
        float   $price,
        int     $stock = 0,
        ?string $orderRef = null,
        ?string $note = null
    ): string {
        // OZON requires local Moroccan format (0XXXXXXXXX), not +212XXXXXXXXX
        $phone = preg_replace('/^\+212/', '0', $phone);

        $payload = [
            'parcel-receiver' => $receiver,
            'parcel-phone'    => $phone,
            'parcel-city'     => $cityId,
            'parcel-address'  => $address,
            'parcel-price'    => $price,
            'parcel-stock'    => $stock,
        ];

        if ($orderRef !== null) {
            $payload['tracking-number'] = $orderRef;
        }
        if ($note !== null) {
            $payload['parcel-note'] = $note;
        }

        $response = Http::asMultipart()->post($this->endpoint('add-parcel'), $payload);

        Log::info('OZON: add-parcel response', [
            'status' => $response->status(),
            'body'   => $response->body(),
        ]);

        if (!$response->successful()) {
            throw new \Exception('OZON: add-parcel HTTP error ' . $response->status() . ': ' . $response->body());
        }

        $data     = $response->json();
        $ozonCode = $data['TRACKING-NUMBER'] ?? null;

        if (!$ozonCode) {
            throw new \Exception('OZON: Parcel registered but no TRACKING-NUMBER in response: ' . $response->body());
        }

        Log::info('OZON: Parcel created', ['ozon_code' => $ozonCode]);

        return (string) $ozonCode;
    }

    /**
     * Step 2 — Create a Bon de Livraison grouping the given OZON parcel codes.
     * Returns the BL reference string.
     */
    public function createDeliveryNote(array $ozonCodes): string
    {
        $formData = [];
        foreach ($ozonCodes as $i => $code) {
            $formData["Codes[{$i}]"] = $code;
        }

        $response = Http::asForm()->post($this->endpoint('add-delivery-note'), $formData);

        Log::info('OZON: add-delivery-note response', [
            'codes'  => $ozonCodes,
            'status' => $response->status(),
            'body'   => $response->body(),
        ]);

        if (!$response->successful()) {
            throw new \Exception('OZON: add-delivery-note HTTP error ' . $response->status() . ': ' . $response->body());
        }

        $data  = $response->json();
        $addBl = $data['ADD-BL'] ?? [];

        if (($addBl['RESULT'] ?? '') !== 'SUCCESS') {
            $msg = $addBl['MESSAGE'] ?? ($data['message'] ?? 'Unknown error');
            throw new \Exception('OZON: Delivery note creation failed: ' . $msg);
        }

        $ref = $addBl['NEW-BL']['REF'] ?? null;

        if (!$ref) {
            throw new \Exception('OZON: Delivery note succeeded but BL reference missing in response: ' . $response->body());
        }

        Log::info('OZON: Delivery note created', ['bl_ref' => $ref]);

        return (string) $ref;
    }

    /**
     * Step 3 — Finalize (save) a delivery note so it can be printed.
     */
    public function saveDeliveryNote(string $ref): void
    {
        $response = Http::asForm()->post($this->endpoint('save-delivery-note'), ['Ref' => $ref]);

        Log::info('OZON: save-delivery-note response', [
            'ref'    => $ref,
            'status' => $response->status(),
            'body'   => $response->body(),
        ]);

        if (!$response->successful()) {
            throw new \Exception('OZON: save-delivery-note HTTP error ' . $response->status() . ': ' . $response->body());
        }

        $data   = $response->json();
        $saveBl = $data['SAVE-BL'] ?? [];

        if (($saveBl['RESULT'] ?? '') !== 'SUCCESS') {
            $msg = $saveBl['MESSAGE'] ?? 'Unknown error';
            throw new \Exception('OZON: Delivery note save failed: ' . $msg);
        }

        Log::info('OZON: Delivery note saved', ['ref' => $ref]);
    }

    /**
     * Full shipping workflow:
     *   1. Register parcel in OZON → OZON tracking code
     *   2. Create BL with that code  → BL reference
     *   3. Save BL
     *
     * Returns the BL reference (stored as order tracking_number).
     */
    public function shipParcel(
        string  $receiver,
        string  $phone,
        string  $address,
        string  $cityName,
        float   $price,
        ?string $orderRef = null,
        ?string $note = null
    ): string {
        $cityId = $this->resolveCityId($cityName);

        $ozonCode = $this->createParcel(
            receiver: $receiver,
            phone:    $phone,
            address:  $address,
            cityId:   $cityId,
            price:    $price,
            stock:    0,
            orderRef: $orderRef,
            note:     $note ?: null,
        );

        $blRef = $this->createDeliveryNote([$ozonCode]);

        // saveDeliveryNote is managed by the OZON driver at pickup — skip silently if it fails
        try {
            $this->saveDeliveryNote($blRef);
        } catch (\Exception $e) {
            Log::warning('OZON: saveDeliveryNote skipped', ['bl_ref' => $blRef, 'reason' => $e->getMessage()]);
        }

        return $blRef;
    }

    /**
     * Build the PDF download URLs for a finalized delivery note.
     *
     * @return array{standard: string, labels_a4: string, labels_10x10: string}
     */
    public function getPdfUrls(string $ref): array
    {
        $base = 'https://client.ozoneexpress.ma';

        return [
            'standard'     => "{$base}/pdf-delivery-note?dn-ref={$ref}",
            'labels_a4'    => "{$base}/pdf-delivery-note-tickets?dn-ref={$ref}",
            'labels_10x10' => "{$base}/pdf-delivery-note-tickets-4-4?dn-ref={$ref}",
        ];
    }
}
