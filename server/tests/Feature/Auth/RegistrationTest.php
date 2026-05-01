<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'brand_name' => 'Test Brand',
            'phone' => '+212612345678',
            'bank_name' => 'CIH',
            'rib' => '123456789012345678901234',
        ]);

        $this->assertAuthenticated();
        $response->assertNoContent();
    }
}
