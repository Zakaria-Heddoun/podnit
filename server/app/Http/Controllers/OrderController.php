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
     * Display all orders for admin
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'product', 'template', 'customer'])
            ->orderBy('created_at', 'desc');

        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'All') {
            $query->where('status', $request->status);
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
     * Show specific order details for admin
     */
    public function adminShow(Order $order): JsonResponse
    {
        $order->load(['product', 'template', 'customer', 'user']);
        
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
        
        // Debug: Log the order data to see what's being returned
        Log::info('Order data for ID ' . $order->id, [
            'order_id' => $order->id,
            'customer_id' => $order->customer_id,
            'customer_data' => $order->customer ? $order->customer->toArray() : 'NO CUSTOMER FOUND',
            'product_data' => $order->product ? $order->product->name : 'NO PRODUCT FOUND'
        ]);

        return response()->json([
            'message' => 'Order details retrieved successfully',
            'data' => $order
        ]);
    }

    /**
     * Create a new order from a product (simple order)
     */
    public function createFromProduct(Request $request): JsonResponse
    {
        Log::info('=== ORDER CREATION DEBUG START ===');
        Log::info('Request data:', $request->all());
        
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:20',
            'quantity' => 'required|integer|min:1',
            'selling_price' => 'required|numeric|min:0',
            'selected_color' => 'required|string',
            'selected_size' => 'required|string',
            'shipping_address' => 'required|array',
            'shipping_address.street' => 'required|string|max:255',
            'shipping_address.city' => 'required|string|max:100',
            'shipping_address.postal_code' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }
        Log::info('Validation passed');

        $user = auth()->user();
        Log::info('Current user:', ['id' => $user->id, 'role' => $user->role, 'email' => $user->email]);

        if (!$user->isSeller()) {
            Log::error('Access denied - user is not a seller');
            return response()->json([
                'error' => 'Access denied. Seller account required.'
            ], 403);
        }
        Log::info('User is seller - access granted');

        $product = Product::find($request->product_id);
        Log::info('Product found:', ['id' => $product->id, 'name' => $product->name, 'available_colors' => $product->available_colors, 'available_sizes' => $product->available_sizes]);
        
        // Validate color and size options
        if (!in_array($request->selected_color, $product->available_colors)) {
            Log::error('Invalid color selection:', ['requested' => $request->selected_color, 'available' => $product->available_colors]);
            return response()->json([
                'error' => 'Invalid color selection'
            ], 422);
        }
        Log::info('Color validation passed');

        if (!in_array($request->selected_size, $product->available_sizes)) {
            Log::error('Invalid size selection:', ['requested' => $request->selected_size, 'available' => $product->available_sizes]);
            return response()->json([
                'error' => 'Invalid size selection'
            ], 422);
        }
        Log::info('Size validation passed');

        // Calculate total using selling price instead of base price
        $unitPrice = $product->base_price; // This is what seller pays
        $sellingPrice = $request->selling_price; // This is what seller charges customer
        $totalAmount = $sellingPrice * $request->quantity;
        Log::info('Price calculated:', [
            'base_price' => $unitPrice, 'selling_price' => $sellingPrice, 
            'quantity' => $request->quantity, 
            'total_amount' => $totalAmount
        ]);

        // Check if user has sufficient balance (product cost + packaging + shipping)
        $productCost = $unitPrice * $request->quantity;
        
        // Add packaging cost if applicable
        $totalCost = $productCost;
        $includePackaging = filter_var($request->include_packaging ?? true, FILTER_VALIDATE_BOOLEAN);
        if ($includePackaging) {
            $packagingPrice = floatval($this->getSetting('packaging_price', 5.00));
            $totalCost += ($packagingPrice * $request->quantity);
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
                'product_cost' => $productCost,
                'packaging' => $includePackaging ? ($packagingPrice * $request->quantity) : 0,
                'shipping' => $shippingPrice
            ]);
            return response()->json([
                'error' => 'Insufficient balance',
                'message' => "You need {$totalCost} MAD but your balance is {$user->balance} MAD. Please top up your account."
            ], 422);
        }
        Log::info('Balance check passed:', [
            'user_balance' => $user->balance,
            'total_cost' => $totalCost,
            'product_cost' => $productCost
        ]);

        // Generate unique order number
        $orderNumber = $this->generateOrderNumber();
        Log::info('Order number generated:', ['order_number' => $orderNumber]);

        try {
            Log::info('Attempting to create or find customer...');
            
            // Create or find customer
            $customer = Customer::where('user_id', $user->id)
                               ->where('email', $request->customer_email)
                               ->first();

            if ($customer) {
                Log::info('Existing customer found:', ['customer_id' => $customer->id]);
                // Update customer info if different (but not shipping address)
                $customer->update([
                    'name' => $request->customer_name,
                    'phone' => $request->customer_phone,
                ]);
            } else {
                Log::info('Creating new customer...');
                $customer = Customer::create([
                    'user_id' => $user->id,
                    'name' => $request->customer_name,
                    'email' => $request->customer_email,
                    'phone' => $request->customer_phone,
                ]);
                Log::info('Customer created:', ['customer_id' => $customer->id]);
            }
            
            Log::info('Attempting to create order...');
            
            // Deduct cost from seller's balance and create order in transaction
            DB::transaction(function () use ($user, $customer, $orderNumber, $product, $request, $totalCost, $totalAmount, $unitPrice, $sellingPrice) {
                // Create order
                $order = Order::create([
                    'user_id' => $user->id,
                    'customer_id' => $customer->id,
                    'product_id' => $product->id,
                    'template_id' => null, // Simple orders don't use templates
                    'order_number' => $orderNumber,
                    'customization' => [
                        'color' => $request->selected_color,
                        'size' => $request->selected_size,
                    ],
                    'quantity' => $request->quantity,
                    'unit_price' => $unitPrice, // What seller pays for the product
                    'selling_price' => $sellingPrice, // What seller charges customer
                    'total_amount' => $totalAmount,
                    'status' => 'PENDING',
                    'shipping_address' => $request->shipping_address,
                ]);
                
                Log::info('Order created successfully:', ['order_id' => $order->id, 'order_number' => $order->order_number]);

                // Deduct total cost from seller's balance
                $user->decrement('balance', $totalCost);
                
                Log::info('Balance deducted:', [
                    'cost_deducted' => $totalCost,
                    'new_balance' => $user->fresh()->balance
                ]);

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
                            Log::info('Referrer bonus awarded for first order:', [
                                'seller_id' => $user->id,
                                'referrer_id' => $user->referred_by_id,
                                'referrer_points' => $refBonus
                            ]);
                        }
                    }
                }

                // Update customer statistics
                $customer->updateStats($totalAmount);
                Log::info('Customer stats updated');
            });

            // Get the order after transaction
            $order = Order::where('order_number', $orderNumber)->first();

            // Log status history
            /* try {
                $order->statusHistory()->create([
                    'old_status' => null,
                    'new_status' => 'PENDING',
                    'notes' => 'Order created',
                    'updated_by' => $user->id,
                ]);
                Log::info('Order status history created');
            } catch (\Exception $e) {
                Log::error('Failed to create order status history:', ['error' => $e->getMessage()]);
                // Continue even if status history fails
            } */

            $order->load(['product', 'customer']);
            
            Log::info('=== ORDER CREATION DEBUG END - SUCCESS ===');
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
    public function createFromTemplate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'template_id' => 'required|exists:templates,id',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:20',
            'quantity' => 'required|integer|min:1',
            'selected_color' => 'required|string',
            'selected_size' => 'required|string',
            'shipping_address' => 'required|array',
            'shipping_address.street' => 'required|string|max:255',
            'shipping_address.city' => 'required|string|max:100',
            'shipping_address.postal_code' => 'required|string|max:20',
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

        $template = Template::with('product')->find($request->template_id);

        // Check if template belongs to seller and is approved
        if ($template->user_id !== $user->id) {
            return response()->json([
                'error' => 'Template not found'
            ], 404);
        }

        if ($template->status !== 'APPROVED') {
            return response()->json([
                'error' => 'Template must be approved before creating orders'
            ], 422);
        }

        // Validate color and size options against template (if defined)
        if ($template->colors && is_array($template->colors) && !in_array($request->selected_color, $template->colors)) {
            return response()->json([
                'error' => 'Invalid color selection for this template'
            ], 422);
        }

        if ($template->sizes && is_array($template->sizes) && !in_array($request->selected_size, $template->sizes)) {
            return response()->json([
                'error' => 'Invalid size selection for this template'
            ], 422);
        }

        // Calculate total using template price or product base price
        $unitPrice = $template->product->base_price;
        
        // Sum view prices if they have designs in the template
        $designConfig = $this->normalizeDesignConfig($template->design_config);
        $states = $designConfig['states'] ?? [];
        $productViews = $template->product->views ?? [];
        
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
                        $unitPrice += $viewPrice;
                    }
                }
            }
        }
        
        $totalAmount = $unitPrice * $request->quantity;

        // Add packaging and shipping costs
        $includePackaging = filter_var($request->include_packaging ?? true, FILTER_VALIDATE_BOOLEAN);
        if ($includePackaging) {
            $packagingPrice = floatval($this->getSetting('packaging_price', 5.00));
            $totalAmount += ($packagingPrice * $request->quantity);
        }

        $city = $request->shipping_city ?? ($request->shipping_address['city'] ?? 'Casablanca');
        $isCasablanca = strtolower(trim($city)) === 'casablanca';
        
        if ($isCasablanca) {
            $shippingPrice = floatval($this->getSetting('shipping_casablanca', 20.00));
        } else {
            $shippingPrice = floatval($this->getSetting('shipping_other', 40.00));
        }
        $totalAmount += $shippingPrice;

        // Check if user has sufficient balance (product cost + packaging + shipping)
        $productCost = $unitPrice * $request->quantity;
        if ($user->balance < $totalAmount) {
            Log::error('Insufficient balance:', [
                'user_balance' => $user->balance,
                'required_total_amount' => $totalAmount,
                'product_cost' => $productCost,
                'unit_price' => $unitPrice,
                'quantity' => $request->quantity
            ]);
            return response()->json([
                'error' => 'Insufficient balance',
                'message' => "You need {$totalAmount} MAD but your balance is {$user->balance} MAD. Please top up your account."
            ], 422);
        }
        Log::info('Balance check passed:', [
            'user_balance' => $user->balance,
            'total_amount' => $totalAmount,
            'product_cost' => $productCost,
            'unit_price' => $unitPrice,
            'quantity' => $request->quantity
        ]);

        // Generate unique order number
        $orderNumber = $this->generateOrderNumber();

        try {
            Log::info('Attempting to create or find customer...');
            
            // Create or find customer
            $customer = Customer::where('user_id', $user->id)
                               ->where('email', $request->customer_email)
                               ->first();

            if ($customer) {
                Log::info('Existing customer found:', ['customer_id' => $customer->id]);
                // Update customer info if different
                $customer->update([
                    'name' => $request->customer_name,
                    'phone' => $request->customer_phone,
                ]);
            } else {
                Log::info('Creating new customer...');
                $customer = Customer::create([
                    'user_id' => $user->id,
                    'name' => $request->customer_name,
                    'email' => $request->customer_email,
                    'phone' => $request->customer_phone,
                ]);
                Log::info('Customer created:', ['customer_id' => $customer->id]);
            }
            
            Log::info('Attempting to create order...');

        // Deduct balance and create order in transaction
        DB::transaction(function () use ($user, $customer, $template, $orderNumber, $request, $totalAmount, $unitPrice) {
            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'customer_id' => $customer->id,
                'template_id' => $template->id,
                'product_id' => $template->product_id,
                'order_number' => $orderNumber,
                'customization' => [
                    'color' => $request->selected_color,
                    'size' => $request->selected_size,
                    'design_config' => $template->design_config,
                ],
                'quantity' => $request->quantity,
                'unit_price' => $unitPrice,
                'total_amount' => $totalAmount,
                'status' => 'PENDING',
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'shipping_address' => $request->shipping_address,
            ]);

            // Deduct total cost from seller's balance
            $user->decrement('balance', $totalAmount);
            
            Log::info('Order created and balance deducted:', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'cost_deducted' => $totalAmount,
                'new_balance' => $user->fresh()->balance
            ]);

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
                        Log::info('Referrer bonus awarded for first order:', [
                            'seller_id' => $user->id,
                            'referrer_id' => $user->referred_by_id,
                            'referrer_points' => $refBonus
                        ]);
                    }
                }
            }
            
            // Update customer stats
            $customer->increment('total_orders');
            $customer->increment('total_spent', $totalAmount);
            $customer->last_order_date = now();
            $customer->save();
            Log::info('Customer stats updated');
        });

        // Get the order after transaction
        $order = Order::where('order_number', $orderNumber)->first();
        Log::info('Order created successfully:', ['order_id' => $order->id, 'order_number' => $order->order_number]);

        // Log status history
        /* $order->statusHistory()->create([
            'old_status' => null,
            'new_status' => 'PENDING',
            'notes' => 'Order created from template',
            'updated_by' => $user->id,
        ]); */

        $order->load(['product', 'template', 'customer']);
        
        Log::info('=== ORDER CREATION FROM TEMPLATE DEBUG END - SUCCESS ===');
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
            'status' => 'required|in:PENDING,IN_PROGRESS,PRINTED,DELIVERING,SHIPPED,PAID,CANCELLED,RETURNED',
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

        // Log status change
        /* $order->statusHistory()->create([
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'notes' => $request->notes,
            'updated_by' => $user->id,
        ]); */

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
            'completed_orders' => Order::where('user_id', $user->id)->where('status', 'PAID')->count(),
            'total_revenue' => Order::where('user_id', $user->id)->where('status', 'PAID')->sum('total_amount'),
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
     * Test method to create order without authentication
     */
    public function createFromProductTest(Request $request): JsonResponse
    {
        Log::info('=== TEST ORDER CREATION DEBUG START ===');
        Log::info('Test request data:', $request->all());
        
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:20',
            'quantity' => 'required|integer|min:1',
            'selling_price' => 'required|numeric|min:0',
            'customization' => 'required|array',
            'shipping_address' => 'required|array',
            'unit_price' => 'required|numeric',
            'total_amount' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            Log::error('Test validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }
        Log::info('Test validation passed');

        // For testing, we'll use user ID 4 as you specified
        $seller = User::find(4);
        if (!$seller || !$seller->isSeller()) {
            Log::error('Seller with ID 4 not found or not a seller');
            return response()->json(['success' => false, 'error' => 'Seller with ID 4 not found'], 404);
        }
        Log::info('Test seller found:', ['id' => $seller->id, 'email' => $seller->email]);
        
        $product = Product::find($request->product_id);
        Log::info('Test product found:', ['id' => $product->id, 'name' => $product->name]);

        // Generate unique order number
        $orderNumber = $this->generateOrderNumber();
        Log::info('Test order number generated:', ['order_number' => $orderNumber]);

        try {
            Log::info('Attempting to create or find test customer...');
            
            // Create or find customer
            $customer = Customer::where('user_id', $seller->id)
                               ->where('email', $request->customer_email)
                               ->first();

            if ($customer) {
                Log::info('Existing test customer found:', ['customer_id' => $customer->id]);
                // Update customer info if different (but not shipping address)
                $customer->update([
                    'name' => $request->customer_name,
                    'phone' => $request->customer_phone,
                ]);
            } else {
                Log::info('Creating new test customer...');
                $customer = Customer::create([
                    'user_id' => $seller->id,
                    'name' => $request->customer_name,
                    'email' => $request->customer_email,
                    'phone' => $request->customer_phone,
                ]);
                Log::info('Test customer created:', ['customer_id' => $customer->id]);
            }
            
            Log::info('Attempting to create test order...');
            
            // Create order
            $order = Order::create([
                'user_id' => $seller->id,
                'customer_id' => $customer->id,
                'product_id' => $product->id,
                'order_number' => $orderNumber,
                'customization' => $request->customization,
                'quantity' => $request->quantity,
                'unit_price' => $request->unit_price,
                'selling_price' => $request->selling_price,
                'total_amount' => $request->total_amount,
                'status' => 'PENDING',
                'shipping_address' => $request->shipping_address,
            ]);
            
            Log::info('Test order created successfully:', ['order_id' => $order->id, 'order_number' => $order->order_number]);
            
            // Update customer statistics
            $customer->updateStats($request->total_amount);
            Log::info('Test customer stats updated');
            
            $order->load(['product', 'customer']);

            Log::info('=== TEST ORDER CREATION DEBUG END - SUCCESS ===');
            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'data' => $order
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Test order creation failed:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            
            return response()->json([
                'success' => false,
                'error' => 'Order creation failed',
                'message' => $e->getMessage()
            ], 500);
        }
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

        // Check permission (Admin or owner seller)
        if (!$user->isAdmin() && $order->user_id !== $user->id) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($order->tracking_number) {
            return response()->json(['error' => 'Order already shipped (Tracking: ' . $order->tracking_number . ')'], 400);
        }

        try {
            // Prepare payload for EliteSpeed
            // documentation: fullname, phone, city, address, price, product, qty, note, change(0/1), openpackage(0/1), from_stock(0/1), internal_id
            
            // Map City/Address
            // Assuming we just pass the city name string. 
            // If ID is needed we'd need a mapping, but docs show "La ville du client".
            // The user request example shows "city": "CASABLANCA" (string) or object in response, but input likely string.
            
            $city = $order->shipping_address['city'] ?? 'Unknown';
            $address = $order->shipping_address['street'] ?? 'Unknown';
            
            // Format Product string
            $productName = $order->product ? $order->product->name : 'Custom Product';
            // If multiple items, we might need to handle differently, but here 1 order = 1 product type usually (or X qty of it)
            
            $payload = [
                'fullname' => $order->customer_name ?? ($order->customer ? $order->customer->name : 'Guest'),
                'phone' => $this->sanitizePhoneNumber($order->customer_phone ?? ($order->customer ? $order->customer->phone : '')),
                'city' => $city,
                'address' => $address,
                'price' => $order->total_amount, // COD amount
                'product' => $productName,
                'qty' => $order->quantity,
                'note' => $request->note ?? '',
                'change' => 0, // Default no exchange
                'openpackage' => 1, // Let's default to 1 as per typical POD requests? or 0? keeping 1 to be safe or 0. Docs say "0 for No, 1 for Yes". Let's assume 1 (allow open) is better for success rate unless specified. 
                                    // User prompt didn't specify preference, but showed "client_can_open": 0 in GET example.
                                    // Let's set to 1 for "Allow open" as it reduces returns usually, or 0 safely.
                                    // Let's stick to 1 (Yes) as a feature, or make it optional. 
                                    // For now, hardcode 1 or use request input.
                'internal_id' => $order->order_number,
            ];

            // Call Service
            $result = $shippingService->createParcel($payload);

            // If success
            // Docs say: { "code": "ok", "message": "..." }
            if (isset($result['code']) && $result['code'] === 'ok') {
                
                // Update Order
                $trackingNumber = $result['code_shippment'] ?? $order->order_number;
                
                $order->update([
                    'status' => 'PRINTED', 
                    'tracking_number' => $trackingNumber,
                ]);

                return response()->json([
                    'message' => 'Order shipped successfully',
                    'data' => $result
                ]);
            } else {
                 return response()->json([
                    'error' => 'Shipping API returned unexpected status',
                    'details' => $result
                ], 500);
            }

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
            return response()->json(['data' => $tracking]);
        } catch (\Exception $e) {
             return response()->json(['error' => 'Failed to track parcel'], 500);
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
}
