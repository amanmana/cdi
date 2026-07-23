<div class="max-w-2xl mx-auto py-8">
    <div class="flex items-center gap-4 mb-8">
        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </div>
        <div>
            <h1 class="text-2xl font-bold text-slate-800">System Settings</h1>
            <p class="text-slate-500">Manage global application configurations and permissions.</p>
        </div>
    </div>


    <div class="space-y-8">
        <!-- Units Management -->
        <div class="card bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div class="card-header p-8 pb-4 border-b border-slate-100">
                <h3 class="font-bold text-slate-800 text-lg">Organizational Units</h3>
                <p class="text-sm text-slate-500 mt-1">Manage the units/departments available for user assignment.</p>
            </div>
            <div class="card-body p-8 pt-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <?php if(empty($units)): ?>
                        <p class="text-slate-400 italic text-sm col-span-2">No units found.</p>
                    <?php else: ?>
                        <?php foreach ($units as $u): ?>
                            <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 group hover:border-blue-200 transition-all" id="unit-row-<?= $u['id'] ?>">
                                <!-- View Mode -->
                                <div class="flex justify-between items-center view-mode">
                                    <span class="font-bold text-sm text-slate-700"><?= e($u['name']) ?></span>
                                    <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href="<?= url('/admin/units/' . $u['id'] . '/form') ?>" class="text-blue-500 hover:text-blue-700 text-xs font-black uppercase tracking-wider bg-white px-2 py-1 rounded shadow-sm border border-slate-100">Form</a>
                                        <button type="button" onclick="toggleEditUnit(<?= $u['id'] ?>)" class="text-blue-500 hover:text-blue-700 text-xs font-black uppercase tracking-wider bg-white px-2 py-1 rounded shadow-sm border border-slate-100">Edit</button>
                                        <form action="<?= url('/admin/settings/units/' . $u['id'] . '/delete') ?>" method="POST" onsubmit="confirmAction(event, 'Delete Unit?', 'Users assigned to this unit might be affected. This action cannot be undone.');" class="inline">
                                            <?= csrf_field() ?>
                                            <button type="submit" class="text-rose-500 hover:text-rose-700 text-xs font-black uppercase tracking-wider bg-white px-2 py-1 rounded shadow-sm border border-slate-100">Delete</button>
                                        </form>
                                    </div>
                                </div>
                                
                                <!-- Edit Mode -->
                                <form action="<?= url('/admin/settings/units/' . $u['id'] . '/update') ?>" method="POST" class="hidden edit-mode flex items-center gap-2">
                                    <?= csrf_field() ?>
                                    <input type="text" name="name" value="<?= e($u['name']) ?>" class="input input-sm input-bordered w-full text-sm" required>
                                    <button type="submit" class="btn btn-sm btn-primary">Save</button>
                                    <button type="button" onclick="toggleEditUnit(<?= $u['id'] ?>)" class="btn btn-sm btn-ghost">Cancel</button>
                                </form>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <form action="<?= url('/admin/settings/units') ?>" method="POST">
                    <?= csrf_field() ?>
                    <label class="label"><span class="label-text font-bold text-xs uppercase text-slate-500">Add New Unit</span></label>
                    <div class="flex gap-2">
                        <input type="text" name="name" placeholder="e.g. IT, Finance, HR" class="input input-bordered w-full text-sm" required>
                        <button type="submit" class="btn btn-primary px-6">Add Unit</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- General System Settings -->
        <div class="card bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div class="card-header p-8 pb-4 border-b border-slate-100">
                <h3 class="font-bold text-slate-800 text-lg">General Preferences</h3>
                <p class="text-sm text-slate-500 mt-1">Global application configurations and security permissions.</p>
            </div>
            <form action="<?= url('/admin/settings/update') ?>" method="POST" class="card-body p-8 pt-6">
                <?= csrf_field() ?>

                <div class="space-y-8">
                    <!-- Manager Delete Permission -->
                    <div>
                        <div class="flex justify-between items-start mb-4">
                            <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wide">Manager Delete Permission</h3>
                            <div class="badge badge-error badge-outline font-bold text-[10px] uppercase tracking-wider px-3">High Security</div>
                        </div>

                        <div class="flex flex-col gap-3">
                            <label class="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-emerald-50 <?= $allowManagerDelete === '1' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-white' ?>">
                                <input type="radio" name="allow_manager_delete" value="1" class="radio radio-success" <?= $allowManagerDelete === '1' ? 'checked' : '' ?>>
                                <div>
                                    <span class="font-bold text-emerald-700">Allow Managers to Delete</span>
                                    <p class="text-xs text-emerald-600/70 font-medium">Managers can permanently remove requests from their unit.</p>
                                </div>
                            </label>

                            <label class="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50 <?= $allowManagerDelete === '0' ? 'border-slate-300 bg-slate-50/50' : 'border-slate-100 bg-white' ?>">
                                <input type="radio" name="allow_manager_delete" value="0" class="radio radio-primary" <?= $allowManagerDelete === '0' ? 'checked' : '' ?>>
                                <div>
                                    <span class="font-bold text-slate-700">Disable Manager Deletion</span>
                                    <p class="text-xs text-slate-400 font-medium">Only Super Admins retain the ability to delete requests.</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Future Settings Placeholder -->
                    <div class="opacity-50 pointer-events-none grayscale pt-6 border-t border-slate-100">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-slate-400 text-sm uppercase tracking-wide">Email Notifications</h3>
                            <div class="badge badge-ghost text-[10px] font-bold">LOCKED</div>
                        </div>
                        <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 border-dashed text-center italic text-sm text-slate-400">
                            Advanced settings will be available in the next Pro version update.
                        </div>
                    </div>
                </div>

                <div class="mt-8 pt-6 border-t border-slate-100">
                    <button type="submit" class="btn btn-ghost w-full border-2 border-slate-200 hover:border-primary hover:text-primary">Save Preferences</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
function toggleEditUnit(id) {
    const row = document.getElementById('unit-row-' + id);
    if (!row) return;
    
    const viewMode = row.querySelector('.view-mode');
    const editMode = row.querySelector('.edit-mode');
    
    if (viewMode.classList.contains('hidden')) {
        viewMode.classList.remove('hidden');
        editMode.classList.add('hidden');
    } else {
        viewMode.classList.add('hidden');
        editMode.classList.remove('hidden');
    }
}
</script>
