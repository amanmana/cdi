<?php

namespace App\Controllers\Auth;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Core\App;

class LoginController extends Controller
{
    public function show(Request $request, Response $response)
    {
        if (auth()->check()) {
            return $this->redirect('/admin');
        }
        return $this->view('auth/login', [], 'guest');
    }

    public function login(Request $request, Response $response)
    {
        $email = $request->input('email');
        $password = $request->input('password');

        if (auth()->attempt($email, $password)) {
            session()->flashSet('success', 'Welcome back!');
            return $this->redirect('/admin');
        }

        session()->flashSet('error', 'Invalid credentials.');
        return $this->back();
    }

    public function logout(Request $request, Response $response)
    {
        auth()->logout();
        return $this->redirect('/login');
    }
}
