<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'notes',
        'total_orders',
        'total_spent',
        'last_order_date'
    ];

    protected $casts = [
        'total_spent' => 'decimal:2',
        'last_order_date' => 'datetime'
    ];

    /**
     * Get the seller that owns this customer.
     */
    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get all orders for this customer.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Update customer statistics when a new order is placed.
     */
    public function updateStats($orderAmount)
    {
        $this->increment('total_orders');
        $this->increment('total_spent', $orderAmount);
        $this->update(['last_order_date' => now()]);
    }

}
