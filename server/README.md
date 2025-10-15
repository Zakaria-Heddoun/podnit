# Podnit Laravel Backend

A Laravel-based backend API with role-based authentication system for the Podnit application.

## Features

- **Role-based Authentication**: Admin and Seller roles with different access levels
- **Laravel Sanctum**: API token-based authentication
- **User Management**: Admin can manage users and their roles
- **Dashboard APIs**: Separate dashboards for Admin and Seller users
- **CORS Support**: Configured for Next.js frontend integration

## Setup Instructions

### Prerequisites
- PHP 8.1 or higher
- Composer
- SQLite (default) or MySQL

### Installation

1. **Install Dependencies**
   ```bash
   composer install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. **Database Setup**
   ```bash
   php artisan migrate
   php artisan db:seed --class=AdminUserSeeder
   ```

4. **Start Development Server**
   ```bash
   php artisan serve
   ```

The server will be available at `http://127.0.0.1:8000`

## Default Admin User

- **Email**: admin@podnit.com
- **Password**: admin123
- **Role**: admin

## API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/register` | Register new seller | Public |
| POST | `/api/login` | User login | Public |
| POST | `/api/logout` | User logout | Authenticated |

### User Information Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/user` | Get authenticated user info | Authenticated |
| GET | `/api/user/redirect` | Get role-based redirect URL | Authenticated |

### Admin Routes (Admin Role Required)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/admin/dashboard` | Admin dashboard stats | Admin |
| GET | `/api/admin/users` | List all users (paginated) | Admin |
| PUT | `/api/admin/users/{id}/role` | Update user role | Admin |

### Seller Routes (Seller Role Required)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/seller/dashboard` | Seller dashboard data | Seller |
| GET | `/api/seller/profile` | Get seller profile | Seller |
| PUT | `/api/seller/profile` | Update seller profile | Seller |

### Public Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/health` | API health check | Public |

## Authentication Flow

1. **Registration**: New users register as 'seller' role by default
2. **Login**: Returns JWT token and user information with role-based redirect URL
3. **Token Usage**: Include token in Authorization header: `Bearer {token}`
4. **Role-based Access**: Middleware enforces role-based route access

## Response Format

### Successful Login Response
```json
{
    "message": "Login successful",
    "token": "3|JmmkUPcizseKkdyFw8uFSi2N8MwI6VqXk9Tl1JgZ...",
    "user": {
        "id": 1,
        "name": "Admin User",
        "email": "admin@podnit.com",
        "role": "admin"
    },
    "redirect_url": "/admin/dashboard"
}
```

### Admin Dashboard Response
```json
{
    "message": "Admin dashboard data",
    "data": {
        "stats": {
            "total_users": 4,
            "total_sellers": 3,
            "total_admins": 1
        },
        "recent_users": [...]
    }
}
```

### Seller Dashboard Response
```json
{
    "message": "Seller dashboard data",
    "data": {
        "user": {
            "id": 4,
            "name": "Test Seller",
            "email": "seller@test.com",
            "role": "seller"
        },
        "stats": {
            "total_products": 0,
            "total_orders": 0,
            "total_revenue": 0
        }
    }
}
```

## Error Responses

### Unauthorized Access (403)
```json
{
    "message": "Unauthorized. Admin access required."
}
```

### Validation Error (422)
```json
{
    "message": "The email has already been taken.",
    "errors": {
        "email": ["The email has already been taken."]
    }
}
```

## Testing

Run the included test script to verify all endpoints:
```bash
php test_api.php
```

This script tests:
- Health check endpoint
- User registration
- Admin and seller login
- Role-based dashboard access
- Access control enforcement

## CORS Configuration

The API is configured to accept requests from `http://localhost:3000` (Next.js frontend) with proper CORS headers for cross-origin requests.

## Security Features

- **Password Hashing**: Bcrypt with configurable rounds
- **API Rate Limiting**: Built-in Laravel rate limiting
- **Token-based Authentication**: Laravel Sanctum for secure API access
- **Role-based Authorization**: Middleware-enforced access control
- **Input Validation**: Request validation for all endpoints

## Database Schema

### Users Table
- `id`: Primary key
- `name`: User's full name
- `email`: Unique email address
- `password`: Hashed password
- `role`: Enum ('admin', 'seller') - defaults to 'seller'
- `email_verified_at`: Email verification timestamp
- `created_at` / `updated_at`: Timestamps

### Personal Access Tokens Table (Laravel Sanctum)
- Token management for API authentication

## Next Steps

This backend is ready for integration with the Next.js frontend. The API provides all necessary endpoints for:
- User authentication and registration
- Role-based dashboard access
- User management (admin functionality)
- Profile management (seller functionality)

For frontend integration, use the provided API endpoints with proper authentication headers.

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
