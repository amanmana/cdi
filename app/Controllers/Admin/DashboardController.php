<?php

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Models\JobRequest;

class DashboardController extends Controller
{
    public function index(Request $request, Response $response)
    {
        $user = auth()->user();
        
        // Staff don't get a dashboard UNLESS they are an acting manager
        if ($user['role'] === 'staff') {
            $isDelegate = \App\Models\Delegation::findActive($user['id']);
            if (!$isDelegate) {
                return $this->redirect('/admin/job-requests');
            }
        }

        // Fetch data for dashboard cards (already filtered by unit in the model)
        $allRequests = JobRequest::all();
        
        $stats = [
            'total' => count($allRequests),
            'pending' => 0,
            'processing' => 0,
            'completed' => 0,
            'rejected' => 0,
            'overdue' => 0
        ];

        $today = date('Y-m-d');
        foreach ($allRequests as $req) {
            $isStaffFinished = ($req['status'] === 'staff_processing' && $req['total_staff'] > 0 && $req['completed_staff'] == $req['total_staff']);
            $isCompleted = ($isStaffFinished || $req['status'] === 'completed');

            // Count overdue separately from status counts
            if (!$isCompleted && $req['status'] !== 'rejected' && !empty($req['deadline']) && $req['deadline'] < $today) {
                $stats['overdue']++;
            }

            if ($req['status'] === 'manager_approval' || $req['status'] === 'pending') {
                $stats['pending']++;
            } elseif ($isCompleted) {
                $stats['completed']++;
            } elseif ($req['status'] === 'staff_processing') {
                $stats['processing']++;
            } elseif ($req['status'] === 'rejected') {
                $stats['rejected']++;
            }
        }

        $recentRequests = array_slice($allRequests, 0, 5);

        return $this->view('admin/dashboard', [
            'stats' => $stats,
            'recentRequests' => $recentRequests,
            'title' => $user['role'] === 'client' ? 'My Dashboard' : 'General Dashboard'
        ], 'admin');
    }

    public function testEmail(Request $request, Response $response)
    {
        $user = auth()->user();
        if ($user['role'] !== 'admin' && $user['role'] !== 'manager') {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $to = 'akhmal@mimos.my';
        $subject = 'MAMP Server Test Email';
        $body = "
            <html>
            <head><title>MAMP Test</title></head>
            <body style='font-family: sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
                    <h1 style='color: #4f46e5;'>Mimos Framework Mini</h1>
                    <p>Hello Akmal!</p>
                    <p>This is a test email sent from your <strong>MAMP Server</strong>.</p>
                    <p>If you have received this email, your local email configuration is working perfectly.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
                    <p style='font-size: 12px; color: #999;'>Sent at: " . date('Y-m-d H:i:s') . "</p>
                </div>
            </body>
            </html>
        ";

        try {
            $sent = \App\Core\Mail::to($to)
                ->subject($subject)
                ->body($body)
                ->send();

            if ($sent) {
                session()->flashSet('success', 'Test email sent to ' . $to . '. Please check your inbox.');
            } else {
                session()->flashSet('error', 'Failed to send email. MAMP requires SMTP configuration in php.ini or a helper like PHPMailer.');
            }
        } catch (\Exception $e) {
            session()->flashSet('error', 'Error sending email: ' . $e->getMessage());
        }

        return $this->redirect('/admin/dashboard');
    }
}
