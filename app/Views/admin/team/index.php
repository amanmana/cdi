<?php
function getUnitStyle($unit) {
    $unitName = strtoupper($unit ?? 'SYSTEM');
    return match($unitName) {
        'GRAPHIC' => ['badge' => 'bg-indigo-50 text-indigo-600 border-indigo-100', 'avatar' => 'bg-indigo-600 shadow-indigo-200'],
        'SOCMED' => ['badge' => 'bg-rose-50 text-rose-600 border-rose-100', 'avatar' => 'bg-rose-600 shadow-rose-200'],
        'EVENTS' => ['badge' => 'bg-amber-50 text-amber-600 border-amber-100', 'avatar' => 'bg-amber-600 shadow-amber-200'],
        'WRITER' => ['badge' => 'bg-emerald-50 text-emerald-600 border-emerald-100', 'avatar' => 'bg-emerald-600 shadow-emerald-200'],
        'IT' => ['badge' => 'bg-blue-50 text-blue-600 border-blue-100', 'avatar' => 'bg-blue-600 shadow-blue-200'],
        'VIDEO' => ['badge' => 'bg-purple-50 text-purple-600 border-purple-100', 'avatar' => 'bg-purple-600 shadow-purple-200'],
        default => ['badge' => 'bg-slate-50 text-slate-500 border-slate-100', 'avatar' => 'bg-slate-600 shadow-slate-200']
    };
}
?>
<div class="mb-10">
    <div class="flex items-center justify-between mb-6">
        <div>
            <h2 class="text-2xl font-black text-slate-800 tracking-tight">Staff Workload</h2>
            <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time capacity view</p>
        </div>
        <button onclick="openAddStaffModal()" class="btn btn-primary rounded-2xl px-8 font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/25 border-none h-12">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
            Add New Staff
        </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <?php foreach ($staffWorkload as $load): 
            $staff = $load['info'];
            $jobs = $load['active_jobs'];
            $hasJobs = !empty($jobs);
        ?>
        <div class="card bg-white shadow-sm border border-slate-100 hover:shadow-md transition-all group h-full">
            <div class="card-body p-6">
                <!-- Staff Header -->
                <div class="flex items-start justify-between mb-6">
                    <div class="flex items-center gap-3">
                        <?php $style = getUnitStyle($staff['unit']); ?>
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg text-lg <?= $style['avatar'] ?>">
                            <?= substr($staff['name'], 0, 1) ?>
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-800 text-lg leading-tight group-hover:text-slate-900 transition-colors"><?= e($staff['name']) ?></h4>
                            <div class="badge badge-xs py-2 px-2 font-black uppercase text-[8px] tracking-widest border mt-1 <?= $style['badge'] ?>">
                                <?= e($staff['unit'] ?? 'STAFF') ?>
                            </div>
                        </div>
                    </div>
                    <?php if ($hasJobs): ?>
                        <div class="badge badge-primary font-bold text-[10px] uppercase tracking-widest py-3 px-3 shadow-blue-500/20 shadow-md">
                            <?= count($jobs) ?> Active Jobs
                        </div>
                    <?php else: ?>
                        <div class="badge badge-ghost font-bold text-[10px] uppercase tracking-widest py-3 px-3 text-emerald-600 bg-emerald-50 border-emerald-100">
                            Ready
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Active Jobs List -->
                <?php if ($hasJobs): ?>
                    <div class="space-y-3">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">In Hand Now:</p>
                        <?php foreach (array_slice($jobs, 0, 3) as $job): ?>
                        <a href="<?= url('/admin/job-requests/' . $job['id']) ?>" class="block p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 transition-colors group/job">
                            <div class="flex justify-between items-start mb-1">
                                <span class="text-[9px] font-black text-blue-500 font-mono tracking-tighter uppercase">
                                    <?= e($job['ticket_no']) ?>
                                </span>
                                <?php if ($job['deadline']): 
                                    $days = ceil((strtotime($job['deadline']) - time()) / 86400);
                                ?>
                                <span class="text-[9px] font-bold <?= $days <= 2 ? 'text-rose-500' : 'text-slate-400' ?>">
                                    <?= $days < 0 ? 'Overdue' : ($days . 'd left') ?>
                                </span>
                                <?php endif; ?>
                            </div>
                            <h5 class="text-sm font-bold text-slate-700 group-hover/job:text-blue-700 line-clamp-1"><?= e($job['title']) ?></h5>
                        </a>
                        <?php endforeach; ?>
                        
                        <?php if (count($jobs) > 3): ?>
                            <a href="<?= url('/admin/team/' . $staff['id']) ?>" class="block text-center text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest py-2">
                                + <?= count($jobs) - 3 ?> more jobs
                            </a>
                        <?php endif; ?>
                    </div>
                <?php else: ?>
                    <div class="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p class="text-xs font-bold text-slate-400">Ready for Assignment</p>
                    </div>
                <?php endif; ?>
                
                <div class="mt-6 pt-4 border-t border-slate-50 flex justify-end">
                    <a href="<?= url('/admin/team/' . $staff['id']) ?>" class="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
                        View Profile <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </a>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>

<?php if (auth()->user()['role'] === 'manager'): ?>
<div class="mt-12 mb-10">
    <div class="flex items-center justify-between mb-6">
        <div>
            <h2 class="text-2xl font-black text-slate-800 tracking-tight">Approval Delegation</h2>
            <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Appoint an acting manager</p>
        </div>
        <button onclick="openDelegationModal()" class="btn btn-outline btn-primary rounded-2xl px-8 font-black text-xs uppercase tracking-widest h-12">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Set Acting Manager
        </button>
    </div>

    <div class="card bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div class="card-body p-0">
            <div class="overflow-x-auto">
                <table class="table w-full">
                    <thead>
                        <tr class="bg-slate-50">
                            <th class="text-slate-400 uppercase text-[10px] font-bold py-4 pl-8">Acting Manager</th>
                            <th class="text-slate-400 uppercase text-[10px] font-bold py-4">From</th>
                            <th class="text-slate-400 uppercase text-[10px] font-bold py-4">Until</th>
                            <th class="text-slate-400 uppercase text-[10px] font-bold py-4">Status</th>
                            <th class="text-slate-400 uppercase text-[10px] font-bold py-4 pr-8 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        <?php foreach ($delegations as $d): ?>
                        <tr class="hover:bg-slate-50/50 transition-colors">
                            <td class="pl-8 py-4">
                                <span class="font-bold text-slate-700"><?= e($d['delegate_name']) ?></span>
                            </td>
                            <td><span class="text-xs font-bold text-slate-500"><?= date('d M Y', strtotime($d['start_date'])) ?></span></td>
                            <td><span class="text-xs font-bold text-slate-500"><?= date('d M Y', strtotime($d['end_date'])) ?></span></td>
                            <td>
                                <?php 
                                    $today = date('Y-m-d');
                                    $isActive = ($d['status'] === 'active' && $d['start_date'] <= $today && $d['end_date'] >= $today);
                                ?>
                                <?php if ($isActive): ?>
                                    <div class="badge badge-success badge-sm py-3 px-3 gap-1 font-bold uppercase text-[9px] tracking-wider">Active Now</div>
                                <?php else: ?>
                                    <div class="badge badge-ghost badge-sm py-3 px-3 gap-1 font-bold uppercase text-[9px] tracking-wider"><?= e(strtoupper($d['status'] ?? 'inactive')) ?></div>
                                <?php endif; ?>
                            </td>
                            <td class="pr-8 text-right">
                                <?php if ($d['status'] === 'active'): ?>
                                 <form action="<?= url('/admin/team/delegation/' . $d['id'] . '/cancel') ?>" method="POST" onsubmit="confirmCancelDelegation(event, '<?= e(addslashes($d['delegate_name'])) ?>')">
                                    <?= csrf_field() ?>
                                    <button type="submit" class="btn btn-ghost btn-xs text-rose-500 font-bold hover:bg-rose-50 uppercase tracking-widest text-[10px]">Cancel</button>
                                </form>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                        <?php if (empty($delegations)): ?>
                        <tr>
                            <td colspan="5" class="py-12 text-center text-slate-300 italic text-xs font-medium">No delegation history found.</td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php endif; ?>

<div class="card bg-white shadow-sm border border-slate-100 overflow-hidden">
    <div class="card-body p-0">
        <div class="p-6 border-b border-slate-50 flex justify-between items-center">
            <div>
                <h3 class="font-bold text-slate-800 uppercase tracking-widest text-sm">Team Members</h3>
                <p class="text-xs text-slate-400 mt-1 font-medium italic">Monitor performance and workload of staff in your unit</p>
            </div>
            <div class="badge badge-info badge-outline font-bold text-[10px] uppercase tracking-wider px-3"><?= count($staffList) ?> Staff</div>
        </div>

        <div class="overflow-x-auto">
            <table class="table w-full">
                <thead>
                    <tr class="bg-slate-50">
                        <th class="text-slate-400 uppercase text-[10px] font-bold py-4 pl-8">Name</th>
                        <th class="text-slate-400 uppercase text-[10px] font-bold py-4">Unit</th>
                        <th class="text-slate-400 uppercase text-[10px] font-bold py-4">Status</th>
                        <th class="text-slate-400 uppercase text-[10px] font-bold py-4 pr-8 text-right">Performance</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <?php foreach ($staffList as $staff): ?>
                    <tr class="hover:bg-slate-50/50 transition-colors group">
                        <td class="pl-8 py-4">
                            <div class="flex items-center gap-4">
                                <?php $style = getUnitStyle($staff['unit']); ?>
                                <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform <?= $style['avatar'] ?>">
                                    <?= substr($staff['name'], 0, 1) ?>
                                </div>
                                <div class="flex flex-col">
                                    <span class="font-bold text-slate-800 text-sm"><?= e($staff['name']) ?></span>
                                    <span class="text-[10px] text-slate-400 font-medium"><?= e($staff['email']) ?></span>
                                </div>
                            </div>
                        </td>
                        <td>
                            <?php $style = getUnitStyle($staff['unit']); ?>
                            <div class="badge badge-sm py-3 px-4 font-black uppercase text-[9px] tracking-[0.15em] border <?= $style['badge'] ?>">
                                <?= e(strtoupper($staff['unit'] ?? 'SYSTEM')) ?>
                            </div>
                        </td>
                        <td>
                            <div class="flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Active</span>
                            </div>
                        </td>
                        <td class="pr-8 text-right">
                            <div class="flex items-center justify-end gap-2">
                                <a href="<?= url('/admin/team/staff/' . $staff['id'] . '/reports') ?>" class="btn btn-ghost btn-sm normal-case font-bold px-4 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border-slate-200">View Reports</a>
                                <a href="<?= url('/admin/team/' . $staff['id']) ?>" class="btn btn-primary btn-sm normal-case font-bold px-6 shadow-md shadow-blue-100">View Jobs</a>
                                <div class="dropdown dropdown-end">
                                    <label tabindex="0" class="btn btn-ghost btn-sm btn-circle">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                    </label>
                                    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-2xl bg-white border border-slate-100 rounded-2xl w-52 mt-2">
                                        <li>
                                            <button onclick="openEditStaffModal(<?= $staff['id'] ?>, '<?= e(addslashes($staff['name'])) ?>', '<?= e(addslashes($staff['email'])) ?>')" class="flex items-center gap-3 text-slate-600 font-bold py-3 px-4 hover:bg-slate-50 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2-2V7a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                Edit Details
                                            </button>
                                        </li>
                                        <li>
                                            <form action="<?= url('/admin/team/' . $staff['id'] . '/delete') ?>" method="POST" onsubmit="confirmArchive(event, '<?= e(addslashes($staff['name'])) ?>')" class="p-0">
                                                <?= csrf_field() ?>
                                                <button type="submit" class="w-full flex items-center gap-3 text-rose-500 font-bold py-3 px-4 hover:bg-rose-50 rounded-xl">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    Archive Member
                                                </button>
                                            </form>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                    <?php if (empty($staffList)): ?>
                    <tr>
                        <td colspan="4" class="py-20 text-center">
                            <div class="flex flex-col items-center">
                                <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                </div>
                                <h3 class="font-bold text-slate-400">No staff members found</h3>
                                <p class="text-[10px] text-slate-300 uppercase font-bold tracking-widest mt-1">Add staff to your unit to see them here</p>
                            </div>
                        </td>
                    </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- ADD STAFF MODAL -->
<dialog id="add-staff-modal" class="modal">
    <div class="modal-box rounded-[2.5rem] p-0 overflow-hidden border border-slate-100 shadow-2xl">
        <div class="bg-slate-900 px-8 py-6 flex items-center justify-between">
            <h3 class="font-black text-white uppercase tracking-widest text-sm">Add New Team Member</h3>
            <button onclick="document.getElementById('add-staff-modal').close()" class="text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <form action="<?= url('/admin/team/store') ?>" method="POST" class="p-8 space-y-5">
            <?= csrf_field() ?>
            <div class="form-control">
                <label class="label"><span class="label-text font-black text-[10px] uppercase text-slate-400 tracking-widest">Full Name</span></label>
                <input type="text" name="name" class="input input-bordered rounded-2xl bg-slate-50 font-bold border-slate-200" required placeholder="e.g. Ahmad Suhairi">
            </div>
            <div class="form-control">
                <label class="label"><span class="label-text font-black text-[10px] uppercase text-slate-400 tracking-widest">Email Address</span></label>
                <input type="email" name="email" class="input input-bordered rounded-2xl bg-slate-50 font-bold border-slate-200" required placeholder="staff@mimos.my">
            </div>
            <div class="form-control">
                <label class="label"><span class="label-text font-black text-[10px] uppercase text-slate-400 tracking-widest">Initial Password</span></label>
                <input type="password" name="password" class="input input-bordered rounded-2xl bg-slate-50 font-bold border-slate-200" required placeholder="••••••••">
            </div>
            
            <?php if (auth()->user()['role'] === 'admin'): ?>
            <div class="form-control">
                <label class="label"><span class="label-text font-black text-[10px] uppercase text-slate-400 tracking-widest">Assigned Unit</span></label>
                <select name="unit" class="select select-bordered rounded-2xl bg-slate-50 font-bold border-slate-200">
                    <option value="Graphic">Graphic</option>
                    <option value="SocMed">SocMed</option>
                    <option value="Events">Events</option>
                    <option value="Writer">Writer</option>
                    <option value="IT">IT</option>
                    <option value="Video">Video</option>
                </select>
            </div>
            <?php endif; ?>

            <div class="pt-4 flex gap-3">
                <button type="submit" class="btn btn-primary flex-1 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/25 h-12">Register Staff</button>
                <button type="button" onclick="document.getElementById('add-staff-modal').close()" class="btn btn-ghost rounded-2xl font-black text-xs uppercase tracking-widest h-12">Cancel</button>
            </div>
        </form>
    </div>
</dialog>

<!-- EDIT STAFF MODAL -->
<dialog id="edit-staff-modal" class="modal">
    <div class="modal-box rounded-[2.5rem] p-0 overflow-hidden border border-slate-100 shadow-2xl">
        <div class="bg-indigo-600 px-8 py-6 flex items-center justify-between">
            <h3 class="font-black text-white uppercase tracking-widest text-sm">Update Staff Member</h3>
            <button onclick="document.getElementById('edit-staff-modal').close()" class="text-white/60 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <form id="edit-staff-form" method="POST" class="p-8 space-y-5">
            <?= csrf_field() ?>
            <div class="form-control">
                <label class="label"><span class="label-text font-black text-[10px] uppercase text-slate-400 tracking-widest">Full Name</span></label>
                <input type="text" id="edit-name" name="name" class="input input-bordered rounded-2xl bg-slate-50 font-bold border-slate-200" required>
            </div>
            <div class="form-control">
                <label class="label"><span class="label-text font-black text-[10px] uppercase text-slate-400 tracking-widest">Email Address</span></label>
                <input type="email" id="edit-email" name="email" class="input input-bordered rounded-2xl bg-slate-50 font-bold border-slate-200" required>
            </div>
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-black text-[10px] uppercase text-slate-400 tracking-widest">Update Password</span>
                    <span class="label-text-alt text-slate-300 font-bold">Leave blank to keep current</span>
                </label>
                <input type="password" name="password" class="input input-bordered rounded-2xl bg-slate-50 font-bold border-slate-200" placeholder="••••••••">
            </div>

            <div class="pt-4 flex gap-3">
                <button type="submit" class="btn btn-primary flex-1 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/25 h-12">Update Details</button>
                <button type="button" onclick="document.getElementById('edit-staff-modal').close()" class="btn btn-ghost rounded-2xl font-black text-xs uppercase tracking-widest h-12">Cancel</button>
            </div>
        </form>
    </div>
</dialog>

<!-- DELEGATION MODAL -->
<dialog id="delegation-modal" class="modal">
    <div class="modal-box rounded-[2.5rem] p-0 overflow-hidden border border-slate-100 shadow-2xl">
        <div class="bg-blue-600 px-8 py-6 flex items-center justify-between">
            <h3 class="font-black text-white uppercase tracking-widest text-sm">Set Acting Manager</h3>
            <button onclick="document.getElementById('delegation-modal').close()" class="text-white/60 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <form action="<?= url('/admin/team/delegation') ?>" method="POST" class="p-8 space-y-5">
            <?= csrf_field() ?>
            <div class="form-control">
                <label class="label"><span class="label-text font-black text-[10px] uppercase text-slate-400 tracking-widest">Select Delegate (Acting Manager)</span></label>
                <select name="delegate_id" class="select select-bordered rounded-2xl bg-slate-50 font-bold border-slate-200" required>
                    <option value="" disabled selected>Select from your staff...</option>
                    <?php foreach ($staffList as $staff): ?>
                        <option value="<?= $staff['id'] ?>"><?= e($staff['name']) ?></option>
                    <?php endforeach; ?>
                </select>
                <p class="text-[9px] text-slate-400 mt-2 italic">* Delegates will inherit your approval authority during the selected period.</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                    <label class="label"><span class="label-text font-black text-[10px] uppercase text-slate-400 tracking-widest">Start Date</span></label>
                    <input type="date" name="start_date" class="input input-bordered rounded-2xl bg-slate-50 font-bold border-slate-200" required value="<?= date('Y-m-d') ?>">
                </div>
                <div class="form-control">
                    <label class="label"><span class="label-text font-black text-[10px] uppercase text-slate-400 tracking-widest">End Date</span></label>
                    <input type="date" name="end_date" class="input input-bordered rounded-2xl bg-slate-50 font-bold border-slate-200" required>
                </div>
            </div>
            <div class="pt-4 flex gap-3">
                <button type="submit" class="btn btn-primary flex-1 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 h-12">Activate Delegation</button>
                <button type="button" onclick="document.getElementById('delegation-modal').close()" class="btn btn-ghost rounded-2xl font-black text-xs uppercase tracking-widest h-12">Cancel</button>
            </div>
        </form>
    </div>
</dialog>

<script>
function openAddStaffModal() {
    document.getElementById('add-staff-modal').showModal();
}

function openDelegationModal() {
    document.getElementById('delegation-modal').showModal();
}

function openEditStaffModal(id, name, email) {
    const modal = document.getElementById('edit-staff-modal');
    const form = document.getElementById('edit-staff-form');
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-email').value = email;
    form.action = `<?= url('/admin/team/') ?>${id}/update`;
    modal.showModal();
}

function confirmArchive(e, name) {
    e.preventDefault();
    const form = e.target.closest('form');
    Swal.fire({
        title: 'Archive Staff Member?',
        text: `Are you sure you want to archive ${name}? This will remove them from active duties but KEEPS all their historical reports and job history for records.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Archive Staff',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#e11d48'
    }).then((result) => {
        if (result.isConfirmed) {
            form.submit();
        }
    });
}

function confirmCancelDelegation(e, name) {
    e.preventDefault();
    const form = e.target.closest('form');
    Swal.fire({
        title: 'Cancel Delegation?',
        text: `Are you sure you want to cancel the acting manager status for ${name}? They will immediately lose authority to approve jobs on your behalf.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Cancel Delegation',
        cancelButtonText: 'Keep Active',
        confirmButtonColor: '#e11d48',
        customClass: {
            confirmButton: 'rounded-xl font-bold uppercase text-xs tracking-widest px-6 py-3',
            cancelButton: 'rounded-xl font-bold uppercase text-xs tracking-widest px-6 py-3'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            form.submit();
        }
    });
}
</script>
