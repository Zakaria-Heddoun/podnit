<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'description',
        'base_price',
        'available_colors',
        'available_sizes',
        'image_url',
        'gallery',
        'mockups',
        'print_areas',
        'views',
        'is_active',
        'in_stock',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'available_colors' => 'array',
        'available_sizes' => 'array',
        'image_url' => 'string',
        'gallery' => 'array',
        'mockups' => 'array',
        'print_areas' => 'array',
        'views' => 'array',
        'is_active' => 'boolean',
        'in_stock' => 'boolean',
    ];

    public function templates(): HasMany
    {
        return $this->hasMany(Template::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
