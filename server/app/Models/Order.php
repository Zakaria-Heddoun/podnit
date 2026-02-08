<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'customer_id',
        'template_id',
        'product_id',
        'order_number',
        'customization',
        'quantity',
        'unit_price',
        'selling_price',
        'total_amount',
        'status',
        'shipping_status',
        'allow_reshipping',
        'shipping_address',
        'tracking_number',
        'is_reordered',
        'reordered_from_id',
    ];

    /**
     * List of statuses that trigger return handling
     */
    /**
     * Statuses from the delivery API that indicate a return.
     * These are the raw EliteSpeed statuses that mean the order is returned.
     */
    public const RETURN_STATUSES = [
        "En voyage",
        "hors zone",
        "Annuler",
        "Refusé",
    ];

    public function isReturnStatus(): bool
    {
        foreach (self::RETURN_STATUSES as $returnStatus) {
            if (stripos($this->status, $returnStatus) !== false || stripos($this->shipping_status, $returnStatus) !== false) {
                return true;
            }
        }
        return false;
    }

    protected $casts = [
        'customization' => 'array',
        'unit_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'shipping_address' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    // Keep seller() method for backwards compatibility
    public function seller(): BelongsTo
    {
        return $this->user();
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class);
    }
}