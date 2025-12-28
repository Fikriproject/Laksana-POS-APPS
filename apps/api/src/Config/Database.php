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
        // Support for Supabase Connection String (DATABASE_URL)
        if (isset($_ENV['DATABASE_URL']) && !empty($_ENV['DATABASE_URL'])) {
            $url = parse_url($_ENV['DATABASE_URL']);
            
            $this->driver = $url['scheme'] === 'postgres' || $url['scheme'] === 'postgresql' ? 'pgsql' : 'mysql';
            $this->host = $url['host'];
            $this->port = $url['port'] ?? '5432';
            $this->dbName = ltrim($url['path'], '/');
            $this->username = $url['user'];
            $this->password = $url['pass'];
            $this->sslMode = 'require';
        } else {
            // Fallback to individual variables
            $this->driver = $_ENV['DB_CONNECTION'] ?? 'mysql';
            $this->host = $_ENV['DB_HOST'] ?? 'localhost';
            $this->port = $_ENV['DB_PORT'] ?? ($this->driver === 'pgsql' ? '5432' : '3306');
            $this->dbName = $_ENV['DB_NAME'] ?? 'pos_cashier';
            $this->username = $_ENV['DB_USER'] ?? 'root';
            $this->password = $_ENV['DB_PASSWORD'] ?? '';
            $this->sslMode = $_ENV['DB_SSL_MODE'] ?? 'disable';
        }
    }

    public function getConnection(): PDO
    {
        if ($this->connection === null) {
            try {
                if ($this->driver === 'pgsql') {
                    $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->dbName};";
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
