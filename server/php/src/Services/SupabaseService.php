<?php

declare(strict_types=1);

namespace StockFlow\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class SupabaseService
{
    private Client $client;
    private string $url;
    private string $serviceRoleKey;

    public function __construct(string $url, string $serviceRoleKey)
    {
        $this->url = rtrim($url, '/');
        $this->serviceRoleKey = $serviceRoleKey;

        $this->client = new Client([
            'base_uri' => $this->url,
            'timeout' => 30,
            'headers' => [
                'apikey' => $this->serviceRoleKey,
                'Authorization' => "Bearer {$this->serviceRoleKey}",
                'Content-Type' => 'application/json',
                'Prefer' => 'return=representation',
            ],
        ]);
    }

    /**
     * Query records from a table.
     *
     * @param array<string, string> $filters Key-value pairs for eq filters
     * @return array<mixed>
     */
    public function select(string $table, array $filters = [], ?string $select = null, ?int $limit = null): array
    {
        $query = [];

        if ($select !== null) {
            $query['select'] = $select;
        }

        foreach ($filters as $column => $value) {
            $query[$column] = "eq.{$value}";
        }

        if ($limit !== null) {
            $query['limit'] = (string) $limit;
        }

        try {
            $response = $this->client->get("/rest/v1/{$table}", [
                'query' => $query,
            ]);

            return json_decode($response->getBody()->getContents(), true) ?? [];
        } catch (GuzzleException $e) {
            throw new \RuntimeException("Supabase query failed: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Insert a record into a table.
     *
     * @param array<string, mixed> $data
     * @return array<mixed>
     */
    public function insert(string $table, array $data): array
    {
        try {
            $response = $this->client->post("/rest/v1/{$table}", [
                'json' => $data,
            ]);

            $result = json_decode($response->getBody()->getContents(), true);
            return is_array($result) ? $result : [];
        } catch (GuzzleException $e) {
            throw new \RuntimeException("Supabase insert failed: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Bulk insert multiple records into a table in a single request.
     * PostgREST supports array JSON bodies for batch inserts.
     *
     * @param array<int, array<string, mixed>> $rows Array of records to insert
     * @return array<mixed>
     */
    public function bulkInsert(string $table, array $rows): array
    {
        if (empty($rows)) {
            return [];
        }

        try {
            $response = $this->client->post("/rest/v1/{$table}", [
                'json' => $rows,
            ]);

            $result = json_decode($response->getBody()->getContents(), true);
            return is_array($result) ? $result : [];
        } catch (GuzzleException $e) {
            throw new \RuntimeException("Supabase bulk insert failed: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Update records in a table.
     *
     * @param array<string, mixed> $data
     * @param array<string, string> $filters
     * @return array<mixed>
     */
    public function update(string $table, array $data, array $filters): array
    {
        $query = [];
        foreach ($filters as $column => $value) {
            $query[$column] = "eq.{$value}";
        }

        try {
            $response = $this->client->patch("/rest/v1/{$table}", [
                'query' => $query,
                'json' => $data,
            ]);

            $result = json_decode($response->getBody()->getContents(), true);
            return is_array($result) ? $result : [];
        } catch (GuzzleException $e) {
            throw new \RuntimeException("Supabase update failed: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Delete records from a table.
     *
     * @param array<string, string> $filters
     * @return bool
     */
    public function delete(string $table, array $filters): bool
    {
        $query = [];
        foreach ($filters as $column => $value) {
            $query[$column] = "eq.{$value}";
        }

        try {
            $this->client->delete("/rest/v1/{$table}", [
                'query' => $query,
            ]);

            return true;
        } catch (GuzzleException $e) {
            throw new \RuntimeException("Supabase delete failed: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Call a Supabase RPC function.
     *
     * @param array<string, mixed> $params
     * @return mixed
     */
    public function rpc(string $functionName, array $params = []): mixed
    {
        try {
            $response = $this->client->post("/rest/v1/rpc/{$functionName}", [
                'json' => $params,
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            throw new \RuntimeException("Supabase RPC call failed: {$e->getMessage()}", 0, $e);
        }
    }
}
