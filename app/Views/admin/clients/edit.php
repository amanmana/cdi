<div class="max-w-2xl">
    <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-8">
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-slate-900">Edit Client</h1>
                <p class="text-slate-500 mt-1">Update client information and account settings.</p>
            </div>

            <?php $errors = session()->flashGet('errors', []); ?>

            <form action="<?= url('/admin/clients/' . $client['id'] . '/update') ?>" method="POST" class="space-y-6">
                <?= csrf_field() ?>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="form-control w-full md:col-span-2">
                        <label class="label pt-0"><span class="label-text font-bold text-slate-700 text-xs uppercase tracking-widest">Full Name</span></label>
                        <input type="text" name="name" value="<?= e(old('name', $client['name'])) ?>" 
                               class="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all rounded-xl <?= isset($errors['name']) ? 'input-error' : '' ?>" required>
                        <?php if(isset($errors['name'])): ?><span class="text-error text-xs mt-1 font-medium"><?= $errors['name'][0] ?></span><?php endif; ?>
                    </div>

                    <div class="form-control w-full">
                        <label class="label pt-0"><span class="label-text font-bold text-slate-700 text-xs uppercase tracking-widest">Email Address</span></label>
                        <input type="email" name="email" value="<?= e(old('email', $client['email'])) ?>" 
                               class="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all rounded-xl <?= isset($errors['email']) ? 'input-error' : '' ?>" required>
                        <?php if(isset($errors['email'])): ?><span class="text-error text-xs mt-1 font-medium"><?= $errors['email'][0] ?></span><?php endif; ?>
                    </div>

                    <div class="form-control w-full">
                        <label class="label pt-0"><span class="label-text font-bold text-slate-700 text-xs uppercase tracking-widest">Department / Unit</span></label>
                        <input type="text" name="unit" value="<?= e(old('unit', $client['unit'] ?? '')) ?>" 
                               class="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all rounded-xl <?= isset($errors['unit']) ? 'input-error' : '' ?>" required>
                        <?php if(isset($errors['unit'])): ?><span class="text-error text-xs mt-1 font-medium"><?= $errors['unit'][0] ?></span><?php endif; ?>
                    </div>

                    <div class="form-control w-full md:col-span-2">
                        <label class="label pt-0">
                            <span class="label-text font-bold text-slate-700 text-xs uppercase tracking-widest">Password</span>
                            <span class="label-text-alt text-slate-400 font-medium">Leave blank to keep current</span>
                        </label>
                        <input type="password" name="password" placeholder="••••••••" 
                               class="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all rounded-xl <?= isset($errors['password']) ? 'input-error' : '' ?>">
                        <?php if(isset($errors['password'])): ?><span class="text-error text-xs mt-1 font-medium"><?= $errors['password'][0] ?></span><?php endif; ?>
                    </div>
                </div>

                <div class="pt-6 border-t border-slate-50 flex items-center gap-4">
                    <button type="submit" class="btn btn-primary h-12 px-8 rounded-xl normal-case font-bold shadow-lg shadow-blue-500/20">
                        Update Client
                    </button>
                    <a href="<?= url('/admin/clients') ?>" class="btn btn-ghost h-12 px-8 rounded-xl normal-case font-bold text-slate-500">
                        Cancel
                    </a>
                </div>
            </form>
        </div>
    </div>
</div>
