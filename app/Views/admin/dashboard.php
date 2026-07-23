<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
    <!-- Stats Cards -->
    <a href="<?= url('/admin/job-requests') ?>" class="card bg-white shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
        <div class="card-body p-6">
            <div class="flex items-center justify-between mb-2">
                <span class="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Requests</span>
                <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
            </div>
            <div class="text-3xl font-bold text-slate-800"><?= $stats['total'] ?></div>
        </div>
    </a>

    <a href="<?= url('/admin/job-requests?filter=pending') ?>" class="card bg-white shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
        <div class="card-body p-6">
            <div class="flex items-center justify-between mb-2">
                <span class="text-slate-400 text-xs font-bold uppercase tracking-widest">Awaiting Approval</span>
                <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
            </div>
            <div class="text-3xl font-bold text-slate-800"><?= $stats['pending'] ?></div>
        </div>
    </a>

    <a href="<?= url('/admin/job-requests?filter=processing') ?>" class="card bg-white shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
        <div class="card-body p-6">
            <div class="flex items-center justify-between mb-2">
                <span class="text-slate-400 text-xs font-bold uppercase tracking-widest">In Progress</span>
                <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
            </div>
            <div class="text-3xl font-bold text-slate-800"><?= $stats['processing'] ?></div>
        </div>
    </a>

    <a href="<?= url('/admin/job-requests?filter=completed') ?>" class="card bg-white shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
        <div class="card-body p-6">
            <div class="flex items-center justify-between mb-2">
                <span class="text-slate-400 text-xs font-bold uppercase tracking-widest">Completed</span>
                <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                </div>
            </div>
            <div class="text-3xl font-bold text-slate-800"><?= $stats['completed'] ?></div>
        </div>
    </a>

    <a href="<?= url('/admin/job-requests?filter=overdue') ?>" class="card bg-white shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border-l-4 border-l-rose-500">
        <div class="card-body p-6">
            <div class="flex items-center justify-between mb-2">
                <span class="text-slate-400 text-xs font-bold uppercase tracking-widest">Overdue</span>
                <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
            </div>
            <div class="text-3xl font-bold text-rose-600"><?= $stats['overdue'] ?></div>
        </div>
    </a>
</div>

<div class="grid grid-cols-1 lg:grid-cols-1 gap-8">
    <div class="card bg-white shadow-sm border border-slate-100">
        <div class="card-body p-0">
            <div class="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 class="font-bold text-slate-800 uppercase tracking-widest text-sm">Recent Job Requests</h3>
                <a href="<?= url('/admin/job-requests') ?>" class="text-blue-600 text-xs font-bold hover:underline italic">View All →</a>
            </div>
            <div class="overflow-x-auto">
                <table class="table w-full">
                    <thead>
                        <tr class="bg-slate-50">
                            <th class="text-slate-400 uppercase text-[10px] font-bold py-3 pl-6">ID</th>
                            <th class="text-slate-400 uppercase text-[10px] font-bold py-3">Client</th>
                            <th class="text-slate-400 uppercase text-[10px] font-bold py-3">Project Title</th>
                            <th class="text-slate-400 uppercase text-[10px] font-bold py-3">Status</th>
                            <th class="text-slate-400 uppercase text-[10px] font-bold py-3 pr-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        <?php foreach ($recentRequests as $req): ?>
                        <tr>
                            <td class="pl-6 text-slate-400 text-xs font-medium">#<?= $req['id'] ?></td>
                            <td>
                                <div class="font-bold text-slate-800 text-sm"><?= e($req['client_name']) ?></div>
                                <div class="text-[10px] text-slate-400"><?= e($req['client_email']) ?></div>
                            </td>
                            <td class="text-sm text-slate-600"><?= e($req['title']) ?></td>
                            <td>
                                <?php 
                                    $percentage = 0;
                                    if ($req['total_staff'] > 0) {
                                        $percentage = round(($req['completed_staff'] / $req['total_staff']) * 100);
                                    }

                                    $label = $req['current_step_name'] ?? $req['status'];
                                    $statusClass = match($req['status']) {
                                        'submitted' => 'badge-info',
                                        'manager_approval' => 'badge-warning',
                                        'staff_processing' => 'badge-primary',
                                        'completed' => 'badge-success',
                                        'rejected' => 'badge-error',
                                        default => 'badge-ghost'
                                    };

                                    if ($req['status'] === 'staff_processing' && $percentage == 100) {
                                        $label = 'COMPLETED';
                                        $statusClass = 'badge-success';
                                    }
                                ?>
                                <div class="badge <?= $statusClass ?> badge-sm py-3 px-4 rounded-full font-bold uppercase text-[9px] tracking-wider border-none text-white">
                                    <?= e(str_replace('_', ' ', $label)) ?>
                                </div>
                            </td>
                            <td class="pr-6 text-right">
                                <a href="<?= url('/admin/job-requests/' . $req['id']) ?>" class="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50 normal-case">View</a>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                        <?php if (empty($recentRequests)): ?>
                        <tr>
                            <td colspan="5" class="py-12 text-center text-slate-400 italic text-sm">No requests found.</td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
