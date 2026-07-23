<div class="text-center">
    <div class="mb-4">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <h2 class="text-3xl font-bold text-slate-800">Request Submitted!</h2>
        <p class="text-slate-500 mt-4 text-base">Thank you for your request. Our team will review it and get back to you shortly.</p>
        
        <?php if ($ticket = session()->flashGet('job_request_ticket')): ?>
            <div class="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                <p class="text-blue-600 text-xs font-bold uppercase tracking-widest mb-1">Your Tracking Number</p>
                <div class="text-4xl font-black text-blue-700 tracking-tighter"><?= $ticket ?></div>
                <p class="text-blue-500/70 text-[10px] font-medium mt-3 mb-5 uppercase tracking-wide">Please save this number to track your request status.</p>
                <a href="<?= url('/job-requests/track?id=' . $ticket) ?>" class="btn btn-sm bg-blue-600 hover:bg-blue-700 border-none text-white normal-case px-6 rounded-lg">Track Status Now</a>
            </div>
        <?php endif; ?>
    </div>

    <div class="space-y-3 mt-8">
        <a href="<?= url('/job-requests/create') ?>" class="btn btn-primary btn-block h-12 normal-case text-base font-bold shadow-lg shadow-blue-500/20 rounded-xl">Submit Another Request</a>
        <a href="<?= url('/') ?>" class="btn btn-ghost btn-block h-12 normal-case text-slate-400 font-medium rounded-xl">Back to Home</a>
    </div>

    <?php if (!auth()->check()): ?>
        <div class="mt-10 pt-8 border-t border-slate-50">
            <p class="text-slate-400 text-xs font-medium italic">Want to track all your project history?</p>
            <a href="<?= url('/register') ?>" class="text-blue-600 text-sm font-bold hover:underline mt-1 inline-block">Register with @mimos.my email</a>
        </div>
    <?php endif; ?>
</div>
