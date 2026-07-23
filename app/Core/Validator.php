<?php

namespace App\Core;

class Validator
{
    protected $errors = [];
    protected $db;

    public function __construct()
    {
        $this->db = App::getInstance()->make('db');
    }

    public function validate($data, $rules)
    {
        $this->errors = [];
        $cleanedData = [];

        foreach ($rules as $field => $fieldRules) {
            $value = $data[$field] ?? null;
            $rulesArray = is_array($fieldRules) ? $fieldRules : explode('|', $fieldRules);

            foreach ($rulesArray as $rule) {
                $params = [];
                if (str_contains($rule, ':')) {
                    list($rule, $paramStr) = explode(':', $rule);
                    $params = explode(',', $paramStr);
                }

                $method = 'validate' . ucfirst($rule);
                if (method_exists($this, $method)) {
                    $this->$method($field, $value, $params, $data);
                }
            }
            $cleanedData[$field] = $value;
        }

        return [
            'isValid' => empty($this->errors),
            'errors' => $this->errors,
            'data' => $cleanedData
        ];
    }

    protected function validateRequired($field, $value)
    {
        if (is_null($value) || $value === '') {
            $this->errors[$field][] = "The {$field} field is required.";
        }
    }

    protected function validateEmail($field, $value)
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field][] = "The {$field} must be a valid email address.";
        }
    }

    protected function validateMin($field, $value, $params)
    {
        $min = (int)$params[0];
        if (strlen($value) < $min) {
            $this->errors[$field][] = "The {$field} must be at least {$min} characters.";
        }
    }

    protected function validateMax($field, $value, $params)
    {
        $max = (int)$params[0];
        if (strlen($value) > $max) {
            $this->errors[$field][] = "The {$field} may not be greater than {$max} characters.";
        }
    }

    protected function validateUnique($field, $value, $params)
    {
        $table = $params[0];
        $column = $params[1] ?? $field;
        $exceptId = $params[2] ?? null;

        $sql = "SELECT COUNT(*) as count FROM {$table} WHERE {$column} = ?";
        $sqlParams = [$value];

        if ($exceptId) {
            $sql .= " AND id != ?";
            $sqlParams[] = $exceptId;
        }

        $result = $this->db->fetch($sql, $sqlParams);
        if ($result['count'] > 0) {
            $this->errors[$field][] = "The {$field} has already been taken.";
        }
    }
    
    protected function validateIn($field, $value, $params)
    {
        if (!in_array($value, $params)) {
            $this->errors[$field][] = "The selected {$field} is invalid.";
        }
    }
}
