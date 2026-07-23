<?php

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Models\User;
use App\Models\JobRequest;
use App\Models\Delegation;

class TeamController extends Controller
{
    public function index(Request $request, Response $response)
    {
        $user = auth()->user();
        
        // Only managers and admins
        if ($user['role'] !== 'admin' && $user['role'] !== 'manager') {
            return (new Response())->view('errors/403', [], null, 403);
        }

        // List staff for the manager's unit, or all for admin
        $unit = $user['role'] === 'admin' ? null : $user['unit'];
        $staffList = User::getByRole('staff', $unit);

        // Calculate workload per staff
        $staffWorkload = [];
        foreach ($staffList as $staff) {
            $staffJobs = JobRequest::getByStaff($staff['id']);
            $activeJobs = array_filter($staffJobs, function($job) {
                // Job is in processing and THIS staff hasn't finished their part
                return $job['status'] === 'staff_processing' && $job['staff_part_completed_at'] === null;
            });
            
            $staffWorkload[] = [
                'info' => $staff,
                'active_jobs' => $activeJobs
            ];
        }

        $delegations = [];
        if ($user['role'] === 'manager') {
            $delegations = Delegation::getByManager($user['id']);
        }

        return $response->view('admin/team/index', [
            'staffList' => $staffList,
            'staffWorkload' => $staffWorkload,
            'delegations' => $delegations,
            'title' => 'My Team'
        ], 'admin');
    }

    public function createDelegation(Request $request, Response $response)
    {
        $user = auth()->user();
        if ($user['role'] !== 'manager') {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $data = $request->all();
        $data['manager_id'] = $user['id'];

        if (empty($data['delegate_id']) || empty($data['start_date']) || empty($data['end_date'])) {
            session()->flashSet('error', 'All delegation fields are required.');
            return $this->redirect('/admin/team');
        }

        try {
            Delegation::create($data);
            session()->flashSet('success', 'Delegation set successfully.');
        } catch (\Exception $e) {
            session()->flashSet('error', 'Failed to set delegation.');
        }

        return $this->redirect('/admin/team');
    }

    public function cancelDelegation(Request $request, Response $response)
    {
        $id = $request->param('id');
        try {
            Delegation::deactivate($id);
            session()->flashSet('success', 'Delegation cancelled.');
        } catch (\Exception $e) {
            session()->flashSet('error', 'Failed to cancel delegation.');
        }
        return $this->redirect('/admin/team');
    }

    public function show(Request $request, Response $response)
    {
        $id = $request->param('id');
        $staff = User::find($id);
        $user = auth()->user();

        if (!$staff || $staff['role'] !== 'staff') {
            return (new Response())->view('errors/404', [], null, 404);
        }

        // Manager can only see staff in their unit
        if ($user['role'] === 'manager' && $staff['unit'] !== $user['unit']) {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $allJobs = JobRequest::getByStaff($id);
        
        $currentJobs = [];
        $historyJobs = [];

        foreach ($allJobs as $job) {
            if ($job['staff_part_completed_at'] === null) {
                $currentJobs[] = $job;
            } else {
                $historyJobs[] = $job;
            }
        }

        return $this->view('admin/team/show', [
            'staff' => $staff,
            'currentJobs' => $currentJobs,
            'historyJobs' => $historyJobs,
            'title' => 'Staff Performance: ' . $staff['name']
        ], 'admin');
    }

    public function store(Request $request, Response $response)
    {
        $user = auth()->user();
        
        // Security: Only admins and managers can add staff
        if ($user['role'] !== 'admin' && $user['role'] !== 'manager') {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $data = $request->all();
        $data['role'] = 'staff'; // Forced role
        
        // Managers can only add to their unit
        if ($user['role'] === 'manager') {
            $data['unit'] = $user['unit'];
        }

        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            session()->flashSet('error', 'Name, Email and Password are required.');
            return $this->redirect('/admin/team');
        }

        try {
            // Check for existing email (including archived ones)
            $existingUser = User::findByEmail($data['email']);
            if ($existingUser) {
                $statusText = $existingUser['status'] === 'archived' ? ' (currently archived)' : '';
                session()->flashSet('error', "The email '{$data['email']}' is already in use{$statusText}. Please use a different email or re-activate the existing user.");
                return $this->redirect('/admin/team');
            }

            User::create($data);
            session()->flashSet('success', 'Staff member added successfully.');
        } catch (\Exception $e) {
            session()->flashSet('error', 'Failed to add staff: System error occurred.');
        }

        return $this->redirect('/admin/team');
    }

    public function update(Request $request, Response $response)
    {
        $id = $request->param('id');
        $user = auth()->user();
        $staff = User::find($id);

        if (!$staff || $staff['role'] !== 'staff') {
            session()->flashSet('error', 'Staff member not found.');
            return $this->redirect('/admin/team');
        }

        // Manager can only update staff in their unit
        if ($user['role'] === 'manager' && $staff['unit'] !== $user['unit']) {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $data = $request->all();
        unset($data['role']); // Prevent role escalation
        unset($data['unit']); // Prevent unit changing for staff by manager

        try {
            User::update($id, $data);
            session()->flashSet('success', 'Staff member updated successfully.');
        } catch (\Exception $e) {
            session()->flashSet('error', 'Failed to update staff: ' . $e->getMessage());
        }

        return $this->redirect('/admin/team');
    }

    public function delete(Request $request, Response $response)
    {
        $id = $request->param('id');
        $user = auth()->user();
        $staff = User::find($id);

        if (!$staff || $staff['role'] !== 'staff') {
            session()->flashSet('error', 'Staff member not found.');
            return $this->redirect('/admin/team');
        }

        // Manager can only delete staff in their unit
        if ($user['role'] === 'manager' && $staff['unit'] !== $user['unit']) {
            return (new Response())->view('errors/403', [], null, 403);
        }

        try {
            User::archive($id);
            
            // Log Activity
            $workflow = new \App\Core\Approval\WorkflowService();
            $workflow->logActivity(0, $user['id'], 'ARCHIVED_STAFF', "Archived staff member: " . $staff['name']);

            session()->flashSet('success', 'Staff member archived successfully.');
        } catch (\Exception $e) {
            session()->flashSet('error', 'Failed to archive staff: ' . $e->getMessage());
        }

        return $this->redirect('/admin/team');
    }
}
