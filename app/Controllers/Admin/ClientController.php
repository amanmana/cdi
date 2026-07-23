<?php

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Models\User;

class ClientController extends Controller
{
    public function index(Request $request, Response $response)
    {
        // Fetch users with role 'client'
        $db = \App\Core\App::getInstance()->make('db');
        $clients = $db->fetchAll("
            SELECT u.*, 
            (SELECT COUNT(*) FROM job_requests jr WHERE jr.client_email = u.email) as job_count
            FROM users u 
            WHERE u.role = 'client' 
            ORDER BY u.created_at DESC
        ");
        
        return $this->view('admin/clients/index', [
            'clients' => $clients,
            'title' => 'Client Management'
        ], 'admin');
    }

    public function show(Request $request, Response $response)
    {
        $id = $request->param('id');
        $client = User::find($id);
        
        if (!$client || $client['role'] !== 'client') {
            return $this->view('errors/404', [], 'public', 404);
        }

        $db = \App\Core\App::getInstance()->make('db');
        
        // Fetch job history by email
        $history = $db->fetchAll("
            SELECT jr.*, ws.name as current_step_name 
            FROM job_requests jr
            LEFT JOIN workflow_steps ws ON jr.current_step_id = ws.id
            WHERE jr.client_email = ? 
            ORDER BY jr.created_at DESC
        ", [$client['email']]);

        return $this->view('admin/clients/show', [
            'client' => $client,
            'history' => $history,
            'title' => 'Client Details: ' . $client['name']
        ], 'admin');
    }

    public function edit(Request $request, Response $response)
    {
        $id = $request->param('id');
        $client = User::find($id);
        
        if (!$client || $client['role'] !== 'client') {
            return $this->view('errors/404', [], 'public', 404);
        }

        return $this->view('admin/clients/edit', [
            'client' => $client,
            'title' => 'Edit Client: ' . $client['name']
        ], 'admin');
    }

    public function update(Request $request, Response $response)
    {
        $id = $request->param('id');
        $client = User::find($id);
        
        if (!$client || $client['role'] !== 'client') {
            return $this->view('errors/404', [], 'public', 404);
        }

        $validator = new \App\Core\Validator();
        $rules = [
            'name' => 'required|min:2|max:80',
            'email' => "required|email|max:120|unique:users,email,{$id}",
            'unit' => 'required|max:100', // Clients call it Department/Unit
        ];

        if ($request->input('password')) {
            $rules['password'] = 'min:8';
        }

        $validation = $validator->validate($request->all(), $rules);

        if (!$validation['isValid']) {
            session()->flashSet('errors', $validation['errors']);
            return $this->back();
        }

        $userData = $validation['data'];
        $userData['role'] = 'client';

        User::update($id, $userData);
        session()->flashSet('success', 'Client updated successfully.');
        return $this->redirect('/admin/clients');
    }

    public function delete(Request $request, Response $response)
    {
        $id = $request->param('id');
        $client = User::find($id);
        
        if (!$client || $client['role'] !== 'client') {
            return $this->view('errors/404', [], 'public', 404);
        }

        User::delete($id);
        session()->flashSet('success', 'Client deleted successfully.');
        return $this->redirect('/admin/clients');
    }
}
