<div class="mb-6">
    <a href="<?= url('/admin/job-requests') ?>" class="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Transaction List
    </a>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div class="lg:col-span-2 space-y-8">
        <!-- Main Detail Card -->
        <div class="card bg-white overflow-hidden">
            <div class="h-1.5 bg-blue-500"></div>
            <div class="card-body p-8">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-50 pb-6">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Request #<?= e($job['ticket_no']) ?></h1>
                        <p class="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">ID: #<?= $job['id'] ?> • Submitted on <?= date('d M Y, H:i A', strtotime($job['created_at'])) ?></p>
                    </div>
                    <?php 
                        $statusBadge = 'bg-blue-50 text-blue-600';
                        if($job['status'] === 'completed') $statusBadge = 'bg-emerald-50 text-emerald-600';
                        if($job['status'] === 'rejected') $statusBadge = 'bg-rose-50 text-rose-600';
                    ?>
                    <span class="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest <?= $statusBadge ?> shadow-sm">
                        <?= str_replace('_', ' ', $job['status']) ?>
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <p class="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Applicant Name</p>
                        <p class="font-bold text-slate-700"><?= e($job['client_name']) ?></p>
                    </div>
                    <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <p class="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Client Email</p>
                        <p class="font-bold text-slate-700"><?= e($job['client_email']) ?></p>
                    </div>
                </div>


                <?php if (!empty($job['additional_data'])): ?>
                <?php $additionalData = json_decode($job['additional_data'], true); ?>
                <div class="mb-4">
                    <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Unit-Specific Requirements</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <?php foreach ($additionalData as $label => $value): ?>
                            <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p class="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1"><?= e(str_replace('-', ' ', $label)) ?></p>
                                <p class="font-bold text-slate-700 text-sm italic"><?= e(is_array($value) ? implode(', ', $value) : $value) ?></p>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endif; ?>

                <?php if ($canApprove && !$currentStep['is_terminal']): ?>
                    <div class="mt-12 pt-8 border-t border-slate-50">
                        <div class="bg-blue-600 rounded-3xl p-8 relative overflow-hidden group">
                            <!-- Background Decoration -->
                            <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
                            
                            <h3 class="font-bold text-xl text-white mb-2 relative z-10">Approval Actions</h3>
                            <p class="text-blue-100 text-sm mb-6 relative z-10">Please review the details before making a decision.</p>
                            
                            <form action="<?= url('/admin/job-requests/' . $job['id'] . '/' . (($currentStep['step_key'] === 'staff_processing') ? 'complete' : 'approve')) ?>" method="POST" class="relative z-10">
                                <?= csrf_field() ?>
                                <div class="form-control">
                                    <textarea name="comment" class="textarea bg-white text-slate-800 placeholder-slate-400 h-24 rounded-2xl border-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all" placeholder="Provide some feedback or comments..."></textarea>
                                </div>
                                <div class="mt-6 flex flex-wrap gap-4">
                                    <?php if ($currentStep['step_key'] === 'staff_processing'): ?>
                                        <button type="submit" class="btn bg-white text-blue-600 border-none hover:bg-blue-50 px-8 rounded-xl font-bold uppercase text-xs tracking-widest h-12">Complete Transaction</button>
                                    <?php else: ?>
                                        <button type="submit" class="btn bg-white text-blue-600 border-none hover:bg-blue-50 px-8 rounded-xl font-bold uppercase text-xs tracking-widest h-12 shadow-lg">Approve</button>
                                        <?php if ($currentStep['on_reject_step_id']): ?>
                                            <button type="submit" onclick="this.form.action='<?= url('/admin/job-requests/' . $job['id'] . '/reject') ?>'" class="btn bg-transparent border-2 border-white/30 text-white hover:bg-white/10 px-8 rounded-xl font-bold uppercase text-xs tracking-widest h-12">Reject</button>
                                        <?php endif; ?>
                                    <?php endif; ?>
                                </div>
                            </form>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Workflow Stepper Card -->
        <div class="card bg-white shadow-sm">
            <div class="card-body p-8">
                <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Approval Workflow</h3>
                <div class="relative flex justify-between">
                    <!-- Progress Line -->
                    <div class="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 z-0"></div>
                    
                    <?php 
                    $reachedCurrent = false;
                    foreach ($steps as $step): 
                        $isCurrent = $step['id'] == $job['current_step_id'];
                        $isPast = !$reachedCurrent && !$isCurrent;
                        if ($isCurrent) $reachedCurrent = true;
                        
                        $dotClass = 'bg-white border-slate-200';
                        if ($isPast) $dotClass = 'bg-blue-500 border-blue-500 shadow-blue-200';
                        if ($isCurrent) $dotClass = 'bg-white border-blue-500 ring-4 ring-blue-100 shadow-blue-100';
                        if ($job['status'] === 'rejected' && $step['step_key'] === 'rejected') $dotClass = 'bg-white border-rose-500 ring-4 ring-rose-100';
                    ?>
                        <div class="relative z-10 flex flex-col items-center group">
                            <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 <?= $dotClass ?> shadow-lg">
                                <?php if ($isPast): ?>
                                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                                <?php elseif ($isCurrent): ?>
                                    <div class="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                                <?php else: ?>
                                    <div class="w-2 h-2 bg-slate-200 rounded-full"></div>
                                <?php endif; ?>
                            </div>
                            <span class="mt-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap <?= $isCurrent ? 'text-blue-600' : 'text-slate-400' ?>"><?= e($step['name']) ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Timeline/Log Activity -->
    <div class="space-y-8">
        <div class="card bg-white shadow-sm border-none">
            <div class="card-body p-8">
                <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Activity Log</h3>
                <div class="space-y-8">
                    <?php foreach ($history as $log): ?>
                        <div class="relative pl-10">
                            <!-- Vertical Line -->
                            <div class="absolute left-[15px] top-6 bottom-[-32px] w-px bg-slate-100 last:hidden"></div>
                            
                            <!-- Dot -->
                            <div class="absolute left-0 top-0 w-8 h-8 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center justify-center z-10 transition-transform hover:scale-110">
                                <?php 
                                    $actionIcon = 'text-slate-300';
                                    if ($log['action'] === 'approve' || $log['action'] === 'submit') $actionIcon = 'text-blue-500';
                                    if ($log['action'] === 'reject') $actionIcon = 'text-rose-500';
                                ?>
                                <div class="w-1.5 h-1.5 rounded-full bg-current <?= $actionIcon ?>"></div>
                            </div>
                            
                            <div class="space-y-1">
                                <div class="flex justify-between items-center">
                                    <p class="text-xs font-bold uppercase tracking-widest text-slate-700"><?= $log['action'] ?></p>
                                    <span class="text-[9px] font-bold text-slate-300"><?= date('H:i', strtotime($log['created_at'])) ?></span>
                                </div>
                                <p class="text-[10px] text-slate-400 font-semibold mb-2"><?= date('d M Y', strtotime($log['created_at'])) ?></p>
                                <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                    <p class="text-xs text-slate-500 italic leading-relaxed">"<?= e($log['comment'] ?: 'No comments') ?>"</p>
                                </div>
                                <div class="flex items-center gap-2 mt-3 p-1">
                                    <div class="w-5 h-5 rounded-lg bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase">
                                        <?= $log['actor_name'] ? substr($log['actor_name'], 0, 1) : 'P' ?>
                                    </div>
                                    <span class="text-[10px] font-bold text-slate-500"><?= e($log['actor_name'] ?: 'Public Visitor') ?></span>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    </div>
</div>


