<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Email - Podnit</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f3f4f6;
        }
        .header {
            background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            border-radius: 12px 12px 0 0;
        }
        .logo {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 8px;
        }
        .content {
            background: #ffffff;
            padding: 40px 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 12px 12px;
        }
        .message {
            background: #f9fafb;
            padding: 24px;
            border-radius: 8px;
            margin: 24px 0;
            border-left: 4px solid #1f2937;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 24px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
            font-size: 13px;
        }
        .success-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 10px 20px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 600;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">PODNIT</div>
        <p style="margin: 0; font-size: 16px; opacity: 0.9;">Print on Demand Platform</p>
    </div>
    <div class="content">
        <h1 style="margin: 0 0 8px 0; font-size: 28px; color: #111827;">🎉 Test Email Success!</h1>
        <div class="success-badge">✓ Email Delivery Working</div>
        
        <div class="message">
            <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">Congratulations!</h2>
            <p>Your email configuration is working correctly. This test email was successfully sent from your Podnit application using Resend.</p>
            
            <p><strong>What this means:</strong></p>
            <ul>
                <li>Your SMTP settings are configured properly</li>
                <li>Resend API integration is active</li>
                <li>Password reset emails will work</li>
                <li>All transactional emails are ready to send</li>
            </ul>
        </div>
        
        <p style="margin-top: 20px;">
            <strong>Sent at:</strong> {{ date('F j, Y \a\t g:i A') }}<br>
            <strong>From:</strong> Podnit Application
        </p>
        
        <div class="footer">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">PODNIT</p>
            <p style="margin: 0;">This is an automated test email from Podnit</p>
            <p style="margin: 8px 0 0 0;">If you didn't request this test email, you can safely ignore it.</p>
        </div>
    </div>
</body>
</html>
