<?php

namespace App\Controllers\Public;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Models\JobRequest;
use App\Models\Unit;
use App\Core\Approval\WorkflowService;

class JobRequestController extends Controller
{
    public function create(Request $request, Response $response)
    {
        $units = Unit::all();
        return $this->view('public/create', [
            'units' => $units
        ]);
    }

    public function store(Request $request, Response $response)
    {
        $units = Unit::all();
        $unitNames = array_column($units, 'name');
        
        $validator = new Validator();
        $standardFields = ['client_name', 'client_email', 'unit', 'title', '_token'];
        
        $validation = $validator->validate($request->all(), [
            'client_name' => 'required|min:2|max:80',
            'client_email' => 'required|email|max:120',
            'unit' => 'required|in:' . implode(',', $unitNames),
            'title' => 'required|min:3|max:255',
        ]);

        if (!$validation['isValid']) {
            session()->flashSet('errors', $validation['errors']);
            session()->flashSet('old', $request->all());
            return $this->back();
        }

        $email = $validation['data']['client_email'];
        if (!str_ends_with($email, '@mimos.my')) {
            session()->flashSet('error', 'Only @mimos.my email addresses are allowed.');
            session()->flashSet('old', $request->all());
            return $this->back();
        }

        // Collect additional fields (anything not in standardFields)
        $additionalData = [];
        foreach ($request->all() as $key => $value) {
            if (!in_array($key, $standardFields)) {
                $additionalData[$key] = $value;
            }
        }

        $jobData = $validation['data'];
        $jobData['additional_data'] = !empty($additionalData) ? json_encode($additionalData) : null;

        $id = JobRequest::create($jobData);
        
        $workflow = new WorkflowService();
        $workflow->start('job_request', $id, 'JOB_REQUEST_DEFAULT');

        // Fetch the newly created job request to get the ticket_no
        $jobRequest = JobRequest::find($id);

        // --- EMAIL NOTIFICATION FOR MANAGERS ---
        $managers = \App\Models\User::getByUnitAndRole($jobRequest['unit'], 'manager');
        
        if (!empty($managers)) {
            $subject = "New Job Request: [" . $jobRequest['ticket_no'] . "] " . $jobRequest['title'];
            $body = "
                <div style='font-family: sans-serif; line-height: 1.6; color: #333;'>
                    <h2 style='color: #4f46e5;'>New Job Request Received</h2>
                    <p>A new job request has been submitted to your unit (<strong>" . e($jobRequest['unit']) . "</strong>).</p>
                    <table style='width: 100%; border-collapse: collapse; margin-top: 20px;'>
                        <tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;'>Ticket ID</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>" . e($jobRequest['ticket_no']) . "</td></tr>
                        <tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Title</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>" . e($jobRequest['title']) . "</td></tr>
                        <tr><td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Client</td><td style='padding: 8px; border-bottom: 1px solid #eee;'>" . e($jobRequest['client_name']) . " (" . e($jobRequest['client_email']) . ")</td></tr>
                    </table>
                    <div style='margin-top: 30px;'>
                        <a href='" . full_url('/login') . "' style='background: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;'>View in Admin Panel</a>
                    </div>
                </div>
            ";

            foreach ($managers as $manager) {
                \App\Core\Mail::to($manager['email'])
                    ->subject($subject)
                    ->body($body)
                    ->send();
            }
        }
        // ----------------------------------------

        session()->flashSet('job_request_ticket', $jobRequest['ticket_no']);

        return $this->redirect('/job-requests/success');
    }

    public function getFormSchema(Request $request, Response $response)
    {
        $unitName = $request->query('unit');
        $db = \App\Core\App::getInstance()->make('db');
        $unit = $db->fetch("SELECT form_schema FROM units WHERE name = ?", [$unitName]);

        return $response->json([
            'schema' => $unit ? $unit['form_schema'] : '[]'
        ]);
    }

    public function success(Request $request, Response $response)
    {
        return $this->view('public/success', [], 'guest');
    }

    public function track(Request $request, Response $response)
    {
        $ticket = $request->query('id');
        $jobRequest = null;
        $history = [];

        if ($ticket) {
            $jobRequest = JobRequest::findByTicket($ticket);
            if ($jobRequest) {
                $workflow = new WorkflowService();
                $history = $workflow->history('job_request', $jobRequest['id']);
            } else {
                session()->flashSet('error', 'Tracking Number not found.');
            }
        }

        return $this->view('public/track', [
            'jobRequest' => $jobRequest,
            'history' => $history,
            'searchId' => $ticket
        ]);
    }

    public function myRequests(Request $request, Response $response)
    {
        if (!auth()->check()) {
            session()->flashSet('error', 'Please log in to see your project history.');
            return $this->redirect('/login');
        }

        $jobs = JobRequest::all();

        return $this->view('public/my_requests', [
            'jobs' => $jobs
        ]);
    }
}
