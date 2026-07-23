<div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
    <div>
        <h2 class="text-3xl font-black text-slate-800 tracking-tight">System Backup</h2>
        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manage database versions & safety</p>
    </div>
    <div class="flex gap-3">
        <button onclick="document.getElementById('import-modal').showModal()" class="btn btn-outline btn-sm h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import Backup
        </button>
        <form action="<?= url('/admin/backup/create') ?>" method="POST">
            <?= csrf_field() ?>
            <button type="submit" class="btn btn-primary btn-sm h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/25 border-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Create Backup
            </button>
        </form>
    </div>
</div>

<div class="card bg-white shadow-sm border border-slate-100 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="table w-full">
            <thead>
                <tr class="bg-slate-50 border-b border-slate-100">
                    <th class="w-16 text-center text-slate-400 font-black text-[10px] uppercase py-4">No.</th>
                    <th class="text-slate-400 font-black text-[10px] uppercase py-4">File Name & Info</th>
                    <th class="text-right text-slate-400 font-black text-[10px] uppercase py-4 pr-12">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                <?php if (empty($files)): ?>
                <tr>
                    <td colspan="3" class="py-20 text-center font-medium text-slate-400 italic">No backups found. Create one to get started.</td>
                </tr>
                <?php endif; ?>

                <?php foreach ($files as $index => $file): ?>
                <tr class="hover:bg-slate-50/50 transition-colors group <?= $index === 0 ? 'bg-amber-50/30' : '' ?>">
                    <td class="text-center font-bold text-slate-400 text-xs py-5"><?= $index + 1 ?>.</td>
                    <td>
                        <div class="flex flex-col">
                            <div class="flex items-center gap-2">
                                <span class="font-black text-slate-700 tracking-tight"><?= e($file['name']) ?></span>
                                <?php if ($index === 0): ?>
                                    <span class="badge badge-success badge-xs font-black uppercase text-[8px] tracking-widest py-2 px-2 border-none text-white">Latest</span>
                                <?php endif; ?>
                            </div>
                            <div class="flex items-center gap-3 mt-1">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter"><?= $file['size'] ?></span>
                                <span class="w-1 h-1 rounded-full bg-slate-200"></span>
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter"><?= $file['date'] ?></span>
                            </div>
                        </div>
                    </td>
                    <td class="text-right pr-8">
                        <div class="flex justify-end items-center gap-2">
                            <a href="<?= url('/admin/backup/download/' . $file['name']) ?>" class="btn btn-ghost btn-sm btn-circle text-emerald-500 hover:bg-emerald-50" title="Download">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </a>
                            
                            <form action="<?= url('/admin/backup/restore/' . $file['name']) ?>" method="POST" onsubmit="confirmRestore(event);">
                                <?= csrf_field() ?>
                                <button type="submit" class="btn btn-ghost btn-sm btn-circle text-blue-500 hover:bg-blue-50" title="Restore this version">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                            </form>

                            <form action="<?= url('/admin/backup/delete/' . $file['name']) ?>" method="POST" onsubmit="confirmAction(event, 'Delete Backup?', 'This file will be permanently removed from storage.');">
                                <?= csrf_field() ?>
                                <button type="submit" class="btn btn-ghost btn-sm btn-circle text-rose-400 hover:bg-rose-50" title="Delete">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </form>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Import Modal -->
<dialog id="import-modal" class="modal">
    <div class="modal-box rounded-[2.5rem] p-0 overflow-hidden border border-slate-100 shadow-2xl">
        <div class="bg-slate-900 px-8 py-6 flex items-center justify-between">
            <h3 class="font-black text-white uppercase tracking-widest text-sm">Import SQL Backup</h3>
            <button onclick="document.getElementById('import-modal').close()" class="text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <form action="<?= url('/admin/backup/import') ?>" method="POST" enctype="multipart/form-data" class="p-8 space-y-6">
            <?= csrf_field() ?>
            <div class="form-control">
                <label class="label"><span class="label-text font-black text-[10px] uppercase text-slate-400 tracking-widest">Select SQL File</span></label>
                <input type="file" name="backup_file" class="file-input file-input-bordered w-full rounded-2xl bg-slate-50 font-bold border-slate-200" required accept=".sql">
                <p class="text-[10px] text-slate-400 mt-2 italic">* Only .sql files are supported. File will be added to the list for restoration.</p>
            </div>
            
            <div class="pt-4 flex gap-3">
                <button type="submit" class="btn btn-primary flex-1 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 h-12">Upload & Add to List</button>
                <button type="button" onclick="document.getElementById('import-modal').close()" class="btn btn-ghost rounded-2xl font-black text-xs uppercase tracking-widest h-12">Cancel</button>
            </div>
        </form>
    </div>
</dialog>

<script>
function confirmRestore(e) {
    e.preventDefault();
    const form = e.target.closest('form');
    
    Swal.fire({
        title: 'Restore Database?',
        text: 'Crucial: Current data will be replaced! The system will create an automatic protective backup of your current database before proceeding.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#F43F5E',
        confirmButtonText: 'Yes, Restore Now',
        cancelButtonText: 'Cancel',
        customClass: {
            confirmButton: 'swal2-styled swal2-confirm',
            cancelButton: 'swal2-styled swal2-cancel'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Processing...',
                text: 'Restoring database, please do not close this window.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            form.submit();
        }
    });
}
</script>
