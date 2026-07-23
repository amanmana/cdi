<?php

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Models\User;
use App\Models\Unit;

class UserController extends Controller
{
    public function index(Request $request, Response $response)
    {
        // Filter out clients (managed in ClientController)
        $db = \App\Core\App::getInstance()->make('db');
        $users = $db->fetchAll("SELECT * FROM users WHERE role != 'client' ORDER BY created_at DESC");
        $units = Unit::all();
        
        return $this->view('admin/users/index', [
            'users' => $users,
            'units' => $units,
            'title' => 'User Management'
        ], 'admin');
    }

    public function create(Request $request, Response $response)
    {
        $units = Unit::all();
        return $this->view('admin/users/create', [
            'units' => $units,
            'title' => 'Create New User'
        ], 'admin');
    }

    public function store(Request $request, Response $response)
    {
        $units = Unit::all();
        $unitNames = array_column($units, 'name');

        $validator = new Validator();
        $validation = $validator->validate($request->all(), [
            'name' => 'required|min:2|max:80',
            'email' => 'required|email|max:120|unique:users',
            'password' => 'required|min:8',
            'role' => 'required|in:admin,manager,staff',
            'unit' => 'nullable|in:' . implode(',', $unitNames),
        ]);

        if (!$validation['isValid']) {
            session()->flashSet('errors', $validation['errors']);
            session()->flashSet('old', $request->all());
            return $this->back();
        }

        User::create($validation['data']);
        session()->flashSet('success', 'User created successfully.');
        return $this->redirect('/admin/users');
    }

    public function edit(Request $request, Response $response)
    {
        $id = $request->param('id');
        $user = User::find($id);
        
        if (!$user) return $this->view('errors/404', [], 'public', 404);

        $units = Unit::all();
        return $this->view('admin/users/edit', [
            'user' => $user,
            'units' => $units,
            'title' => 'Edit User'
        ], 'admin');
    }

    public function update(Request $request, Response $response)
    {
        $id = $request->param('id');
        
        $units = Unit::all();
        $unitNames = array_column($units, 'name');
        
        $validator = new Validator();
        
        $rules = [
            'name' => 'required|min:2|max:80',
            'email' => "required|email|max:120|unique:users,email,{$id}",
            'role' => 'required|in:admin,manager,staff',
            'unit' => 'nullable|in:' . implode(',', $unitNames),
        ];

        if ($request->input('password')) {
            $rules['password'] = 'min:8';
        }

        $validation = $validator->validate($request->all(), $rules);

        if (!$validation['isValid']) {
            session()->flashSet('errors', $validation['errors']);
            return $this->back();
        }

        User::update($id, $validation['data']);
        session()->flashSet('success', 'User updated successfully.');
        return $this->redirect('/admin/users');
    }

    public function delete(Request $request, Response $response)
    {
        $id = $request->param('id');
        if ($id == auth()->id()) {
            session()->flashSet('error', 'You cannot delete yourself.');
            return $this->back();
        }

        User::delete($id);
        session()->flashSet('success', 'User deleted successfully.');
        return $this->redirect('/admin/users');
    }
}
