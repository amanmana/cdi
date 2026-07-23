<div class="max-w-4xl mx-auto py-12">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
            <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight">My Job Requests</h1>
            <p class="text-slate-500 mt-2">View and track all your projects linked to <span class="font-bold text-slate-700"><?= e(auth()->user()['email']) ?></span></p>
        </div>
        <a href="<?= url('/job-requests/create') ?>" class="btn btn-primary h-12 normal-case px-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            New Request
        </a>
    </div>

    <div class="grid gap-6">
        <?php foreach ($jobs as $job): ?>
            <div class="card bg-white shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                <div class="flex flex-col md:flex-row">
                    <div class="p-6 flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded"><?= $job['ticket_no'] ?></span>
                            <span class="text-slate-400 text-xs"><?= date('M d, Y', strtotime($job['created_at'])) ?></span>
                        </div>
                        <h3 class="text-xl font-bold text-slate-800 mb-2"><?= e($job['title']) ?></h3>
                        <p class="text-slate-600 text-sm line-clamp-1 mb-4"><?= e($job['description']) ?></p>
                        
                            <?php 
                                $status = $job['status'];
                                $label = $job['current_step_name'] ?? str_replace('_', ' ', $job['status']);
                                $colorClass = 'text-amber-600';

                                if ($status === 'completed') {
                                    $colorClass = 'text-emerald-600';
                                } elseif ($status === 'rejected') {
                                    $colorClass = 'text-rose-600';
                                } elseif ($status === 'staff_processing') {
                                    $colorClass = 'text-indigo-600';
                                    if ($job['total_staff'] > 0 && $job['completed_staff'] == $job['total_staff']) {
                                        $label = 'COMPLETED';
                                        $colorClass = 'text-emerald-600';
                                    }
                                }
                            ?>
                            <div class="flex items-center gap-1.5 <?= $colorClass ?>">
                                <div class="w-2 h-2 rounded-full bg-current"></div>
                                <?= e($label) ?>
                            </div>
                    </div>
                    <div class="bg-slate-50 p-6 flex items-center justify-center border-t md:border-t-0 md:border-l border-slate-100">
                        <a href="<?= url('/job-requests/track?id=' . $job['ticket_no']) ?>" class="btn btn-ghost text-blue-600 normal-case font-bold">Track Status</a>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>

        <?php if (empty($jobs)): ?>
            <div class="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <h2 class="text-xl font-bold text-slate-700">No requests found</h2>
                <p class="text-slate-500 mt-2 mb-6">You haven't submitted any job requests using this email yet.</p>
                <a href="<?= url('/job-requests/create') ?>" class="btn btn-primary h-12 normal-case px-8">Submit Your First Request</a>
            </div>
        <?php endif; ?>
    </div>
</div>
