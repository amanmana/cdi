<div class="max-w-3xl mx-auto py-12 px-4">
    <div class="mb-8 text-center">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Submit a Job Request</h1>
        <p class="mt-2 text-slate-500">Fill in the details below and we'll get back to you as soon as possible.</p>
    </div>

    <div class="bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden border border-slate-100">
        <div class="h-2 bg-blue-600"></div>
        <div class="p-8 md:p-12">
            <?php $errors = session()->flashGet('errors', []); ?>
            <?php $old = session()->flashGet('old', []); ?>

            <form action="<?= url('/job-requests') ?>" method="POST" class="space-y-8" novalidate id="job-request-form">
                <?= csrf_field() ?>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="form-group">
                        <label class="block text-sm font-bold text-slate-700 mb-2">Your Full Name <span class="text-rose-500">*</span></label>
                        <?php if (auth()->check()): ?>
                            <div class="w-full rounded-xl bg-slate-100 h-12 px-4 flex items-center text-slate-600 font-medium">
                                <?= e(auth()->user()['name']) ?>
                            </div>
                            <input type="hidden" name="client_name" value="<?= e(auth()->user()['name']) ?>">
                        <?php else: ?>
                            <input type="text" name="client_name" value="<?= e($old['client_name'] ?? '') ?>" required
                                   class="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-12 px-4 transition-all <?= isset($errors['client_name']) ? 'border-rose-300 bg-rose-50' : 'bg-slate-50' ?>" 
                                   placeholder="John Doe" data-error-msg="Full name is required">
                            <p class="mt-2 text-sm text-rose-500 hidden error-message">
                                Full name is required
                            </p>
                        <?php endif; ?>
                    </div>
                    
                    <div class="form-group">
                        <label class="block text-sm font-bold text-slate-700 mb-2">Email Address <span class="text-rose-500">*</span></label>
                        <?php if (auth()->check()): ?>
                            <div class="w-full rounded-xl bg-slate-100 h-12 px-4 flex items-center text-slate-600 font-medium">
                                <?= e(auth()->user()['email']) ?>
                            </div>
                            <input type="hidden" name="client_email" value="<?= e(auth()->user()['email']) ?>">
                        <?php else: ?>
                            <input type="email" name="client_email" value="<?= e($old['client_email'] ?? '') ?>" required
                                   class="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-12 px-4 transition-all <?= isset($errors['client_email']) ? 'border-rose-300 bg-rose-50' : 'bg-slate-50' ?>" 
                                   placeholder="john@mimos.my" data-error-msg="Email address is required or invalid">
                            <p class="mt-2 text-sm text-rose-500 hidden error-message">
                                Email address is required or invalid
                            </p>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="form-group">
                    <label class="block text-sm font-bold text-slate-700 mb-2">Select Target Unit <span class="text-rose-500">*</span></label>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <?php foreach($units as $u): ?>
                        <label class="unit-card relative flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50 group">
                            <input type="radio" name="unit" value="<?= e($u['name']) ?>" class="peer sr-only" <?= ($old['unit'] ?? '') === $u['name'] ? 'checked' : '' ?> required>
                            <span class="text-sm font-bold text-slate-800 transition-colors group-hover:text-blue-600"><?= e($u['name']) ?></span>
                            <div class="absolute inset-0 border-2 border-transparent peer-checked:border-blue-600 peer-checked:bg-blue-50/50 rounded-xl pointer-events-none transition-all"></div>
                        </label>
                        <?php endforeach; ?>
                    </div>
                    <p class="mt-2 text-sm text-rose-500 hidden error-message">Please select a unit</p>
                </div>

                <div class="form-group">
                    <label class="block text-sm font-bold text-slate-700 mb-2">Title <span class="text-rose-500">*</span></label>
                    <input type="text" name="title" value="<?= e($old['title'] ?? '') ?>" required
                           class="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-12 px-4 transition-all <?= isset($errors['title']) ? 'border-rose-300 bg-rose-50' : 'bg-slate-50' ?>" 
                           placeholder="Enter a descriptive title for your request" data-error-msg="Title is required">
                    <p class="mt-2 text-sm text-rose-500 hidden error-message">
                        Title is required
                    </p>
                </div>

                <!-- Dynamic Form Fields Container -->
                <div id="dynamic-form-fields" class="space-y-6 pt-2"></div>

                <div class="pt-4">
                    <button type="submit" class="w-full inline-flex items-center justify-center px-6 py-4 bg-blue-600 border border-transparent rounded-xl font-bold text-white uppercase tracking-widest hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-150 shadow-lg shadow-blue-200">
                        Submit Request
                    </button>
                    <p class="mt-4 text-center text-xs text-slate-400 font-medium">By submitting, you agree to our privacy policy and terms.</p>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Scripts for Dynamic Form -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<script src="https://formbuilder.online/assets/js/form-render.min.js"></script>
<script>
jQuery(function($) {
    const $container = $('#dynamic-form-fields');
    const $form = $('#job-request-form');
    
    // Custom Validation
    $form.on('submit', function(e) {
        let isValid = true;
        
        // Hide all previous errors
        $('.error-message').addClass('hidden');
        $('.border-rose-300').removeClass('border-rose-300 bg-rose-50');

        // Check standard & dynamic fields
        $(this).find('input[required], select[required], textarea[required]').each(function() {
            const $field = $(this);
            let fieldValid = true;

            if ($field.attr('type') === 'radio') {
                const name = $field.attr('name');
                if (!$('input[name="' + name + '"]:checked').length) {
                    fieldValid = false;
                }
            } else if (!$field.val() || !$field[0].checkValidity()) {
                fieldValid = false;
            }

            if (!fieldValid) {
                isValid = false;
                const $group = $field.closest('.form-group');
                $group.find('.error-message').removeClass('hidden');
                $field.addClass('border-rose-300 bg-rose-50');
                
                // For radio buttons, highlight the container
                if ($field.attr('type') === 'radio') {
                    $field.closest('.grid').addClass('p-2 bg-rose-50 rounded-xl border border-rose-100');
                }
            }
        });

        if (!isValid) {
            e.preventDefault();
            // Scroll to first error
            $('html, body').animate({
                scrollTop: $('.error-message:not(.hidden)').first().offset().top - 100
            }, 500);
        }
    });

    $('input[name="unit"]').on('change', function() {
        const unitName = $(this).val();
        
        $container.html('<div class="flex items-center gap-2 text-slate-400 p-4"><span class="loading loading-spinner loading-xs"></span><span class="text-xs font-bold uppercase tracking-widest">Loading unit requirements...</span></div>');

        $.get('<?= url("/units/form-schema") ?>', { unit: unitName }, function(response) {
            $container.empty();
            if (response.schema && response.schema !== '[]') {
                $container.formRender({
                    formData: response.schema
                });

                // Apply tailwind classes to all rendered elements to match base UI exactly
                $container.find('.form-group').each(function() {
                    const $group = $(this);
                    $group.addClass('mb-8');
                    
                    const $label = $group.find('label');
                    $label.addClass('block text-sm font-bold text-slate-700 mb-2');
                    
                    // Add asterisk if required
                    if ($group.find('[required]').length) {
                        $label.append(' <span class="text-rose-500">*</span>');
                    }

                    // Input styling - removed form-control and outline-none
                    const inputClasses = 'w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 px-4 transition-all bg-slate-50 h-12';
                    const textareaClasses = 'w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-4 transition-all bg-slate-50 min-h-[120px]';

                    $group.find('input[type="text"], input[type="number"], input[type="email"], input[type="date"], select')
                        .removeClass('form-control outline-none')
                        .addClass(inputClasses);
                        
                    $group.find('textarea')
                        .removeClass('form-control outline-none')
                        .addClass(textareaClasses);
                    
                    // Append error message placeholder
                    const labelText = $label.text().replace('*', '').trim();
                    $group.append(`<p class="mt-2 text-sm text-rose-500 hidden error-message">${labelText} is required</p>`);

                    // Checkbox/Radio groups
                    $group.find('.checkbox-group, .radio-group').addClass('flex flex-wrap gap-4 mt-2');
                    $group.find('.fb-checkbox, .fb-radio').addClass('flex items-center gap-2 cursor-pointer');
                    $group.find('input[type="checkbox"]').addClass('checkbox checkbox-primary checkbox-sm rounded-lg');
                    $group.find('input[type="radio"]').addClass('radio radio-primary radio-sm');
                });
            }
        });
    });

    // Auto-trigger if already selected (old input)
    $('input[name="unit"]:checked').trigger('change');
});
</script>

<style>
/* Remove default form-render styles that might conflict */
#dynamic-form-fields .rendered-form {
    display: block !important;
}
#dynamic-form-fields .form-group {
    margin-bottom: 2rem;
}
/* Ensure the labels look identical */
#dynamic-form-fields label {
    font-size: 0.875rem !important;
    font-weight: 700 !important;
    color: #334155 !important;
}
</style>
