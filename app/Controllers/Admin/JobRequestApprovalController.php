<?php

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Core\Approval\WorkflowService;

class JobRequestApprovalController extends Controller
{
    public function approve(Request $request, Response $response)
    {
        $id = $request->param('id');
        $comment = $request->input('comment');
        $assignedStaffIds = $request->input('assigned_staff_ids');
        $startDate = $request->input('start_date');
        $deadline = $request->input('deadline');
        
        if (empty($assignedStaffIds)) {
            session()->flashSet('error', 'Please select at least one staff member.');
            return $this->redirect("/admin/job-requests/{$id}");
        }

        if ($deadline < $startDate) {
            session()->flashSet('error', 'Deadline cannot be earlier than the Start Date.');
            return $this->redirect("/admin/job-requests/{$id}");
        }

        $jobRequest = \App\Models\JobRequest::find($id);
        $workflow = new WorkflowService();
        if (!$workflow->canAct(auth()->user(), $jobRequest['role_required'])) {
            return (new Response())->view('errors/403', [], null, 403);
        }

        // Update assigned staff and dates
        \App\Models\JobRequest::assignStaff($id, $assignedStaffIds);
        \App\Models\JobRequest::updateDates($id, $startDate, $deadline);
        
        $workflow->approve('job_request', $id, auth()->id(), $comment);

        // --- EMAIL NOTIFICATION FOR STAFF ---
        foreach ($assignedStaffIds as $staffId) {
            $staff = \App\Models\User::find($staffId);
            if ($staff) {
                $subject = "Task Assigned: [" . $jobRequest['ticket_no'] . "] " . $jobRequest['title'];
                $body = "
                    <div style='font-family: sans-serif; line-height: 1.6; color: #333;'>
                        <h2 style='color: #4f46e5;'>New Task Assigned</h2>
                        <p>Hi " . e($staff['name']) . ", you have been assigned to a new project.</p>
                        <table style='width: 100%; border-collapse: collapse; margin-top: 20px;'>
                            <tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;'>Ticket ID</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>" . e($jobRequest['ticket_no']) . "</td></tr>
                            <tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Project Title</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>" . e($jobRequest['title']) . "</td></tr>
                            <tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Deadline</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>" . e($deadline) . "</td></tr>
                        </table>
                        <div style='margin-top: 30px;'>
                            <a href='" . full_url('/login') . "' style='background: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;'>View Project Details</a>
                        </div>
                    </div>
                ";
                \App\Core\Mail::to($staff['email'])->subject($subject)->body($body)->send();
            }
        }
        // ------------------------------------

        session()->flashSet('success', 'Request approved and assigned to staff.');
        return $this->redirect("/admin/job-requests/{$id}");
    }

    public function reject(Request $request, Response $response)
    {
        $id = $request->param('id');
        $comment = $request->input('comment');
        
        $jobRequest = \App\Models\JobRequest::find($id);

        $workflow = new WorkflowService();
        if (!$workflow->canAct(auth()->user(), $jobRequest['role_required'])) {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $workflow->reject('job_request', $id, auth()->id(), $comment);

        // Simulation: Sending email to client
        // \App\Core\Mail::to($jobRequest['client_email'])->send(new RejectionEmail($comment));
        
        session()->flashSet('success', "Request disapproved.");
        return $this->redirect("/admin/job-requests/{$id}");
    }

    public function complete(Request $request, Response $response)
    {
        $id = $request->param('id');
        $comment = $request->input('comment');
        
        $jobRequest = \App\Models\JobRequest::find($id);
        $workflow = new WorkflowService();
        if (!$workflow->canAct(auth()->user(), $jobRequest['role_required'])) {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $workflow->complete('job_request', $id, auth()->id(), $comment);

        session()->flashSet('success', 'Workflow completed.');
        return $this->redirect("/admin/job-requests/{$id}");
    }

    public function staffComplete(Request $request, Response $response)
    {
        $id = $request->param('id');
        $user = auth()->user();
        
        if ($user['role'] !== 'staff') {
            return (new Response())->view('errors/403', [], null, 403);
        }

        \App\Models\JobRequest::markStaffComplete($id, $user['id']);

        $workflow = new WorkflowService();
        $workflow->logAction('job_request', $id, 'staff_complete', $user['id'], "Completed their assigned task.");

        // Check for Auto-Complete
        $job = \App\Models\JobRequest::find($id);
        if ($job['total_staff'] > 0 && $job['completed_staff'] == $job['total_staff']) {
            $workflow->complete('job_request', $id, 0, "Automatically completed because all assigned staff finished their tasks.");
            session()->flashSet('success', 'Your part is done, and the project has been automatically finalized!');
        } else {
            session()->flashSet('success', 'Your part is marked as completed!');
        }
        
        return $this->redirect("/admin/job-requests/{$id}");
    }
}
