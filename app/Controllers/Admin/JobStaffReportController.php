<?php

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Models\JobStaffReport;
use App\Models\JobRequest;

class JobStaffReportController extends Controller
{
    public function store(Request $request, Response $response)
    {
        $id = $request->param('id');
        $text = $request->input('report_text');
        $user = auth()->user();

        if (empty($text)) {
            session()->flashSet('error', 'Report text cannot be empty.');
            return $this->redirect("/admin/job-requests/{$id}");
        }

        JobStaffReport::create([
            'job_request_id' => $id,
            'staff_id' => $user['id'],
            'report_text' => $text
        ]);

        // Log to Activity History
        $workflow = new \App\Core\Approval\WorkflowService();
        $workflow->logAction('job_request', $id, 'report', $user['id'], "Added a progress report: " . $text);

        session()->flashSet('success', 'Report added successfully.');
        return $this->redirect("/admin/job-requests/{$id}");
    }

    public function update(Request $request, Response $response)
    {
        $jobId = $request->param('id');
        $reportId = $request->param('reportId');
        $text = $request->input('report_text');
        $user = auth()->user();

        $report = JobStaffReport::find($reportId);
        if (!$report || ($report['staff_id'] != $user['id'] && $user['role'] !== 'admin')) {
            session()->flashSet('error', 'Unauthorized or report not found.');
            return $this->redirect("/admin/job-requests/{$jobId}");
        }

        JobStaffReport::update($reportId, $text);

        session()->flashSet('success', 'Report updated successfully.');
        return $this->redirect("/admin/job-requests/{$jobId}");
    }

    public function delete(Request $request, Response $response)
    {
        $jobId = $request->param('id');
        $reportId = $request->param('reportId');
        $user = auth()->user();

        $report = JobStaffReport::find($reportId);
        if (!$report || ($report['staff_id'] != $user['id'] && $user['role'] !== 'admin')) {
            session()->flashSet('error', 'Unauthorized or report not found.');
            return $this->redirect("/admin/job-requests/{$jobId}");
        }

        JobStaffReport::delete($reportId);

        session()->flashSet('success', 'Report deleted successfully.');
        return $this->redirect("/admin/job-requests/{$jobId}");
    }

    public function myReports(Request $request, Response $response)
    {
        $user = auth()->user();
        $selectedMonth = $request->query('month');
        
        // Get all available months for tabs
        $db = \App\Core\App::getInstance()->make('db');
        $availableMonths = $db->fetchAll("
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month_key, 
                   DATE_FORMAT(created_at, '%M %Y') as month_label
            FROM job_staff_reports 
            WHERE staff_id = ? 
            GROUP BY month_key, month_label
            ORDER BY month_key DESC
        ", [$user['id']]);

        // Default to the most recent month if none selected
        if (!$selectedMonth && !empty($availableMonths)) {
            $selectedMonth = $availableMonths[0]['month_key'];
        }

        $reports = JobStaffReport::getByJobAndStaff(null, $user['id']);
        
        $grouped = [];
        foreach ($reports as $r) {
            $date = new \DateTime($r['created_at']);
            $reportMonth = $date->format('Y-m');
            
            // Filter by selected month
            if ($selectedMonth && $reportMonth !== $selectedMonth) continue;

            $year = $date->format('Y');
            $week = $date->format('W');
            $key = $year . '-' . $week;
            
            if (!isset($grouped[$key])) {
                $monday = clone $date;
                $monday->setISODate($year, $week, 1);
                $friday = clone $monday;
                $friday->modify('+4 days'); // Business week: Mon-Fri
                
                $label = "Week " . (int)$week . " : ";
                if ($monday->format('F') === $friday->format('F')) {
                    $label .= $monday->format('d') . "–" . $friday->format('d F Y');
                } else {
                    $label .= $monday->format('d F') . " – " . $friday->format('d F Y');
                }
                
                $grouped[$key] = [
                    'label' => $label,
                    'items' => []
                ];
            }
            
            $job = JobRequest::find($r['job_request_id']);
            $r['job_title'] = $job ? $job['title'] : 'Unknown Project';
            $r['ticket_no'] = $job ? $job['ticket_no'] : 'N/A';
            
            $grouped[$key]['items'][] = $r;
        }

        return $this->view('admin/reports/my_reports', [
            'groupedReports' => $grouped,
            'availableMonths' => $availableMonths,
            'selectedMonth' => $selectedMonth,
            'title' => 'My Work Reports'
        ], 'admin');
    }
    public function staffReports(Request $request, Response $response)
    {
        $staffId = $request->param('id');
        $staffUser = \App\Models\User::find($staffId);
        $selectedMonth = $request->query('month');
        
        if (!$staffUser) {
            session()->flashSet('error', 'Staff member not found.');
            return $this->redirect('/admin/team');
        }

        $db = \App\Core\App::getInstance()->make('db');
        $availableMonths = $db->fetchAll("
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month_key, 
                   DATE_FORMAT(created_at, '%M %Y') as month_label
            FROM job_staff_reports 
            WHERE staff_id = ? 
            GROUP BY month_key, month_label
            ORDER BY month_key DESC
        ", [$staffId]);

        if (!$selectedMonth && !empty($availableMonths)) {
            $selectedMonth = $availableMonths[0]['month_key'];
        }

        $reports = JobStaffReport::getByJobAndStaff(null, $staffId);
        
        $grouped = [];
        foreach ($reports as $r) {
            $date = new \DateTime($r['created_at']);
            $reportMonth = $date->format('Y-m');
            
            if ($selectedMonth && $reportMonth !== $selectedMonth) continue;

            $year = $date->format('Y');
            $week = $date->format('W');
            $key = $year . '-' . $week;
            
            if (!isset($grouped[$key])) {
                $monday = clone $date;
                $monday->setISODate($year, $week, 1);
                $friday = clone $monday;
                $friday->modify('+4 days');
                
                $label = "Week " . (int)$week . " : ";
                if ($monday->format('F') === $friday->format('F')) {
                    $label .= $monday->format('d') . "–" . $friday->format('d F Y');
                } else {
                    $label .= $monday->format('d F') . " – " . $friday->format('d F Y');
                }
                
                $grouped[$key] = [
                    'label' => $label,
                    'items' => []
                ];
            }
            
            $job = JobRequest::find($r['job_request_id']);
            $r['job_title'] = $job ? $job['title'] : 'Unknown Project';
            $r['ticket_no'] = $job ? $job['ticket_no'] : 'N/A';
            
            $grouped[$key]['items'][] = $r;
        }

        return $this->view('admin/reports/my_reports', [
            'groupedReports' => $grouped,
            'availableMonths' => $availableMonths,
            'selectedMonth' => $selectedMonth,
            'title' => "Reports: " . $staffUser['name'],
            'isManagerView' => true,
            'staffName' => $staffUser['name']
        ], 'admin');
    }
}
