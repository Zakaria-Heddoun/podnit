<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\WelcomeMail;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): Response
    {
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', Rules\Password::defaults()],
            'brand_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20', 'regex:/^[\+]?[0-9]{10,}$/'],
            'account_holder' => ['required', 'string', 'max:255'],
            'bank_name' => ['required', 'string', 'in:CIH,ATTIJARI,BMCE,BMCI,CREDIT_AGRICOLE,SOCIETE_GENERALE,CFG,OTHER'],
            'rib' => ['required', 'string', 'size:24', 'regex:/^[0-9]{24}$/'],
            'referred_by_code' => ['nullable', 'string', 'exists:users,referral_code'],
        ]);

        // Generate a unique referral code for the new seller
        $referralCode = $this->generateUniqueReferralCode();

        // Find the referring user if referral code is provided
        $referrer = null;
        if ($request->filled('referred_by_code')) {
            $referrer = User::where('referral_code', $request->referred_by_code)->first();
        }

        $user = User::create([
            'name' => $request->first_name . ' ' . $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->string('password')),
            'role' => 'seller', // All new registrations are sellers
            'brand_name' => $request->brand_name,
            'phone' => $request->phone,
            'account_holder' => $request->account_holder,
            'bank_name' => $request->bank_name,
            'rib' => $request->rib,
            'referral_code' => $referralCode,
            'referred_by_id' => $referrer?->id,
        ]);

        // Points are granted when orders are placed, not at signup.

        event(new Registered($user));

        // Send welcome email
        try {
            Mail::to($user->email)->send(new WelcomeMail($user));
        } catch (\Exception $e) {
            // Log error but don't fail registration
            \Log::error('Failed to send welcome email: ' . $e->getMessage());
        }

        Auth::login($user);

        return response()->noContent();
    }

    /**
     * Generate a unique referral code
     */
    private function generateUniqueReferralCode(): string
    {
        do {
            // Generate a 6-character alphanumeric referral code
            $code = strtoupper(Str::random(6));
        } while (User::where('referral_code', $code)->exists());

        return $code;
    }
}
