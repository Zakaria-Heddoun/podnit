<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
            'email' => ['required', 'string', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', Rules\Password::defaults()],
            'phone' => ['required', 'string', 'max:20'],
            'brand_name' => ['nullable', 'string', 'max:255'],
            'cin' => ['nullable', 'string', 'max:20'],
            'bank_name' => ['required', 'string', 'max:255'],
            'rib' => ['required', 'string', 'size:24'],
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'brand_name' => $request->brand_name,
            'cin' => $request->cin,
            'bank_name' => $request->bank_name,
            'rib' => $request->rib,
            'role' => 'seller',
            'is_active' => true,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return response()->noContent();
    }
}
