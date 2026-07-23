<div class="max-w-2xl mx-auto py-8">
    <div class="flex items-center gap-4 mb-8">
        <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
        </div>
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Site Branding</h1>
            <p class="text-slate-500">Customize the identity and footer of your application.</p>
        </div>
    </div>

    <div class="card bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div class="card-header p-8 pb-4 border-b border-slate-100">
            <h3 class="font-bold text-slate-800 text-lg">Identity Settings</h3>
            <p class="text-sm text-slate-500 mt-1">These settings affect the header logo and global footer text.</p>
        </div>
        <form action="<?= url('/admin/branding/update') ?>" method="POST" class="card-body p-8 pt-6">
            <?= csrf_field() ?>

            <div class="space-y-6">
                <!-- App Name -->
                <div class="form-control w-full">
                    <label class="label pt-0">
                        <span class="label-text font-bold text-xs uppercase text-slate-500 tracking-wider">Application / Company Name</span>
                    </label>
                    <input type="text" name="app_name" value="<?= e($appName) ?>" placeholder="e.g. My Awesome Co." class="input input-bordered w-full text-sm rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all" required>
                    <label class="label">
                        <span class="label-text-alt text-slate-400">This appears in the sidebar and browser title tab.</span>
                    </label>
                </div>

                <!-- Footer Text -->
                <div class="form-control w-full">
                    <label class="label pt-4">
                        <span class="label-text font-bold text-xs uppercase text-slate-500 tracking-wider">Footer Copyright Text</span>
                    </label>
                    <textarea name="footer_text" placeholder="e.g. My Awesome Co. Micro-Framework" class="textarea textarea-bordered w-full text-sm rounded-xl min-h-[100px] focus:ring-2 focus:ring-indigo-100 transition-all" required><?= e($footerText) ?></textarea>
                    <label class="label">
                        <span class="label-text-alt text-slate-400">Displayed at the bottom of public pages.</span>
                    </label>
                </div>
            </div>

            <div class="mt-8 pt-6 border-t border-slate-100">
                <button type="submit" class="btn btn-primary w-full shadow-lg shadow-indigo-100 rounded-xl font-bold uppercase tracking-widest text-xs h-12">Update Branding</button>
            </div>
        </form>
    </div>

    <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
            <h4 class="font-bold text-indigo-800 text-sm uppercase tracking-wide mb-2">Logo Usage</h4>
            <p class="text-xs text-indigo-600/80 leading-relaxed font-medium">Currently, the logo uses the first letter of your Application Name. Change the name to update the dynamic logo.</p>
        </div>
        <div class="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
            <h4 class="font-bold text-slate-800 text-sm uppercase tracking-wide mb-2">Live Update</h4>
            <p class="text-xs text-slate-500 leading-relaxed font-medium">Changes made here are applied instantly across the entire platform for all users.</p>
        </div>
    </div>
</div>
