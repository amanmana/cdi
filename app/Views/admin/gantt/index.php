<div class="mb-6 flex justify-between items-end">
    <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Project Timeline</h1>
        <p class="text-sm text-slate-500 font-medium">Gantt chart view of all active and scheduled job requests.</p>
    </div>
    <div class="flex flex-col items-end gap-3">
        <div class="join">
            <button class="join-item btn btn-sm btn-neutral filter-btn" data-filter="all" onclick="filterTasks('all')">All</button>
            <button class="join-item btn btn-sm filter-btn" data-filter="in_progress" onclick="filterTasks('in_progress')">In Progress</button>
            <button class="join-item btn btn-sm filter-btn" data-filter="completed" onclick="filterTasks('completed')">Completed</button>
        </div>
        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <span class="w-3 h-3 rounded-full bg-yellow-500"></span> Approval
            <span class="w-3 h-3 rounded-full bg-blue-500"></span> In Progress
            <span class="w-3 h-3 rounded-full bg-green-500"></span> Completed
        </div>
    </div>
</div>

<div class="card bg-white shadow-sm border overflow-hidden">
    <div class="card-body p-0">
        <div class="overflow-x-auto p-4 w-full" style="max-width: 100%;">
            <svg id="gantt-chart" height="400"></svg>
        </div>
    </div>
</div>

<!-- Load Frappe Gantt via CDN -->
<script src="https://cdn.jsdelivr.net/npm/frappe-gantt@0.6.1/dist/frappe-gantt.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/frappe-gantt@0.6.1/dist/frappe-gantt.css">

<style>
    /* Custom Gantt Styles */
    .gantt .bar-label {
        /*fill: #e2e8f0 !important;*/ /* Light Grey Text */
        font-weight: 600;
        font-family: 'Inter', sans-serif;
        font-size: 12px;
    }
    .gantt .bar-progress {
        fill: rgba(0, 0, 0, 0.1) !important;
    }
    .gantt-container {
        height: 100%;
        overflow: auto;
    }
    .popup-wrapper {
        opacity: 0;
        scale: 0.95;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        transform-origin: bottom center;
    }
    .popup-wrapper.show {
        opacity: 1;
        scale: 1;
    }
    .details-container {
        border-radius: 12px;
        background: white;
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        border: 1px solid #e2e8f0;
        padding: 16px;
        width: 280px;
    }
    /* Disable dragging - make bars read-only */
    .gantt .bar-wrapper {
        cursor: pointer !important;
    }
    .gantt .bar-wrapper .bar {
        cursor: pointer !important;
    }
    .gantt .handle {
        display: none !important;
    }
</style>

<script>
    // Global function to be accessible from buttons
    let allTasksData = [];
    let ganttChart = null;

    function renderGantt(tasksToRender) {
        const container = document.querySelector('.card-body .overflow-x-auto');
        
        if (tasksToRender.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 text-slate-400" id="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
                    </svg>
                    <p class="font-bold uppercase tracking-widest text-sm">No jobs found</p>
                </div>
            `;
            return;
        } else {
            // Always reset the container to ensure clean render
            container.innerHTML = '<svg id="gantt-chart" height="400"></svg>';
        }

        const ganttTasks = tasksToRender.map(t => ({
            id: t.id.toString(),
            name: t.name,
            start: t.start,
            end: t.end,
            progress: t.progress,
            dependencies: '',
            custom_class: t.custom_class,
            _status: t.status,
            _assigned: t.assigned_to,
            _color: t.color
        }));

        ganttChart = new Gantt("#gantt-chart", ganttTasks, {
            header_height: 50,
            column_width: 30,
            step: 24,
            view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
            bar_height: 30,
            bar_corner_radius: 6,
            arrow_curve: 5,
            padding: 18,
            view_mode: 'Day',
            date_format: 'YYYY-MM-DD',
            custom_popup_html: function(task) {
                let badgeClass = 'bg-slate-100 text-slate-600';
                if (task._status === 'completed') badgeClass = 'bg-green-100 text-green-700';
                else if (task._status === 'staff_processing') badgeClass = 'bg-blue-100 text-blue-700';
                else if (task._status === 'manager_approval') badgeClass = 'bg-yellow-100 text-yellow-700';
                else if (task._status === 'rejected') badgeClass = 'bg-red-100 text-red-700';

                return `
                    <div class="details-container">
                        <div class="flex items-start justify-between mb-2">
                            <h5 class="font-bold text-slate-800 text-sm leading-tight">${task.name}</h5>
                            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}">
                                ${task._status.replace('_', ' ')}
                            </span>
                        </div>
                        <div class="space-y-2">
                            <div class="flex items-center gap-2 text-xs">
                                <span class="text-slate-400 font-bold uppercase w-16">Timeline</span>
                                <span class="font-mono font-medium text-slate-700">${task.start} → ${task.end}</span>
                            </div>
                            <div class="flex items-center gap-2 text-xs">
                                <span class="text-slate-400 font-bold uppercase w-16">Progress</span>
                                <div class="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div class="bg-blue-500 h-full rounded-full" style="width: ${task.progress}%"></div>
                                </div>
                                <span class="font-bold text-blue-600">${task.progress}%</span>
                            </div>
                             <div class="flex items-center gap-2 text-xs">
                                <span class="text-slate-400 font-bold uppercase w-16">Assigned</span>
                                <span class="font-medium text-slate-700 truncate">${task._assigned}</span>
                            </div>
                        </div>
                    </div>
                `;
            },
            on_click: function (task) {
                window.location.href = `<?= url('/admin/job-requests/') ?>${task.id}`;
            }
        });

        // Apply custom styling corrections
        setTimeout(() => {
            const svgChart = document.getElementById('gantt-chart');
            if (svgChart) {
                svgChart.setAttribute('width', '200%');
                try {
                    const todayLine = svgChart.querySelector('.today-highlight');
                    const scrollContainer = svgChart.parentElement;
                    if (todayLine && scrollContainer) {
                        const bbox = todayLine.getBBox();
                        const centerX = bbox.x + (bbox.width / 2);
                        scrollContainer.scrollLeft = centerX - (scrollContainer.clientWidth / 2);
                    }
                } catch(e) {}
            }
            // Apply colors
            tasksToRender.forEach(t => {
                const bars = document.querySelectorAll(`[data-id="${t.id}"] .bar`);
                const progressBars = document.querySelectorAll(`[data-id="${t.id}"] .bar-progress`);
                bars.forEach(bar => bar.style.fill = t.color);
            });
        }, 100);
    }

    function filterTasks(category) {
        // Update Active Button State
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('btn-neutral');
            if (btn.dataset.filter === category) {
                btn.classList.add('btn-neutral');
            }
        });

        let filtered = [];
        if (category === 'all') {
            filtered = allTasksData;
        } else if (category === 'in_progress') {
            // Filter based on color to match visual expectation. 
            // Exclude Green (Completed/100%) and Red (Rejected).
            // Include Blue (Processing) and Yellow (Approval).
            filtered = allTasksData.filter(t => t.color !== '#22c55e' && t.status !== 'rejected');
        } else if (category === 'completed') {
            // Include anything Green (Status completed OR 100% progress)
            filtered = allTasksData.filter(t => t.color === '#22c55e');
        }

        renderGantt(filtered);
    }

    document.addEventListener('DOMContentLoaded', function() {
        allTasksData = <?= json_encode($tasks) ?>;
        renderGantt(allTasksData);
    });
</script>
