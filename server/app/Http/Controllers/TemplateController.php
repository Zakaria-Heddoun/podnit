<?php

namespace App\Http\Controllers;

use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class TemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            $templates = Template::with(['user', 'product'])
                ->when($request->status, function ($query, $status) {
                    if ($status !== 'All') {
                        return $query->where('status', strtoupper($status));
                    }
                })
                ->when($request->search, function ($query, $search) {
                    return $query->where('title', 'like', "%{$search}%");
                })
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            // User sees their own templates
            $templates = Template::where('user_id', $user->id)
                ->when($request->status, function ($query, $status) {
                    if ($status !== 'All') {
                        return $query->where('status', strtoupper($status));
                    }
                })
                ->when($request->search, function ($query, $search) {
                    return $query->where('title', 'like', "%{$search}%");
                })
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        \Log::info('Template store request received', [
            'content_length' => $_SERVER['CONTENT_LENGTH'] ?? 'unknown', 
            'params' => $request->keys()
        ]);
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'product_id' => 'required|exists:products,id',
                'design_config' => 'required',
            ]);

            DB::beginTransaction();

            // Process all design side images
            $bigFrontImageUrl = $this->saveImage($request->big_front_image, 'big-front');
            $smallFrontImageUrl = $this->saveImage($request->small_front_image, 'small-front');
            $backImageUrl = $this->saveImage($request->back_image, 'back');
            $leftSleeveImageUrl = $this->saveImage($request->left_sleeve_image, 'left-sleeve');
            $rightSleeveImageUrl = $this->saveImage($request->right_sleeve_image, 'right-sleeve');

            \Log::info('Saved images', [
                'big_front' => $bigFrontImageUrl,
                'small_front' => $smallFrontImageUrl,
                'back' => $backImageUrl,
                'left_sleeve' => $leftSleeveImageUrl,
                'right_sleeve' => $rightSleeveImageUrl,
            ]);

            // Thumbnail priority: big_front > small_front > back > sleeves
            $thumbnailUrl = $bigFrontImageUrl ?? $smallFrontImageUrl ?? $backImageUrl ?? $leftSleeveImageUrl ?? $rightSleeveImageUrl;
            
            \Log::info('Selected thumbnail', ['thumbnail' => $thumbnailUrl]);

            $template = Template::create([
                'user_id' => Auth::id(),
                'product_id' => $request->product_id,
                'title' => $request->title,
                'description' => $request->description,
                'design_config' => $request->design_config,
                'thumbnail_image' => $thumbnailUrl,
                'big_front_image' => $bigFrontImageUrl,
                'small_front_image' => $smallFrontImageUrl,
                'back_image' => $backImageUrl,
                'left_sleeve_image' => $leftSleeveImageUrl,
                'right_sleeve_image' => $rightSleeveImageUrl,
                'colors' => $request->colors,
                'status' => 'PENDING',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Template created successfully and is pending approval.',
                'data' => $template
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Server Error: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Template $template)
    {
        $user = Auth::user();
        
        // Admins can view any template, sellers can only view their own
        if ($user->role !== 'admin' && $template->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to template');
        }

        return response()->json([
            'success' => true,
            'data' => $template->load(['user', 'product'])
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Template $template)
    {
        if (Auth::user()->role !== 'admin' && Auth::id() !== $template->user_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'string|max:255',
        ]);

        $data = $request->except(['status', 'admin_feedback', 'approved_by', 'approved_at']);

        // Handle all design side image updates if provided
        if ($request->has('big_front_image') && $this->isBase64($request->big_front_image)) {
            $data['big_front_image'] = $this->saveImage($request->big_front_image, 'big-front');
        }
        if ($request->has('small_front_image') && $this->isBase64($request->small_front_image)) {
            $data['small_front_image'] = $this->saveImage($request->small_front_image, 'small-front');
        }
        if ($request->has('back_image') && $this->isBase64($request->back_image)) {
            $data['back_image'] = $this->saveImage($request->back_image, 'back');
        }
        if ($request->has('left_sleeve_image') && $this->isBase64($request->left_sleeve_image)) {
            $data['left_sleeve_image'] = $this->saveImage($request->left_sleeve_image, 'left-sleeve');
        }
        if ($request->has('right_sleeve_image') && $this->isBase64($request->right_sleeve_image)) {
            $data['right_sleeve_image'] = $this->saveImage($request->right_sleeve_image, 'right-sleeve');
        }

        // Update thumbnail if any image was updated
        if (isset($data['big_front_image']) || isset($data['small_front_image']) || 
            isset($data['back_image']) || isset($data['left_sleeve_image']) || isset($data['right_sleeve_image'])) {
            $data['thumbnail_image'] = $data['big_front_image'] ?? $data['small_front_image'] ?? 
                                       $data['back_image'] ?? $data['left_sleeve_image'] ?? 
                                       $data['right_sleeve_image'] ?? $template->thumbnail_image;
        }

        // If seller updates, reset status to PENDING
        if (Auth::user()->role === 'seller') {
            $data['status'] = 'PENDING';
            $data['admin_feedback'] = null; // Clear old feedback
        }

        $template->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Template updated successfully.',
            'data' => $template
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Template $template)
    {
        if (Auth::user()->role !== 'admin' && Auth::id() !== $template->user_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete images from storage
        if ($template->front_image) $this->deleteImage($template->front_image);
        if ($template->back_image) $this->deleteImage($template->back_image);
        if ($template->sleeve_image) $this->deleteImage($template->sleeve_image);

        $template->delete();

        return response()->json([
            'success' => true,
            'message' => 'Template deleted successfully.'
        ]);
    }

    /**
     * Approve the specified template.
     */
    public function approve(Template $template)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $template->update([
            'status' => 'APPROVED',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'admin_feedback' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Template approved successfully.',
            'data' => $template
        ]);
    }

    /**
     * Reject the specified template.
     */
    public function reject(Request $request, Template $template)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $template->update([
            'status' => 'REJECTED',
            'admin_feedback' => $request->reason,
            'approved_by' => Auth::id(), // Track who rejected it
            'approved_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Template rejected.',
            'data' => $template
        ]);
    }

    /**
     * Save base64 image to storage
     */
    private function saveImage($data, $type = 'image')
    {
        if (!$data) return null;

        // If it's already a URL (e.g. on update without change), return it
        if (!$this->isBase64($data)) {
            return $data;
        }

        if (preg_match('/^data:image\/(\w+);base64,/', $data, $typeMatch)) {
            $extension = strtolower($typeMatch[1]);
            if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                // Default to png if unknown
                $extension = 'png';
            }
            $data = substr($data, strpos($data, ',') + 1);
            $data = base64_decode($data);

            if ($data === false) {
                return null; // Failed decode
            }

            $filename = 'template_' . $type . '_' . Str::random(10) . '_' . time() . '.' . $extension;
            
            // Store in public/templates
            Storage::disk('public')->put('templates/' . $filename, $data);

            return '/storage/templates/' . $filename;
        }

        return null;
    }

    /**
     * Delete image from storage
     */
    private function deleteImage($path)
    {
        if (!$path) return;
        
        // Convert URL to path relative to storage root
        $relativePath = str_replace('/storage/', '', $path);
        
        // Add a safety check to ensure we only delete files in public disk
        if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }
    }

    /**
     * Check if string is base64 image
     */
    private function isBase64($string)
    {
        if (!is_string($string)) return false;
        return preg_match('/^data:image\/(\w+);base64,/', $string);
    }
}
