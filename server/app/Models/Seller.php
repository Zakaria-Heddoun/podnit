<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Seller extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'cin',
        'bank_name',
        'rib',
        'balance',
        'referral_code',
        'referred_by_id',
        'is_verified',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'is_verified' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function referredBy(): BelongsTo
    {
        return $this->belongsTo(Seller::class, 'referred_by_id');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Seller::class, 'referred_by_id');
    }

    public function templates(): HasMany
    {
        return $this->hasMany(Template::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function points(): HasOne
    {
        return $this->hasOne(SellerPoint::class);
    }

    public function deposits(): HasMany
    {
        return $this->hasMany(Deposit::class);
    }

    public function withdrawals(): HasMany
    {
        return $this->hasMany(Withdrawal::class);
    }
}