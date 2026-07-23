<?php

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Models\User;
use App\Models\JobRequest;

class ProfileController extends Controller
{
    public function index(Request $request, Response $response)
    {
        $user = auth()->user();
        
        // Get some stats for the profile
        $stats = [
            'total_jobs' => 0,
            'completed_jobs' => 0,
            'pending_jobs' => 0
        ];

        if ($user['role'] === 'staff') {
            $jobs = JobRequest::getByStaff($user['id']);
            $stats['total_jobs'] = count($jobs);
            foreach ($jobs as $job) {
                if ($job['staff_part_completed_at']) {
                    $stats['completed_jobs']++;
                } else {
                    $stats['pending_jobs']++;
                }
            }
        }

        return $this->view('admin/profile/index', [
            'user' => $user,
            'stats' => $stats,
            'title' => 'User Profile'
        ], 'admin');
    }

    public function settings(Request $request, Response $response)
    {
        return $this->view('admin/profile/settings', [
            'user' => auth()->user(),
            'title' => 'Account Settings'
        ], 'admin');
    }

    public function update(Request $request, Response $response)
    {
        $user = auth()->user();
        $id = $user['id'];
        
        $data = [
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'role' => $user['role'], // Keep role
            'unit' => $request->input('unit') ?: $user['unit'], // Update unit if provided
        ];

        $password = $request->input('password');
        if (!empty($password)) {
            $data['password'] = $password;
        }

        User::update($id, $data);

        session()->flashSet('success', 'Account settings updated successfully.');
        return $this->redirect('/admin/profile');
    }
}
