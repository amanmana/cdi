<?php
$user = auth()->user();
$role = $user['role'];
$isDelegate = \App\Models\Delegation::findActive($user['id']);

$activeJobs = [];
$completedJobs = [];

foreach ($requests as $req) {
    $isCompleted = false;
    
    if ($role === 'staff' && !$isDelegate) {
        $isCompleted = !empty($req['my_completed_at']);
    } else {
        // Admin, Manager, OR Delegate
        // 1. Status is explicit 'completed' or 'rejected'
        // 2. OR status is 'staff_processing' BUT all staff finished (visually 'COMPLETED')
        $isAllStaffDone = ($req['status'] === 'staff_processing' && $req['total_staff'] > 0 && $req['completed_staff'] == $req['total_staff']);
        
        $isCompleted = in_array($req['status'], ['completed', 'rejected']) || $isAllStaffDone;
    }

    if ($isCompleted) {
        $completedJobs[] = $req;
    } else {
        $activeJobs[] = $req;
    }
}

$activeLabel = ($role === 'staff' && !$isDelegate) ? 'New Job' : 'Current Jobs';
$completedLabel = 'History';
?>

<div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
    <div class="tabs tabs-boxed bg-slate-100 p-1 inline-flex gap-1 order-2 md:order-1">
        <a class="tab tab-lg px-8 font-black uppercase text-[10px] tracking-widest transition-all tab-active bg-blue-600 !text-white shadow-md" id="tab-new" onclick="switchJobs('new')">
            <?= $activeLabel ?> (<?= count($activeJobs) ?>)
        </a>
        <a class="tab tab-lg px-8 font-black uppercase text-[10px] tracking-widest transition-all text-slate-500 hover:text-slate-700" id="tab-completed" onclick="switchJobs('completed')">
            <?= $completedLabel ?> (<?= count($completedJobs) ?>)
        </a>
    </div>

    <div class="flex items-center gap-2 order-1 md:order-2 w-full md:w-auto">
        <form action="<?= url('/admin/job-requests') ?>" method="GET" class="flex items-center gap-2 w-full md:w-auto">
            <div class="relative w-full md:w-64">
                <input type="text" name="search" value="<?= e($search ?? '') ?>" placeholder="Search ID, Ticket, Client or Data..." class="input input-bordered w-full pl-10 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <?php if (!empty($search)): ?>
                <a href="<?= url('/admin/job-requests') ?>" class="btn btn-square btn-ghost text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </a>
            <?php endif; ?>
        </form>

    </div>
</div>

<div class="overflow-x-auto bg-white rounded-xl shadow-sm border overflow-hidden">
    <table class="table w-full">
        <thead>
            <tr class="bg-slate-50">
                <th class="text-slate-600 uppercase text-xs font-bold py-4 pl-8">ID</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4">Client</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4">Current Status</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4">Assigned To</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4">Timeline</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4">Progress</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4 text-right pr-8">Actions</th>
            </tr>
        </thead>
        <tbody class="divide-y">
            <?php 
                function renderRows($items, $idPrefix = "") {
                    foreach ($items as $req): 
                        $statusClass = match($req['status']) {
                            'submitted' => 'badge-info',
                            'manager_approval' => 'badge-warning',
                            'staff_processing' => 'badge-primary',
                            'completed' => 'badge-success',
                            'rejected' => 'badge-error',
                            default => 'badge-ghost'
                        };

                        $label = $req['current_step_name'] ?? $req['status'];
                        if ($req['status'] === 'staff_processing' && $req['total_staff'] > 0 && $req['completed_staff'] == $req['total_staff']) {
                            $label = 'completed';
                            $statusClass = 'badge-success';
                        }
            ?>
            <tr class="hover:bg-slate-50 transition-colors <?= $idPrefix ?>-row">
                <td class="pl-8">
                    <div class="flex flex-col">
                        <span class="font-bold text-slate-800 text-sm">#<?= $req['id'] ?></span>
                        <span class="text-[10px] font-black text-blue-600 font-mono tracking-tighter uppercase"><?= e($req['ticket_no']) ?></span>
                    </div>
                </td>
                <td>
                    <div class="flex flex-col">
                        <span class="font-bold text-slate-800 text-sm"><?= e($req['title'] ?? 'Untitled Request') ?></span>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter"><?= e($req['client_name']) ?></span>
                            <span class="text-[10px] text-slate-300">•</span>
                            <span class="text-[10px] text-slate-400 font-medium"><?= e($req['client_email']) ?></span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="badge <?= $statusClass ?> badge-sm py-3 px-4 rounded-full font-bold uppercase text-[10px] tracking-wider">
                        <?= str_replace('_', ' ', $label) ?>
                    </div>
                </td>
                <td>
                    <?php if ($req['assigned_staff_name']): ?>
                        <?php 
                        // Parse staff details JSON
                        $staffDetails = json_decode($req['staff_details'] ?? '[]', true);
                        if ($staffDetails && count($staffDetails) > 0): 
                        ?>
                            <div class="flex flex-wrap items-center gap-1">
                                <?php foreach ($staffDetails as $index => $staff): ?>
                                    <span class="text-sm font-medium <?= $staff['completed'] ? 'text-slate-800' : 'text-slate-300' ?>"><?= $staff['completed'] ? '✓ ' : '' ?><?= e($staff['name']) ?></span><?php if ($index < count($staffDetails) - 1): ?><span class="text-slate-300">,</span><?php endif; ?>
                                <?php endforeach; ?>
                            </div>
                        <?php else: ?>
                            <span class="text-sm text-slate-600 font-medium"><?= e($req['assigned_staff_name']) ?></span>
                        <?php endif; ?>
                    <?php else: ?>
                        <span class="text-xs text-slate-300 italic">Unassigned</span>
                    <?php endif; ?>
                </td>
                <td>
                    <?php if ($req['start_date'] || $req['deadline']): ?>
                        <div class="flex flex-col">
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Start: <?= $req['start_date'] ? date('M d', strtotime($req['start_date'])) : '-' ?></span>
                            <span class="text-xs font-bold text-rose-600">Finish: <?= $req['deadline'] ? date('M d, Y', strtotime($req['deadline'])) : '-' ?></span>
                        </div>
                    <?php else: ?>
                        <span class="text-[10px] text-slate-300 italic uppercase font-bold">Not Scheduled</span>
                    <?php endif; ?>
                </td>
                <td>
                    <?php 
                        $pct = 0;
                        if ($req['total_staff'] > 0) {
                            $pct = round(($req['completed_staff'] / $req['total_staff']) * 100);
                        }
                        
                        $barColor = 'bg-slate-200';
                        if ($req['status'] === 'completed' || ($req['status'] === 'staff_processing' && $pct == 100)) {
                            $barColor = 'bg-emerald-500';
                            $pct = 100;
                        } elseif ($pct > 0) {
                            $barColor = 'bg-blue-500';
                        }
                    ?>
                    <div class="flex flex-col gap-1.5 w-32">
                        <div class="flex justify-between items-center px-0.5">
                            <span class="text-[9px] font-black <?= $pct > 0 ? 'text-slate-700' : 'text-slate-400' ?> uppercase tracking-tighter"><?= $pct ?>%</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div class="<?= $barColor ?> h-full transition-all duration-500" style="width: <?= $pct ?>%"></div>
                        </div>
                    </div>
                </td>
                <td class="text-right flex justify-end gap-2 pr-8">
                    <a href="<?= url('/admin/job-requests/' . $req['id']) ?>" class="btn btn-ghost btn-sm text-primary hover:bg-primary/10 font-bold uppercase text-[10px]">View Details</a>
                    <?php 
                        $canDelete = false;
                        if (auth()->user()['role'] === 'admin') {
                            $canDelete = true;
                        } elseif (auth()->user()['role'] === 'manager') {
                            $canDelete = \App\Models\Setting::get('allow_manager_delete', '1') === '1';
                        }
                    ?>
                    <?php if ($canDelete): ?>
                        <form action="<?= url('/admin/job-requests/' . $req['id'] . '/delete') ?>" method="POST" onsubmit="confirmAction(event, 'Delete Job?', 'Are you sure you want to delete this case? This action is permanent.');" class="inline">
                            <?= csrf_field() ?>
                            <button type="submit" class="btn btn-ghost btn-sm text-error hover:bg-error/10 font-bold uppercase text-[10px]">Delete</button>
                        </form>
                    <?php endif; ?>
                </td>
            </tr>
            <?php endforeach; } ?>

            <tbody id="new-jobs-body">
                <?php renderRows($activeJobs, 'new'); ?>
                <?php if (empty($activeJobs)): ?>
                    <tr class="new-row"><td colspan="8" class="text-center py-20 bg-slate-50/30 text-slate-400 font-bold uppercase tracking-widest text-xs italic">No active requests found.</td></tr>
                <?php endif; ?>
            </tbody>
            <tbody id="completed-jobs-body" class="hidden">
                <?php renderRows($completedJobs, 'completed'); ?>
                <?php if (empty($completedJobs)): ?>
                    <tr class="completed-row"><td colspan="8" class="text-center py-20 bg-slate-50/30 text-slate-400 font-bold uppercase tracking-widest text-xs italic">No history records found.</td></tr>
                <?php endif; ?>
            </tbody>
        </tbody>
    </table>
</div>

<script>
function switchJobs(type) {
    const newBody = document.getElementById('new-jobs-body');
    const completedBody = document.getElementById('completed-jobs-body');
    const tabNew = document.getElementById('tab-new');
    const tabCompleted = document.getElementById('tab-completed');

    if (type === 'new') {
        newBody.classList.remove('hidden');
        completedBody.classList.add('hidden');
        tabNew.classList.add('tab-active', 'bg-blue-600', '!text-white', 'shadow-md');
        tabNew.classList.remove('text-slate-500', 'hover:text-slate-700');
        tabCompleted.classList.remove('tab-active', 'bg-blue-600', '!text-white', 'shadow-md');
        tabCompleted.classList.add('text-slate-500', 'hover:text-slate-700');
    } else {
        newBody.classList.add('hidden');
        completedBody.classList.remove('hidden');
        tabCompleted.classList.add('tab-active', 'bg-blue-600', '!text-white', 'shadow-md');
        tabCompleted.classList.remove('text-slate-500', 'hover:text-slate-700');
        tabNew.classList.remove('tab-active', 'bg-blue-600', '!text-white', 'shadow-md');
        tabNew.classList.add('text-slate-500', 'hover:text-slate-700');
    }
}

// Auto-switch to History tab if filter=completed
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');
    
    if (filter === 'completed') {
        switchJobs('completed');
    }
});
</script>
