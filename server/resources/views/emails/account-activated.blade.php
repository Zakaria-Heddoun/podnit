<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Activated - Podnit</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f3f4f6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
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
        .success-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 16px;
            font-weight: 600;
            margin: 20px 0;
        }
        .info-box {
            background: #f3f4f6;
            border-left: 4px solid #1f2937;
            padding: 24px;
            margin: 24px 0;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .info-box h3 {
            margin: 0 0 12px 0;
            color: #111827;
            font-size: 18px;
        }
        .balance-amount {
            font-size: 32px;
            font-weight: bold;
            color: #111827;
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: #ffffff;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
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
            min-width: 24px;
        }
        ul {
            margin: 12px 0;
            padding-left: 24px;
        }
        ul li {
            margin: 8px 0;
            color: #555555;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">PODNIT</div>
            <h1>🎉 Account Activated!</h1>
        </div>
        
        <div class="content">
            <div class="success-badge">✓ Account Ready</div>
            
            <h2>Congratulations, {{ $userName }}!</h2>
            
            <p>Great news! Your first deposit has been validated and your account is now fully activated. You're ready to start creating and selling amazing products.</p>
            
            <div class="info-box">
                <h3>💰 Your Current Balance</h3>
                <div class="balance-amount">{{ number_format($balance, 2) }} MAD</div>
                <p style="margin: 12px 0 0 0; font-size: 14px; color: #6c757d;">
                    Your deposit of {{ number_format($depositAmount, 2) }} MAD has been credited to your account.
                </p>
            </div>
            
            <div class="features">
                <h3 style="color: #111827; margin-bottom: 16px;">What You Can Do Now:</h3>
                
                <div class="feature-item">
                    <span class="feature-icon">✅</span>
                    <div>
                        <strong>Create Your First Order</strong><br>
                        <span style="color: #6c757d; font-size: 14px;">Your account is now active and you can place orders for your customers</span>
                    </div>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">🎨</span>
                    <div>
                        <strong>Design Custom Products</strong><br>
                        <span style="color: #6c757d; font-size: 14px;">Use our design studio to create unique products for your brand</span>
                    </div>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">📊</span>
                    <div>
                        <strong>Track Your Business</strong><br>
                        <span style="color: #6c757d; font-size: 14px;">Monitor orders, earnings, and customer satisfaction</span>
                    </div>
                </div>
                
                <div class="feature-item">
                    <span class="feature-icon">💳</span>
                    <div>
                        <strong>Manage Your Finances</strong><br>
                        <span style="color: #6c757d; font-size: 14px;">View transactions, add funds, and request withdrawals anytime</span>
                    </div>
                </div>
            </div>
            
            <center>
                <a href="{{ $dashboardUrl }}" class="button">Go to Dashboard →</a>
            </center>
            
            <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin-top: 32px;">
                <h4 style="margin: 0 0 12px 0; color: #111827; font-size: 16px;">💡 Quick Tips:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Each order will deduct the product cost + packaging + shipping from your balance</li>
                    <li>You earn {{ $pointsPerOrder }} points for every order you place</li>
                    <li>Share your referral code <strong>{{ $referralCode }}</strong> to earn extra rewards</li>
                    <li>Keep your balance topped up to ensure smooth order processing</li>
                </ul>
            </div>
            
            <p style="margin-top: 32px; color: #6c757d; font-size: 14px;">
                If you have any questions or need assistance, our support team is here to help!
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">PODNIT</p>
            <p style="margin: 0;">© {{ date('Y') }} PODNIT. All rights reserved.</p>
            <p style="margin: 8px 0 0 0;">
                <a href="{{ env('FRONTEND_URL', 'https://podnit.com') }}" style="color: #1f2937; text-decoration: none; font-weight: 600;">Visit Website</a>
            </p>
        </div>
    </div>
</body>
</html>
