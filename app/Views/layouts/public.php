<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e(setting('app_name', config('app.name'))) ?></title>
    <link href="https://cdn.jsdelivr.net/npm/daisyui@3.9.4/dist/full.css" rel="stylesheet" type="text/css" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
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
<body class="bg-gray-50 min-h-screen">
    
    <div class="navbar bg-white border-b border-gray-100 px-4 md:px-12 h-16">
        <div class="flex-1">
            <a href="<?= url('/') ?>" class="flex items-center gap-2 group">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                    <span class="text-white font-bold text-lg"><?= substr(setting('app_name', 'M'), 0, 1) ?></span>
                </div>
                <span class="text-xl font-bold text-slate-800 tracking-tight"><?= e(setting('app_name', config('app.name'))) ?></span>
            </a>
        </div>
        <div class="flex-none gap-2">
            <?php if (!auth()->check()): ?>
                <a href="<?= url('/job-requests/track') ?>" class="btn btn-ghost text-slate-600 font-medium normal-case">Track Request</a>
                <a href="<?= url('/register') ?>" class="btn btn-ghost text-slate-600 font-medium normal-case">Register</a>
                <a href="<?= url('/login') ?>" class="btn bg-blue-600 hover:bg-blue-700 border-none text-white font-semibold rounded-lg px-6 normal-case">Sign In</a>
            <?php else: ?>
                <a href="<?= url('/admin') ?>" class="btn bg-blue-600 hover:bg-blue-700 border-none text-white font-semibold rounded-lg px-6 normal-case">Admin Panel</a>
            <?php endif; ?>
        </div>
    </div>

    <main class="container mx-auto px-4 py-8">
        <?= $content ?>
    </main>

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
    </script>

    <footer class="footer footer-center p-10 bg-white text-base-content border-t mt-auto">
        <div>
            <p class="font-bold"><?= e(setting('footer_text', setting('app_name', config('app.name')) . ' Micro-Framework')) ?></p> 
            <p>Copyright © <?= date('Y') ?> - All right reserved</p>
        </div>
    </footer>
</body>
</html>
