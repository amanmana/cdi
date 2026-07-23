<?php

use App\Core\Route;
use App\Middlewares\AuthMiddleware;
use App\Middlewares\RoleMiddleware;
use App\Middlewares\CsrfMiddleware;

// Public Routes
Route::get('/', 'Public\\JobRequestController@create');
Route::get('/job-requests/create', 'Public\\JobRequestController@create');
Route::get('/units/form-schema', 'Public\\JobRequestController@getFormSchema');

Route::get('/job-requests/success', 'Public\\JobRequestController@success');
Route::get('/job-requests/track', 'Public\\JobRequestController@track');
Route::get('/login', 'Auth\\LoginController@show');
Route::get('/register', 'Auth\\RegisterController@show');
Route::get('/forgot-password', 'Auth\\ForgotPasswordController@showLinkRequestForm');
Route::get('/reset-password', 'Auth\\ForgotPasswordController@showResetForm');

Route::group(['middleware' => [CsrfMiddleware::class]], function() {
    Route::post('/job-requests', 'Public\\JobRequestController@store');
    Route::post('/login', 'Auth\\LoginController@login');
    Route::post('/logout', 'Auth\\LoginController@logout');
    Route::post('/register', 'Auth\\RegisterController@register');
    Route::post('/forgot-password', 'Auth\\ForgotPasswordController@sendResetLinkEmail');
    Route::post('/reset-password', 'Auth\\ForgotPasswordController@reset');
});

// Client Project History
Route::get('/my-requests', 'Public\\JobRequestController@myRequests');

// Admin Routes
Route::group(['prefix' => '/admin', 'middleware' => [AuthMiddleware::class, CsrfMiddleware::class]], function() {
    
    Route::get('/', 'Admin\\DashboardController@index');
    Route::get('/dashboard', 'Admin\\DashboardController@index');
    Route::get('/test-email', 'Admin\\DashboardController@testEmail');
    
    // Profile & Settings
    Route::get('/profile', 'Admin\\ProfileController@index');
    Route::get('/profile/settings', 'Admin\\ProfileController@settings');
    Route::post('/profile/settings', 'Admin\\ProfileController@update');

    Route::get('/job-requests', 'Admin\\JobRequestController@index');
    Route::get('/job-requests/{id}', 'Admin\\JobRequestController@show');
    Route::get('/my-reports', 'Admin\\JobStaffReportController@myReports');
    Route::get('/gantt', 'Admin\\GanttController@index');
    Route::post('/job-requests/{id}/delete', 'Admin\\JobRequestController@delete');
    
    // Edit Routes
    Route::post('/job-requests/{id}/update-timeline', 'Admin\\JobRequestController@updateTimeline');
    Route::post('/job-requests/{id}/update-team', 'Admin\\JobRequestController@updateTeam');
    Route::post('/job-requests/{id}/update-description', 'Admin\\JobRequestController@updateDescription');
    
    // Task Invitation (Staff can invite team members)
    Route::post('/job-requests/{id}/invite-staff', 'Admin\\TaskInvitationController@store');

    // Team Management
    Route::get('/team', 'Admin\\TeamController@index');
    Route::get('/team/{id}', 'Admin\\TeamController@show');
    Route::post('/team/store', 'Admin\\TeamController@store');
    Route::post('/team/{id}/update', 'Admin\\TeamController@update');
    Route::post('/team/{id}/delete', 'Admin\\TeamController@delete');
    Route::post('/team/delegation', 'Admin\\TeamController@createDelegation');
    Route::post('/team/delegation/{id}/cancel', 'Admin\\TeamController@cancelDelegation');
    
    Route::get('/team/staff/{id}/reports', 'Admin\\JobStaffReportController@staffReports');
    
    Route::post('/job-requests/{id}/report', 'Admin\\JobStaffReportController@store');
    Route::post('/job-requests/{id}/report/{reportId}/update', 'Admin\\JobStaffReportController@update');
    Route::post('/job-requests/{id}/report/{reportId}/delete', 'Admin\\JobStaffReportController@delete');

    Route::post('/job-requests/{id}/approve', 'Admin\\JobRequestApprovalController@approve');
    Route::post('/job-requests/{id}/reject', 'Admin\\JobRequestApprovalController@reject');
    Route::post('/job-requests/{id}/complete', 'Admin\\JobRequestApprovalController@complete');
    Route::post('/job-requests/{id}/staff-complete', 'Admin\\JobRequestApprovalController@staffComplete');

    // User CRUD (Admin only)
    Route::group(['middleware' => [RoleMiddleware::class . ':admin']], function() {
        Route::get('/users', 'Admin\\UserController@index');
        Route::get('/users/create', 'Admin\\UserController@create');
        Route::post('/users', 'Admin\\UserController@store');
        
        // Clients
        Route::get('/clients', 'Admin\\ClientController@index');
        Route::get('/clients/{id}', 'Admin\\ClientController@show');
        Route::get('/clients/{id}/edit', 'Admin\\ClientController@edit');
        Route::post('/clients/{id}/update', 'Admin\\ClientController@update');
        Route::post('/clients/{id}/delete', 'Admin\\ClientController@delete');

        Route::get('/users/{id}/edit', 'Admin\\UserController@edit');
        Route::post('/users/{id}/update', 'Admin\\UserController@update');
        Route::post('/users/{id}/delete', 'Admin\\UserController@delete');

        // Settings (Admin ONLY)
        Route::get('/settings', 'Admin\\SettingsController@index');
        Route::post('/settings/update', 'Admin\\SettingsController@update');
        Route::post('/settings/units', 'Admin\\SettingsController@storeUnit');
        Route::post('/settings/units/{id}/update', 'Admin\\SettingsController@updateUnit');
        Route::post('/settings/units/{id}/delete', 'Admin\\SettingsController@deleteUnit');

        // Branding (Admin ONLY)
        Route::get('/branding', 'Admin\\SettingsController@branding');
        Route::post('/branding/update', 'Admin\\SettingsController@updateBranding');

        // Backup (Admin ONLY)
        Route::get('/backup', 'Admin\\BackupController@index');
        Route::post('/backup/create', 'Admin\\BackupController@create');
        Route::get('/backup/download/{filename}', 'Admin\\BackupController@download');
        Route::post('/backup/restore/{filename}', 'Admin\\BackupController@restore');
        Route::post('/backup/delete/{filename}', 'Admin\\BackupController@delete');
        Route::post('/backup/import', 'Admin\\BackupController@import');
    });

    // Shared Form Builder (Admin and Manager)
    Route::group(['middleware' => [RoleMiddleware::class . ':admin,manager']], function() {
        Route::get('/units/{id}/form', 'Admin\\SettingsController@formBuilder');
        Route::post('/units/{id}/form', 'Admin\\SettingsController@saveForm');
    });
});
