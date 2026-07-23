<?php

namespace App\Core;

class Logger
{
    public static function log($level, $message)
    {
        $logPath = storage_path('logs/app.log');
        $date = date('Y-m-d H:i:s');
        $formattedMessage = "[{$date}] [{$level}] {$message}" . PHP_EOL;
        file_put_contents($logPath, $formattedMessage, FILE_APPEND);
    }

    public static function error($message)
    {
        static::log('ERROR', $message);
    }

    public static function info($message)
    {
        static::log('INFO', $message);
    }
}
