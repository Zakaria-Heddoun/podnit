<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class AccountActivatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $depositAmount;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, float $depositAmount)
    {
        $this->user = $user;
        $this->depositAmount = $depositAmount;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Account Activated - Start Selling on Podnit!',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $dashboardUrl = config('app.frontend_url') . '/seller/dashboard';
        
        return new Content(
            view: 'emails.account-activated',
            with: [
                'userName' => $this->user->name,
                'balance' => $this->user->balance,
                'depositAmount' => $this->depositAmount,
                'dashboardUrl' => $dashboardUrl,
                'referralCode' => $this->user->referral_code,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
