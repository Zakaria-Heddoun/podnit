<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
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
        .warning-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .warning-box p {
            margin: 0;
            color: #856404;
            font-size: 14px;
        }
        .footer {
            background: #f8f9fa;
            padding: 24px 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .security-notice {
            margin-top: 32px;
            padding: 20px;
            background: #f8f9ff;
            border-radius: 4px;
        }
        .security-notice h4 {
            margin: 0 0 12px 0;
            color: #333;
            font-size: 16px;
        }
        .security-notice ul {
            margin: 0;
            padding-left: 20px;
            color: #6c757d;
            font-size: 14px;
        }
        .security-notice li {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">PODNIT</div>
            <h1>🔒 Password Reset Request</h1>
        </div>
        
        <div class="content">
            <h2>Hello {{ $userName }}!</h2>
            
            <p>We received a request to reset your password for your PODNIT account. If you made this request, click the button below to reset your password:</p>
            
            <center>
                <a href="{{ $resetUrl }}" class="button">Reset Password →</a>
            </center>
            
            <div class="warning-box">
                <p><strong>⏰ This link will expire in 60 minutes</strong> for security reasons.</p>
            </div>
            
            <p style="margin-top: 24px;">If the button doesn't work, you can copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 14px; border-radius: 6px; font-size: 13px; color: #1f2937; border: 1px solid #e5e7eb;">
                {{ $resetUrl }}
            </p>
            
            <div class="security-notice">
                <h4>🛡️ Security Tips:</h4>
                <ul>
                    <li>Never share your password with anyone</li>
                    <li>Use a strong, unique password for your account</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password will remain unchanged if you don't click the link</li>
                </ul>
            </div>
            
            <p style="margin-top: 32px; color: #6c757d; font-size: 14px;">
                If you're having trouble or didn't request this password reset, please contact our support team immediately.
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">© {{ date('Y') }} PODNIT. All rights reserved.</p>
            <p style="margin: 8px 0 0 0;">
                This is an automated email. Please do not reply to this message.
            </p>
        </div>
    </div>
</body>
</html>
