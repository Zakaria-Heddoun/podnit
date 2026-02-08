<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PODNIT</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 8px;
        }
        .header h1 {
            margin: 16px 0 0 0;
            font-size: 24px;
            font-weight: 600;
            opacity: 0.95;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #111827;
            font-size: 24px;
            margin-top: 0;
        }
        .content p {
            margin: 16px 0;
            color: #555555;
        }
        .highlight-box {
            background: #f3f4f6;
            border-left: 4px solid #1f2937;
            padding: 24px;
            margin: 24px 0;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .referral-code {
            font-size: 28px;
            font-weight: bold;
            color: #111827;
            letter-spacing: 3px;
            text-align: center;
            margin: 16px 0;
            padding: 16px;
            background: #ffffff;
            border-radius: 8px;
            border: 2px dashed #1f2937;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 8px;
            margin: 24px 0;
            font-weight: 600;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .footer {
            background: #f8f9fa;
            padding: 24px 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .features {
            margin: 24px 0;
        }
        .feature-item {
            display: flex;
            align-items: flex-start;
            margin: 16px 0;
        }
        .feature-icon {
            color: #1f2937;
            margin-right: 12px;
            font-size: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">PODNIT</div>
            <h1>🎉 Welcome Aboard!</h1>
        </div>
        
        <div class="content">
            <h2>Hello {{ $userName }}! 👋</h2>
            
            <p>We're thrilled to have you join the PODNIT family! Your seller account has been successfully created and you're all set to start creating and selling amazing print-on-demand products.</p>
            
            @if($brandName)
            <p><strong>Brand Name:</strong> {{ $brandName }}</p>
            @endif
            
            <div class="highlight-box">
                <p style="margin: 0 0 12px 0;"><strong>Your Unique Referral Code:</strong></p>
                <div class="referral-code">{{ $referralCode }}</div>
                <p style="margin: 12px 0 0 0; font-size: 14px;">Share this code with others and earn rewards when they place orders!</p>
            </div>
            
            <div class="features">
                <h3 style="color: #333; margin-bottom: 16px;">What's Next?</h3>
                
                <div class="feature-item">
                    <span class="feature-icon">🎨</span>
                    <div>
                        <strong>Create Your First Design</strong><br>
                        <span style="color: #6c757d; font-size: 14px;">Use our design studio to create unique products</span>
                    </div>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">📦</span>
                    <div>
                        <strong>Place Your First Order</strong><br>
                        <span style="color: #6c757d; font-size: 14px;">Start selling to your customers right away</span>
                    </div>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">💰</span>
                    <div>
                        <strong>Track Your Earnings</strong><br>
                        <span style="color: #6c757d; font-size: 14px;">Monitor your balance and withdraw anytime</span>
                    </div>
                </div>
            </div>
            
            <center>
                <a href="{{ $dashboardUrl }}" class="button">Go to Dashboard →</a>
            </center>
            
            <p style="margin-top: 32px; color: #6c757d; font-size: 14px;">
                If you have any questions or need assistance, our support team is here to help!
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">© {{ date('Y') }} PODNIT. All rights reserved.</p>
            <p style="margin: 8px 0 0 0;">
                <a href="{{ env('FRONTEND_URL', 'https://podnit.com') }}" style="color: #1f2937; text-decoration: none; font-weight: 600;">Visit Website</a>
            </p>
        </div>
    </div>
</body>
</html>
