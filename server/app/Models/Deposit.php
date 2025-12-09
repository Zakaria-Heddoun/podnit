<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deposit extends Model
{
    protected $fillable = [
        'user_id',
        'amount',
        'bank_name',
        'receipt_image',
        'reference_number',
        'status',
        'admin_notes',
        'validated_by',
        'validated_at'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'validated_at' => 'datetime'
    ];

    /**
     * Get the user that owns the deposit.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin who validated the deposit.
     */
    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}
