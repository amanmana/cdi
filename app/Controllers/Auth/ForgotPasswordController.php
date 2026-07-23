<?php

namespace App\Controllers\Auth;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Core\App;
use App\Core\Mail;
use App\Models\User;

class ForgotPasswordController extends Controller
{
    public function showLinkRequestForm(Request $request, Response $response)
    {
        return $this->view('auth/forgot_password', ['title' => 'Forgot Password'], 'guest');
    }

    public function sendResetLinkEmail(Request $request, Response $response)
    {
        $email = $request->input('email');
        $db = App::getInstance()->make('db');
        
        $user = $db->fetch("SELECT id FROM users WHERE email = ?", [$email]);
        
        if (!$user) {
            session()->flashSet('error', 'We could not find a user with that email address.');
            return $this->redirect('/forgot-password');
        }

        $token = bin2hex(random_bytes(32));
        $db->execute("DELETE FROM password_resets WHERE email = ?", [$email]);
        $db->execute("INSERT INTO password_resets (email, token, created_at) VALUES (?, ?, ?)", [
            $email, $token, date('Y-m-d H:i:s')
        ]);

        $resetUrl = full_url("/reset-password?token={$token}&email=" . urlencode($email));

        $subject = "Reset Your Password";
        $body = "
            <div style='font-family: sans-serif; line-height: 1.6; color: #333;'>
                <h2 style='color: #4f46e5;'>Password Reset Request</h2>
                <p>Hello,</p>
                <p>You are receiving this email because we received a password reset request for your account.</p>
                <div style='margin-top: 30px; text-align: center;'>
                    <a href='{$resetUrl}' style='background: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;'>Reset Password</a>
                </div>
                <p style='margin-top: 30px;'>If you did not request a password reset, no further action is required.</p>
                <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
                <p style='font-size: 12px; color: #999;'>This password reset link will expire in 60 minutes.</p>
            </div>
        ";

        try {
            Mail::to($email)->subject($subject)->body($body)->send();
            session()->flashSet('success', 'We have emailed your password reset link!');
        } catch (\Exception $e) {
            session()->flashSet('error', 'Failed to send reset link. Please try again later.');
        }

        return $this->redirect('/forgot-password');
    }

    public function showResetForm(Request $request, Response $response)
    {
        $token = $request->query('token');
        $email = $request->query('email');

        return $this->view('auth/reset_password', [
            'token' => $token,
            'email' => $email,
            'title' => 'Reset Password'
        ], 'guest');
    }

    public function reset(Request $request, Response $response)
    {
        $email = $request->input('email');
        $token = $request->input('token');
        $password = $request->input('password');
        $passwordConfirmation = $request->input('password_confirmation');

        if ($password !== $passwordConfirmation) {
            session()->flashSet('error', 'The password confirmation does not match.');
            return $this->redirect("/reset-password?token={$token}&email=" . urlencode($email));
        }

        $db = App::getInstance()->make('db');
        $record = $db->fetch("SELECT * FROM password_resets WHERE email = ? AND token = ? LIMIT 1", [$email, $token]);

        if (!$record) {
            session()->flashSet('error', 'This password reset token is invalid.');
            return $this->redirect('/forgot-password');
        }

        // Check expiration (optional, let's do 1 hour)
        $expiresAt = strtotime($record['created_at']) + 3600;
        if (time() > $expiresAt) {
            session()->flashSet('error', 'This password reset token has expired.');
            return $this->redirect('/forgot-password');
        }

        $user = $db->fetch("SELECT id FROM users WHERE email = ?", [$email]);
        if ($user) {
            User::update($user['id'], ['password' => $password]);
            $db->execute("DELETE FROM password_resets WHERE email = ?", [$email]);
            session()->flashSet('success', 'Your password has been reset! You can now login.');
            return $this->redirect('/login');
        }

        session()->flashSet('error', 'We could not find a user with that email address.');
        return $this->redirect('/forgot-password');
    }
}
