<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <h1 class="text-3xl font-bold text-slate-800">Transactions</h1>
    <a href="<?= url('/job-requests/create') ?>" class="btn btn-primary shadow-md hover:shadow-lg transition-all duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Add Transaction
    </a>
</div>

<!-- Filters Section -->
<div class="card bg-white p-6 mb-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="form-control">
            <label class="label pt-0"><span class="label-text font-semibold text-gray-500 text-xs uppercase">From Date</span></label>
            <input type="date" class="input input-bordered h-11 w-full text-sm rounded-lg border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value="<?= date('Y-m-d') ?>">
        </div>
        <div class="form-control">
            <label class="label pt-0"><span class="label-text font-semibold text-gray-500 text-xs uppercase">To Date</span></label>
            <input type="date" class="input input-bordered h-11 w-full text-sm rounded-lg border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value="<?= date('Y-m-d') ?>">
        </div>
        <div class="form-control">
            <label class="label pt-0"><span class="label-text font-semibold text-gray-500 text-xs uppercase">Account</span></label>
            <select class="select select-bordered font-normal h-11 min-h-0 w-full text-sm rounded-lg border-gray-200 focus:border-blue-400">
                <option>All</option>
                <option>Maybank</option>
                <option>CIMB</option>
            </select>
        </div>
        <div class="form-control">
            <label class="label pt-0"><span class="label-text font-semibold text-gray-500 text-xs uppercase">Type</span></label>
            <select class="select select-bordered font-normal h-11 min-h-0 w-full text-sm rounded-lg border-gray-200 focus:border-blue-400">
                <option>All</option>
                <option>Expense</option>
                <option>Income</option>
            </select>
        </div>
    </div>
    <div class="form-control mt-6">
        <label class="label pt-0"><span class="label-text font-semibold text-gray-500 text-xs uppercase">Search</span></label>
        <input type="text" placeholder="Search in Amount, Description, Note..." class="input input-bordered h-11 w-full text-sm rounded-lg border-gray-200 focus:border-blue-400">
    </div>
    <div class="flex justify-end gap-3 mt-6">
        <button class="btn btn-sm h-10 px-6 bg-slate-800 border-slate-800 text-white hover:bg-slate-900 rounded-lg text-xs font-bold tracking-widest uppercase">Filter</button>
        <button class="btn btn-sm h-10 px-6 bg-slate-400 border-slate-400 text-white hover:bg-slate-500 rounded-lg text-xs font-bold tracking-widest uppercase">Reset</button>
    </div>
</div>

<!-- Table Section -->
<div class="card bg-white overflow-hidden">
    <div class="overflow-x-auto">
        <table class="table w-full">
            <thead>
                <tr class="text-gray-400 text-[10px] font-bold tracking-widest uppercase">
                    <th class="bg-gray-50 py-4 px-6 border-b border-gray-100">Date</th>
                    <th class="bg-gray-50 py-4 px-6 border-b border-gray-100">Ticket No</th>
                    <th class="bg-gray-50 py-4 px-6 border-b border-gray-100">Client / Type</th>
                    <th class="bg-gray-50 py-4 px-6 border-b border-gray-100">Job Title</th>
                    <th class="bg-gray-50 py-4 px-6 border-b border-gray-100">Status</th>
                    <th class="bg-gray-50 py-4 px-6 border-b border-gray-100 text-right">Actions</th>
                </tr>
            </thead>
            <tbody class="text-sm divide-y divide-gray-50">
                <?php foreach ($jobs as $job): ?>
                    <tr class="hover:bg-blue-50/30 transition-colors">
                        <td class="py-4 px-6 whitespace-nowrap text-blue-600 font-medium">
                            <?= date('d/m/Y', strtotime($job['created_at'])) ?>
                        </td>
                        <td class="py-4 px-6 font-mono text-xs font-bold text-slate-500">
                            <?= $job['ticket_no'] ?>
                        </td>
                        <td class="py-4 px-6">
                            <?php 
                                $badgeClass = 'bg-blue-50 text-blue-600';
                                if($job['status'] === 'rejected') $badgeClass = 'bg-red-50 text-red-600';
                                if($job['status'] === 'completed') $badgeClass = 'bg-green-50 text-green-600';
                            ?>
                            <div class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium <?= $badgeClass ?>">
                                <?= e($job['client_name']) ?>
                            </div>
                        </td>
                        <td class="py-4 px-6 font-semibold text-slate-700">
                            <?= e($job['title']) ?>
                        </td>
                        <td class="py-4 px-6">
                            <?php 
                                $statusColor = 'text-gray-500';
                                switch($job['status']) {
                                    case 'submitted': $statusColor = 'text-blue-500'; break;
                                    case 'manager_approval': $statusColor = 'text-amber-500'; break;
                                    case 'staff_processing': $statusColor = 'text-indigo-500'; break;
                                    case 'completed': $statusColor = 'text-emerald-500'; break;
                                    case 'rejected': $statusColor = 'text-rose-500'; break;
                                }
                            ?>
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 rounded-full bg-current <?= $statusColor ?>"></div>
                                <span class="capitalize font-medium text-slate-600"><?= str_replace('_', ' ', $job['status']) ?></span>
                            </div>
                        </td>
                        <td class="py-4 px-6 text-right space-x-3">
                            <a href="<?= url('/admin/job-requests/' . $job['id']) ?>" class="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-wider">Details</a>
                            <button class="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-wider">Delete</button>
                        </td>
                    </tr>
                <?php endforeach; ?>
                
                <?php if (empty($jobs)): ?>
                    <tr>
                        <td colspan="5" class="py-20 text-center text-gray-400 italic">No records found.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
