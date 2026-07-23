<?php

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Core\App;

class BackupController extends Controller
{
    public function index(Request $request, Response $response)
    {
        $backupDir = storage_path('backups');
        $files = [];
        
        if (is_dir($backupDir)) {
            $rawFiles = scandir($backupDir, SCANDIR_SORT_DESCENDING);
            foreach ($rawFiles as $file) {
                if ($file !== '.' && $file !== '..' && str_ends_with($file, '.sql')) {
                    $path = $backupDir . '/' . $file;
                    $files[] = [
                        'name' => $file,
                        'size' => $this->formatSize(filesize($path)),
                        'date' => date('d/m/Y H:i:s', filemtime($path)),
                        'timestamp' => filemtime($path)
                    ];
                }
            }
        }

        return $this->view('admin/backup', [
            'files' => $files,
            'title' => 'Database Backup'
        ], 'admin');
    }

    public function create(Request $request, Response $response)
    {
        $this->performBackup();
        session()->flashSet('success', 'Backup created successfully.');
        return $this->redirect('/admin/backup');
    }

    public function download(Request $request, Response $response)
    {
        $filename = $request->param('filename');
        $path = storage_path('backups/' . $filename);

        if (file_exists($path)) {
            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . basename($path) . '"');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($path));
            readfile($path);
            exit;
        }

        session()->flashSet('error', 'File not found.');
        return $this->redirect('/admin/backup');
    }

    public function restore(Request $request, Response $response)
    {
        $filename = $request->param('filename');
        $path = storage_path('backups/' . $filename);

        if (!file_exists($path)) {
            session()->flashSet('error', 'Backup file not found.');
            return $this->redirect('/admin/backup');
        }

        // 1. Auto backup current DB
        $this->performBackup('auto_before_restore_');

        // 2. Perform Restore
        $success = $this->performRestore($path);

        if ($success) {
            session()->flashSet('success', 'Database restored successfully. A protective backup was created before replacement.');
        } else {
            session()->flashSet('error', 'Failed to restore database.');
        }

        return $this->redirect('/admin/backup');
    }

    public function delete(Request $request, Response $response)
    {
        $filename = $request->param('filename');
        $path = storage_path('backups/' . $filename);

        if (file_exists($path)) {
            unlink($path);
            session()->flashSet('success', 'Backup deleted.');
        } else {
            session()->flashSet('error', 'File not found.');
        }

        return $this->redirect('/admin/backup');
    }

    public function import(Request $request, Response $response)
    {
        $file = $_FILES['backup_file'] ?? null;

        if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
            session()->flashSet('error', 'Failed to upload file.');
            return $this->redirect('/admin/backup');
        }

        $filename = $file['name'];
        if (!str_ends_with($filename, '.sql')) {
            session()->flashSet('error', 'Only .sql files are allowed.');
            return $this->redirect('/admin/backup');
        }

        // Move to backup dir
        $targetPath = storage_path('backups/' . time() . '_' . $filename);
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            session()->flashSet('success', 'Backup imported and saved to list. You can now restore it.');
        } else {
            session()->flashSet('error', 'Failed to move uploaded file.');
        }

        return $this->redirect('/admin/backup');
    }

    private function performBackup($prefix = '')
    {
        $config = require base_path('config/db.php');
        $filename = $prefix . date('d-M-Y_H-i-s') . '.sql';
        $path = storage_path('backups/' . $filename);

        // We use mysqldump via exec
        // MAMP usually has mysqldump in /Applications/MAMP/Library/bin/mysqldump
        $mysqldump = stripos(PHP_OS, 'WIN') === 0 ? 'mysqldump' : '/Applications/MAMP/Library/bin/mysqldump';
        
        // Check if mysqldump exists at the expected path, if not fallback to 'mysqldump'
        if (!file_exists($mysqldump)) {
            $mysqldump = 'mysqldump';
        }

        $command = sprintf(
            '%s -h %s -P %s -u %s %s %s > %s',
            escapeshellarg($mysqldump),
            escapeshellarg($config['host']),
            escapeshellarg($config['port']),
            escapeshellarg($config['username']),
            $config['password'] ? '-p' . escapeshellarg($config['password']) : '',
            escapeshellarg($config['database']),
            escapeshellarg($path)
        );

        exec($command, $output, $returnCode);

        return $returnCode === 0;
    }

    private function performRestore($path)
    {
        $config = require base_path('config/db.php');
        
        $mysql = stripos(PHP_OS, 'WIN') === 0 ? 'mysql' : '/Applications/MAMP/Library/bin/mysql';
        if (!file_exists($mysql)) {
            $mysql = 'mysql';
        }

        $command = sprintf(
            '%s -h %s -P %s -u %s %s %s < %s',
            escapeshellarg($mysql),
            escapeshellarg($config['host']),
            escapeshellarg($config['port']),
            escapeshellarg($config['username']),
            $config['password'] ? '-p' . escapeshellarg($config['password']) : '',
            escapeshellarg($config['database']),
            escapeshellarg($path)
        );

        exec($command, $output, $returnCode);

        return $returnCode === 0;
    }

    private function formatSize($bytes)
    {
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' B';
        }
    }
}
