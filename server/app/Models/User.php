<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Notifications\ResetPassword as ResetPasswordNotification;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'role_id',
        'brand_name',
        'phone',
        'cin',
        'account_holder',
        'bank_name',
        'rib',
        'balance',
        'points',
        'referral_code',
        'referred_by_id',
        'is_verified',
        'is_active',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'balance' => 'decimal:2',
            'is_verified' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // Seller relationships
    public function referredBy()
    {
        return $this->belongsTo(User::class, 'referred_by_id');
    }

    public function referrals()
    {
        return $this->hasMany(User::class, 'referred_by_id');
    }

    // Orders relationship (for sellers)
    public function sellerOrders()
    {
        return $this->hasMany(Order::class, 'seller_id');
    }

    // Helper methods
    public function isSeller(): bool
    {
        return $this->role === 'seller';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function templates()
    {
        return $this->hasMany(Template::class);
    }

    public function roleRelation()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Check whether the user has a given permission key.
     */
    public function hasPermission(string $permission): bool
    {
        // Admin string role has everything
        if ($this->isAdmin()) {
            return true;
        }

        // Check attached role model
        if ($this->roleRelation) {
            $perms = $this->roleRelation->permissions ?? [];
            if (is_array($perms) && in_array($permission, $perms, true)) {
                return true;
            }
        }

        // Fallback: if legacy role string maps to broad permissions
        // (optional) - keep simple: no permission
        return false;
    }

    /**
     * Generate a unique referral code for the user
     */
    public static function generateUniqueReferralCode(): string
    {
        do {
            // Generate a 6-character alphanumeric referral code
            $code = strtoupper(\Illuminate\Support\Str::random(6));
        } while (self::where('referral_code', $code)->exists());

        return $code;
    }

    /**
     * Ensure the user has a referral code (generate if missing)
     */
    public function ensureReferralCode(): void
    {
        if (empty($this->referral_code) && $this->isSeller()) {
            $this->referral_code = self::generateUniqueReferralCode();
            $this->save();
        }
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}