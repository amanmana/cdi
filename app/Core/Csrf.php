<?php

namespace App\Core;

class Csrf
{
    protected $session;

    public function __construct(Session $session)
    {
        $this->session = $session;
    }

    public function token()
    {
        $token = $this->session->get('_csrf_token');
        if (!$token) {
            $token = bin2hex(random_bytes(32));
            $this->session->set('_csrf_token', $token);
        }
        return $token;
    }

    public function verify($token)
    {
        $stored = $this->session->get('_csrf_token');
        return $token && hash_equals($stored, $token);
    }
}
