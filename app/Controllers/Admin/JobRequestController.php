<?php

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Models\JobRequest;
use App\Core\Approval\WorkflowService;

class JobRequestController extends Controller
{
    public function index(Request $request, Response $response)
    {
        $search = $request->query('search');
        $filter = $request->query('filter'); // pending, processing, completed, overdue
        $requests = JobRequest::all($search);
        
        // Apply filter if specified
        if ($filter) {
            $today = date('Y-m-d');
            $requests = array_filter($requests, function($req) use ($filter, $today) {
                $isStaffFinished = ($req['status'] === 'staff_processing' && $req['total_staff'] > 0 && $req['completed_staff'] == $req['total_staff']);
                $isCompleted = ($isStaffFinished || $req['status'] === 'completed');
                
                switch($filter) {
                    case 'pending':
                        return ($req['status'] === 'manager_approval' || $req['status'] === 'pending');
                    case 'processing':
                        return ($req['status'] === 'staff_processing' && !$isStaffFinished);
                    case 'completed':
                        return $isCompleted;
                    case 'overdue':
                        return (!$isCompleted && $req['status'] !== 'rejected' && !empty($req['deadline']) && $req['deadline'] < $today);
                    default:
                        return true;
                }
            });
        }
        
        return $this->view('admin/index', [
            'requests' => $requests,
            'title' => 'Job Requests',
            'search' => $search,
            'filter' => $filter
        ], 'admin');
    }

    public function show(Request $request, Response $response)
    {
        $id = $request->param('id');
        $jobRequest = JobRequest::find($id);
        
        if (!$jobRequest) {
            return $this->view('errors/404', [], 'public', 404);
        }

        $user = auth()->user();
        if ($user['role'] === 'client') {
            if ($jobRequest['client_email'] !== $user['email']) {
                return (new Response())->view('errors/403', [], null, 403);
            }
        } elseif ($user['role'] === 'staff') {
            $assignedIds = explode(',', $jobRequest['assigned_staff_ids'] ?? '');
            $isDelegate = \App\Models\Delegation::findActive($user['id']);
            $isDelegateOfUnit = ($isDelegate && $isDelegate['manager_unit'] === $jobRequest['unit']);
            
            if (!in_array($user['id'], $assignedIds) && !$isDelegateOfUnit) {
                return (new Response())->view('errors/403', [], null, 403);
            }
        } elseif ($user['role'] !== 'admin') { // Manager/Other
            if ($jobRequest['unit'] !== $user['unit']) {
                return (new Response())->view('errors/403', [], null, 403);
            }
        }

        $workflow = new WorkflowService();
        $history = $workflow->history('job_request', $id);
        
        $user = auth()->user();
        $isDelegate = \App\Models\Delegation::findActive($user['id']);
        $effectiveUnit = ($isDelegate && $user['role'] === 'staff') ? $isDelegate['manager_unit'] : $user['unit'];

        $staffList = \App\Models\User::getByRole('staff', $user['role'] === 'admin' ? null : $effectiveUnit);
        $assignedStaff = JobRequest::getAssignedStaffDetails($id);
        
        $staffReports = \App\Models\JobStaffReport::getByJobAndStaff($id, (auth()->user()['role'] === 'staff' ? auth()->id() : null));
        
        return $this->view('admin/show', [
            'request' => $jobRequest,
            'history' => $history,
            'staffList' => $staffList,
            'assignedStaff' => $assignedStaff,
            'staffReports' => $staffReports,
            'title' => 'Request Details'
        ], 'admin');
    }

    public function delete(Request $request, Response $response)
    {
        $id = $request->param('id');
        $user = auth()->user();
        $job = JobRequest::find($id);

        if (!$job) {
            return $this->view('errors/404', [], 'public', 404);
        }

        // Security Check: Only admins, managers, and delegates can delete
        $isDelegate = \App\Models\Delegation::findActive($user['id']);
        $isDelegateOfUnit = ($isDelegate && $isDelegate['manager_unit'] === $job['unit']);

        if ($user['role'] !== 'admin' && $user['role'] !== 'manager' && !$isDelegateOfUnit) {
            return (new Response())->view('errors/403', [], null, 403);
        }

        // Setting Check: If user is manager or delegate, check if delete is allowed
        if ($user['role'] === 'manager' || $isDelegateOfUnit) {
            $allowManagerDelete = \App\Models\Setting::get('allow_manager_delete', '1');
            if ($allowManagerDelete !== '1') {
                return (new Response())->view('errors/403', [], null, 403);
            }
        }

        if (JobRequest::delete($id)) {
            session()->flashSet('success', 'Job Request successfully deleted.');
        } else {
            session()->flashSet('error', 'Failed to delete Job Request.');
        }

        return $this->redirect('/admin/job-requests');
    }

    public function updateTimeline(Request $request, Response $response)
    {
        $id = $request->param('id');
        $user = auth()->user();
        $job = JobRequest::find($id);

        $isDelegate = \App\Models\Delegation::findActive($user['id']);
        $isDelegateOfUnit = ($isDelegate && $isDelegate['manager_unit'] === $job['unit']);

        if (!$job || ($user['role'] !== 'admin' && ($user['role'] !== 'manager' || $job['unit'] !== $user['unit']) && !$isDelegateOfUnit)) {
             return (new Response())->view('errors/403', [], null, 403);
        }

        $startDate = $request->input('start_date');
        $deadline = $request->input('deadline');

        if ($deadline < $startDate) {
            session()->flashSet('error', 'Deadline cannot be earlier than the Start Date.');
            return $this->redirect("/admin/job-requests/{$id}");
        }

        JobRequest::updateDates($id, $startDate, $deadline);
        session()->flashSet('success', 'Project timeline updated.');
        return $this->redirect('/admin/job-requests/' . $id);
    }

    public function updateTeam(Request $request, Response $response)
    {
        $id = $request->param('id');
        $user = auth()->user();
        $job = JobRequest::find($id);

        $isDelegate = \App\Models\Delegation::findActive($user['id']);
        $isDelegateOfUnit = ($isDelegate && $isDelegate['manager_unit'] === $job['unit']);

        if (!$job || ($user['role'] !== 'admin' && ($user['role'] !== 'manager' || $job['unit'] !== $user['unit']) && !$isDelegateOfUnit)) {
             return (new Response())->view('errors/403', [], null, 403);
        }

        $staffIds = $request->input('staff_ids') ?? [];
        $newlyAssigned = JobRequest::assignStaff($id, $staffIds);

        // --- EMAIL NOTIFICATION FOR NEWLY ASSIGNED STAFF ---
        if (!empty($newlyAssigned)) {
            foreach ($newlyAssigned as $staffId) {
                $staff = \App\Models\User::find($staffId);
                if ($staff) {
                    $subject = "New Task Assigned: [" . $job['ticket_no'] . "] " . $job['title'];
                    $body = "
                        <div style='font-family: sans-serif; line-height: 1.6; color: #333;'>
                            <h2 style='color: #4f46e5;'>New Task Assigned</h2>
                            <p>Hi " . e($staff['name']) . ", you have been added to a new project team.</p>
                            <table style='width: 100%; border-collapse: collapse; margin-top: 20px;'>
                                <tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;'>Ticket ID</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>" . e($job['ticket_no']) . "</td></tr>
                                <tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Project Title</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>" . e($job['title']) . "</td></tr>
                            </table>
                            <div style='margin-top: 30px;'>
                                <a href='" . full_url('/login') . "' style='background: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;'>View Project Details</a>
                            </div>
                        </div>
                    ";
                    \App\Core\Mail::to($staff['email'])->subject($subject)->body($body)->send();
                }
            }
        }
        // ----------------------------------------------------

        // Log to Activity History
        $workflow = new \App\Core\Approval\WorkflowService();
        $staffNames = [];
        if (!empty($staffIds)) {
            foreach ($staffIds as $sid) {
                $u = \App\Models\User::find($sid);
                if ($u) $staffNames[] = $u['name'];
            }
        }
        $msg = empty($staffNames) ? "Cleared all staff assignments." : "Updated team assignment to: " . implode(', ', $staffNames);
        $workflow->logAction('job_request', $id, 'update_team', $user['id'], $msg);
        
        session()->flashSet('success', 'Team assignment updated.');
        return $this->redirect('/admin/job-requests/' . $id);
    }

    public function updateDescription(Request $request, Response $response)
    {
        $id = $request->param('id');
        $user = auth()->user();
        $job = JobRequest::find($id);

        $isDelegate = \App\Models\Delegation::findActive($user['id']);
        $isDelegateOfUnit = ($isDelegate && $isDelegate['manager_unit'] === $job['unit']);

        if (!$job || ($user['role'] !== 'admin' && ($user['role'] !== 'manager' || $job['unit'] !== $user['unit']) && !$isDelegateOfUnit)) {
             return (new Response())->view('errors/403', [], null, 403);
        }

        $description = $request->input('description');
        JobRequest::updateDescription($id, $description);

        session()->flashSet('success', 'Project description updated.');
        return $this->redirect('/admin/job-requests/' . $id);
    }
}
