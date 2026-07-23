<?php

namespace App\Core;

class View
{
    public static function render($viewName, $data = [], $layout = null)
    {
        $viewPath = base_path("app/Views/{$viewName}.php");
        
        if (!file_exists($viewPath)) {
            throw new \Exception("View {$viewName} not found at {$viewPath}");
        }

        // Prevent path traversal
        if (strpos(realpath($viewPath), realpath(base_path('app/Views'))) !== 0) {
            throw new \Exception("Unauthorized view access");
        }

        if (!isset($data['errors'])) {
            $data['errors'] = session()->flashGet('errors', []);
        }

        extract($data);

        ob_start();
        include $viewPath;
        $content = ob_get_clean();

        // DEBUG
        // var_dump($layout);
        
        if ($layout) {
            $layoutPath = base_path("app/Views/layouts/{$layout}.php");
            if (!file_exists($layoutPath)) {
                throw new \Exception("Layout {$layout} not found");
            }
            ob_start();
            include $layoutPath;
            return ob_get_clean();
        }

        return $content;
    }
}
