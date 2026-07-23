<?php
namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Models\JobRequest;

class GanttController extends Controller {

    public function index() {
        if (!auth()->hasRole(['admin', 'manager'])) {
            return $this->redirect('/admin');
        }

        $allRequests = JobRequest::all();

        // Filter and format data for Gantt Chart
        $ganttData = [];
        $resourceList = [];
        
        foreach ($allRequests as $req) {
            // Only include jobs that have at least a start date or a deadline
            if (!empty($req['start_date']) || !empty($req['deadline'])) {
                
                // Determine start and end dates
                $startDate = !empty($req['start_date']) ? $req['start_date'] : date('Y-m-d', strtotime($req['created_at']));
                // If deadline is missing but start date exists, make it a 1-day event or some default duration
                $endDate = !empty($req['deadline']) ? $req['deadline'] : date('Y-m-d', strtotime($startDate . ' + 7 days'));

                // Calculate progress
                $progress = 0;
                if ($req['status'] === 'completed') {
                    $progress = 100;
                } elseif ($req['status'] === 'staff_processing' && $req['total_staff'] > 0) {
                    $progress = round(($req['completed_staff'] / $req['total_staff']) * 100);
                } elseif ($req['status'] === 'manager_approval') {
                    $progress = 10;
                }

                // Determine color based on status
                $color = match($req['status']) {
                    'completed' => '#22c55e', // green
                    'staff_processing' => '#3b82f6', // blue
                    'manager_approval' => '#eab308', // yellow
                    'rejected' => '#ef4444', // red
                    default => '#94a3b8' // slate
                };
                
                if ($req['status'] === 'staff_processing' && $progress == 100) {
                    $color = '#22c55e'; // Visually completed
                }

                $ganttData[] = [
                    'id' => $req['id'],
                    'name' => 'Job #' . $req['id'] . ': ' . $req['title'],
                    'start' => $startDate,
                    'end' => $endDate,
                    'progress' => $progress,
                    'status' => $req['status'],
                    'custom_class' => 'gantt-bar-' . $req['status'],
                    'color' => $color,
                    'assigned_to' => $req['assigned_staff_name'] ?? 'Unassigned'
                ];
            }
        }

        return $this->view('admin/gantt/index', [
            'tasks' => $ganttData,
            'title' => 'Project Timeline / Gantt'
        ], 'admin');
    }
}
