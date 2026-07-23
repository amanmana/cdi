<div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
    <div>
        <h3 class="text-xl font-bold text-slate-800">Clients</h3>
        <p class="text-sm text-slate-500">Manage registered clients.</p>
    </div>
    <!-- You might want a specific 'Add Client' button if the flow differs, but for now we list them -->
</div>

<div class="overflow-x-auto bg-white rounded-xl shadow-sm border">
    <table class="table w-full">
        <thead>
            <tr class="bg-slate-50">
                <th class="text-slate-600 uppercase text-xs font-bold py-4 pl-6">Name</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4">Email</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4 text-center">Job Requests</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4">Status</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4">Joined</th>
                <th class="text-slate-600 uppercase text-xs font-bold py-4 text-right pr-6">Actions</th>
            </tr>
        </thead>
        <tbody class="divide-y">
            <?php if (empty($clients)): ?>
                <tr>
                    <td colspan="6" class="text-center py-8 text-slate-500">No clients found.</td>
                </tr>
            <?php else: ?>
                <?php foreach ($clients as $client): ?>
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="pl-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="avatar placeholder">
                                <div class="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs uppercase">
                                    <?= substr($client['name'], 0, 1) ?>
                                </div>
                            </div>
                            <div class="font-bold text-slate-700">
                                <a href="<?= url('/admin/clients/' . $client['id']) ?>" class="hover:text-blue-600 transition-colors">
                                    <?= e($client['name']) ?>
                                </a>
                            </div>
                        </div>
                    </td>
                    <td class="py-4 text-slate-600 font-medium text-sm"><?= e($client['email']) ?></td>
                    <td class="py-4 text-center">
                        <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-100 bg-blue-600 rounded-full">
                            <?= $client['job_count'] ?? 0 ?>
                        </span>
                    </td>
                    <td class="py-4">
                        <span class="badge badge-sm font-bold badge-ghost uppercase">Active</span>
                    </td>
                    <td class="py-4 text-slate-500 text-xs font-bold font-mono">
                        <?= date('M d, Y', strtotime($client['created_at'])) ?>
                    </td>
                    <td class="text-right pr-6 py-4">
                        <div class="flex justify-end gap-2">
                             <a href="<?= url('/admin/clients/' . $client['id'] . '/edit') ?>" class="text-blue-500 hover:text-blue-700 text-xs font-black uppercase tracking-wider bg-white px-2 py-1 rounded shadow-sm border border-slate-100 transition-all hover:-translate-y-0.5">Edit</a>
                             <form action="<?= url('/admin/clients/' . $client['id'] . '/delete') ?>" method="POST" onsubmit="confirmAction(event, 'Delete Client?', 'Are you sure you want to delete this client? All their project history will be lost.');" class="inline">
                                <?= csrf_field() ?>
                                <button type="submit" class="text-rose-500 hover:text-rose-700 text-xs font-black uppercase tracking-wider bg-white px-2 py-1 rounded shadow-sm border border-slate-100 transition-all hover:-translate-y-0.5">Delete</button>
                            </form>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
</div>
