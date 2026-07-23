<?php
$workflow = new \App\Core\Approval\WorkflowService();
$canAct = $workflow->canAct(auth()->user(), $request['role_required']);

// Check if job is visually completed (all staff done, even if not finalized)
$isVisuallyCompleted = ($request['status'] === 'staff_processing' && $request['total_staff'] > 0 && $request['completed_staff'] == $request['total_staff']);

// Extract completion or rejection date if exists
$resolvedDate = null;
$resolvedAction = null;

// 1. Check formal resolution (Manager Finalize or Reject)
foreach ($history as $item) {
    // If it's explicitly 'complete' or 'reject', or it's an 'approve' that led to 'completed' status
    if ($item['action'] === 'complete' || $item['action'] === 'reject' || ($request['status'] === 'completed' && $item['action'] === 'approve')) {
        $resolvedDate = $item['created_at'];
        $resolvedAction = ($item['action'] === 'approve' && $request['status'] === 'completed') ? 'complete' : $item['action'];
    }
}

// 2. Fallback for "Visual Completion" (Staff all done, but Manager hasn't finalized)
if (!$resolvedDate && $isVisuallyCompleted) {
    foreach ($history as $item) {
        if ($item['action'] === 'staff_complete') {
            $resolvedDate = $item['created_at']; // Use the latest staff completion date
            $resolvedAction = 'complete';
        }
    }
}

// Can edit only if: authorized AND not completed/rejected AND not visually completed AND has been approved by manager
$user = auth()->user();
$isDelegate = false;
if ($user['role'] !== 'admin') {
    $delegation = \App\Models\Delegation::findActive($user['id']);
    if ($delegation && $delegation['manager_unit'] === $request['unit']) {
        $isDelegate = true;
    }
}

$canEdit = ($user['role'] === 'admin') || 
           ($user['role'] === 'manager' && $user['unit'] === $request['unit']) ||
           $isDelegate;

$canEdit = $canEdit && !in_array($request['status'], ['completed', 'rejected', 'manager_approval', 'submitted']) && !$isVisuallyCompleted;
?>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    <!-- Info & Actions -->
    <div class="lg:col-span-2 space-y-8">
        <div class="card bg-white shadow-sm border">
            <div class="card-body">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <p class="text-[10px] font-black text-blue-600 font-mono tracking-tighter uppercase mb-1">Request #<?= e($request['ticket_no']) ?></p>
                        <h1 class="text-3xl font-black text-slate-800 tracking-tight mb-2"><?= e($request['title'] ?? 'Untitled Request') ?></h1>
                        <div class="flex items-center gap-3 mt-2">
                            <?php if (auth()->user()['role'] !== 'client'): ?>
                            <p class="text-slate-400 text-xs uppercase font-bold tracking-widest">Internal ID: #<?= $request['id'] ?></p>
                            <?php endif; ?>
                            <div class="px-2 py-1 bg-blue-50 border border-blue-100 rounded-md">
                                <span class="text-[10px] uppercase font-bold text-blue-600 tracking-widest">SUBMITTED ON <?= date('d M Y', strtotime($request['created_at'])) ?></span>
                            </div>
                            <?php if ($resolvedDate): ?>
                            <div class="px-2 py-1 <?= $resolvedAction === 'reject' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100' ?> border rounded-md">
                                <span class="text-[10px] uppercase font-bold <?= $resolvedAction === 'reject' ? 'text-rose-600' : 'text-emerald-600' ?> tracking-widest">
                                    <?= $resolvedAction === 'reject' ? 'REJECTED' : 'COMPLETED' ?> ON <?= date('d M Y', strtotime($resolvedDate)) ?>
                                </span>
                            </div>
                            <?php endif; ?>
                        </div>
                    </div>
                    <?php 
                        $statusClass = match($request['status']) {
                            'submitted' => 'badge-info',
                            'manager_approval' => 'badge-warning',
                            'staff_processing' => 'badge-primary',
                            'completed' => 'badge-success',
                            'rejected' => 'badge-error',
                            default => 'badge-ghost'
                        };
                    ?>
                    <div class="flex items-center gap-4">
                        <?php if ($request['total_staff'] > 0): ?>
                            <?php 
                                $percentage = round(($request['completed_staff'] / $request['total_staff']) * 100);
                            ?>
                            <div class="flex flex-col items-center">
                                <div class="radial-progress text-primary" style="--value:<?= $percentage ?>; --size:3rem; --thickness: 4px;" role="progressbar">
                                    <span class="text-[10px] font-bold"><?= $percentage ?>%</span>
                                </div>
                                <span class="text-[8px] uppercase font-bold text-slate-400 mt-1">Progress</span>
                            </div>
                        <?php endif; ?>
                        <?php 
                            $badgeLabel = str_replace('_', ' ', $request['current_step_name']);
                            $displayClass = $statusClass;
                            
                            if ($request['status'] === 'staff_processing' && isset($percentage) && $percentage == 100) {
                                $badgeLabel = 'COMPLETED';
                                $displayClass = 'badge-success';
                            }
                        ?>
                        <div class="badge <?= $displayClass ?> py-4 px-6 gap-2 font-bold uppercase tracking-wider">
                            <?= $badgeLabel ?>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-xl mb-6">
                    <div>
                        <p class="text-xs text-slate-400 uppercase font-bold mb-1">Client Name</p>
                        <p class="font-semibold text-slate-800"><?= e($request['client_name']) ?></p>
                    </div>
                    <div>
                        <p class="text-xs text-slate-400 uppercase font-bold mb-1">Email</p>
                        <p class="font-semibold text-slate-800"><?= e($request['client_email']) ?></p>
                    </div>
                    <?php if (auth()->user()['role'] !== 'client'): ?>
                    <div class="col-span-2 pt-4 border-t border-slate-200">
                        <div class="flex justify-between items-center mb-3">
                            <p class="text-xs text-slate-400 uppercase font-bold">Team Assignment & Status</p>
                            <?php if ($canEdit): ?>
                                <button onclick="openModal('team-modal')" class="btn btn-ghost btn-xs text-blue-500 font-bold uppercase tracking-wider hover:bg-blue-50 h-auto py-1 px-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                    Edit
                                </button>
                            <?php endif; ?>
                        </div>
                        <?php if (!empty($assignedStaff)): ?>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <?php foreach ($assignedStaff as $s): ?>
                                    <div class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full <?= $s['completed_at'] ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400' ?> flex items-center justify-center text-xs font-bold">
                                                <?= substr($s['name'], 0, 1) ?>
                                            </div>
                                            <div class="flex flex-col">
                                                <span class="text-sm font-bold text-slate-700"><?= e($s['name']) ?></span>
                                                <span class="text-[10px] text-slate-400 font-medium"><?= e($s['email']) ?></span>
                                            </div>
                                        </div>
                                        <?php if ($s['completed_at']): ?>
                                            <div class="badge badge-success badge-sm gap-1 text-[10px] font-bold py-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                                </svg>
                                                DONE
                                            </div>
                                        <?php else: ?>
                                            <div class="badge badge-ghost badge-sm text-[10px] font-bold py-3 text-slate-400">PENDING</div>
                                        <?php endif; ?>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php else: ?>
                            <div class="flex items-center gap-2">
                                <span class="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                                <p class="text-slate-400 italic text-sm font-medium">Not yet assigned</p>
                            </div>
                        <?php endif; ?>
                        
                        <?php 
                        // Staff can invite team members if they are assigned and job is not completed
                        $isAssignedStaff = false;
                        if (auth()->user()['role'] === 'staff') {
                            $assignedIds = explode(',', $request['assigned_staff_ids'] ?? '');
                            $isAssignedStaff = in_array(auth()->id(), $assignedIds);
                        }
                        $canInvite = $isAssignedStaff && !in_array($request['status'], ['completed', 'rejected']) && !$isVisuallyCompleted;
                        ?>
                        
                        <?php if ($canInvite): ?>
                            <div class="mt-3 pt-3 border-t border-slate-100">
                                <button onclick="openModal('invite-staff-modal')" class="btn btn-sm btn-outline btn-primary gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                    Invite Team Member
                                </button>
                            </div>
                        <?php endif; ?>
                    </div>
                    <?php endif; ?>
                </div>

                <?php if (!empty($request['additional_data'])): ?>
                <?php $additionalData = json_decode($request['additional_data'], true); ?>
                <div class="mb-8 p-6 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                    <h4 class="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Project Requirements
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <?php foreach ($additionalData as $label => $value): ?>
                            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <p class="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1"><?= e(str_replace(['-', '_'], ' ', $label)) ?></p>
                                <p class="font-bold text-slate-700 text-sm">
                                    <?php if (is_array($value)): ?>
                                        <div class="flex flex-wrap gap-1 mt-1">
                                            <?php foreach($value as $v): ?>
                                                <span class="badge badge-ghost badge-xs font-bold"><?= e($v) ?></span>
                                            <?php endforeach; ?>
                                        </div>
                                    <?php else: ?>
                                        <?= e($value) ?>
                                    <?php endif; ?>
                                </p>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endif; ?>

            </div>
        </div>

        <!-- Progress Stepper (Hidden for Client in main column) -->
        <?php if (auth()->user()['role'] !== 'client'): ?>
        <div class="card bg-white shadow-sm border">
            <div class="card-body">
                <h4 class="font-bold text-slate-800 mb-8">Workflow Progress</h4>
                <?php 
                    $isStaffFinished = ($request['status'] === 'staff_processing' && $request['total_staff'] > 0 && $request['completed_staff'] == $request['total_staff']);
                ?>
                <ul class="steps steps-vertical md:steps-horizontal w-full">
                    <li class="step step-primary">Submitted</li>
                    <li class="step <?= in_array($request['status'], ['manager_approval', 'staff_processing', 'completed', 'rejected']) ? 'step-primary' : '' ?>">Manager Review</li>
                    <li class="step <?= in_array($request['status'], ['staff_processing', 'completed']) ? 'step-primary' : '' ?>">Staff Processing</li>
                    <li class="step <?= ($isStaffFinished || in_array($request['status'], ['completed', 'rejected'])) ? 'step-primary' : '' ?>">
                        <?= $request['status'] === 'rejected' ? 'Rejected' : 'Completed' ?>
                    </li>
                </ul>
            </div>
        </div>
        <?php endif; ?>
    </div>

    <!-- History/Sidebar -->
    <div class="space-y-8">
        <div class="card bg-white shadow-sm border overflow-hidden">
            <div class="bg-slate-50 p-4 border-b">
                <h4 class="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2 justify-between w-full">
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                        Project Timeline
                    </div>
                    <?php if ($canEdit): ?>
                        <button onclick="openModal('timeline-modal')" class="btn btn-ghost btn-xs text-blue-500 font-bold hover:bg-blue-50 h-auto py-1 px-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        </button>
                    <?php endif; ?>
                </h4>
            </div>
            <div class="card-body p-6 space-y-6">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p class="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">Start Date</p>
                        <p class="font-bold text-slate-700"><?= $request['start_date'] ? date('M d, Y', strtotime($request['start_date'])) : 'Not Set' ?></p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p class="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">Dateline / Deadline</p>
                        <p class="font-bold text-slate-700"><?= $request['deadline'] ? date('M d, Y', strtotime($request['deadline'])) : 'Not Set' ?></p>
                    </div>
                </div>
                <?php if ($resolvedDate): ?>
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl <?= $resolvedAction === 'reject' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600' ?> flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                    </div>
                    <div>
                        <p class="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5"><?= $resolvedAction === 'reject' ? 'Rejection Date' : 'Completion Date' ?></p>
                        <p class="font-bold text-slate-700"><?= date('M d, Y', strtotime($resolvedDate)) ?></p>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Workflow Progress (Client Only Sidebar View) -->
        <?php if (auth()->user()['role'] === 'client'): ?>
        <div class="card bg-white shadow-sm border">
            <div class="card-body">
                <h4 class="font-bold text-slate-800 mb-6 text-sm uppercase tracking-wider">Workflow Progress</h4>
                <?php 
                    $isStaffFinished = ($request['status'] === 'staff_processing' && $request['total_staff'] > 0 && $request['completed_staff'] == $request['total_staff']);
                ?>
                <ul class="steps steps-vertical w-full">
                    <li class="step step-primary text-xs">Submitted</li>
                    <li class="step <?= in_array($request['status'], ['manager_approval', 'staff_processing', 'completed', 'rejected']) ? 'step-primary' : '' ?> text-xs">Manager Review</li>
                    <li class="step <?= in_array($request['status'], ['staff_processing', 'completed']) ? 'step-primary' : '' ?> text-xs">Staff Processing</li>
                    <li class="step <?= ($isStaffFinished || in_array($request['status'], ['completed', 'rejected'])) ? 'step-primary' : '' ?> text-xs">
                        <?= $request['status'] === 'rejected' ? 'Rejected' : 'Completed' ?>
                    </li>
                </ul>
            </div>
        </div>
        <?php endif; ?>

        <!-- Workflow Actions Card (Sidebar) -->
        <?php if ($canAct && !in_array($request['step_key'], ['completed', 'rejected']) && auth()->user()['role'] !== 'client'): ?>
        <div class="card bg-white shadow-sm border">
            <div class="card-body">
                <h4 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    Workflow Actions
                </h4>

                <?php 
                // Initialize variables for workflow state
                $isStaffDone = \App\Models\JobRequest::isStaffCompleted($request['id'], auth()->id());
                ?>

                <!-- Reports Section for Staff Processing -->
                <?php if ($request['step_key'] === 'staff_processing'): ?>
                    <div class="mb-6">
                        <div class="flex items-center justify-between mb-3">
                            <p class="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Note / Report</p>
                        </div>
                        
                        <div class="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                            <?php if (empty($staffReports)): ?>
                                <p class="text-xs text-slate-400 italic py-2">No reports added yet.</p>
                            <?php else: ?>
                                <?php foreach ($staffReports as $report): ?>
                                    <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 group relative">
                                        <div class="flex justify-between items-start mb-1">
                                            <span class="text-[9px] font-bold text-slate-400 capitalize"><?= date('M d, Y H:i', strtotime($report['created_at'])) ?></span>
                                            <?php if (auth()->id() == $report['staff_id'] || auth()->user()['role'] === 'admin'): ?>
                                                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                                                    <button onclick="openEditReportModal(<?= $report['id'] ?>, '<?= e(addslashes($report['report_text'])) ?>')" class="text-blue-500 hover:text-blue-700">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                                    </button>
                                                    <form action="<?= url('/admin/job-requests/' . $request['id'] . '/report/' . $report['id'] . '/delete') ?>" method="POST" onsubmit="confirmAction(event, 'Delete Report?', 'Are you sure you want to remove this report?');" class="inline">
                                                        <?= csrf_field() ?>
                                                        <button type="submit" class="text-rose-500 hover:text-rose-700">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                                                        </button>
                                                    </form>
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                        <p class="text-xs text-slate-600 leading-relaxed font-medium"><?= nl2br(e($report['report_text'])) ?></p>
                                        <p class="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tight">— <?= e($report['staff_name']) ?></p>
                                    </div>
                                <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <?php 
                // Check if current user is assigned staff
                $assignedIds = explode(',', $request['assigned_staff_ids'] ?? '');
                
                // Only show report form for assigned staff
                if (in_array(auth()->id(), $assignedIds)): 
                ?>
                        <?php if (!$isStaffDone): ?>
                            <form action="<?= url('/admin/job-requests/' . $request['id'] . '/report') ?>" method="POST" class="space-y-2 mt-4">
                                <?= csrf_field() ?>
                                <textarea name="report_text" class="textarea textarea-bordered w-full text-xs h-20 bg-slate-50 focus:bg-white transition-colors" placeholder="Type your report or progress update here..." required></textarea>
                                <button type="submit" class="btn btn-sm btn-ghost btn-block border-slate-200 text-slate-500 font-bold hover:bg-slate-50">Add Note / Report</button>
                            </form>
                        <?php else: ?>
                            <div class="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                                <div class="inline-flex items-center justify-center w-8 h-8 bg-emerald-500 text-white rounded-full mb-2 shadow-sm shadow-emerald-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <p class="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">Part Completed</p>
                                <p class="text-[11px] text-emerald-600/70 font-medium mt-1">You have finalized your work for this project.</p>
                            </div>
                        <?php endif; ?>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

                <?php if (!$isStaffDone): ?>
                <div class="divider text-[10px] uppercase font-black text-slate-300 tracking-widest my-6">Job Status Submission</div>
                <?php endif; ?>

                <div class="space-y-3">
                    <?php if ($request['step_key'] === 'manager_approval'): ?>
                        <div class="grid grid-cols-1 gap-3">
                            <button type="button" onclick="openModal('approve-modal')" class="btn btn-success btn-block">Approve Request</button>
                            <button type="button" onclick="openModal('reject-modal')" class="btn btn-error btn-outline btn-block">Reject Request</button>
                        </div>
                    <?php elseif ($request['step_key'] === 'staff_processing'): ?>
                        <?php 
                        $isAssigned = in_array(auth()->id(), explode(',', $request['assigned_staff_ids'] ?? ''));
                        $alreadyDone = \App\Models\JobRequest::isStaffCompleted($request['id'], auth()->id());
                        $myReportCount = count(array_filter(($staffReports ?? []), function($r) { 
                            return $r['staff_id'] == auth()->id(); 
                        }));
                        ?>

                        <?php if ($isAssigned && !$alreadyDone): ?>
                            <form action="<?= url('/admin/job-requests/' . $request['id'] . '/staff-complete') ?>" method="POST" onsubmit="confirmStaffComplete(event, <?= $myReportCount ?>);">
                                <?= csrf_field() ?>
                                <button type="submit" class="btn btn-info btn-block shadow-sm">Mark My Part as Done</button>
                            </form>
                        <?php endif; ?>

                        <?php /* Manual Finalize button removed as Auto-Complete is now active */ ?>
                    <?php endif; ?>

                    <?php if (auth()->user()['role'] === 'admin' || ((auth()->user()['role'] === 'manager' || $isDelegate) && \App\Models\Setting::get('allow_manager_delete', '1') === '1')): ?>
                        <form action="<?= url('/admin/job-requests/' . $request['id'] . '/delete') ?>" method="POST" onsubmit="confirmAction(event, 'Delete Job Request?', 'This action is permanent and will remove all project history.');" class="pt-2">
                            <?= csrf_field() ?>
                            <button type="submit" class="btn btn-ghost btn-xs text-rose-400 hover:text-rose-600 hover:bg-rose-50 font-bold btn-block">Delete Request Instance</button>
                        </form>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php endif; ?>

        <?php if (auth()->user()['role'] !== 'client'): ?>
        <div class="card bg-white shadow-sm border">
            <div class="card-body p-0">
                <div class="p-6 border-b flex justify-between items-center">
                    <h4 class="font-bold text-slate-800">Activity History</h4>
                    <button onclick="copyActivityHistory()" class="btn btn-primary btn-xs font-bold gap-2 h-8 px-3 rounded-lg shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        Copy History
                    </button>
                </div>
                <div class="p-6 max-h-[600px] overflow-y-auto">
                    <div class="space-y-6">
                        <?php foreach (array_reverse($history) as $item): ?>
                        <div class="relative pl-8 pb-2 border-l-2 border-slate-100 last:border-0">
                            <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 <?= match($item['action']) {
                                'submit' => 'border-info',
                                'approve' => 'border-success',
                                'reject' => 'border-error',
                                'complete' => 'border-primary',
                                'staff_complete' => 'border-emerald-400',
                                'invite' => 'border-indigo-400',
                                'update_team' => 'border-teal-400',
                                default => 'border-slate-300'
                            } ?>"></div>
                            <div class="flex flex-col">
                                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <?= date('M d, Y H:i', strtotime($item['created_at'])) ?>
                                </span>
                                <span class="font-bold text-slate-800 mt-1 uppercase text-xs tracking-wide">
                                    <?php
                                    echo match($item['action']) {
                                        'submit' => 'submitted',
                                        'approve' => 'approved',
                                        'reject' => 'rejected',
                                        'complete' => 'completed',
                                        'staff_complete' => 'staff completed part',
                                        'invite' => 'invited member',
                                        'update_team' => 'updated team',
                                        default => $item['action'] . 'ed'
                                    };
                                    ?>
                                </span>
                                <span class="text-sm text-slate-500 mt-1">by <?= e($item['actor_name'] ?? 'System / Public') ?></span>
                                <?php if($item['comment']): ?>
                                <div class="mt-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 italic">
                                    "<?= e($item['comment']) ?>"
                                </div>
                                <?php endif; ?>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>
</div>

<!-- Modal Templates -->
<dialog id="approve-modal" class="modal">
    <div class="modal-box">
        <h3 class="font-bold text-lg">Approve This Request?</h3>
        <p class="py-4 text-slate-600">This will move the request to the staff processing stage.</p>
        <form action="<?= url('/admin/job-requests/' . $request['id'] . '/approve') ?>" method="POST">
            <?= csrf_field() ?>
            
            <div class="form-control mb-4">
                <label class="label">
                    <span class="label-text font-bold">Assign to Staff Member</span>
                </label>
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-48 overflow-y-auto space-y-2">
                    <?php if (empty($staffList)): ?>
                        <p class="text-slate-400 text-sm italic py-2">No staff members found in your unit.</p>
                    <?php else: ?>
                        <?php foreach ($staffList as $staff): ?>
                            <label class="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-slate-100">
                                <input type="checkbox" name="assigned_staff_ids[]" value="<?= $staff['id'] ?>" class="checkbox checkbox-primary checkbox-sm">
                                <span class="flex flex-col">
                                    <span class="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors"><?= e($staff['name']) ?></span>
                                    <span class="text-[10px] text-slate-400 font-medium"><?= e($staff['email']) ?></span>
                                </span>
                            </label>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
                <p class="text-[10px] text-slate-400 mt-2 italic">Select one or more staff members to handle this project</p>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-bold">Start Date</span>
                    </label>
                    <input type="date" id="approve_start_date" name="start_date" class="input input-bordered w-full" required value="<?= date('Y-m-d') ?>">
                </div>
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-bold">Deadline</span>
                    </label>
                    <input type="date" id="approve_deadline" name="deadline" class="input input-bordered w-full" required>
                </div>
            </div>

            <div class="form-control mb-4">
                <label class="label"><span class="label-text font-bold">Add a comment (optional)</span></label>
                <textarea name="comment" class="textarea textarea-bordered h-24" placeholder="Instruction for staff..."></textarea>
            </div>
            
            <div class="modal-action">
                <button type="button" onclick="closeModal('approve-modal')" class="btn btn-ghost">Cancel</button>
                <button type="submit" class="btn btn-success px-8">Confirm & Assign</button>
            </div>
        </form>
    </div>
</dialog>

<dialog id="reject-modal" class="modal">
    <div class="modal-box">
        <h3 class="font-bold text-lg text-error text-center uppercase tracking-widest">Reject This Request?</h3>
        <p class="py-4 text-slate-600 text-center">Please provide a reason for this rejection for record purposes.</p>
        <form action="<?= url('/admin/job-requests/' . $request['id'] . '/reject') ?>" method="POST">
            <?= csrf_field() ?>
            <div class="form-control mb-4">
                <label class="label"><span class="label-text">Rejection Reason</span></label>
                <textarea name="comment" class="textarea textarea-bordered h-24" required placeholder="Tell the client why..."></textarea>
            </div>
            <div class="modal-action">
                <button type="button" onclick="closeModal('reject-modal')" class="btn btn-ghost">Cancel</button>
                <button type="submit" class="btn btn-error">Confirm Rejection</button>
            </div>
        </form>
    </div>
</dialog>

<dialog id="complete-modal" class="modal">
    <div class="modal-box">
        <h3 class="font-bold text-lg text-primary">Mark as Completed?</h3>
        <p class="py-4 text-slate-600">The task will be finalized and the workflow closed.</p>
        <form action="<?= url('/admin/job-requests/' . $request['id'] . '/complete') ?>" method="POST">
            <?= csrf_field() ?>
            <div class="form-control mb-4">
                <label class="label"><span class="label-text">Completion Notes</span></label>
                <textarea name="comment" class="textarea textarea-bordered h-24" placeholder="Summary of work done..."></textarea>
            </div>
            <div class="modal-action">
                <button type="button" onclick="closeModal('complete-modal')" class="btn btn-ghost">Cancel</button>
                <button type="submit" class="btn btn-primary">Finish Workflow</button>
            </div>
        </form>
    </div>
</dialog>

<!-- Update Timeline Modal -->
<dialog id="timeline-modal" class="modal">
    <div class="modal-box">
        <h3 class="font-bold text-lg text-slate-800">Edit Project Timeline</h3>
        <p class="py-2 text-sm text-slate-500 mb-4">Update the start date and deadline for this project.</p>
        <form action="<?= url('/admin/job-requests/' . $request['id'] . '/update-timeline') ?>" method="POST">
            <?= csrf_field() ?>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="form-control">
                    <label class="label"><span class="label-text font-bold">Start Date</span></label>
                    <input type="date" id="timeline_start_date" name="start_date" class="input input-bordered w-full" value="<?= $request['start_date'] ?>">
                </div>
                <div class="form-control">
                    <label class="label"><span class="label-text font-bold">Deadline</span></label>
                    <input type="date" id="timeline_deadline" name="deadline" class="input input-bordered w-full" value="<?= $request['deadline'] ?>">
                </div>
            </div>
            <div class="modal-action">
                <button type="button" onclick="closeModal('timeline-modal')" class="btn btn-ghost">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </form>
    </div>
</dialog>

<!-- Update Team Modal -->
<dialog id="team-modal" class="modal">
    <div class="modal-box">
        <h3 class="font-bold text-lg text-slate-800">Manage Team Assignment</h3>
        <p class="py-2 text-sm text-slate-500 mb-4">Add or remove staff assigned to this project.</p>
        <form action="<?= url('/admin/job-requests/' . $request['id'] . '/update-team') ?>" method="POST">
            <?= csrf_field() ?>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-64 overflow-y-auto space-y-2 mb-4">
                <?php if (empty($staffList)): ?>
                    <p class="text-slate-400 text-sm italic py-2">No staff members found.</p>
                <?php else: ?>
                    <?php 
                        $currentAssignedIds = explode(',', $request['assigned_staff_ids'] ?? '');
                    ?>
                    <?php foreach ($staffList as $staff): ?>
                        <label class="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-slate-100">
                            <input type="checkbox" name="staff_ids[]" value="<?= $staff['id'] ?>" class="checkbox checkbox-primary checkbox-sm" <?= in_array($staff['id'], $currentAssignedIds) ? 'checked' : '' ?>>
                            <span class="flex flex-col">
                                <span class="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors"><?= e($staff['name']) ?></span>
                                <span class="text-[10px] text-slate-400 font-medium"><?= e($staff['email']) ?></span>
                            </span>
                        </label>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
            <div class="modal-action">
                <button type="button" onclick="closeModal('team-modal')" class="btn btn-ghost">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Assignments</button>
            </div>
        </form>
    </div>
</dialog>


<!-- Invite Staff Modal -->
<dialog id="invite-staff-modal" class="modal">
    <div class="modal-box w-11/12 max-w-xl">
        <h3 class="font-bold text-lg text-slate-800">Invite Team Member</h3>
        <p class="py-2 text-sm text-slate-500 mb-4">Add a team member from your unit to help with this job.</p>
        <form action="<?= url('/admin/job-requests/' . $request['id'] . '/invite-staff') ?>" method="POST">
            <?= csrf_field() ?>
            
            <div class="form-control mb-4">
                <label class="label"><span class="label-text font-bold text-slate-700">Select Team Members</span></label>
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-48 overflow-y-auto space-y-2">
                    <?php 
                    $user = auth()->user();
                    $assignedIds = array_filter(explode(',', $request['assigned_staff_ids'] ?? ''));
                    $invitedIds = array_filter(explode(',', $request['invited_staff_ids'] ?? ''));
                    $involvedIds = array_merge($assignedIds, $invitedIds);

                    $currentUserUnit = $user['unit'];
                    $isAdmin = $user['role'] === 'admin';
                    $hasStaff = false;
                    ?>
                    <?php foreach ($staffList as $staff): ?>
                        <?php 
                        // If Admin, show all. If Manager/Staff, show only same unit.
                        $isSameUnit = $isAdmin || ($staff['unit'] === $currentUserUnit);
                        if ($isSameUnit && !in_array($staff['id'], $involvedIds)): 
                        ?>
                            <?php $hasStaff = true; ?>
                            <label class="flex items-center gap-3 p-2.5 bg-white border border-slate-100 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group">
                                <input type="checkbox" name="invitee_ids[]" value="<?= $staff['id'] ?>" class="checkbox checkbox-primary checkbox-sm">
                                <span class="flex flex-col">
                                    <span class="text-sm font-bold text-slate-700 group-hover:text-blue-700"><?= e($staff['name']) ?></span>
                                    <span class="text-[10px] text-slate-400 font-medium tracking-wide"><?= e($staff['email']) ?></span>
                                </span>
                            </label>
                        <?php endif; ?>
                    <?php endforeach; ?>
                    
                    <?php if (!$hasStaff): ?>
                        <div class="py-4 text-center">
                            <p class="text-xs text-slate-400 italic">No available staff members in your unit</p>
                        </div>
                    <?php endif; ?>
                </div>
                <label class="label">
                    <span class="label-text-alt text-slate-400">
                        <?php if ($isAdmin): ?>
                            Invite one or more staff members to help with this job.
                        <?php else: ?>
                            Invite one or more staff from your unit (<?= e($currentUserUnit) ?>)
                        <?php endif; ?>
                    </span>
                </label>
            </div>
            
            <div class="form-control mb-4">
                <label class="label"><span class="label-text font-bold">Task Description</span></label>
                <textarea name="task_description" class="textarea textarea-bordered h-32" required placeholder="Describe what this team member should work on..."></textarea>
                <label class="label">
                    <span class="label-text-alt text-slate-400">Be specific about what you need help with</span>
                </label>
            </div>
            
            <div class="modal-action">
                <button type="button" onclick="closeModal('invite-staff-modal')" class="btn btn-ghost">Cancel</button>
                <button type="submit" class="btn btn-primary">Send Invitation</button>
            </div>
        </form>
    </div>
</dialog>

<!-- Edit Report Modal -->
<dialog id="edit-report-modal" class="modal">
    <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Edit Report / Note</h3>
        <form id="edit-report-form" method="POST">
            <?= csrf_field() ?>
            <div class="form-control mb-4">
                <textarea id="edit-report-text" name="report_text" class="textarea textarea-bordered h-32" required></textarea>
            </div>
            <div class="modal-action">
                <button type="button" onclick="closeModal('edit-report-modal')" class="btn btn-ghost">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Report</button>
            </div>
        </form>
    </div>
</dialog>

<script>
    function openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.showModal();
            // Initialize date validation if it's a date-sensitive modal
            if (id === 'approve-modal') initDateValidation('approve_start_date', 'approve_deadline');
            if (id === 'timeline-modal') initDateValidation('timeline_start_date', 'timeline_deadline');
        }
    }

    function openEditReportModal(reportId, text) {
        const modal = document.getElementById('edit-report-modal');
        const form = document.getElementById('edit-report-form');
        const textarea = document.getElementById('edit-report-text');
        
        textarea.value = text;
        form.action = `<?= url('/admin/job-requests/' . $request['id'] . '/report/') ?>${reportId}/update`;
        
        modal.showModal();
    }

    function confirmStaffComplete(e, reportCount) {
        e.preventDefault();
        const form = e.target.closest('form');
        
        let title = 'Mark as Done?';
        let text = 'This will notify the manager that your portion of the work is finished.';
        let icon = 'question';
        
        if (reportCount === 0) {
            title = 'No reports added!';
            text = 'You haven\'t added any notes or progress reports yet. Are you sure you want to mark this as completed anyway?';
            icon = 'warning';
        }
        
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            showCancelButton: true,
            confirmButtonText: 'Yes, I am done!',
            cancelButtonText: 'Wait, let me add a note',
            customClass: {
                confirmButton: 'swal2-styled swal2-confirm',
                cancelButton: 'swal2-styled swal2-cancel'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                form.submit();
            }
        });
    }

    function closeModal(id) {
        document.getElementById(id).close();
    }

    function initDateValidation(startId, deadlineId) {
        const startInput = document.getElementById(startId);
        const deadlineInput = document.getElementById(deadlineId);

        if (startInput && deadlineInput) {
            // Set initial min date
            deadlineInput.min = startInput.value;

            // Update min date on change
            startInput.addEventListener('change', function() {
                deadlineInput.min = this.value;
                if (deadlineInput.value && deadlineInput.value < this.value) {
                    deadlineInput.value = this.value;
                }
            });

            // Prevent form submit if invalid (extra safety)
            const form = startInput.closest('form');
            form.addEventListener('submit', function(e) {
                if (deadlineInput.value < startInput.value) {
                    e.preventDefault();
                    Swal.fire({
                        icon: 'error',
                        title: 'Invalid Date',
                        text: 'Deadline cannot be earlier than the Start Date.'
                    });
                }
            });
        }
    }

    function copyActivityHistory() {
        try {
            const ticketNo = "<?= e($request['ticket_no']) ?>";
            const title = "<?= e($request['title']) ?>";
            let text = `*ACTIVITY HISTORY: [${ticketNo}]*\n*${title}*\n`;
            text += `--------------------------------\n\n`;

            const items = document.querySelectorAll('.card .relative.pl-8');
            if (items.length === 0) {
                Swal.fire('No history found to copy.');
                return;
            }

            items.forEach((item, index) => {
                const timeEl = item.querySelector('.text-xs.font-bold');
                const actionEl = item.querySelector('.font-bold.text-slate-800');
                const actorEl = item.querySelector('.text-sm.text-slate-500');
                const commentBox = item.querySelector('.bg-slate-50');

                const timeDateInfo = timeEl ? timeEl.innerText.trim() : 'N/A';
                const action = actionEl ? actionEl.innerText.trim().toUpperCase() : 'UNKNOWN';
                const actor = actorEl ? actorEl.innerText.trim() : 'by Unknown';
                const comment = commentBox ? commentBox.innerText.trim() : 'No comments';
                
                text += `${index + 1}. *${action}*\n`;
                text += `📅 ${timeDateInfo}\n`;
                text += `👤 ${actor}\n`;
                text += `💬 ${comment}\n\n`;
            });

            text += `_Generated via Corporate Communication System_`;

            // Fallback for non-secure contexts
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(() => showSuccess());
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    showSuccess();
                } catch (err) {
                    console.error('Fallback copy failed', err);
                }
                document.body.removeChild(textArea);
            }
        } catch (e) {
            console.error('Copy script error:', e);
            alert('Failed to copy: ' + e.message);
        }

        function showSuccess() {
            Swal.fire({
                title: 'Copied!',
                text: 'History copied to clipboard (WhatsApp-ready)',
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            
            const btn = document.querySelector('button[onclick="copyActivityHistory()"]');
            if (btn) {
                const originalContent = btn.innerHTML;
                btn.innerHTML = 'Copied!';
                btn.classList.add('btn-success');
                btn.classList.remove('btn-primary');
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.classList.add('btn-primary');
                    btn.classList.remove('btn-success');
                }, 2000);
            }
        }
    }
</script>
