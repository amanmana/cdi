<div class="text-center mb-8">
    <h1 class="text-2xl font-bold text-slate-900 tracking-tight text-center uppercase tracking-widest">Sign In</h1>
    <p class="text-slate-500 text-sm mt-2">Access your projects and history.</p>
</div>

<?php if ($error = session()->flashGet('error')): ?>
    <div class="alert alert-error mb-6 text-sm py-3 rounded-xl shadow-sm">
        <span><?= e($error) ?></span>
    </div>
<?php endif; ?>

<?php if ($success = session()->flashGet('success')): ?>
    <div class="alert alert-success mb-6 text-sm py-3 rounded-xl shadow-sm">
        <span><?= e($success) ?></span>
    </div>
<?php endif; ?>

<form action="<?= url('/login') ?>" method="POST" class="space-y-5">
    <?= csrf_field() ?>
    
    <div class="form-control">
        <label class="label pt-0"><span class="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">Email Address</span></label>
        <input type="email" name="email" class="input input-bordered w-full h-11 bg-slate-50 border-slate-200 focus:border-blue-500 transition-all" placeholder="admin@example.com" required autofocus />
    </div>

    <div class="form-control mt-4">
        <label class="label pt-0"><span class="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">Password</span></label>
        <input type="password" name="password" class="input input-bordered w-full h-11 bg-slate-50 border-slate-200 focus:border-blue-500 transition-all" placeholder="••••••••" required />
    </div>

    <div class="flex items-center justify-between mt-6 px-1">
        <label class="label cursor-pointer gap-2">
            <input type="checkbox" name="remember" class="checkbox checkbox-xs checkbox-primary rounded">
            <span class="label-text text-xs text-slate-500 font-medium">Remember me</span>
        </label>

        <a class="text-xs text-slate-400 font-bold hover:text-blue-600" href="<?= url('/forgot-password') ?>">
            Forgot password?
        </a>
    </div>

    <button type="submit" class="btn btn-primary w-full h-12 normal-case text-base font-bold shadow-lg shadow-blue-500/30 mt-6 rounded-xl">
        Sign In
    </button>
</form>

<div class="mt-8 pt-6 border-t border-slate-100">
    <p class="text-center text-slate-500 text-sm italic mb-6">
        Don't have an account? 
        <a href="<?= url('/register') ?>" class="text-blue-600 font-bold hover:underline not-italic ml-1">Register Now</a>
    </p>
</div>

