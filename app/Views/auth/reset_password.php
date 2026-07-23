<div class="text-center mb-8">
    <h1 class="text-2xl font-bold text-slate-900 tracking-tight text-center uppercase tracking-widest">Reset Password</h1>
    <p class="text-slate-500 text-sm mt-2">Enter your new secure password.</p>
</div>

<?php if ($error = session()->flashGet('error')): ?>
    <div class="alert alert-error mb-6 text-sm py-3 rounded-xl shadow-sm">
        <span><?= e($error) ?></span>
    </div>
<?php endif; ?>

<form action="<?= url('/reset-password') ?>" method="POST" class="space-y-5">
    <?= csrf_field() ?>
    <input type="hidden" name="token" value="<?= e($data['token'] ?? '') ?>">
    <input type="hidden" name="email" value="<?= e($data['email'] ?? '') ?>">
    
    <div class="form-control">
        <label class="label pt-0"><span class="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">Email Address</span></label>
        <input type="email" value="<?= e($data['email'] ?? '') ?>" class="input input-bordered w-full h-11 bg-slate-100 border-slate-200 text-slate-500" disabled />
    </div>

    <div class="form-control">
        <label class="label pt-0"><span class="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">New Password</span></label>
        <input type="password" name="password" class="input input-bordered w-full h-11 bg-slate-50 border-slate-200 focus:border-blue-500 transition-all" placeholder="••••••••" required autofocus />
    </div>

    <div class="form-control">
        <label class="label pt-0"><span class="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">Confirm New Password</span></label>
        <input type="password" name="password_confirmation" class="input input-bordered w-full h-11 bg-slate-50 border-slate-200 focus:border-blue-500 transition-all" placeholder="••••••••" required />
    </div>

    <button type="submit" class="btn btn-primary w-full h-12 normal-case text-base font-bold shadow-lg shadow-blue-500/30 mt-6 rounded-xl">
        Update Password
    </button>
</form>
