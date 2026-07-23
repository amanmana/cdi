<?php

namespace App\Core;

class Mail
{
    public static function to($to)
    {
        return new static($to);
    }

    protected $to;
    protected $subject;
    protected $body;
    protected $headers = [];

    public function __construct($to)
    {
        $this->to = $to;
        
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        if (strpos($host, ':') !== false) {
            $host = explode(':', $host)[0];
        }

        $fromEmail = setting('site_email', 'noreply@' . $host);
        $this->headers[] = 'From: ' . $fromEmail;
        $this->headers[] = 'Reply-To: ' . $fromEmail;
        $this->headers[] = 'X-Mailer: PHP/' . phpversion();
        $this->headers[] = 'MIME-Version: 1.0';
        $this->headers[] = 'Content-type: text/html; charset=UTF-8';
    }

    public function subject($subject)
    {
        $this->subject = $subject;
        return $this;
    }

    public function body($body)
    {
        $this->body = $body;
        return $this;
    }

    public function send()
    {
        $success = mail(
            $this->to,
            $this->subject,
            $this->body,
            implode("\r\n", $this->headers)
        );

        if (!$success) {
            error_log("Mail failure: To: {$this->to}, Subject: {$this->subject}");
        } else {
            error_log("Mail sent: To: {$this->to}, Subject: {$this->subject}");
        }

        return $success;
    }
}
