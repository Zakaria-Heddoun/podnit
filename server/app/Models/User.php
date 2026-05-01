<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'name',
        'email',
        'password',
        'phone',
        'brand_name',
        'cin',
        'bank_name',
        'rib',
        'role',
        'is_active',
        'balance',
        'points',
        'referred_by',
        'referral_code',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'balance' => 'decimal:2',
        'points' => 'integer',
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = ['is_verified'];

    /**
     * Alias is_active as is_verified for frontend compatibility.
     */
    public function getIsVerifiedAttribute(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * Get the user's full name.
     *
     * @param  string|null  $value
     * @return string
     */
    public function getNameAttribute(?string $value): string
    {
        if ($value) {
            return $value;
        }
        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));
    }

    /**
     * Check if the user has a specific role.
     *
     * @param  string  $role
     * @return bool
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Get the role associated with the user.
     */
    public function roleRelation()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Check if the user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if the user is a seller.
     */
    public function isSeller(): bool
    {
        return $this->role === 'seller';
    }

    /**
     * Check if the user has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        if (!$this->roleRelation) {
            return false;
        }

        $permissions = $this->roleRelation->permissions ?? [];
        return is_array($permissions) && in_array($permission, $permissions);
    }
}
