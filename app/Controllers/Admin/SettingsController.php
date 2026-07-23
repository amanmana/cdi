<?php

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Models\Setting;
use App\Models\Unit;

class SettingsController extends Controller
{
    public function index(Request $request, Response $response)
    {
        // Only super admins
        if (auth()->user()['role'] !== 'admin') {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $allowManagerDelete = Setting::get('allow_manager_delete', '1');
        $units = Unit::all();

        return $this->view('admin/settings', [
            'allowManagerDelete' => $allowManagerDelete,
            'units' => $units,
            'title' => 'System Settings'
        ], 'admin');
    }

    public function update(Request $request, Response $response)
    {
        // Only super admins
        if (auth()->user()['role'] !== 'admin') {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $allowManagerDelete = $request->input('allow_manager_delete', '0');
        Setting::set('allow_manager_delete', $allowManagerDelete);

        session()->flashSet('success', 'Settings updated successfully.');
        return $this->redirect('/admin/settings');
    }

    public function storeUnit(Request $request, Response $response)
    {
        if (auth()->user()['role'] !== 'admin') {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $name = trim($request->input('name'));
        if (empty($name)) {
            session()->flashSet('error', 'Unit name is required.');
            return $this->redirect('/admin/settings');
        }

        if (Unit::findByName($name)) {
            session()->flashSet('error', 'Unit already exists.');
            return $this->redirect('/admin/settings');
        }

        Unit::create($name);
        session()->flashSet('success', 'Unit added successfully.');
        return $this->redirect('/admin/settings');
    }

    public function updateUnit(Request $request, Response $response)
    {
        if (auth()->user()['role'] !== 'admin') {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $id = $request->param('id');
        $name = trim($request->input('name'));
        
        if (empty($name)) {
            session()->flashSet('error', 'Unit name cannot be empty.');
            return $this->redirect('/admin/settings');
        }

        // Check if name taken by another unit
        $existing = Unit::findByName($name);
        if ($existing && $existing['id'] != $id) {
            session()->flashSet('error', 'Unit name already exists.');
            return $this->redirect('/admin/settings');
        }

        Unit::update($id, $name);
        session()->flashSet('success', 'Unit updated successfully.');
        return $this->redirect('/admin/settings');
    }

    public function deleteUnit(Request $request, Response $response)
    {
        if (auth()->user()['role'] !== 'admin') {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $id = $request->param('id');
        Unit::delete($id);
        
        session()->flashSet('success', 'Unit deleted successfully.');
        return $this->redirect('/admin/settings');
    }

    public function formBuilder(Request $request, Response $response)
    {
        $id = $request->param('id');
        $db = \App\Core\App::getInstance()->make('db');
        $unit = $db->fetch("SELECT * FROM units WHERE id = ?", [$id]);

        if (!$unit) {
            session()->flashSet('error', 'Unit not found.');
            return $this->redirect('/admin/dashboard');
        }

        // Check permission: Admin can see all, Manager only their own unit
        $user = auth()->user();
        if ($user['role'] === 'manager' && $user['unit'] !== $unit['name']) {
            return (new Response())->view('errors/403', [], null, 403);
        }

        return $this->view('admin/units/form-builder', [
            'unit' => $unit,
            'title' => 'Form Builder - ' . $unit['name']
        ], 'admin');
    }

    public function saveForm(Request $request, Response $response)
    {
        $id = $request->param('id');
        $formSchema = $request->input('form_schema');
        
        $db = \App\Core\App::getInstance()->make('db');
        $unit = $db->fetch("SELECT * FROM units WHERE id = ?", [$id]);

        if (!$unit) {
            return (new Response())->json(['success' => false, 'message' => 'Unit not found'], 404);
        }

        $user = auth()->user();
        if ($user['role'] === 'manager' && $user['unit'] !== $unit['name']) {
            return (new Response())->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $db->execute("UPDATE units SET form_schema = ? WHERE id = ?", [$formSchema, $id]);

        return (new Response())->json(['success' => true, 'message' => 'Form saved successfully']);
    }

    public function branding(Request $request, Response $response)
    {
        if (auth()->user()['role'] !== 'admin') {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $appName = Setting::get('app_name', 'Mini Framework');
        $footerText = Setting::get('footer_text', 'Mini Framework Micro-Framework');

        return $this->view('admin/branding', [
            'appName' => $appName,
            'footerText' => $footerText,
            'title' => 'Site Branding'
        ], 'admin');
    }

    public function updateBranding(Request $request, Response $response)
    {
        if (auth()->user()['role'] !== 'admin') {
            return (new Response())->view('errors/403', [], null, 403);
        }

        $appName = $request->input('app_name');
        $footerText = $request->input('footer_text');

        Setting::set('app_name', $appName);
        Setting::set('footer_text', $footerText);

        session()->flashSet('success', 'Branding settings updated successfully.');
        return $this->redirect('/admin/branding');
    }
}
