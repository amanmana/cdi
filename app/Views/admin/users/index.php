<?php
// Define available units for tabs (Dynamic)
// $units is passed from controller
$unitNames = array_column($units, 'name');
$tabs = array_merge(['All'], $unitNames, ['Others']);
?>

<div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
    <div>
        <h3 class="text-xl font-bold text-slate-800">System Users</h3>
        <p class="text-sm text-slate-500">Manage user access and roles.</p>
    </div>
    <a href="<?= url('/admin/users/create') ?>" class="btn btn-primary btn-sm">Add New User</a>
</div>

<!-- Unit Tabs -->
<div class="tabs tabs-boxed bg-slate-100 p-1 inline-flex gap-1 mb-6 flex-wrap">
    <?php foreach ($tabs as $tab): ?>
    <a class="tab tab-lg px-6 font-bold uppercase text-[10px] tracking-widest transition-all <?= $tab === 'All' ? 'tab-active bg-blue-600 !text-white shadow-md' : 'text-slate-500 hover:text-slate-700' ?>" 
       onclick="filterByUnit(this, '<?= $tab ?>')">
        <?= $tab ?>
    </a>
    <?php endforeach; ?>
</div>

<div class="overflow-x-auto bg-white rounded-xl shadow-sm border">
    <table class="table w-full">
        <thead>
            <tr class="bg-slate-50">
                <th class="text-slate-600 uppercase text-xs font-bold py-4 pl-6">Name</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4">Email</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4">Role</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4">Unit</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4">Joined</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4 text-right pr-6">Actions</th>
            </tr>
        </thead>
        <tbody class="divide-y" id="users-table-body">
            <?php foreach ($users as $user): 
                $userUnit = $user['unit'] ? $user['unit'] : 'Others';
                // Map common units, everything else to Others
                if (!in_array($userUnit, $unitNames)) {
                    $userUnit = 'Others';
                }
            ?>
            <tr class="hover:bg-slate-50 transition-colors user-row" data-unit="<?= $userUnit ?>">
                <td class="pl-6 font-semibold text-slate-800">
                    <?= e($user['name']) ?>
                </td>
                <td class="text-slate-500 font-medium"><?= e($user['email']) ?></td>
                <td>
                    <div class="badge <?= match($user['role']) {
                        'admin' => 'badge-error',
                        'manager' => 'badge-warning',
                        'staff' => 'badge-info',
                        'client' => 'badge-ghost',
                        default => 'badge-ghost'
                    } ?> badge-sm font-bold uppercase py-3 text-[10px] tracking-wider">
                        <?= e($user['role']) ?>
                    </div>
                </td>
                <td>
                    <?php if($user['unit']): ?>
                        <span class="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200 tracking-wider"><?= e($user['unit']) ?></span>
                    <?php else: ?>
                        <span class="text-[10px] text-slate-300 italic font-medium">-</span>
                    <?php endif; ?>
                </td>
                <td class="text-sm text-slate-400">
                    <?= date('M d, Y', strtotime($user['created_at'])) ?>
                </td>
                <td class="text-right pr-6">
                    <div class="flex justify-end gap-2">
                        <a href="<?= url('/admin/users/' . $user['id'] . '/edit') ?>" class="btn btn-ghost btn-xs text-blue-600 font-bold uppercase text-[10px] tracking-wider">Edit</a>
                        <?php if ($user['id'] != auth()->id()): ?>
                        <form action="<?= url('/admin/users/' . $user['id'] . '/delete') ?>" method="POST" onsubmit="confirmAction(event, 'Delete User?', 'Are you sure you want to delete this user? This action cannot be undone.');">
                            <?= csrf_field() ?>
                            <button type="submit" class="btn btn-ghost btn-xs text-rose-500 font-bold uppercase text-[10px] tracking-wider">Delete</button>
                        </form>
                        <?php endif; ?>
                    </div>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<script>
function filterByUnit(element, unit) {
    // Update tabs UI
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => {
        t.classList.remove('tab-active', 'bg-blue-600', '!text-white', 'shadow-md');
        t.classList.add('text-slate-500', 'hover:text-slate-700');
    });
    element.classList.add('tab-active', 'bg-blue-600', '!text-white', 'shadow-md');
    element.classList.remove('text-slate-500', 'hover:text-slate-700');

    // Filter rows
    const rows = document.querySelectorAll('.user-row');
    rows.forEach(row => {
        if (unit === 'All' || row.dataset.unit === unit) {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    });
}
</script>
