<div class="max-w-2xl mx-auto">
    <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div class="p-8 md:p-12">
            <div class="text-center mb-10">
                <h1 class="text-3xl font-black text-slate-900 tracking-tight">Create Account</h1>
                <p class="text-slate-500 mt-3 text-lg">Sign up to track all your job requests.</p>
                <div class="w-16 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
            </div>

            <?php if ($error = session()->flashGet('error')): ?>
                <div class="alert alert-error mb-8 text-sm py-4 rounded-2xl shadow-sm border-none bg-red-50 text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span><?= e($error) ?></span>
                </div>
            <?php endif; ?>

            <form action="<?= url('/register') ?>" method="POST" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <?= csrf_field() ?>

                <div class="form-control w-full md:col-span-2">
                    <label class="label pt-0"><span class="label-text font-bold text-slate-700 text-xs uppercase tracking-widest">Full Name</span></label>
                    <input type="text" name="name" value="<?= old('name') ?>" placeholder="John Doe" 
                           class="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all rounded-xl <?= isset($errors['name']) ? 'input-error' : '' ?>" required>
                    <?php if (isset($errors['name'])): ?>
                        <label class="label pb-0"><span class="label-text-alt text-error font-medium"><?= $errors['name'][0] ?></span></label>
                    <?php endif; ?>
                </div>

                <div class="form-control w-full">
                    <label class="label pt-0"><span class="label-text font-bold text-slate-700 text-xs uppercase tracking-widest">Mimos Email</span></label>
                    <input type="email" name="email" value="<?= old('email') ?>" placeholder="john@mimos.my" 
                           class="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all rounded-xl <?= isset($errors['email']) ? 'input-error' : '' ?>" required>
                    <?php if (isset($errors['email'])): ?>
                        <label class="label pb-0"><span class="label-text-alt text-error font-medium"><?= $errors['email'][0] ?></span></label>
                    <?php endif; ?>
                </div>

                <div class="form-control w-full">
                    <label class="label pt-0"><span class="label-text font-bold text-slate-700 text-xs uppercase tracking-widest">Department</span></label>
                    <input type="text" name="unit" value="<?= old('unit') ?>" placeholder="Graphic Design" 
                           class="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all rounded-xl <?= isset($errors['unit']) ? 'input-error' : '' ?>" required>
                    <?php if (isset($errors['unit'])): ?>
                        <label class="label pb-0"><span class="label-text-alt text-error font-medium"><?= $errors['unit'][0] ?></span></label>
                    <?php endif; ?>
                </div>

                <div class="form-control w-full md:col-span-2">
                    <label class="label pt-0"><span class="label-text font-bold text-slate-700 text-xs uppercase tracking-widest">Password</span></label>
                    <input type="password" name="password" placeholder="••••••••" 
                           class="input input-bordered w-full h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all rounded-xl <?= isset($errors['password']) ? 'input-error' : '' ?>" required>
                    <?php if (isset($errors['password'])): ?>
                        <label class="label pb-0"><span class="label-text-alt text-error font-medium"><?= $errors['password'][0] ?></span></label>
                    <?php endif; ?>
                </div>

                <div class="md:col-span-2 mt-4">
                    <button type="submit" class="btn btn-primary w-full h-14 normal-case text-lg font-bold shadow-xl shadow-blue-500/25 rounded-2xl border-none bg-blue-600 hover:bg-blue-700 transition-all hover:scale-[1.01] active:scale-[0.99]">
                        Register Account
                    </button>
                </div>
            </form>

            <div class="mt-10 pt-8 border-t border-slate-100">
                <p class="text-center text-slate-500 font-medium">
                    Already have an account? 
                    <a href="<?= url('/login') ?>" class="text-blue-600 font-bold hover:text-blue-700 transition-colors ml-1">Sign In</a>
                </p>
            </div>
        </div>
    </div>
    
    <div class="mt-8 text-center">
        <p class="text-slate-400 text-sm">By registering, you agree to our Terms of Service and Privacy Policy.</p>
    </div>
</div>

