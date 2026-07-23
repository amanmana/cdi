<div class="mb-10">
    <div class="flex items-center gap-4">
        <div class="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 ring-4 ring-indigo-50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 00-4-4H5m14 0h-1a4 4 0 00-4 4v2m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        </div>
        <div>
            <h1 class="text-3xl font-black text-slate-800 tracking-tight"><?= $title ?? 'View Reports' ?></h1>
            <p class="text-slate-500 font-medium"><?= isset($isManagerView) ? 'Reviewing work notes and progress updates for ' . e($staffName) : 'Your personal collection of work notes and progress updates.' ?></p>
        </div>
    </div>
</div>

<?php if (!empty($availableMonths)): ?>
    <!-- MONTH TABS -->
    <div class="mb-10 overflow-x-auto">
        <div class="flex items-center gap-2 pb-4 border-b border-slate-100 min-w-max">
            <?php 
                $currentPath = \App\Core\App::getInstance()->make('request')->path();
                foreach ($availableMonths as $month): 
                    $isActive = ($selectedMonth === $month['month_key']);
                    $url = url($currentPath) . '?month=' . $month['month_key'];
            ?>
                <a href="<?= $url ?>" 
                   class="btn btn-sm rounded-xl px-6 h-11 font-black text-[10px] uppercase tracking-widest transition-all duration-300 <?= $isActive ? 'btn-primary shadow-lg shadow-indigo-500/25 border-none' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600' ?>">
                    <?= e($month['month_label']) ?>
                </a>
            <?php endforeach; ?>
        </div>
    </div>
<?php endif; ?>
<?php if (empty($groupedReports)): ?>
    <div class="card bg-white border border-dashed border-slate-300 rounded-3xl p-20 text-center">
        <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        </div>
        <h3 class="text-xl font-bold text-slate-400 uppercase tracking-widest">No Reports Found</h3>
        <p class="text-slate-400 mt-2 max-w-sm mx-auto">None found for this period.</p>
    </div>
<?php else: ?>
    <!-- 3 COLUMNS GRID -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <?php foreach ($groupedReports as $weekKey => $data): ?>
            <!-- New Week Mini Card -->
            <div class="group card bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-500 rounded-[2.5rem] overflow-hidden">
                <!-- Card Header -->
                <div class="bg-slate-900 px-8 py-6 relative overflow-hidden">
                    <div class="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors"></div>
                    <div class="relative z-10 flex flex-col gap-1">
                        <span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Activity Report</span>
                        <h2 class="text-sm font-black text-white uppercase tracking-wider line-clamp-1"><?= e($data['label']) ?></h2>
                    </div>
                </div>
                
                <!-- Card Content -->
                <div class="p-8 flex flex-col items-center justify-center text-center">
                    <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    
                    <button type="button" 
                            onclick="showWeekDetails('modal-<?= $weekKey ?>')"
                            class="btn btn-primary rounded-2xl px-8 font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/25 border-none hover:bg-indigo-700 transition-all active:scale-95">
                        View <?= count($data['items']) ?> Reports
                    </button>
                    
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">Week Summary Only</p>
                </div>
            </div>

            <!-- Detail Modal for each week (Hidden by default) -->
            <dialog id="modal-<?= $weekKey ?>" class="modal modal-bottom sm:modal-middle">
                <div class="modal-box p-0 rounded-[2.5rem] max-w-3xl border border-slate-100 shadow-2xl relative max-h-[90vh] flex flex-col">
                    <!-- Modal Header -->
                    <div class="bg-slate-900 px-10 py-8 flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
                        <div>
                            <span class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Weekly Logs</span>
                            <h2 class="text-xl font-black text-white uppercase tracking-wider mt-1"><?= e($data['label']) ?></h2>
                        </div>
                        <button onclick="document.getElementById('modal-<?= $weekKey ?>').close()" class="btn btn-circle btn-ghost text-white hover:bg-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <!-- Modal Body (Detailed Reports) - Scrollable -->
                    <div class="p-4 sm:p-8 bg-slate-50/30 overflow-y-auto flex-1">
                        <div class="space-y-4">
                            <?php foreach ($data['items'] as $item): ?>
                                <div class="group/item relative bg-white p-6 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                                    <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                        <div class="flex-1">
                                            <!-- Ticket & Project Info -->
                                            <a href="<?= url('/admin/job-requests/' . $item['job_request_id']) ?>" class="flex items-center gap-4 mb-4 group/link">
                                                <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover/link:bg-indigo-600 group-hover/link:text-white transition-all duration-300 shadow-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2-2V7a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </div>
                                                <div class="group-hover/link:underline decoration-indigo-200 decoration-2 underline-offset-4">
                                                    <span class="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none"><?= e($item['ticket_no']) ?></span>
                                                    <h4 class="font-bold text-slate-800 leading-tight mt-0.5"><?= e($item['job_title']) ?></h4>
                                                </div>
                                            </a>
                                            
                                            <!-- Report Text -->
                                            <div class="ml-14">
                                                <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 group-hover/item:bg-white group-hover/item:border-indigo-50 transition-colors">
                                                    <p class="text-sm text-slate-600 leading-relaxed font-medium">
                                                        <?= nl2br(e($item['report_text'])) ?>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Time & Actions -->
                                        <div class="md:text-right flex flex-col items-end pt-1">
                                            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest"><?= date('h:i A', strtotime($item['created_at'])) ?></div>
                                            <div class="text-[10px] font-bold text-slate-300 mb-4"><?= date('M d, Y', strtotime($item['created_at'])) ?></div>
                                            
                                            <?php if (!isset($isManagerView)): ?>
                                            <div class="flex items-center gap-2 opacity-100 md:opacity-0 group-hover/item:opacity-100 transition-all transform translate-y-2 group-hover/item:translate-y-0">
                                                <button type="button" 
                                                        onclick="openEditReportModal(<?= $item['id'] ?>, '<?= addslashes($item['report_text']) ?>', <?= $item['job_request_id'] ?>)"
                                                        class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-500 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2-2V7a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <form action="<?= url('/admin/job-requests/' . $item['job_request_id'] . '/report/' . $item['id'] . '/delete') ?>" method="POST" onsubmit="confirmAction(event, 'Delete Report?', 'Remove this progress note permanently?');" class="inline">
                                                    <?= csrf_field() ?>
                                                    <input type="hidden" name="redirect_to" value="my_reports">
                                                    <button type="submit" 
                                                            class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-rose-500 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </form>
                                            </div>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    
                    <!-- Modal Footer -->
                    <div class="px-10 py-6 bg-white border-t border-slate-50 text-center flex-shrink-0 flex items-center justify-center gap-3">
                        <?php if (!isset($isManagerView)): ?>
                        <button onclick="openWhatsAppModal('<?= $weekKey ?>', '<?= addslashes($data['label']) ?>')" class="btn btn-primary rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            Convert to WhatsApp Report
                        </button>
                        <?php endif; ?>
                        <button onclick="document.getElementById('modal-<?= $weekKey ?>').close()" class="btn btn-ghost rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-indigo-600">Close Window</button>
                    </div>
                </div>
                <form method="dialog" class="modal-backdrop bg-slate-900/40 backdrop-blur-md">
                    <button>close</button>
                </form>
            </dialog>

            <!-- WhatsApp Report Modal for this week -->
            <dialog id="whatsapp-modal-<?= $weekKey ?>" class="modal z-[70]">
                <div class="modal-box rounded-[2.5rem] border border-slate-100 shadow-2xl p-0 overflow-hidden max-w-2xl">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-emerald-600 to-emerald-500 px-10 py-8 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                            </div>
                            <div>
                                <span class="text-[10px] font-black text-white/80 uppercase tracking-[0.3em]">WhatsApp Format</span>
                                <h2 class="text-xl font-black text-white uppercase tracking-wider mt-1">Ready to Share</h2>
                            </div>
                        </div>
                        <button onclick="document.getElementById('whatsapp-modal-<?= $weekKey ?>').close()" class="btn btn-circle btn-ghost text-white hover:bg-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="p-8 bg-slate-50">
                        <div class="bg-white rounded-2xl border border-slate-200 p-6">
                            <div class="flex items-center justify-between mb-4">
                                <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Preview</span>
                                <button onclick="copyWhatsAppReport('<?= $weekKey ?>')" class="btn btn-sm btn-primary rounded-xl font-bold text-xs">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    Copy to Clipboard
                                </button>
                            </div>
                            <textarea id="whatsapp-text-<?= $weekKey ?>" readonly class="w-full h-96 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" style="resize: none;"></textarea>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="px-10 py-6 bg-white border-t border-slate-50 text-center">
                        <button onclick="document.getElementById('whatsapp-modal-<?= $weekKey ?>').close()" class="btn btn-ghost rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-emerald-600">Close</button>
                    </div>
                </div>
                <form method="dialog" class="modal-backdrop bg-slate-900/40 backdrop-blur-md">
                    <button>close</button>
                </form>
            </dialog>
        <?php endforeach; ?>
    </div>
<?php endif; ?>

<!-- Edit Report Modal (Global) -->
<dialog id="edit-report-modal" class="modal z-[60]">
    <div class="modal-box rounded-[2.5rem] border border-slate-100 shadow-2xl p-0 overflow-hidden max-w-lg">
        <div class="bg-slate-800 px-8 py-6">
            <h3 class="font-black text-white uppercase tracking-widest text-sm flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2-2V7a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Progress Note
            </h3>
        </div>
        <form id="edit-report-form" method="POST" class="p-8">
            <?= csrf_field() ?>
            <input type="hidden" name="redirect_to" value="my_reports">
            <div class="form-control mb-6">
                <label class="label"><span class="label-text font-black text-[10px] uppercase text-slate-400 tracking-widest">Update your report text</span></label>
                <textarea id="edit-report-text" name="report_text" class="textarea textarea-bordered h-40 rounded-3xl bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm leading-relaxed" required></textarea>
            </div>
            <div class="flex gap-3">
                <button type="submit" class="btn btn-primary flex-1 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20">Save Changes</button>
                <button type="button" onclick="document.getElementById('edit-report-modal').close()" class="btn btn-ghost rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
            </div>
        </form>
    </div>
    <form method="dialog" class="modal-backdrop bg-slate-900/60 backdrop-blur-sm">
        <button>close</button>
    </form>
</dialog>

<script>
// Store reports data for WhatsApp conversion
const reportsData = <?= json_encode($groupedReports) ?>;

function showWeekDetails(modalId) {
    document.getElementById(modalId).showModal();
}

function openEditReportModal(reportId, text, jobId) {
    const modal = document.getElementById('edit-report-modal');
    const form = document.getElementById('edit-report-form');
    const textarea = document.getElementById('edit-report-text');
    
    textarea.value = text;
    form.action = `<?= url('/admin/job-requests/') ?>${jobId}/report/${reportId}/update`;
    
    modal.showModal();
}

function openWhatsAppModal(weekKey, weekLabel) {
    const modal = document.getElementById('whatsapp-modal-' + weekKey);
    const textarea = document.getElementById('whatsapp-text-' + weekKey);
    
    // Get the current user's name (from first report)
    const weekData = reportsData[weekKey];
    if (!weekData || !weekData.items || weekData.items.length === 0) {
        alert('No reports found for this week');
        return;
    }
    
    const staffName = weekData.items[0].staff_name;
    
    // Generate WhatsApp format
    let whatsappText = `*${staffName} Weekly Reports ${weekLabel}*\n\n`;
    
    weekData.items.forEach((item, index) => {
        const runningNumber = index + 1;
        const jobTitle = item.job_title;
        const reportText = item.report_text;
        const date = new Date(item.created_at).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
        
        whatsappText += `${staffName} > ${runningNumber} > ${jobTitle}: ${reportText} > ${date} > Completed\n`;
    });
    
    textarea.value = whatsappText;
    modal.showModal();
}

function copyWhatsAppReport(weekKey) {
    const textarea = document.getElementById('whatsapp-text-' + weekKey);
    const textToCopy = textarea.value;
    const button = event.target.closest('button');
    const originalHTML = button.innerHTML;
    
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showCopySuccess(button, originalHTML);
        }).catch(err => {
            console.log('Modern API failed, trying fallback...', err);
            fallbackCopy(textarea, button, originalHTML);
        });
    } else {
        // Use fallback method
        fallbackCopy(textarea, button, originalHTML);
    }
}

function fallbackCopy(textarea, button, originalHTML) {
    try {
        // Temporarily make textarea not readonly
        textarea.readOnly = false;
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        
        // Execute copy command
        const successful = document.execCommand('copy');
        
        // Restore readonly
        textarea.readOnly = true;
        
        if (successful) {
            showCopySuccess(button, originalHTML);
        } else {
            throw new Error('execCommand failed');
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Failed to copy to clipboard. Please select the text and copy manually (Ctrl+C or Cmd+C).');
    }
}

function showCopySuccess(button, originalHTML) {
    button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Copied!
    `;
    button.classList.add('btn-success');
    
    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove('btn-success');
    }, 2000);
}
</script>
