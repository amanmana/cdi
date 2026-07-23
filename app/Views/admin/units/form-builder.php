<div class="max-w-6xl mx-auto">
    <div class="mb-10 flex items-center justify-between">
        <div>
            <h2 class="text-4xl font-black text-slate-800 tracking-tight"><?= e($unit['name']) ?> Requisition Form</h2>
            <p class="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                Customize the unique fields for this unit's job requests
            </p>
        </div>
        <div class="flex gap-4">
            <a href="<?= auth()->user()['role'] === 'admin' ? url('/admin/settings') : url('/admin/dashboard') ?>" class="btn btn-ghost normal-case font-bold text-slate-400">Back</a>
            <button id="save-form" class="btn btn-primary h-14 px-8 rounded-2xl shadow-lg shadow-blue-500/20 normal-case font-black text-sm tracking-wide">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                Save Form Schema
            </button>
        </div>
    </div>

    <div class="card bg-white shadow-2xl border border-slate-100 overflow-hidden rounded-3xl">
        <div class="p-8">
            <div id="fb-editor"></div>
        </div>
    </div>
</div>

<!-- Load jQuery and formBuilder -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js"></script>
<script src="https://formbuilder.online/assets/js/form-builder.min.js"></script>

<script>
jQuery(function($) {
    const fbEditor = document.getElementById('fb-editor');
    const options = {
        formData: <?= $unit['form_schema'] ?: '[]' ?>,
        disableFields: ['autocomplete', 'file', 'header', 'paragraph'],
        controlOrder: [
            'text',
            'textarea',
            'number',
            'select',
            'checkbox-group',
            'radio-group',
            'date'
        ]
    };
    const formBuilder = $(fbEditor).formBuilder(options);

    $('#save-form').on('click', function() {
        Swal.fire({
            title: 'Save Form Schema?',
            text: 'This will update the job request form for all future requests in this unit.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Save it!',
            cancelButtonText: 'No, cancel',
            customClass: {
                confirmButton: 'swal2-styled swal2-confirm',
                cancelButton: 'swal2-styled swal2-cancel'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const formData = formBuilder.actions.getData('json');
                const btn = $('#save-form');
                
                btn.addClass('loading').prop('disabled', true);

                $.ajax({
                    url: window.location.href,
                    method: 'POST',
                    data: {
                        form_schema: formData,
                        _token: '<?= csrf_token() ?>'
                    },
                    success: function(response) {
                        if (response.success) {
                            Swal.fire({
                                text: 'Form saved successfully!',
                                icon: 'success',
                                confirmButtonText: 'Excellent',
                                customClass: {
                                    confirmButton: 'swal2-styled swal2-confirm'
                                }
                            });
                        } else {
                            Swal.fire({
                                title: 'Error',
                                text: response.message,
                                icon: 'error',
                                confirmButtonText: 'Try Again',
                                customClass: {
                                    confirmButton: 'swal2-styled swal2-confirm'
                                }
                            });
                        }
                    },
                    error: function() {
                        Swal.fire({
                            text: 'A system error occurred while saving.',
                            icon: 'error',
                            confirmButtonText: 'Close',
                            customClass: {
                                confirmButton: 'swal2-styled swal2-confirm'
                            }
                        });
                    },
                    complete: function() {
                        btn.removeClass('loading').prop('disabled', false);
                    }
                });
            }
        });
    });
});
</script>

<style>
/* Adjust formBuilder styling to match admin theme */
.fb-main {
    font-family: 'Inter', sans-serif !important;
}
.form-wrap.form-builder .cb-wrap li {
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    padding: 10px !important;
    margin-bottom: 8px !important;
    transition: all 0.2s !important;
    font-weight: 600 !important;
    color: #475569 !important;
    font-size: 13px !important;
}
.form-wrap.form-builder .cb-wrap li:hover {
    background: #eff6ff !important;
    border-color: #3b82f6 !important;
    color: #2563eb !important;
}
.form-wrap.form-builder .stage-wrap {
    background: #fcfcfc !important;
    border: 2px dashed #e2e8f0 !important;
    border-radius: 24px !important;
    padding: 20px !important;
    min-height: 400px !important;
}
.form-wrap.form-builder .frmb li {
    background: white !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 16px !important;
    margin-bottom: 15px !important;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05) !important;
}
.form-wrap.form-builder .frmb li .field-label {
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    font-size: 11px !important;
    color: #1e293b !important;
}
</style>
