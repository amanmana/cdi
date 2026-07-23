<div class="max-w-xl">
    <div class="card bg-white shadow-sm border">
        <div class="card-body">
            <?php $errors = session()->flashGet('errors', []); ?>

            <form action="<?= url('/admin/users/' . $user['id'] . '/update') ?>" method="POST" class="space-y-4">
                <?= csrf_field() ?>
                
                <div class="form-control w-full">
                    <label class="label"><span class="label-text font-semibold">Full Name</span></label>
                    <input type="text" name="name" value="<?= e($user['name']) ?>" class="input input-bordered <?= isset($errors['name']) ? 'input-error' : '' ?>" placeholder="Full Name">
                    <?php if(isset($errors['name'])): ?><span class="text-error text-xs mt-1"><?= $errors['name'][0] ?></span><?php endif; ?>
                </div>

                <div class="form-control w-full">
                    <label class="label"><span class="label-text font-semibold">Email Address</span></label>
                    <input type="email" name="email" value="<?= e($user['email']) ?>" class="input input-bordered <?= isset($errors['email']) ? 'input-error' : '' ?>" placeholder="user@example.com">
                    <?php if(isset($errors['email'])): ?><span class="text-error text-xs mt-1"><?= $errors['email'][0] ?></span><?php endif; ?>
                </div>

                <div class="form-control w-full">
                    <label class="label">
                        <span class="label-text font-semibold">Password</span>
                        <span class="label-text-alt text-slate-400">Leave blank to keep current</span>
                    </label>
                    <input type="password" name="password" class="input input-bordered <?= isset($errors['password']) ? 'input-error' : '' ?>" placeholder="New password (optional)">
                    <?php if(isset($errors['password'])): ?><span class="text-error text-xs mt-1"><?= $errors['password'][0] ?></span><?php endif; ?>
                </div>

                <div class="form-control w-full">
                    <label class="label"><span class="label-text font-semibold">Role</span></label>
                    <select name="role" id="role-select" class="select select-bordered <?= isset($errors['role']) ? 'select-error' : '' ?>">
                        <option value="staff" <?= $user['role'] === 'staff' ? 'selected' : '' ?>>Staff</option>
                        <option value="manager" <?= $user['role'] === 'manager' ? 'selected' : '' ?>>Manager</option>
                        <option value="admin" <?= $user['role'] === 'admin' ? 'selected' : '' ?>>Admin</option>
                    </select>
                    <?php if(isset($errors['role'])): ?><span class="text-error text-xs mt-1"><?= $errors['role'][0] ?></span><?php endif; ?>
                </div>

                <div id="unit-control" class="form-control w-full <?= $user['role'] === 'admin' ? 'hidden' : '' ?>">
                    <label class="label"><span class="label-text font-semibold">Unit</span></label>
                    <select name="unit" class="select select-bordered <?= isset($errors['unit']) ? 'select-error' : '' ?>">
                        <option value="">No Unit (Default)</option>
                        <?php foreach($units as $u): ?>
                            <option value="<?= e($u['name']) ?>" <?= ($user['unit'] ?? '') === $u['name'] ? 'selected' : '' ?>><?= e($u['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                    <?php if(isset($errors['unit'])): ?><span class="text-error text-xs mt-1"><?= $errors['unit'][0] ?></span><?php endif; ?>
                </div>

                <script>
                    document.getElementById('role-select').addEventListener('change', function() {
                        const unitControl = document.getElementById('unit-control');
                        if (this.value === 'admin') {
                            unitControl.classList.add('hidden');
                        } else {
                            unitControl.classList.remove('hidden');
                        }
                    });
                </script>

                <div class="pt-6 flex gap-3">
                    <button type="submit" class="btn btn-primary flex-1">Update User</button>
                    <a href="<?= url('/admin/users') ?>" class="btn btn-ghost">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</div>
