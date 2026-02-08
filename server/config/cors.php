<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'signin', 'signup', 'register', 'storage/*'],

    'allowed_methods' => ['*'],

    // Include common dev frontend origins (add more if you use different ports)
    'allowed_origins' => [
        // Local Next dev server
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:30000',
        'http://127.0.0.1:30000',
        'http://podnit.com',
        'https://podnit.com',
        'http://www.podnit.com',
        'https://www.podnit.com',
        'http://127.0.0.1:30001',
        env('FRONTEND_URL'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
