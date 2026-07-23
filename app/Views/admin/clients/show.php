<div class="mb-6">
    <a href="<?= url('/admin/clients') ?>" class="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Clients
    </a>
</div>

<!-- Top Section: Client Details -->
<div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
    <div class="flex flex-col md:flex-row items-center gap-8">
        <div class="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span class="text-3xl font-black text-white"><?= substr($client['name'], 0, 1) ?></span>
        </div>
        <div class="text-center md:text-left flex-1">
            <h1 class="text-3xl font-black text-slate-800 tracking-tight mb-2"><?= e($client['name']) ?></h1>
            <div class="flex flex-wrap justify-center md:justify-start gap-4">
                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wide">
                    <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <?= e($client['email']) ?>
                </span>
                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-wide">
                    <svg class="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    <?= e($client['unit'] ?? 'No Unit') ?>
                </span>
                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs uppercase tracking-wide">
                    <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Active Account
                </span>
                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wide">
                    <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    Joined <?= date('M d, Y', strtotime($client['created_at'])) ?>
                </span>
            </div>
        </div>
        <div>
             <!-- Add edit action if needed -->
             <a href="<?= url('/admin/clients/' . $client['id'] . '/edit') ?>" class="btn btn-outline btn-sm rounded-xl font-bold border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all">EDIT PROFILE</a>
        </div>
    </div>
</div>

<!-- Bottom Section: Job Request History -->
<h3 class="text-xl font-bold text-slate-800 mb-4 px-1">Job Request History</h3>
<div class="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100">
    <table class="table w-full">
        <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
                <th class="py-4 pl-6 text-xs font-black text-slate-500 uppercase tracking-widest">Ticket ID</th>
                <th class="py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Project Title</th>
                <th class="py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th class="py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Submitted Date</th>
                <th class="py-4 pr-6 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Action</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
            <?php if (empty($history)): ?>
                <tr>
                    <td colspan="5" class="py-12 text-center text-slate-400 italic">No job requests found for this client.</td>
                </tr>
            <?php else: ?>
                <?php foreach ($history as $job): ?>
                <tr class="hover:bg-slate-50 transition-colors group">
                    <td class="py-4 pl-6">
                        <span class="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs"><?= e($job['ticket_no']) ?></span>
                    </td>
                    <td class="py-4">
                        <div class="font-bold text-slate-700"><?= e($job['title']) ?></div>
                        <div class="text-xs text-slate-400 mt-1"><?= e($job['unit']) ?> Unit</div>
                    </td>
                    <td class="py-4">
                        <?php
                            $status = $job['status'];
                            $stepName = $job['current_step_name'] ?? 'Unknown';
                            
                            $badgeClass = 'bg-slate-100 text-slate-500';
                            if ($status === 'completed') $badgeClass = 'bg-emerald-100 text-emerald-600';
                            if ($status === 'rejected') $badgeClass = 'bg-rose-100 text-rose-600';
                            if ($status === 'manager_approval') $badgeClass = 'bg-amber-100 text-amber-600';
                            if ($status === 'in_progress') $badgeClass = 'bg-blue-100 text-blue-600';
                        ?>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide <?= $badgeClass ?>">
                            <?= e($stepName) ?>
                        </span>
                    </td>
                    <td class="py-4 text-sm font-medium text-slate-600">
                        <?= date('M d, Y', strtotime($job['created_at'])) ?>
                        <span class="text-slate-400 text-xs ml-1"><?= date('h:i A', strtotime($job['created_at'])) ?></span>
                    </td>
                    <td class="py-4 pr-6 text-right">
                        <a href="<?= url('/admin/job-requests/' . $job['id']) ?>" class="btn btn-sm btn-ghost text-slate-400 hover:text-blue-600">
                            View Details
                        </a>
                    </td>
                </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
</div>
