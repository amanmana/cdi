<div class="max-w-2xl mx-auto">
    <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div class="p-8 md:p-12">
            <div class="text-center mb-10">
                <h1 class="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
                <p class="text-slate-500 mt-3 text-lg">Update your personal information & security.</p>
                <div class="w-16 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
            </div>

            <?php $errors = session()->flashGet('errors', []); ?>

            <form action="<?= url('/admin/profile/settings') ?>" method="POST" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <?= csrf_field() ?>
                
                <div class="form-control w-full md:col-span-2">
                    <label class="label pt-0"><span class="label-text font-bold text-slate-700 text-xs uppercase tracking-widest">Full Name</span></label>
                    <input type="text" name="name" value="<?= e(old('name', $user['name'])) ?>" 
                           class="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all rounded-xl" required>
                </div>

                <div class="form-control w-full <?= $user['role'] === 'admin' ? 'md:col-span-2' : '' ?>">
                    <label class="label pt-0"><span class="label-text font-bold text-slate-700 text-xs uppercase tracking-widest">Email Address</span></label>
                    <input type="email" name="email" value="<?= e(old('email', $user['email'])) ?>" 
                           <?= in_array($user['role'], ['client', 'manager', 'staff']) ? 'readonly' : '' ?>
                           class="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all rounded-xl <?= in_array($user['role'], ['client', 'manager', 'staff']) ? 'cursor-not-allowed opacity-70' : '' ?>" required>
                </div>

                <?php if ($user['role'] !== 'admin'): ?>
                <div class="form-control w-full">
                    <label class="label pt-0"><span class="label-text font-bold text-slate-700 text-xs uppercase tracking-widest">Department / Unit</span></label>
                    <input type="text" name="unit" value="<?= e(old('unit', $user['unit'] ?? '')) ?>" 
                           <?= in_array($user['role'], ['manager', 'staff']) ? 'readonly' : '' ?>
                           class="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all rounded-xl <?= in_array($user['role'], ['manager', 'staff']) ? 'cursor-not-allowed opacity-70' : '' ?>" required>
                </div>
                <?php endif; ?>

                <div class="form-control w-full md:col-span-2">
                    <label class="label pt-0">
                        <span class="label-text font-bold text-slate-700 text-xs uppercase tracking-widest">New Password</span>
                        <span class="label-text-alt text-slate-400 font-medium tracking-tight">Leave blank to keep current</span>
                    </label>
                    <input type="password" name="password" placeholder="••••••••" 
                           class="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all rounded-xl">
                </div>

                <div class="md:col-span-2 mt-4 flex items-center gap-4">
                    <button type="submit" class="btn btn-primary flex-1 h-14 normal-case text-lg font-bold shadow-xl shadow-blue-500/25 rounded-2xl border-none bg-blue-600 hover:bg-blue-700 transition-all">
                        Save Changes
                    </button>
                    <a href="<?= url('/admin/profile') ?>" class="btn btn-ghost h-14 px-8 rounded-2xl normal-case font-bold text-slate-500 transition-all">
                        Cancel
                    </a>
                </div>
            </form>
        </div>
    </div>
</div>

