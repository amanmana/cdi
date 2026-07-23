<div class="max-w-4xl mx-auto">
    <div class="card bg-white shadow-xl border border-slate-100 overflow-hidden">
        <!-- Profile Header Cover -->
        <div class="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
            <div class="absolute -bottom-16 left-8">
                <div class="w-32 h-32 rounded-3xl bg-white p-2 shadow-2xl">
                    <div class="w-full h-full rounded-2xl bg-blue-600 flex items-center justify-center font-black text-5xl text-white shadow-inner">
                        <?= substr($user['name'], 0, 1) ?>
                    </div>
                </div>
            </div>
        </div>

        <div class="pt-20 pb-12 px-12">
            <div class="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                    <h2 class="text-4xl font-black text-slate-800 tracking-tight"><?= e($user['name']) ?></h2>
                    <div class="flex items-center gap-4 mt-2">
                        <span class="badge badge-primary py-4 px-6 font-black uppercase text-xs tracking-widest"><?= e($user['role']) ?></span>
                        <?php if ($user['role'] !== 'admin' && $user['unit']): ?>
                        <div class="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            <?= e($user['unit']) ?> UNIT
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
                <a href="<?= url('/admin/profile/settings') ?>" class="btn btn-outline border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 normal-case px-8 rounded-2xl shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Edit Account
                </a>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16">
                <!-- Contact Info -->
                <div class="space-y-8">
                    <h3 class="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                        <span class="w-8 h-px bg-slate-200"></span>
                        Contact Details
                    </h3>
                    <div class="space-y-6">
                        <div class="flex items-center gap-4 group">
                            <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <div>
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                <p class="font-bold text-slate-700"><?= e($user['email']) ?></p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4 group">
                            <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                            </div>
                            <div>
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Member Since</p>
                                <p class="font-bold text-slate-700"><?= date('M d, Y', strtotime($user['created_at'])) ?></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats if Staff -->
                <?php if ($user['role'] === 'staff'): ?>
                <div class="space-y-8">
                    <h3 class="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                        <span class="w-8 h-px bg-slate-200"></span>
                        Performance Overview
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div class="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                            <p class="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Assignments</p>
                            <h4 class="text-4xl font-black text-blue-700"><?= $stats['total_jobs'] ?></h4>
                        </div>
                        <div class="bg-amber-50/50 p-6 rounded-3xl border border-amber-100">
                            <p class="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Pending Jobs</p>
                            <h4 class="text-4xl font-black text-amber-600"><?= $stats['pending_jobs'] ?></h4>
                        </div>
                        <div class="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                            <p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Jobs Completed</p>
                            <h4 class="text-4xl font-black text-emerald-700"><?= $stats['completed_jobs'] ?></h4>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>
