<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     * Usage: ->middleware("permission:approve_templates")
     */
    public function handle(Request $request, Closure $next, $permission = null): Response
    {
        $user = $request->user();

        // If no user or not authenticated
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Admin string role has all permissions
        if (method_exists($user, 'isAdmin') && $user->isAdmin()) {
            return $next($request);
        }

        if ($permission && method_exists($user, 'hasPermission') && $user->hasPermission($permission)) {
            return $next($request);
        }

        return response()->json(['message' => 'Forbidden: missing permission ' . $permission], 403);
    }
}
