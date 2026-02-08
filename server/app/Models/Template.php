<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'title',
        'description',
        'design_config',
        'thumbnail_image',
        'calculated_price',
        'colors',
        'status',
        'admin_feedback',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'design_config' => 'array',
        'colors' => 'array',
        'calculated_price' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Calculate the template price based on product base price and views with designs
     * 
     * @return float
     */
    public function calculatePrice(): float
    {
        // Load product if not already loaded
        if (!$this->product) {
            $this->load('product');
        }

        $product = $this->product;
        
        // Start with base price
        $totalPrice = (float) $product->base_price;
        
        // Get design config
        $designConfig = $this->design_config;
        
        if (!is_array($designConfig) || !isset($designConfig['images']) || !is_array($designConfig['images'])) {
            return $totalPrice;
        }
        
        // Get views that have designs (keys in design_config.images with non-empty values)
        $viewsWithDesigns = [];
        foreach ($designConfig['images'] as $key => $value) {
            // Only include views that have an actual design (non-null, non-empty value)
            if (!empty($value)) {
                $viewsWithDesigns[] = $key;
            }
        }
        
        // Get product views
        $productViews = $product->views;
        
        if (!is_array($productViews)) {
            return $totalPrice;
        }
        
        // Sum prices of views that have designs
        foreach ($productViews as $view) {
            if (isset($view['key']) && in_array($view['key'], $viewsWithDesigns)) {
                $totalPrice += (float) ($view['price'] ?? 0);
            }
        }
        
        return $totalPrice;
    }
}
