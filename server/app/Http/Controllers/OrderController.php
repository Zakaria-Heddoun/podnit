<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Template;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Services\EliteSpeedService;

class OrderController extends Controller
{
    /**
     * Display all orders for admin or authorized employees
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $user = auth()->user();

        // Check permission: admin has full access, employees need view_orders permission
        if (!$user->isAdmin() && !$user->hasPermission('view_orders')) {
            return response()->json([
                'error' => 'Access denied. You do not have permission to view orders.'
            ], 403);
        }

        $query = Order::with(['user', 'product', 'template', 'customer'])
            ->orderBy('created_at', 'desc');

        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        // Filter by returns if requested
        if ($request->get('filter') === 'returns') {
            $query->where(function($q) {
                foreach (Order::RETURN_STATUSES as $status) {
                    $q->orWhere('status', 'like', "%{$status}%")
                      ->orWhere('shipping_status', 'like', "%{$status}%");
                }
            });
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        $orders = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Show specific order details for admin or authorized employees
     */
    public function adminShow(Order $order): JsonResponse
    {
        $user = auth()->user();

        // Check permission: admin has full access, employees need view_orders permission
        if (!$user->isAdmin() && !$user->hasPermission('view_orders')) {
            return response()->json([
                'error' => 'Access denied. You do not have permission to view orders.'
            ], 403);
        }

        $order->load(['product', 'template', 'customer', 'user']);
        $order = $this->enrichOrderItems($order);
        
        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    /**
     * Display a listing of orders for the authenticated seller
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        if (!$user->isSeller()) {
            return response()->json([
                'error' => 'Access denied. Seller account required.'
            ], 403);
        }

        $query = Order::where('user_id', $user->id)
            ->with(['product', 'template', 'customer'])
            ->orderBy('created_at', 'desc');

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by returns if requested
        if ($request->get('filter') === 'returns') {
            $query->where(function($q) {
                foreach (Order::RETURN_STATUSES as $status) {
                    $q->orWhere('status', 'like', "%{$status}%")
                      ->orWhere('shipping_status', 'like', "%{$status}%");
                }
            });
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        $orders = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'message' => 'Orders retrieved successfully',
            'data' => $orders
        ]);
    }

    /**
     * Show specific order details
     */
    public function show(Order $order): JsonResponse
    {
        $user = auth()->user();

        // Check if order belongs to the authenticated seller
        if (!$user->isSeller() || $order->user_id !== $user->id) {
            return response()->json([
                'error' => 'Order not found'
            ], 404);
        }

        $order->load(['product', 'template', 'customer']);
        $order = $this->enrichOrderItems($order);

        return response()->json([
            'message' => 'Order details retrieved successfully',
            'data' => $order
        ]);
    }

    /**
     * Get seller-specific price for a product or default base price
     */
    private function getSellerPrice($userId, $productId, $defaultPrice)
    {
        $sellerPrice = DB::table('seller_product_prices')
            ->where('user_id', $userId)
            ->where('product_id', $productId)
            ->value('price');
        
        return $sellerPrice ?? $defaultPrice;
    }

    /**
     * Create a new order from a product (simple order)
     */
    public function createFromProduct(Request $request, EliteSpeedService $shippingService): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'nullable|exists:products,id', // Made optional - can be per-item
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'required|string|max:20',
            'total_price' => 'required|numeric|min:0', // Total COD price for EliteSpeed
            'quantity' => 'required|integer|min:1',
            'selling_price' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id', // Allow per-item product
            'items.*.color' => 'required|string',
            'items.*.size' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.reorder_from_order_id' => 'nullable|exists:orders,id',
            'shipping_address' => 'required|array',
            'shipping_address.street' => 'required|string|max:255',
            'shipping_address.city' => 'required|string|max:100',
            'shipping_address.postal_code' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }

        $user = auth()->user();

        if (!$user->isSeller()) {
            return response()->json([
                'error' => 'Access denied. Seller account required.'
            ], 403);
        }

        // Get the main product if specified, otherwise use first item's product
        $mainProductId = $request->product_id ?? $request->items[0]['product_id'] ?? null;
        if (!$mainProductId) {
            return response()->json([
                'error' => 'No product specified for order'
            ], 422);
        }
        
        $mainProduct = Product::find($mainProductId);
        
        // Validate each item's product, color, and size
        $totalProductCost = 0;
        foreach ($request->items as $index => $item) {
            // Use item's specific product_id or fall back to main product
            $itemProductId = $item['product_id'] ?? $mainProductId;
            $itemProduct = Product::find($itemProductId);
            
            if (!$itemProduct) {
                return response()->json([
                    'error' => "Product not found for item #" . ($index + 1)
                ], 422);
            }
            
            if (!in_array($item['color'], $itemProduct->available_colors)) {
                Log::error('Invalid color selection:', ['item_index' => $index, 'requested' => $item['color'], 'available' => $itemProduct->available_colors]);
                return response()->json([
                    'error' => "Invalid color selection for item #" . ($index + 1)
                ], 422);
            }

            if (!in_array($item['size'], $itemProduct->available_sizes)) {
                Log::error('Invalid size selection:', ['item_index' => $index, 'requested' => $item['size'], 'available' => $itemProduct->available_sizes]);
                return response()->json([
                    'error' => "Invalid size selection for item #" . ($index + 1)
                ], 422);
            }
            
            // Calculate cost for this item
            $reorderId = $item['reorder_from_order_id'] ?? null;
            if ($reorderId) {
                // Reorder logic: verify ownership and status
                $originalOrder = Order::find($reorderId);
                
                if (!$originalOrder || $originalOrder->user_id !== $user->id) {
                    return response()->json([
                        'error' => "Invalid reorder source for item #" . ($index + 1)
                    ], 422);
                }
                
                if ($originalOrder->is_reordered) {
                    return response()->json([
                        'error' => "This return has already been reordered for item #" . ($index + 1)
                    ], 422);
                }
                
                // No base cost added for reorders
            } else {
                // Get seller-specific price or default base price
                $itemPrice = $this->getSellerPrice($user->id, $itemProduct->id, $itemProduct->base_price);
                $totalProductCost += $itemPrice * $item['quantity'];
            }
        }

        // Calculate total using selling price instead of base price
        $sellingPrice = $request->selling_price; // This is what seller charges customer
        $totalAmount = $sellingPrice * $request->quantity;

        // Check if user account is verified (activated)
        if (!$user->is_verified) {
            Log::warning('Unverified user attempted to create order:', [
                'user_id' => $user->id,
                'user_email' => $user->email
            ]);
            return response()->json([
                'error' => 'Account not activated',
                'message' => 'Your account is not activated yet. Please make your first deposit to activate your account and start placing orders.'
            ], 403);
        }

        // Check if user has sufficient balance (product cost + packaging + shipping)
        $totalCost = $totalProductCost;
        
        // Add packaging cost if applicable (flat rate for entire order)
        $includePackaging = filter_var($request->include_packaging ?? true, FILTER_VALIDATE_BOOLEAN);
        if ($includePackaging) {
            $packagingPrice = floatval($this->getSetting('packaging_price', 5.00));
            $totalCost += $packagingPrice;
        }
        
        // Add shipping cost
        $city = $request->shipping_city ?? ($request->shipping_address['city'] ?? 'Casablanca');
        $isCasablanca = strtolower(trim($city)) === 'casablanca';
        if ($isCasablanca) {
            $shippingPrice = floatval($this->getSetting('shipping_casablanca', 20.00));
        } else {
            $shippingPrice = floatval($this->getSetting('shipping_other', 40.00));
        }
        $totalCost += $shippingPrice;
        
        if ($user->balance < $totalCost) {
            Log::error('Insufficient balance:', [
                'user_balance' => $user->balance,
                'required_total_cost' => $totalCost,
                'product_cost' => $totalProductCost,
                'packaging' => $includePackaging ? $packagingPrice : 0,
                'shipping' => $shippingPrice
            ]);
            return response()->json([
                'error' => 'Insufficient balance',
                'message' => "You need {$totalCost} MAD but your balance is {$user->balance} MAD. Please top up your account."
            ], 422);
        }

        // Generate unique order number
        $orderNumber = $this->generateOrderNumber();

        try {
            // Create or find customer by phone
            $customer = Customer::where('user_id', $user->id)
                               ->where('phone', $request->customer_phone)
                               ->first();

            if ($customer) {
                // Update customer info if different (but not shipping address)
                $customer->update([
                    'name' => $request->customer_name,
                    'email' => $request->customer_email,
                ]);
            } else {
                $customer = Customer::create([
                    'user_id' => $user->id,
                    'name' => $request->customer_name,
                    'email' => $request->customer_email,
                    'phone' => $request->customer_phone,
                ]);
            }
            
            // Deduct cost from seller's balance and create order in transaction
            DB::transaction(function () use ($user, $customer, $orderNumber, $mainProduct, $request, $totalCost, $totalAmount, $totalProductCost, $sellingPrice) {
                // Create order
                $order = Order::create([
                    'user_id' => $user->id,
                    'customer_id' => $customer->id,
                    'product_id' => $mainProduct->id,
                    'template_id' => null, // Simple orders don't use templates
                    'order_number' => $orderNumber,
                    'customization' => [
                        'items' => $request->items,
                    ],
                    'quantity' => $request->quantity,
                    'unit_price' => $totalProductCost / $request->quantity, // Average unit price
                    'selling_price' => $sellingPrice, // What seller charges customer
                    'total_amount' => $request->total_price, // Use total_price from frontend (for EliteSpeed COD)
                    'status' => 'PENDING',
                    'shipping_address' => $request->shipping_address,
                    'is_reordered' => false,
                    'reordered_from_id' => $request->items[0]['reorder_from_order_id'] ?? null,
                ]);
                
                // Mark original orders as reordered
                $reorderedIds = array_filter(array_column($request->items, 'reorder_from_order_id'));
                if (!empty($reorderedIds)) {
                    Order::whereIn('id', $reorderedIds)->update(['is_reordered' => true]);
                }

                // Deduct total cost from seller's balance
                $user->decrement('balance', $totalCost);

                // Award points to seller and referrer
                $pointsPerOrder = (int) $this->getSetting('points_per_order', 10);
                if ($pointsPerOrder > 0) {
                    $user->increment('points', $pointsPerOrder);
                }
                
                // Award referrer points only on seller's first order
                if ($user->referred_by_id) {
                    $isFirstOrder = Order::where('user_id', $user->id)->count() === 1;
                    if ($isFirstOrder) {
                        $referrer = User::find($user->referred_by_id);
                        $refBonus = (int) $this->getSetting('referral_points_referrer', 100);
                        if ($referrer && $refBonus > 0) {
                            $referrer->increment('points', $refBonus);
                        }
                    }
                }

                // Update customer statistics
                $customer->updateStats($totalAmount);
            });

            // Get the order after transaction
            $order = Order::where('order_number', $orderNumber)->first();

            $order->load(['product', 'customer']);

            return response()->json([
                'message' => 'Order created successfully',
                'data' => $order
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Order creation failed:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            
            return response()->json([
                'error' => 'Order creation failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create an order from a template
     */
    public function createFromTemplate(Request $request, EliteSpeedService $shippingService): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'template_id' => 'nullable|exists:templates,id', // Made optional - can be per-item
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'required|string|max:20',
            'total_price' => 'required|numeric|min:0', // Total COD price for EliteSpeed
            'quantity' => 'required|integer|min:1',
            'items' => 'required|array|min:1',
            'items.*.template_id' => 'nullable|exists:templates,id', // Allow per-item template
            'items.*.color' => 'required|string',
            'items.*.size' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'shipping_address' => 'required|array',
            'shipping_address.street' => 'required|string|max:255',
            'shipping_address.city' => 'required|string|max:100',
            'shipping_address.postal_code' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }

        $user = auth()->user();

        if (!$user->isSeller()) {
            return response()->json([
                'error' => 'Access denied. Seller account required.'
            ], 403);
        }

        // Get the main template if specified, otherwise use first item's template
        $mainTemplateId = $request->template_id ?? $request->items[0]['template_id'] ?? null;
        if (!$mainTemplateId) {
            return response()->json([
                'error' => 'No template specified for order'
            ], 422);
        }

        $mainTemplate = Template::with('product')->find($mainTemplateId);

        // Check if template belongs to seller and is approved
        if ($mainTemplate->user_id !== $user->id) {
            return response()->json([
                'error' => 'Template not found'
            ], 404);
        }

        if ($mainTemplate->status !== 'APPROVED') {
            return response()->json([
                'error' => 'Template must be approved before creating orders'
            ], 422);
        }

        // Validate each item's template, color, and size
        $totalProductCost = 0;
        foreach ($request->items as $index => $item) {
            // Use item's specific template_id or fall back to main template
            $itemTemplateId = $item['template_id'] ?? $mainTemplateId;
            $itemTemplate = Template::with('product')->find($itemTemplateId);
            
            if (!$itemTemplate) {
                return response()->json([
                    'error' => "Template not found for item #" . ($index + 1)
                ], 422);
            }
            
            // Check template belongs to seller
            if ($itemTemplate->user_id !== $user->id) {
                return response()->json([
                    'error' => "Template for item #" . ($index + 1) . " does not belong to you"
                ], 422);
            }
            
            // Check template is approved
            if ($itemTemplate->status !== 'APPROVED') {
                return response()->json([
                    'error' => "Template for item #" . ($index + 1) . " must be approved"
                ], 422);
            }
            
            if ($itemTemplate->colors && is_array($itemTemplate->colors) && !in_array($item['color'], $itemTemplate->colors)) {
                return response()->json([
                    'error' => "Invalid color selection for item #" . ($index + 1) . " in this template"
                ], 422);
            }

            if ($itemTemplate->sizes && is_array($itemTemplate->sizes) && !in_array($item['size'], $itemTemplate->sizes)) {
                return response()->json([
                    'error' => "Invalid size selection for item #" . ($index + 1) . " in this template"
                ], 422);
            }
            
            // Calculate unit price for this item's template
            // Use seller-specific price or default base price
            $basePrice = $this->getSellerPrice($user->id, $itemTemplate->product->id, $itemTemplate->product->base_price);
            $itemUnitPrice = $basePrice;
            
            // Sum view prices if they have designs in the template
            $designConfig = $this->normalizeDesignConfig($itemTemplate->design_config);
            $states = $designConfig['states'] ?? [];
            $productViews = $itemTemplate->product->views ?? [];
            
            foreach ($productViews as $productView) {
                $viewKey = $productView['key'] ?? null;
                if (!$viewKey) continue;
                
                // Check if this view has a design (objects) in the template
                $viewState = $states[$viewKey] ?? null;
                if ($viewState) {
                    $decodedState = json_decode($viewState, true);
                    $objects = $decodedState['objects'] ?? [];
                    
                    // If there are any objects (stickers, text, etc.) in this view
                    if (!empty($objects)) {
                        $viewPrice = floatval($productView['price'] ?? 0);
                        // Only add view price if it's greater than 0 (free views don't add cost)
                        if ($viewPrice > 0) {
                            $itemUnitPrice += $viewPrice;
                        }
                    }
                }
            }
            
            // Add to total cost
            $reorderId = $item['reorder_from_order_id'] ?? null;
            if ($reorderId) {
                 // Reorder logic
                 $originalOrder = Order::find($reorderId);
                 if (!$originalOrder || $originalOrder->user_id !== $user->id) {
                     return response()->json([
                        'error' => "Invalid reorder source for item #" . ($index + 1)
                    ], 422);
                 }
                 if ($originalOrder->is_reordered) {
                     return response()->json([
                        'error' => "This return has already been reordered for item #" . ($index + 1)
                    ], 422);
                 }
                 // No cost added
            } else {
                $totalProductCost += $itemUnitPrice * $item['quantity'];
            }
        }

        // Calculate total amount (what customer pays)
        $totalAmount = $totalProductCost;

        // Add packaging and shipping costs (flat rate for entire order)
        $includePackaging = filter_var($request->include_packaging ?? true, FILTER_VALIDATE_BOOLEAN);
        if ($includePackaging) {
            $packagingPrice = floatval($this->getSetting('packaging_price', 5.00));
            $totalAmount += $packagingPrice;
        }

        $city = $request->shipping_city ?? ($request->shipping_address['city'] ?? 'Casablanca');
        $isCasablanca = strtolower(trim($city)) === 'casablanca';
        
        if ($isCasablanca) {
            $shippingPrice = floatval($this->getSetting('shipping_casablanca', 20.00));
        } else {
            $shippingPrice = floatval($this->getSetting('shipping_other', 40.00));
        }
        $totalAmount += $shippingPrice;

        // Check if user account is verified (activated)
        if (!$user->is_verified) {
            Log::warning('Unverified user attempted to create order:', [
                'user_id' => $user->id,
                'user_email' => $user->email
            ]);
            return response()->json([
                'error' => 'Account not activated',
                'message' => 'Your account is not activated yet. Please make your first deposit to activate your account and start placing orders.'
            ], 403);
        }

        // Check if user has sufficient balance (product cost + packaging + shipping)
        if ($user->balance < $totalAmount) {
            Log::error('Insufficient balance:', [
                'user_balance' => $user->balance,
                'required_total_amount' => $totalAmount,
                'product_cost' => $totalProductCost,
                'quantity' => $request->quantity
            ]);
            return response()->json([
                'error' => 'Insufficient balance',
                'message' => "You need {$totalAmount} MAD but your balance is {$user->balance} MAD. Please top up your account."
            ], 422);
        }

        // Generate unique order number
        $orderNumber = $this->generateOrderNumber();

        try {
            // Create or find customer by phone
            $customer = Customer::where('user_id', $user->id)
                               ->where('phone', $request->customer_phone)
                               ->first();

            if ($customer) {
                // Update customer info if different
                $customer->update([
                    'name' => $request->customer_name,
                    'email' => $request->customer_email,
                ]);
            } else {
                $customer = Customer::create([
                    'user_id' => $user->id,
                    'name' => $request->customer_name,
                    'email' => $request->customer_email,
                    'phone' => $request->customer_phone,
                ]);
            }

        // Deduct balance and create order in transaction
        DB::transaction(function () use ($user, $customer, $mainTemplate, $orderNumber, $request, $totalAmount, $totalProductCost) {
            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'customer_id' => $customer->id,
                'template_id' => $mainTemplate->id,
                'product_id' => $mainTemplate->product_id,
                'order_number' => $orderNumber,
                'customization' => [
                    'items' => $request->items,
                    'design_config' => $mainTemplate->design_config,
                ],
                'quantity' => $request->quantity,
                'unit_price' => $totalProductCost / $request->quantity, // Average unit price
                'total_amount' => $request->total_price, // Use total_price from frontend (for EliteSpeed COD)
                'status' => 'PENDING',
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'shipping_address' => $request->shipping_address,
                'is_reordered' => false,
                'reordered_from_id' => $request->items[0]['reorder_from_order_id'] ?? null,
            ]);
            
            // Mark original orders as reordered
            $reorderedIds = array_filter(array_column($request->items, 'reorder_from_order_id'));
            if (!empty($reorderedIds)) {
                Order::whereIn('id', $reorderedIds)->update(['is_reordered' => true]);
            }

            // Deduct total cost from seller's balance
            $user->decrement('balance', $totalAmount);

            // Award points for template-based orders
            $pointsPerOrder = (int) $this->getSetting('points_per_order', 10);
            if ($pointsPerOrder > 0) {
                $user->increment('points', $pointsPerOrder);
            }
            
            // Award referrer points only on seller's first order
            if ($user->referred_by_id) {
                $isFirstOrder = Order::where('user_id', $user->id)->count() === 1;
                if ($isFirstOrder) {
                    $referrer = User::find($user->referred_by_id);
                    $refBonus = (int) $this->getSetting('referral_points_referrer', 100);
                    if ($referrer && $refBonus > 0) {
                        $referrer->increment('points', $refBonus);
                    }
                }
            }
            
            // Update customer stats
            $customer->increment('total_orders');
            $customer->increment('total_spent', $totalAmount);
            $customer->last_order_date = now();
            $customer->save();
        });

        // Get the order after transaction
        $order = Order::where('order_number', $orderNumber)->first();

        $order->load(['product', 'template', 'customer']);

        return response()->json([
            'message' => 'Order created successfully from template',
            'data' => $order
        ], 201);
        
        } catch (\Exception $e) {
            Log::error('Order creation from template failed:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            
            return response()->json([
                'error' => 'Order creation failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update order status
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }

        $user = auth()->user();

        // Check if order belongs to the authenticated seller or user is admin
        if (!$user->isAdmin() && $order->user_id !== $user->id) {
            return response()->json([
                'error' => 'Order not found'
            ], 404);
        }

        $oldStatus = $order->status;
        $newStatus = $request->status;

        // Update order status
        $order->update([
            'status' => $newStatus
        ]);

        // Automatically restrict reshipping if status is a return status
        if ($order->isReturnStatus()) {
            $order->update(['allow_reshipping' => false]);
        }

        $order->load(['product', 'template', 'customer']);

        return response()->json([
            'message' => 'Order details retrieved successfully',
            'data' => $order
        ]);
    }

    /**
     * Generate a unique order number
     */
    private function generateOrderNumber(): string
    {
        $month = date('m'); // Current month (01-12)
        $year = date('Y');
        
        // Count orders created this month to get sequential number
        $monthlyCount = Order::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->count();
        
        $sequentialNumber = $monthlyCount + 1;
        
        do {
            $orderNumber = "POD-{$month}-{$sequentialNumber}";
            $exists = Order::where('order_number', $orderNumber)->exists();
            if ($exists) {
                $sequentialNumber++;
            }
        } while ($exists);

        return $orderNumber;
    }

    /**
     * Get order statistics for seller dashboard
     */
    public function getStats(): JsonResponse
    {
        $user = auth()->user();

        if (!$user->isSeller()) {
            return response()->json([
                'error' => 'Access denied. Seller account required.'
            ], 403);
        }

        $stats = [
            'total_orders' => Order::where('user_id', $user->id)->count(),
            'pending_orders' => Order::where('user_id', $user->id)->where('status', 'PENDING')->count(),
            'completed_orders' => Order::where('user_id', $user->id)->where('status', 'LIKE', '%livré%')->count(),
            'total_revenue' => Order::where('user_id', $user->id)->where('status', 'LIKE', '%livré%')->sum('total_amount'),
            'orders_by_status' => Order::where('user_id', $user->id)
                ->groupBy('status')
                ->selectRaw('status, count(*) as count')
                ->get()
                ->pluck('count', 'status'),
        ];

        return response()->json([
            'message' => 'Order statistics retrieved successfully',
            'data' => $stats
        ]);
    }
    
    /**
     * Download order assets (design and placement) as ZIP
     */
    public function downloadAssets(Order $order): \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\JsonResponse
    {
        try {
            $user = auth()->user();

            // Check if order belongs to the authenticated seller or user is admin
            if ($user->role !== 'admin' && $order->user_id !== $user->id) {
                return response()->json([
                    'error' => 'Unauthorized'
                ], 403);
            }

            $order->load(['template', 'product', 'customer']);
            
            if (!$order->template) {
                 return response()->json([
                    'error' => 'No template associated with this order'
                ], 404);
            }

            // Check if ZipArchive class exists
            if (!class_exists('ZipArchive')) {
                throw new \Exception('ZipArchive PHP extension is not installed or enabled');
            }

            $zipFileName = 'order-' . $order->order_number . '-assets.zip';

            return response()->streamDownload(function () use ($order) {
                $zip = new \ZipArchive;
                $output = fopen('php://output', 'wb');
                
                // Create a temporary file for the zip
                $tempZipFile = tempnam(sys_get_temp_dir(), 'order_assets_');
                
                if ($zip->open($tempZipFile, \ZipArchive::CREATE) === TRUE) {

                    // 1. Add Placement Images (Mockups)
                    $template = $order->template;
                    $designConfig = $this->normalizeDesignConfig($template->design_config);

                    $hasPlacement = false;
                    foreach (($designConfig['images'] ?? []) as $key => $url) {
                        if ($url) {
                            $entryName = 'Placements/' . $this->sanitizeViewKey((string) $key) . '.png';
                            $this->addFileToZip($zip, $url, $entryName);
                            $hasPlacement = true;
                        }
                    }

                    if (!$hasPlacement && $template->thumbnail_image) {
                        $this->addFileToZip($zip, $template->thumbnail_image, 'Placements/thumbnail.png');
                    }

                    // 2. Add High Quality Design
                    // Parse design_config to find the high quality image
                    $this->extractImagesFromConfig($zip, $designConfig, 'Designs/');

                    $zip->close();
                    
                    // Stream the zip content
                    readfile($tempZipFile);
                    
                    // Clean up
                    unlink($tempZipFile);
                } else {
                    Log::error('Failed to create/open zip file at ' . $tempZipFile);
                }
            }, $zipFileName);

        } catch (\Exception $e) {
            Log::error('Download assets failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'error' => 'Failed to generate download: ' . $e->getMessage()
            ], 500);
        }
    }

    private function normalizeDesignConfig($designConfig): array
    {
        if (is_string($designConfig)) {
            $decoded = json_decode($designConfig, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
        }

        return is_array($designConfig) ? $designConfig : [];
    }

    /**
     * Ship order via EliteSpeed
     */
    public function shipOrder(Request $request, Order $order, EliteSpeedService $shippingService): JsonResponse
    {
        $user = auth()->user();

        // Check permission: admin has full access, employees need manage_orders permission, sellers need to own the order
        if (!$user->isAdmin() && !$user->hasPermission('manage_orders') && $order->user_id !== $user->id) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($order->tracking_number && !$user->isAdmin() && !$user->hasPermission('manage_orders')) {
            return response()->json(['error' => 'Order already shipped (Tracking: ' . $order->tracking_number . ')'], 400);
        }

        if (!$user->isAdmin() && !$user->hasPermission('manage_orders') && !$order->allow_reshipping) {
            return response()->json(['error' => 'This order is restricted and cannot be reshipped. Please contact admin.'], 403);
        }

        try {
            $result = $this->automateShipping($order, $shippingService, $request->note);

            return response()->json([
                'message' => 'Order shipped successfully',
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Shipping failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Track order status via EliteSpeed
     */
    public function trackOrder(Order $order, EliteSpeedService $shippingService): JsonResponse
    {
        if (!$order->tracking_number) {
            return response()->json(['error' => 'No tracking number found'], 404);
        }

        try {
            $tracking = $shippingService->trackParcel($order->tracking_number);
            
            // Sync status to database
            if ($tracking) {
                // Extract status from different possible response formats
                $externalStatus = null;
                
                if (isset($tracking['statut'])) {
                    $externalStatus = $tracking['statut'];
                } elseif (isset($tracking['last_status'])) {
                    $externalStatus = $tracking['last_status'];
                } elseif (isset($tracking['message'])) {
                    $externalStatus = $tracking['message'];
                } elseif (isset($tracking['data']) && is_array($tracking['data']) && !empty($tracking['data'])) {
                    $latestEvent = $tracking['data'][0];
                    $externalStatus = $latestEvent['status'] ?? null;
                }
                
                if ($externalStatus) {
                    $oldStatus = $order->status;
                    
                    // Update BOTH status and shipping_status with the raw delivery status
                    $order->status = $externalStatus;
                    $order->shipping_status = $externalStatus;
                    
                    // Check if it's a return status and restrict reshipping
                    if ($order->isReturnStatus()) {
                        $order->allow_reshipping = false;
                    }
                    
                    // Credit seller when order transitions to delivered ("Livré")
                    if ($this->isDeliveredStatus($externalStatus) && !$this->isDeliveredStatus($oldStatus)) {
                        $this->creditSellerForDeliveredOrder($order);
                    }
                    
                    $order->save();
                    
                    \Log::info("Order status synced via track", [
                        'order_number' => $order->order_number,
                        'old_status' => $oldStatus,
                        'new_status' => $externalStatus
                    ]);
                }
            }
            
            $order->load(['product', 'template', 'customer']);
            
            return response()->json([
                'data' => $tracking,
                'order' => $order
            ]);
        } catch (\Exception $e) {
             return response()->json(['error' => 'Failed to track parcel: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Check if status indicates delivered (order finished)
     */
    private function isDeliveredStatus(string $status): bool
    {
        return str_contains(strtolower($status), 'livré');
    }
    
    /**
     * Credit seller's balance when order is delivered
     */
    private function creditSellerForDeliveredOrder(Order $order): void
    {
        try {
            $seller = $order->user;
            
            if (!$seller) {
                \Log::error("Cannot credit seller - user not found for order {$order->order_number}");
                return;
            }

            $creditAmount = $order->total_amount;
            $oldBalance = $seller->balance;
            $seller->increment('balance', $creditAmount);
            $newBalance = $seller->fresh()->balance;

            \Log::info("Seller credited for delivered order", [
                'order_number' => $order->order_number,
                'seller_id' => $seller->id,
                'seller_email' => $seller->email,
                'credit_amount' => $creditAmount,
                'old_balance' => $oldBalance,
                'new_balance' => $newBalance
            ]);
        } catch (\Exception $e) {
            \Log::error("Failed to credit seller for order {$order->order_number}", [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Helper to add a file from URL/Path to ZIP
     */
    private function addFileToZip(\ZipArchive $zip, string $pathOrUrl, string $zipEntryName)
    {
        try {
            $content = null;
            
            // Check if it's a local storage path
            if (str_starts_with($pathOrUrl, '/storage/')) {
                $localPath = public_path($pathOrUrl);
                if (file_exists($localPath)) {
                    $zip->addFile($localPath, $zipEntryName);
                    return;
                }
            } elseif (str_starts_with($pathOrUrl, 'http')) {
                // Remote URL
                $content = @file_get_contents($pathOrUrl);
            } else {
                // assume local public path relative to public/
                $localPath = public_path($pathOrUrl);
                 if (file_exists($localPath)) {
                    $zip->addFile($localPath, $zipEntryName);
                    return;
                }
            }

            if ($content) {
                $zip->addFromString($zipEntryName, $content);
            }
        } catch (\Exception $e) {
            Log::error("Failed to add file to zip: $pathOrUrl", ['error' => $e->getMessage()]);
        }
    }

    private function sanitizeViewKey(string $key): string
    {
        $clean = strtolower($key);
        $clean = preg_replace('/[^a-z0-9\\-_]+/', '-', $clean);
        $clean = trim((string) $clean, '-_');
        return $clean ?: 'view';
    }

    /**
     * Helper to extract high quality images from design config
     */
    private function extractImagesFromConfig(\ZipArchive $zip, array $config, string $folderPrefix = '')
    {
        // Recursively search for image sources
        $imageCount = 1;
        $objects = $config['objects'] ?? []; // Common Fabric.js structure

        foreach (($config['images'] ?? []) as $key => $url) {
            if ($url) {
                $entryName = $folderPrefix . $this->sanitizeViewKey((string) $key) . '.png';
                $this->addFileToZip($zip, $url, $entryName);
                $imageCount++;
            }
        }
        
        // Also check direct sides if structured that way
        $sides = ['front', 'back', 'left', 'right', 'main'];
        foreach ($config as $key => $value) {
            if (in_array($key, $sides) && is_array($value)) {
                 if (isset($value['objects'])) {
                     $objects = array_merge($objects, $value['objects']);
                 }
            }
        }

        foreach ($objects as $obj) {
            if (isset($obj['type']) && $obj['type'] === 'image' && !empty($obj['src'])) {
                if (str_starts_with($obj['src'], 'http') || str_starts_with($obj['src'], '/storage')) {
                    $extension = pathinfo($obj['src'], PATHINFO_EXTENSION);
                    if (str_contains($extension, '?')) {
                        $extension = substr($extension, 0, strpos($extension, '?'));
                    }
                    if (!$extension) $extension = 'png';
                    
                    $filename = $folderPrefix . "design_hq_{$imageCount}.{$extension}";
                    $this->addFileToZip($zip, $obj['src'], $filename);
                    $imageCount++;
                }
            }
        }
    }

    private function getSetting(string $key, $default = null)
    {
        try {
            $value = DB::table('system_settings')->where('setting_key', $key)->value('setting_value');
            return $value !== null ? $value : $default;
        } catch (\Exception $e) {
            Log::warning('Failed to read setting', ['key' => $key, 'error' => $e->getMessage()]);
            return $default;
        }
    }

    private function automateShipping(Order $order, EliteSpeedService $shippingService, ?string $note = ''): array
    {
        // Map City/Address
        $city = $order->shipping_address['city'] ?? 'Unknown';
        $address = $order->shipping_address['street'] ?? 'Unknown';
        
        // Format Product string - Handle multiple items
        $productItems = [];
        if ($order->customization && isset($order->customization['items'])) {
            foreach ($order->customization['items'] as $item) {
                $qty = $item['quantity'] ?? 1;
                $size = $item['size'] ?? '';
                $color = $item['color'] ?? '';
                
                // Try to find product name
                $pName = 'Product';
                if (isset($item['product_id'])) {
                    $prod = Product::find($item['product_id']);
                    $pName = $prod ? $prod->name : 'Product';
                }
                
                $productItems[] = "{$qty}x {$pName} ({$size} {$color})";
            }
        }
        
        $productString = !empty($productItems) ? implode(', ', $productItems) : ($order->product ? $order->product->name : 'Custom Order');
        
        $payload = [
            'fullname' => $order->customer_name ?? ($order->customer ? $order->customer->name : 'Guest'),
            'phone' => $this->sanitizePhoneNumber($order->customer_phone ?? ($order->customer ? $order->customer->phone : '')),
            'city' => $city,
            'address' => $address,
            'price' => $order->total_amount, // Use total_amount (set via total_price from frontend)
            'product' => substr($productString, 0, 255), // Limit length
            'qty' => $order->quantity,
            'note' => $note ?? '',
            'change' => 0,
            'openpackage' => 1,
            'internal_id' => $order->order_number,
        ];

        // Call Service
        $result = $shippingService->createParcel($payload);

        // If success
        if (isset($result['code']) && $result['code'] === 'ok') {
            $trackingNumber = $result['code_shippment'] ?? $order->order_number;
            
            $order->update([
                'status' => 'PRINTED', 
                'tracking_number' => $trackingNumber,
            ]);
            
            return $result;
        }

        throw new \Exception('Shipping API returned unexpected status: ' . json_encode($result));
    }

    /**
     * Admin toggle reshipping permission
     */
    public function toggleReshipping(Order $order): JsonResponse
    {
        $user = auth()->user();

        // Check permission: admin has full access, employees need manage_orders permission
        if (!$user->isAdmin() && !$user->hasPermission('manage_orders')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $order->update([
            'allow_reshipping' => !$order->allow_reshipping
        ]);

        return response()->json([
            'message' => 'Reshipping permission updated successfully',
            'allow_reshipping' => $order->allow_reshipping
        ]);
    }

    private function enrichOrderItems(Order $order)
    {
        $customization = $order->customization;
        if (!isset($customization['items']) || !is_array($customization['items'])) {
            return $order;
        }

        $items = $customization['items'];
        foreach ($items as &$item) {
            // Enrich with template data if present
            if (isset($item['template_id'])) {
                $template = Template::with('product')->find($item['template_id']);
                if ($template) {
                    $item['template'] = [
                        'id' => $template->id,
                        'title' => $template->title,
                        'design_config' => $template->design_config,
                        'product' => $template->product ? [
                            'id' => $template->product->id,
                            'name' => $template->product->name,
                            'mockups' => $template->product->mockups,
                            'image_url' => $template->product->image_url,
                        ] : null
                    ];
                }
            } elseif (isset($item['product_id'])) {
                // Enrich with product data if no template (simple product item)
                $product = Product::find($item['product_id']);
                if ($product) {
                    $item['product'] = [
                        'id' => $product->id,
                        'name' => $product->name,
                        'mockups' => $product->mockups,
                        'image_url' => $product->image_url,
                    ];
                }
            }
        }

        $customization['items'] = $items;
        // Assigning to a temporary property or updating the loaded customization
        $order->customization = $customization;
        return $order;
    }

    private function sanitizePhoneNumber(?string $phone): string
    {
        if (!$phone) return '';
        
        // Remove spaces and non-numeric chars (except +)
        $phone = preg_replace('/[^0-9+]/', '', $phone);
        
        // Replace +212 or 00212 with 0
        if (str_starts_with($phone, '+212')) {
            $phone = '0' . substr($phone, 4);
        } elseif (str_starts_with($phone, '00212')) {
            $phone = '0' . substr($phone, 5);
        } elseif (str_starts_with($phone, '212')) {
             $phone = '0' . substr($phone, 3);
        }
        
        return $phone;
    }

    /**
     * Admin endpoint to manually trigger status sync
     */
    public function adminSyncStatuses(Request $request): JsonResponse
    {
        $user = auth()->user();

        // Check permission
        if (!$user->isAdmin() && !$user->hasPermission('manage_orders')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $limit = $request->input('limit', 50);
        $force = $request->boolean('force', false);

        // Run sync command programmatically
        \Illuminate\Support\Facades\Artisan::call('orders:sync-statuses', [
            '--limit' => $limit,
            '--force' => $force
        ]);

        $output = \Illuminate\Support\Facades\Artisan::output();

        return response()->json([
            'success' => true,
            'message' => 'Order sync completed',
            'output' => $output
        ]);
    }

    /**
     * Get sync statistics for admin dashboard
     */
    public function adminSyncStats(): JsonResponse
    {
        $user = auth()->user();

        // Check permission
        if (!$user->isAdmin() && !$user->hasPermission('view_orders')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $stats = [
            'orders_with_tracking' => Order::whereNotNull('tracking_number')->count(),
            'active_orders_to_sync' => Order::whereNotNull('tracking_number')
                ->where('status', 'NOT LIKE', '%livré%')
                ->count(),
            'completed_orders' => Order::where('status', 'LIKE', '%livré%')->count(),
            'returned_orders' => Order::where(function($q) {
                    foreach (Order::RETURN_STATUSES as $status) {
                        $q->orWhere('status', 'like', "%{$status}%");
                    }
                })->count(),
            'orders_by_status' => Order::whereNotNull('tracking_number')
                ->groupBy('status')
                ->selectRaw('status, count(*) as count')
                ->get()
                ->pluck('count', 'status'),
            'recent_updates' => Order::whereNotNull('tracking_number')
                ->where('updated_at', '>=', now()->subHours(24))
                ->orderBy('updated_at', 'desc')
                ->limit(10)
                ->get(['id', 'order_number', 'status', 'shipping_status', 'tracking_number', 'updated_at'])
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
