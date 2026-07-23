<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - <?= e(setting('app_name', config('app.name'))) ?></title>
    <link href="https://cdn.jsdelivr.net/npm/daisyui@3.9.4/dist/full.css" rel="stylesheet" type="text/css" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?= url('css/app.css') ?>">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .swal2-popup { border-radius: 1.5rem !important; padding: 2rem !important; }
        .swal2-styled.swal2-confirm { background-color: #2563eb !important; padding: 0.75rem 2rem !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; font-size: 0.75rem !important; border-radius: 0.75rem !important; }
        .swal2-styled.swal2-cancel { background-color: #f1f5f9 !important; color: #475569 !important; padding: 0.75rem 2rem !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; font-size: 0.75rem !important; border-radius: 0.75rem !important; }
    </style>
</head>
<body class="bg-slate-50 min-h-screen flex">
    
    <!-- Sidebar -->
    <aside class="w-72 bg-slate-900 text-white flex-shrink-0 hidden lg:flex flex-col shadow-2xl">
        <div class="p-8">
            <a href="<?= url('/admin') ?>" class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span class="text-white font-bold text-xl"><?= substr(setting('app_name', 'M'), 0, 1) ?></span>
                </div>
                <div>
                    <h1 class="text-lg font-bold leading-none tracking-tight">Admin</h1>
                    <p class="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1"><?= e(setting('app_name', 'Framework Mini')) ?></p>
                </div>
            </a>
        </div>
        
        <nav class="flex-1 px-6 space-y-1">
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 mt-4 px-2">Navigation</div>
            
            <?php if (auth()->hasRole(['admin', 'manager', 'client'])): ?>
            <a href="<?= url('/admin/dashboard') ?>" class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all group <?= (strpos($_SERVER['REQUEST_URI'], 'dashboard') !== false || $_SERVER['REQUEST_URI'] === url('/admin') || $_SERVER['REQUEST_URI'] === url('/admin/')) ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400' ?>">
                <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                <span class="font-medium">Dashboard</span>
            </a>
            <?php endif; ?>

            <a href="<?= url('/admin/job-requests') ?>" class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all group <?= (strpos($_SERVER['REQUEST_URI'], 'job-requests') !== false && strpos($_SERVER['REQUEST_URI'], 'my-reports') === false) ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400' ?>">
                <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span class="font-medium text-sm"><?= auth()->user()['role'] === 'client' ? 'My Requests' : 'Job Requests' ?></span>
            </a>

            <?php if (auth()->user()['role'] === 'staff'): ?>
            <a href="<?= url('/admin/my-reports') ?>" class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all group <?= strpos($_SERVER['REQUEST_URI'], 'my-reports') !== false ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400' ?>">
                <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 00-4-4H5m14 0h-1a4 4 0 00-4 4v2m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span class="font-medium text-sm">My Reports</span>
            </a>
            <?php endif; ?>

            <?php if (auth()->hasRole(['admin', 'manager'])): ?>
            <a href="<?= url('/admin/gantt') ?>" class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all group <?= strpos($_SERVER['REQUEST_URI'], 'gantt') !== false ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400' ?>">
                <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <span class="font-medium text-sm">Timeline / Gantt</span>
            </a>
            <?php endif; ?>

            <?php if (auth()->hasRole(['admin', 'manager'])): ?>
            <a href="<?= url('/admin/team') ?>" class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all group <?= strpos($_SERVER['REQUEST_URI'], 'team') !== false ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400' ?>">
                <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span class="font-medium text-sm">My Team</span>
            </a>
            <?php endif; ?>

            <?php if (auth()->hasRole('manager')): ?>
            <?php 
                $db = \App\Core\App::getInstance()->make('db');
                $myUnit = $db->fetch("SELECT id FROM units WHERE name = ?", [auth()->user()['unit']]);
            ?>
            <?php if ($myUnit): ?>
            <a href="<?= url('/admin/units/' . $myUnit['id'] . '/form') ?>" class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all group <?= strpos($_SERVER['REQUEST_URI'], 'form') !== false ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400' ?>">
                <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span class="font-medium">Unit Form Settings</span>
            </a>
            <?php endif; ?>
            <?php endif; ?>

            <?php if (auth()->hasRole('admin')): ?>
            <a href="<?= url('/admin/clients') ?>" class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all group <?= strpos($_SERVER['REQUEST_URI'], 'clients') !== false ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400' ?>">
                <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <span class="font-medium text-sm">Clients</span>
            </a>
            <?php endif; ?>

            <?php if (auth()->hasRole('admin')): ?>
            <a href="<?= url('/admin/users') ?>" class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all group <?= strpos($_SERVER['REQUEST_URI'], 'users') !== false ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400' ?>">
                <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <span class="font-medium">User Management</span>
            </a>
            <a href="<?= url('/admin/branding') ?>" class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all group <?= strpos($_SERVER['REQUEST_URI'], 'branding') !== false ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400' ?>">
                <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                <span class="font-medium">Site Branding</span>
            </a>
            <a href="<?= url('/admin/settings') ?>" class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all group <?= strpos($_SERVER['REQUEST_URI'], 'settings') !== false ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400' ?>">
                <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span class="font-medium">System Settings</span>
            </a>
            <a href="<?= url('/admin/backup') ?>" class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all group <?= strpos($_SERVER['REQUEST_URI'], 'backup') !== false ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400' ?>">
                <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 1.105 2.239 2 5 2s5-.895 5-2V7M4 7c0 1.105 2.239 2 5 2s5-.895 5-2M4 7c0-1.105 2.239-2 5-2s5 .895 5 2m0 5c0 1.105-2.239 2-5 2s-5-.895-5-2" /></svg>
                <span class="font-medium">Backup</span>
            </a>
            <?php endif; ?>

            <div class="pt-8 border-t border-slate-800/50 mt-8">
                <a href="<?= url('/') ?>" class="flex items-center space-x-3 p-3 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all group">
                    <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                    <span class="font-medium text-sm">View Public Site</span>
                </a>
            </div>
        </nav>

        </nav>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
        <header class="bg-white border-b border-slate-100 h-20 flex items-center justify-between px-8">
            <h2 class="text-sm font-black uppercase tracking-widest text-slate-400"><?= $title ?? 'Dashboard' ?></h2>
            
            <div class="flex items-center gap-4">
                <!-- User Profile Dropdown -->
                <div class="dropdown dropdown-end dropdown-hover">
                    <label tabindex="0" class="flex items-center gap-3 cursor-pointer group p-1 pr-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                        <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            <?= substr(auth()->user()['name'], 0, 1) ?>
                        </div>
                        <div class="hidden md:flex flex-col items-start mr-1">
                            <span class="text-xs font-black text-slate-800 uppercase tracking-tight"><?= e(auth()->user()['name']) ?></span>
                            <span class="text-[9px] text-blue-500 font-bold uppercase tracking-widest"><?= e(auth()->user()['role']) ?></span>
                            <?php if(auth()->user()['role'] !== 'admin' && !empty(auth()->user()['unit'])): ?>
                                <span class="text-[9px] text-slate-400 font-bold uppercase tracking-widest"><?= e(auth()->user()['unit']) ?></span>
                            <?php endif; ?>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </label>
                    
                    <div tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-2xl bg-white rounded-2xl w-64 border border-slate-100 mt-0 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all origin-top-right">
                        <div class="p-4 border-b border-slate-50">
                            <div class="flex items-center gap-3 mb-1">
                                <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                                    <?= substr(auth()->user()['name'], 0, 1) ?>
                                </div>
                                <div class="overflow-hidden">
                                    <p class="font-black text-sm text-slate-800 truncate"><?= e(auth()->user()['name']) ?></p>
                                    <p class="text-[10px] text-slate-400 font-bold truncate lowercase"><?= e(auth()->user()['email']) ?></p>
                                </div>
                            </div>
                        </div>
                        <ul class="p-2 space-y-1">
                            <li>
                                <a href="<?= url('/admin/profile') ?>" class="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-bold text-xs uppercase tracking-tight transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    User Profile
                                </a>
                            </li>
                            <li>
                                <a href="<?= url('/admin/profile/settings') ?>" class="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-bold text-xs uppercase tracking-tight transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Account Settings
                                </a>
                            </li>
                        </ul>
                        <div class="p-2 pt-0 mt-1">
                            <form action="<?= url('/logout') ?>" method="POST">
                                <?= csrf_field() ?>
                                <button type="submit" class="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs uppercase tracking-tight transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div class="lg:hidden">
                    <button class="btn btn-ghost btn-square">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                </div>
            </div>
        </header>

        <main class="p-8 lg:p-12">
            <?= $content ?>
        </main>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            <?php if ($success = session()->flashGet('success')): ?>
                Swal.fire({
                    text: <?= json_encode($success) ?>,
                    icon: 'success',
                    confirmButtonText: 'Ok, got it!',
                    customClass: {
                        confirmButton: 'swal2-styled swal2-confirm'
                    }
                });
            <?php endif; ?>

            <?php if ($error = session()->flashGet('error')): ?>
                Swal.fire({
                    text: <?= json_encode($error) ?>,
                    icon: 'error',
                    confirmButtonText: 'Try Again',
                    customClass: {
                        confirmButton: 'swal2-styled swal2-confirm'
                    }
                });
            <?php endif; ?>
        });

        function confirmAction(e, title = 'Are you sure?', text = "You won't be able to revert this!") {
            e.preventDefault();
            const form = e.target.closest('form');
            
            Swal.fire({
                title: title,
                text: text,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#F43F5E',
                confirmButtonText: 'Yes, proceed!',
                cancelButtonText: 'No, cancel',
                customClass: {
                    confirmButton: 'swal2-styled swal2-confirm',
                    cancelButton: 'swal2-styled swal2-cancel'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    form.submit();
                }
            });
        }
    </script>
</body>
</html>
