<?php

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Request;
use App\Models\TaskInvitation;
use App\Models\User;
use App\Models\JobRequest;

class TaskInvitationController extends Controller {

    public function store(Request $request, $response) {
        $jobRequestId = $request->param('id');
        $currentUser = auth()->user();
        $currentUserId = $currentUser['id'];
        $jobRequest = JobRequest::find($jobRequestId);
        
        // Security: Only assigned staff, managers (from same unit), or admins can invite others
        $isAssignedStaff = TaskInvitation::isStaffAssigned($jobRequestId, $currentUserId);
        $isManager = $currentUser['role'] === 'manager' && $currentUser['unit'] === $jobRequest['unit'];
        $isAdmin = $currentUser['role'] === 'admin';
        
        if (!$isAssignedStaff && !$isManager && !$isAdmin) {
            session()->flashSet('error', 'You do not have permission to invite team members to this job.');
            return $this->redirect("/admin/job-requests/{$jobRequestId}");
        }
        
        $inviteeIds = $request->input('invitee_ids', []);
        $taskDescription = $request->input('task_description');
        
        // Validate
        if (empty($inviteeIds) || empty($taskDescription)) {
            session()->flashSet('error', 'Please select at least one team member and provide a task description.');
            return $this->redirect("/admin/job-requests/{$jobRequestId}");
        }
        
        $alreadyAssigned = [];
        $invitedCount = 0;

        $invitedNames = [];
        foreach ($inviteeIds as $inviteeId) {
            // Check if already invited or assigned
            if (TaskInvitation::isStaffInvolved($jobRequestId, $inviteeId)) {
                $user = User::find($inviteeId);
                $alreadyAssigned[] = $user ? $user['name'] : "ID: {$inviteeId}";
                continue;
            }
            
            // Create invitation and add to job
            TaskInvitation::create($jobRequestId, $currentUserId, $inviteeId, $taskDescription);
            
            $user = User::find($inviteeId);
            if ($user) $invitedNames[] = $user['name'];
            
            $invitedCount++;
        }
        
        if (!empty($alreadyAssigned)) {
            $msg = count($alreadyAssigned) > 1 ? "Some members were already assigned: " : "Member already assigned: ";
            session()->flashSet('warning', $msg . implode(', ', $alreadyAssigned));
        }

        if ($invitedCount > 0) {
            $workflow = new \App\Core\Approval\WorkflowService();
            $namesList = implode(', ', $invitedNames);
            $msg = "Invited {$namesList} to collaborate: " . $taskDescription;
            $workflow->logAction('job_request', $jobRequestId, 'invite', $currentUserId, $msg);
            
            session()->flashSet('success', "{$invitedCount} team member(s) invited successfully!");
        }

        return $this->redirect("/admin/job-requests/{$jobRequestId}");
    }
}
