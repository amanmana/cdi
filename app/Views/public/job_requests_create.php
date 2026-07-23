<div class="max-w-2xl mx-auto">
    <div class="mb-10 text-center">
        <h1 class="text-4xl font-extrabold text-gray-900 mb-2">Submit Job Request</h1>
        <p class="text-gray-600">Please fill out the form below to start the approval process.</p>
    </div>

    <div class="card bg-white shadow-xl border overflow-hidden">
        <div class="h-2 bg-primary"></div>
        <div class="card-body p-8">
            <form action="<?= url('/job-requests') ?>" method="POST">
                <?= csrf_field() ?>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Applicant Name</span>
                        </label>
                        <input type="text" name="client_name" value="<?= e(old('client_name')) ?>" placeholder="e.g. John Doe" class="input input-bordered w-full <?= error('client_name') ? 'input-error' : '' ?>" />
                        <?php if (error('client_name')): ?>
                            <label class="label"><span class="label-text-alt text-error"><?= error('client_name') ?></span></label>
                        <?php endif; ?>
                    </div>

                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Email Address</span>
                        </label>
                        <input type="email" name="client_email" value="<?= e(old('client_email')) ?>" placeholder="john@example.com" class="input input-bordered w-full <?= error('client_email') ? 'input-error' : '' ?>" />
                        <?php if (error('client_email')): ?>
                            <label class="label"><span class="label-text-alt text-error"><?= error('client_email') ?></span></label>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="form-control w-full mt-6">
                    <label class="label">
                        <span class="label-text font-semibold">Request Title</span>
                    </label>
                    <input type="text" name="title" value="<?= e(old('title')) ?>" placeholder="e.g. Server Maintenance Request" class="input input-bordered w-full <?= error('title') ? 'input-error' : '' ?>" />
                    <?php if (error('title')): ?>
                        <label class="label"><span class="label-text-alt text-error"><?= error('title') ?></span></label>
                    <?php endif; ?>
                </div>

                <div class="form-control w-full mt-6">
                    <label class="label">
                        <span class="label-text font-semibold">Further Details</span>
                    </label>
                    <textarea name="description" rows="4" placeholder="Please provide a complete description for this task..." class="textarea textarea-bordered h-32 <?= error('description') ? 'textarea-error' : '' ?>"><?= e(old('description')) ?></textarea>
                    <?php if (error('description')): ?>
                        <label class="label"><span class="label-text-alt text-error"><?= error('description') ?></span></label>
                    <?php endif; ?>
                </div>

                <div class="card-actions justify-end mt-10">
                    <button type="submit" class="btn btn-primary btn-lg px-8">Submit Now</button>
                </div>
            </form>
        </div>
    </div>
</div>
