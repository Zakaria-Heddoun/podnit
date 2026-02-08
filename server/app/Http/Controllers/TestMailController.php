<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\TestMail;

class TestMailController extends Controller
{
    /**
     * Send a test email
     */
    public function sendTestEmail(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        try {
            Mail::to($request->email)->send(new TestMail());
            
            return response()->json([
                'success' => true,
                'message' => 'Test email sent successfully to ' . $request->email
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send test email: ' . $e->getMessage()
            ], 500);
        }
    }
}
