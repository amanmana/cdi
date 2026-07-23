<div class="max-w-3xl mx-auto py-12">
    <div class="text-center mb-12">
        <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Track Your Request</h1>
        <p class="text-lg text-slate-600">Enter your Tracking Number to check the real-time status of your project.</p>
    </div>

    <!-- Search Form -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-12">
        <form action="<?= url('/job-requests/track') ?>" method="GET" class="flex flex-col md:flex-row gap-4">
            <div class="flex-1 relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-slate-400 font-bold text-xl">#</span>
                </div>
                <input type="text" name="id" value="<?= e($searchId) ?>" placeholder="Enter Tracking Number (e.g. 2E8F5A12)" 
                       class="input input-bordered w-full pl-10 h-14 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" required>
            </div>
            <button type="submit" class="btn btn-primary h-14 px-8 text-lg normal-case">Track Now</button>
        </form>
    </div>

    <?php if ($jobRequest): 
        // Logic to extract resolution date (same as admin/show.php)
        $is_staff_finished = ($jobRequest['status'] === 'staff_processing' && $jobRequest['total_staff'] > 0 && $jobRequest['completed_staff'] == $jobRequest['total_staff']);
        $resolvedDate = null;
        $resolvedAction = null;

        // 1. Check formal resolution
        foreach ($history as $item) {
            if ($item['action'] === 'complete' || $item['action'] === 'reject' || ($jobRequest['status'] === 'completed' && $item['action'] === 'approve')) {
                $resolvedDate = $item['created_at'];
                $resolvedAction = ($item['action'] === 'approve' && $jobRequest['status'] === 'completed') ? 'complete' : $item['action'];
            }
        }

        // 2. Fallback for "Visual Completion"
        if (!$resolvedDate && $is_staff_finished) {
            foreach ($history as $item) {
                if ($item['action'] === 'staff_complete') {
                    $resolvedDate = $item['created_at'];
                    $resolvedAction = 'complete';
                }
            }
        }
    ?>
        <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <!-- Header Status -->
            <div class="bg-slate-50 px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800"><?= e($jobRequest['title']) ?></h2>
                    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                        <p class="text-slate-500 text-sm">Tracking Number: <span class="font-semibold text-slate-700"><?= $jobRequest['ticket_no'] ?></span></p>
                        <div class="w-1 h-1 rounded-full bg-slate-300 hidden md:block"></div>
                        <p class="text-slate-500 text-sm">Submitted on <?= date('M d, Y', strtotime($jobRequest['created_at'])) ?></p>
                        <?php if ($resolvedDate): ?>
                            <div class="w-1 h-1 rounded-full bg-slate-300 hidden md:block"></div>
                            <p class="<?= $resolvedAction === 'reject' ? 'text-rose-500' : 'text-emerald-500' ?> text-sm font-bold uppercase tracking-tight">
                                <?= $resolvedAction === 'reject' ? 'Rejected' : 'Completed' ?> on <?= date('M d, Y', strtotime($resolvedDate)) ?>
                            </p>
                        <?php endif; ?>
                    </div>
                </div>
                <?php 
                    $percentage = 0;
                    if ($jobRequest['total_staff'] > 0) {
                        $percentage = round(($jobRequest['completed_staff'] / $jobRequest['total_staff']) * 100);
                    }
                    
                    $status = $jobRequest['status'];
                    $label = $jobRequest['current_step_name'] ?? 'Submitted';
                    $badgeClass = 'badge-warning';

                    if ($status === 'completed') {
                        $badgeClass = 'badge-success';
                    } elseif ($status === 'rejected') {
                        $badgeClass = 'badge-error';
                    } elseif ($status === 'staff_processing') {
                        $badgeClass = 'badge-info';
                        if ($percentage == 100) {
                            $label = 'COMPLETED';
                            $badgeClass = 'badge-success';
                        }
                    }
                ?>
                <div class="badge <?= $badgeClass ?> badge-lg py-4 px-6 font-bold uppercase tracking-wider text-white">
                    <?= e($label) ?>
                </div>
            </div>

            <?php
                // Extract specific milestone dates for badges
                $milestones = [
                    'submitted' => null,
                    'manager_approval' => null,
                    'staff_processing' => null,
                    'completed' => null
                ];

                foreach ($history as $h) {
                    if ($h['action'] === 'submit') $milestones['submitted'] = $h['created_at'];
                    if ($h['action'] === 'approve') $milestones['manager_approval'] = $h['created_at'];
                    if ($h['action'] === 'staff_complete') $milestones['staff_processing'] = $h['created_at']; // Latest staff completion
                    if ($h['action'] === 'complete' || $h['action'] === 'reject') $milestones['completed'] = $h['created_at'];
                }
            ?>

            <!-- Tracking Stepper (Custom Premium Vertical Timeline) -->
            <div class="p-8 md:p-12 bg-white">
                <div class="max-w-md mx-auto">
                    <div class="relative">
                        <!-- Main Line -->
                        <div class="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

                        <div class="space-y-10">
                            <?php
                            $is_staff_finished = ($jobRequest['status'] === 'staff_processing' && $jobRequest['total_staff'] > 0 && $jobRequest['completed_staff'] == $jobRequest['total_staff']);
                            
                            $steps = [
                                ['key' => 'submitted', 'name' => 'Request Submitted'],
                                ['key' => 'manager_approval', 'name' => 'Manager Review'],
                                ['key' => 'staff_processing', 'name' => 'Staff Processing'],
                                ['key' => 'completed', 'name' => 'Completed']
                            ];

                            if ($jobRequest['status'] === 'rejected') {
                                $steps[3] = ['key' => 'rejected', 'name' => 'Rejected'];
                            }

                            $current_status = $jobRequest['status'];
                            $is_active_path = true;
                            
                            foreach ($steps as $index => $step):
                                $is_done = false;
                                if ($is_active_path) {
                                    $is_done = true;
                                }
                                
                                if ($current_status === $step['key']) {
                                    $is_active_path = false;
                                }
                                
                                // Override for final step
                                if ($current_status === 'completed' || ($step['key'] === 'completed' && $is_staff_finished)) {
                                    $is_done = true;
                                }

                                $step_date = $milestones[$step['key']] ?? null;
                                if ($step['key'] === 'rejected' && !$step_date) {
                                    $step_date = $milestones['completed'];
                                }

                                $is_current = ($current_status === $step['key']) || ($step['key'] === 'completed' && $is_staff_finished && $current_status === 'staff_processing');
                                
                                $circle_color = $is_done ? ($step['key'] === 'rejected' ? 'bg-rose-500' : 'bg-blue-600') : 'bg-slate-200';
                                $text_color = $is_done ? 'text-slate-800' : 'text-slate-400';
                            ?>
                                <div class="relative flex items-start gap-6 group">
                                    <!-- Indicator -->
                                    <div class="relative z-10 flex items-center justify-center w-10 h-10 rounded-full <?= $circle_color ?> shadow-lg shadow-blue-100 transition-all duration-500 <?= $is_current ? 'scale-110 ring-4 ring-blue-50' : '' ?>">
                                        <?php if ($is_done): ?>
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                            </svg>
                                        <?php else: ?>
                                            <div class="w-2 h-2 rounded-full bg-white opacity-40"></div>
                                        <?php endif; ?>
                                    </div>

                                    <!-- Content -->
                                    <div class="flex-1 pt-1">
                                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <h4 class="font-bold <?= $text_color ?> tracking-tight transition-colors duration-300"><?= e($step['name']) ?></h4>
                                            <?php if ($step_date): ?>
                                                <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 self-start md:self-center whitespace-nowrap">
                                                    <?= date('M d, Y - h:i A', strtotime($step_date)) ?>
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Details & Timeline -->
            <div class="bg-slate-50 border-t border-slate-100 p-8">
                <div>
                    <h3 class="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Project Overview
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div class="flex flex-col p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Project Start</span>
                            <span class="text-sm font-bold text-slate-800"><?= $jobRequest['start_date'] ? date('M d, Y', strtotime($jobRequest['start_date'])) : 'TBD' ?></span>
                        </div>
                        <div class="flex flex-col p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Project Deadline</span>
                            <span class="text-sm font-bold text-rose-600"><?= $jobRequest['deadline'] ? date('M d, Y', strtotime($jobRequest['deadline'])) : 'TBD' ?></span>
                        </div>
                        <?php if ($resolvedDate): ?>
                        <div class="flex flex-col p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2"><?= $resolvedAction === 'reject' ? 'Rejection Date' : 'Resolution Date' ?></span>
                            <span class="text-sm font-bold <?= $resolvedAction === 'reject' ? 'text-rose-600' : 'text-emerald-600' ?>"><?= date('M d, Y', strtotime($resolvedDate)) ?></span>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
    </div>
<?php endif; ?>
    <?php if ($searchId && !$jobRequest): ?>
        <div class="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
             <h2 class="text-xl font-bold text-slate-700">No request found</h2>
             <p class="text-slate-500 mt-2">We couldn't find any request with that tracking number.</p>
        </div>
    <?php endif; ?>

    <?php if (!auth()->check()): ?>
        <div class="text-center mt-12 bg-blue-50/50 p-8 rounded-2xl border border-blue-100">
            <h3 class="font-bold text-slate-800">Tired of manual tracking?</h3>
            <p class="text-slate-600 text-sm mt-1">Register with your <span class="font-bold">@mimos.my</span> email to see all your projects in one place.</p>
            <a href="<?= url('/register') ?>" class="btn btn-primary btn-sm mt-4 normal-case">Register My Account</a>
        </div>
    <?php endif; ?>
</div>
