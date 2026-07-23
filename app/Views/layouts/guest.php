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
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="mb-8 text-center">
            <a href="<?= url('/') ?>" class="inline-flex items-center gap-2 group">
                <div class="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-all shadow-xl shadow-blue-500/20">
                    <span class="text-white font-black text-2xl"><?= substr(setting('app_name', 'M'), 0, 1) ?></span>
                </div>
                <span class="text-2xl font-black text-slate-800 tracking-tighter uppercase"><?= e(setting('app_name', config('app.name'))) ?></span>
            </a>
        </div>

        <!-- Card Container -->
        <div class="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-white p-8 md:p-10">
            <?= $content ?>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center space-y-4">
            <a href="<?= url('/') ?>" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-blue-600 transition-colors group">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Homepage
            </a>
        </div>
    </div>
</body>
</html>
