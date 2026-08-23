<?php

declare(strict_types=1);

namespace StockFlow\Helpers;

class Validator
{
    /** @var array<string, string> */
    private array $errors = [];

    /**
     * Validate required fields exist in the data.
     *
     * @param array<string, mixed> $data
     * @param array<string> $fields
     */
    public function required(array $data, array $fields): self
    {
        foreach ($fields as $field) {
            if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
                $this->errors[$field] = "{$field} is required";
            }
        }

        return $this;
    }

    /**
     * Validate a field is a valid email.
     *
     * @param array<string, mixed> $data
     */
    public function email(array $data, string $field): self
    {
        if (isset($data[$field]) && !filter_var($data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = "{$field} must be a valid email address";
        }

        return $this;
    }

    /**
     * Validate a field is numeric.
     *
     * @param array<string, mixed> $data
     */
    public function numeric(array $data, string $field): self
    {
        if (isset($data[$field]) && !is_numeric($data[$field])) {
            $this->errors[$field] = "{$field} must be numeric";
        }

        return $this;
    }

    /**
     * Validate a field is a positive integer.
     *
     * @param array<string, mixed> $data
     */
    public function positiveInteger(array $data, string $field): self
    {
        if (isset($data[$field])) {
            $value = $data[$field];
            if (!is_int($value) || $value <= 0) {
                $this->errors[$field] = "{$field} must be a positive integer";
            }
        }

        return $this;
    }

    /**
     * Validate a field is within allowed values.
     *
     * @param array<string, mixed> $data
     * @param array<string> $allowedValues
     */
    public function in(array $data, string $field, array $allowedValues): self
    {
        if (isset($data[$field]) && !in_array($data[$field], $allowedValues, true)) {
            $this->errors[$field] = "{$field} must be one of: " . implode(', ', $allowedValues);
        }

        return $this;
    }

    /**
     * Validate a field has a minimum string length.
     *
     * @param array<string, mixed> $data
     */
    public function minLength(array $data, string $field, int $min): self
    {
        if (isset($data[$field]) && is_string($data[$field]) && strlen($data[$field]) < $min) {
            $this->errors[$field] = "{$field} must be at least {$min} characters";
        }

        return $this;
    }

    /**
     * Validate a field is an array.
     *
     * @param array<string, mixed> $data
     */
    public function isArray(array $data, string $field): self
    {
        if (isset($data[$field]) && !is_array($data[$field])) {
            $this->errors[$field] = "{$field} must be an array";
        }

        return $this;
    }

    /**
     * Check if validation passed.
     */
    public function passes(): bool
    {
        return empty($this->errors);
    }

    /**
     * Check if validation failed.
     */
    public function fails(): bool
    {
        return !empty($this->errors);
    }

    /**
     * Get validation errors.
     *
     * @return array<string, string>
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Reset validator state.
     */
    public function reset(): self
    {
        $this->errors = [];
        return $this;
    }
}
