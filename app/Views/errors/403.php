<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>403 - Forbidden</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center min-h-screen">
    <div class="text-center px-4">
        <h1 class="text-9xl font-bold text-slate-200">403</h1>
        <p class="text-2xl font-semibold text-slate-800 mt-4">Access Denied</p>
        <p class="text-slate-500 mt-2">You don't have permission to access this page.</p>
        <div class="mt-8">
            <a href="<?= url('/') ?>" class="text-blue-600 hover:underline">Go back home</a>
        </div>
    </div>
</body>
</html>
