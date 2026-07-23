<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>404 - Not Found</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center min-h-screen">
    <div class="text-center px-4">
        <h1 class="text-9xl font-bold text-slate-200">404</h1>
        <p class="text-2xl font-semibold text-slate-800 mt-4">Page Not Found</p>
        <p class="text-slate-500 mt-2">The page you're looking for doesn't exist.</p>
        <div class="mt-8">
            <a href="<?= url('/') ?>" class="text-blue-600 hover:underline">Go back home</a>
        </div>
    </div>
</body>
</html>
