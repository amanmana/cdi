<?php

namespace App\Core;

class Auth
{
    protected $db;
    protected $session;
    protected $user;

    public function __construct(DB $db, Session $session)
    {
        $this->db = $db;
        $this->session = $session;
    }

    public function attempt($email, $password)
    {
        $user = $this->db->fetch("SELECT * FROM users WHERE email = ? AND status = 'active' LIMIT 1", [$email]);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            $this->session->set('user_id', $user['id']);
            $this->user = $user;
            return true;
        }

        return false;
    }

    public function check()
    {
        return $this->session->has('user_id');
    }

    public function user()
    {
        if ($this->user) return $this->user;

        $userId = $this->session->get('user_id');
        if ($userId) {
            $this->user = $this->db->fetch("SELECT * FROM users WHERE id = ? LIMIT 1", [$userId]);
            return $this->user;
        }

        return null;
    }

    public function id()
    {
        return $this->session->get('user_id');
    }

    public function logout()
    {
        $this->session->forget('user_id');
        $this->user = null;
    }

    public function hasRole($roles)
    {
        $user = $this->user();
        if (!$user) return false;

        $roles = (array)$roles;
        return in_array($user['role'], $roles);
    }
}
