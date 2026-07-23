<div class="text-center mb-8">
    <h1 class="text-2xl font-bold text-slate-900 tracking-tight text-center uppercase tracking-widest">Forgot Password</h1>
    <p class="text-slate-500 text-sm mt-2">No worries! Just enter your email below.</p>
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

<form action="<?= url('/forgot-password') ?>" method="POST" class="space-y-5">
    <?= csrf_field() ?>
    
    <div class="form-control">
        <label class="label pt-0"><span class="label-text font-bold text-slate-600 text-xs uppercase tracking-wider">Email Address</span></label>
        <input type="email" name="email" class="input input-bordered w-full h-11 bg-slate-50 border-slate-200 focus:border-blue-500 transition-all" placeholder="your@mimos.my" required autofocus />
    </div>

    <button type="submit" class="btn btn-primary w-full h-12 normal-case text-base font-bold shadow-lg shadow-blue-500/30 mt-6 rounded-xl">
        Send Reset Link
    </button>
</form>

<div class="mt-8 pt-6 border-t border-slate-100 text-center">
    <a href="<?= url('/login') ?>" class="text-xs text-slate-400 font-bold hover:text-blue-600 flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Login
    </a>
</div>
