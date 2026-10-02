<?php
/**
 * Database Configuration - MySQL & PostgreSQL Support
 */

namespace App\Config;

use PDO;
use PDOException;

class Database
{
    private ?PDO $connection = null;
    
    private string $driver;
    private string $host;
    private string $port;
    private string $dbName;
    private string $username;
    private string $password;
    private string $sslMode;

    public function __construct()
    {
        $dbUrl = $_ENV['DATABASE_URL'] ?? getenv('DATABASE_URL');

        // Support for Supabase / Railway / Heroku Connection String (DATABASE_URL)
        if (!empty($dbUrl)) {
            $url = parse_url($dbUrl);
            
            $scheme = strtolower($url['scheme'] ?? '');
            $this->driver = ($scheme === 'postgres' || $scheme === 'postgresql') ? 'pgsql' : 'mysql';
            $this->host = $url['host'] ?? 'localhost';
            $this->port = isset($url['port']) ? (string)$url['port'] : ($this->driver === 'pgsql' ? '5432' : '3306');
            $this->dbName = isset($url['path']) ? ltrim($url['path'], '/') : 'pos_cashier';
            $this->username = isset($url['user']) ? urldecode($url['user']) : 'root';
            $this->password = isset($url['pass']) ? urldecode($url['pass']) : '';
            $this->sslMode = 'require';
        } else {
            // Fallback to individual variables
            $this->driver = $_ENV['DB_CONNECTION'] ?? getenv('DB_CONNECTION') ?: 'mysql';
            $this->host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost';
            $this->port = (string)($_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: ($this->driver === 'pgsql' ? '5432' : '3306'));
            $this->dbName = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'pos_cashier';
            $this->username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root';
            $this->password = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '';
            $this->sslMode = $_ENV['DB_SSL_MODE'] ?? getenv('DB_SSL_MODE') ?: 'disable';
        }
    }

    public function getDriver(): string
    {
        return $this->driver;
    }

    public function getDbName(): string
    {
        return $this->dbName;
    }

    public function getHost(): string
    {
        return $this->host;
    }

    public function getPort(): string
    {
        return $this->port;
    }

    public function getConnection(): PDO
    {
        if ($this->connection === null) {
            try {
                if ($this->driver === 'pgsql') {
                    $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->dbName};";
                    if (!empty($this->sslMode) && $this->sslMode !== 'disable') {
                        $dsn .= "sslmode={$this->sslMode};";
                    }
                } else {
                    $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->dbName};charset=utf8mb4";
                }
                
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];

                if ($this->driver === 'mysql') {
                    $options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES utf8mb4";
                }

                $this->connection = new PDO($dsn, $this->username, $this->password, $options);
            } catch (PDOException $e) {
                // In production, avoid exposing full error details if possible, but keeping it for debugging
                throw new PDOException("Database connection failed: " . $e->getMessage());
            }
        }
        
        return $this->connection;
    }
}
