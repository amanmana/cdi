<?php

namespace App\Controllers\Auth;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Models\User;

class RegisterController extends Controller
{
    public function show(Request $request, Response $response)
    {
        if (auth()->check()) {
            return $this->redirect('/');
        }
        return $this->view('auth/register', [], 'public');
    }

    public function register(Request $request, Response $response)
    {
        $validator = new Validator();
        $validation = $validator->validate($request->all(), [
            'name' => 'required|min:2|max:80',
            'email' => 'required|email|max:120',
            'unit' => 'required|max:100',
            'password' => 'required|min:6',
        ]);

        if (!$validation['isValid']) {
            session()->flashSet('errors', $validation['errors']);
            session()->flashSet('old', $request->all());
            return $this->back();
        }

        $email = $validation['data']['email'];
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !str_ends_with($email, '@mimos.my')) {
            session()->flashSet('error', 'Only @mimos.my email addresses are allowed.');
            session()->flashSet('old', $request->all());
            return $this->back();
        }

        // Check if user exists
        $db = \App\Core\App::getInstance()->make('db');
        $existing = $db->fetch("SELECT id FROM users WHERE email = ?", [$email]);
        if ($existing) {
            session()->flashSet('error', 'This email is already registered.');
            session()->flashSet('old', $request->all());
            return $this->back();
        }

        $userData = $validation['data'];
        $userData['role'] = 'client';
        
        User::create($userData);

        session()->flashSet('success', 'Registration successful! You can now log in.');
        return $this->redirect('/login');
    }
}
