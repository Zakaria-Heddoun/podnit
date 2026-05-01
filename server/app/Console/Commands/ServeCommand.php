<?php

namespace App\Console\Commands;

use Illuminate\Foundation\Console\ServeCommand as BaseServeCommand;

use function Illuminate\Support\php_binary;

class ServeCommand extends BaseServeCommand
{
    protected function serverCommand()
    {
        $server = file_exists(base_path('server.php'))
            ? base_path('server.php')
            : __DIR__.'/../../../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php';

        return [
            php_binary(),
            '-d', 'post_max_size=100M',
            '-d', 'upload_max_filesize=64M',
            '-d', 'memory_limit=256M',
            '-d', 'max_execution_time=120',
            '-d', 'max_input_time=120',
            '-d', 'max_file_uploads=500',
            '-S',
            $this->host().':'.$this->port(),
            $server,
        ];
    }
}
