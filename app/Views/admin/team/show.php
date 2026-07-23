<div class="mb-8">
    <div class="flex items-center gap-6">
        <div class="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-blue-500/20">
            <?= substr($staff['name'], 0, 1) ?>
        </div>
        <div>
            <h2 class="text-3xl font-black text-slate-800 tracking-tight"><?= e($staff['name']) ?></h2>
            <div class="flex items-center gap-3 mt-1">
                <span class="text-slate-400 font-bold uppercase tracking-widest text-[10px]"><?= e($staff['email']) ?></span>
                <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                <span class="badge badge-ghost badge-sm font-bold uppercase tracking-tighter text-[10px]"><?= e($staff['unit'] ?? 'SYSTEM') ?> UNIT</span>
            </div>
        </div>
    </div>
</div>

<div class="tabs tabs-boxed bg-slate-100 p-1 mb-8 gap-1 inline-flex">
    <a class="tab tab-lg px-8 font-bold uppercase text-xs tracking-widest transition-all <?= !isset($_GET['tab']) || $_GET['tab'] === 'current' ? 'tab-active bg-blue-600 !text-white shadow-md' : 'text-slate-500 hover:text-slate-700' ?>" 
       onclick="switchTab('current', this)">Current Jobs (<?= count($currentJobs) ?>)</a>
    <a class="tab tab-lg px-8 font-bold uppercase text-xs tracking-widest transition-all <?= isset($_GET['tab']) && $_GET['tab'] === 'history' ? 'tab-active bg-blue-600 !text-white shadow-md' : 'text-slate-500 hover:text-slate-700' ?>" 
       onclick="switchTab('history', this)">History Jobs (<?= count($historyJobs) ?>)</a>
</div>

<div id="current-tab-content" class="<?= isset($_GET['tab']) && $_GET['tab'] === 'history' ? 'hidden' : '' ?>">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <?php foreach ($currentJobs as $job): ?>
        <a href="<?= url('/admin/job-requests/' . $job['id']) ?>" class="card bg-white shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group">
            <div class="card-body p-6">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[10px] font-black text-blue-400 font-mono tracking-tighter uppercase"><?= e($job['ticket_no']) ?></span>
                    <div class="badge badge-warning badge-sm font-bold uppercase text-[9px] tracking-widest py-3 border-none shadow-sm shadow-amber-100">Active</div>
                </div>
                <h4 class="font-bold text-slate-800 group-hover:text-blue-600 transition-colors"><?= e($job['title']) ?></h4>
                <p class="text-xs text-slate-400 mt-2 line-clamp-2"><?= e($job['description']) ?></p>
                
                <div class="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div class="flex flex-col">
                        <span class="text-[9px] text-slate-400 uppercase font-black tracking-widest">Deadline</span>
                        <span class="text-xs font-bold text-rose-500"><?= $job['deadline'] ? date('M d, Y', strtotime($job['deadline'])) : 'Not Set' ?></span>
                    </div>
                    <div class="flex flex-col items-end">
                        <span class="text-[9px] text-slate-400 uppercase font-black tracking-widest">My Progress</span>
                        <span class="text-[10px] font-bold text-slate-600">PENDING</span>
                    </div>
                </div>
            </div>
        </a>
        <?php endforeach; ?>
        <?php if (empty($currentJobs)): ?>
        <div class="col-span-full py-20 text-center bg-white border border-slate-100 border-dashed rounded-3xl">
            <p class="text-slate-300 font-bold uppercase tracking-widest text-xs italic">No current active jobs for this staff member.</p>
        </div>
        <?php endif; ?>
    </div>
</div>

<div id="history-tab-content" class="<?= !isset($_GET['tab']) || $_GET['tab'] === 'current' ? 'hidden' : '' ?>">
    <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table class="table w-full">
            <thead>
                <tr class="bg-slate-50">
                    <th class="text-slate-400 uppercase text-[10px] font-bold py-4 pl-8">Job ID</th>
                    <th class="text-slate-400 uppercase text-[10px] font-bold py-4">Title</th>
                    <th class="text-slate-400 uppercase text-[10px] font-bold py-4">Finished At</th>
                    <th class="text-slate-400 uppercase text-[10px] font-bold py-4 pr-8 text-right">Status</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                <?php foreach ($historyJobs as $job): ?>
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="pl-8 font-mono text-[10px] font-black text-slate-400 tracking-tighter uppercase"><?= e($job['ticket_no']) ?></td>
                    <td><a href="<?= url('/admin/job-requests/' . $job['id']) ?>" class="text-sm font-bold text-slate-700 hover:text-blue-600"><?= e($job['title']) ?></a></td>
                    <td>
                        <span class="text-xs text-slate-500 font-medium italic"><?= date('M d, Y', strtotime($job['staff_part_completed_at'])) ?></span>
                    </td>
                    <td class="pr-8 text-right">
                        <div class="badge badge-success badge-sm py-3 px-4 font-bold uppercase text-[9px] tracking-widest shadow-sm shadow-emerald-50 border-none text-white">Done</div>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($historyJobs)): ?>
                <tr>
                    <td colspan="4" class="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">No history records found.</td>
                </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<script>
function switchTab(tab, el) {
    const currentTab = document.getElementById('current-tab-content');
    const historyTab = document.getElementById('history-tab-content');
    const tabs = document.querySelectorAll('.tab');

    // Reset all tabs
    tabs.forEach(t => {
        t.classList.remove('tab-active', 'bg-blue-600', '!text-white', 'shadow-md');
        t.classList.add('text-slate-500', 'hover:text-slate-700');
    });

    // Set active tab
    el.classList.add('tab-active', 'bg-blue-600', '!text-white', 'shadow-md');
    el.classList.remove('text-slate-500', 'hover:text-slate-700');

    if (tab === 'current') {
        currentTab.classList.remove('hidden');
        historyTab.classList.add('hidden');
    } else {
        currentTab.classList.add('hidden');
        historyTab.classList.remove('hidden');
    }
    
    // Update URL without reload if possible
    const url = new URL(window.location);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url);
}

// Check URL param on load
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
        const tabs = document.querySelectorAll('.tab');
        const targetTab = tab === 'history' ? tabs[1] : tabs[0];
        switchTab(tab, targetTab);
    }
});
</script>
