-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Waktu pembuatan: 09 Okt 2026 pada 14.31
-- Versi server: 8.0.30
-- Versi PHP: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Basis data: `pos_cashier`
--

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `stock_reports`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `shifts`;
DROP TABLE IF EXISTS `inventory_logs`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

-- --------------------------------------------------------

--
-- Struktur dari tabel `categories`
--

CREATE TABLE `categories` (
  `id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `slug` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `categories`
--

INSERT INTO `categories` (`id`, `name`, `icon`, `slug`, `is_active`, `created_at`) VALUES
(1, 'Peci', 'domino', 'peci', 1, '2026-05-19 12:58:19'),
(2, 'Jam', 'schedule', 'jam', 1, '2026-05-19 12:58:19'),
(3, 'Kertas', 'description', 'kertas', 1, '2026-05-19 12:58:19'),
(4, 'ATK', 'edit', 'atk', 1, '2026-05-19 12:58:19'),
(5, 'Kalkulator', 'calculate', 'kalkulator', 1, '2026-05-19 12:58:19'),
(6, 'Jasa', NULL, 'jasa', 1, '2026-05-20 01:36:29'),
(7, 'Figura', NULL, 'figura', 1, '2026-05-20 04:32:36');

-- --------------------------------------------------------

--
-- Struktur dari tabel `customers`
--

CREATE TABLE `customers` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `loyalty_points` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `expenses`
--

CREATE TABLE `expenses` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `category` enum('Tanah sewa','Arisan','Belanja','Tamu','Infaq','Lainnya') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `expenses`
--

INSERT INTO `expenses` (`id`, `user_id`, `category`, `amount`, `description`, `created_at`) VALUES
('294aabe0-5916-4a56-ac6c-1a3b1ab75752', 'c2bc802f-508b-4a57-8974-9892c5890001', 'Lainnya', 5000.00, 'Beli Es Jelly', '2026-05-29 10:07:47');

-- --------------------------------------------------------

--
-- Struktur dari tabel `inventory_logs`
--

CREATE TABLE `inventory_logs` (
  `id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `supplier_id` char(36) DEFAULT NULL,
  `type` enum('stock_in','stock_out','adjustment','sale') NOT NULL,
  `quantity_change` int NOT NULL,
  `quantity_after` int NOT NULL,
  `reference_number` varchar(50) DEFAULT NULL,
  `notes` text,
  `status` enum('pending','completed') DEFAULT 'completed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `inventory_logs`
--

INSERT INTO `inventory_logs` (`id`, `product_id`, `user_id`, `supplier_id`, `type`, `quantity_change`, `quantity_after`, `reference_number`, `notes`, `status`, `created_at`) VALUES
('0809b2ae-c88e-4fa8-a37b-fb10b7aed42b', 'bc924c42-9397-48b8-9e55-1d8125933eb7', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'stock_in', 1, 1, 'SI-20260602-3B5152', '', 'completed', '2026-06-02 02:47:15'),
('1c5e2b4d-3651-4ff0-ad09-fe95768041ce', '5579f855-95a2-441b-ab6c-c20232232c5c', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 998, '#20260529-0002', 'Sale: Order #20260529-0002', 'completed', '2026-05-29 04:19:10'),
('2187a92d-0888-44cc-be0b-65e4d3e3f8ac', 'f92180f5-9a86-49a5-a123-37e722692e5f', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -1, 5, '#20260701-0001', 'Sale: Order #20260701-0001', 'completed', '2026-07-01 02:28:07'),
('2a0ae9aa-71be-4c64-b730-960a9cde8a28', '6efb5d78-c182-43b9-81f0-a84ed360bd9c', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 3, '#20260607-0001', 'Sale: Order #20260607-0001', 'completed', '2026-06-07 11:44:29'),
('2b80e321-abdb-4319-9f21-8a31cd4319a2', '02fd12dd-83ae-41c9-bcde-daadb2d1bdf8', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -2, 5, '#20260601-0001', 'Sale: Order #20260601-0001', 'completed', '2026-06-01 01:56:33'),
('2eac96db-2805-4c72-993d-00c4e50dfe24', '0579ebb8-75cc-498f-8557-4e771bdac9fb', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -2, 997, '#20260520-0005', 'Sale: Order #20260520-0005', 'completed', '2026-05-20 07:18:47'),
('313d7e96-a2f6-429a-8b23-d89a1af57476', '647071f9-7d65-400f-a07d-5a6618dac916', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 0, '#20260607-0001', 'Sale: Order #20260607-0001', 'completed', '2026-06-07 11:44:29'),
('3bae108e-0643-486a-a8c0-e812e24689e1', '0579ebb8-75cc-498f-8557-4e771bdac9fb', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 990, '#20260602-0001', 'Sale: Order #20260602-0001', 'completed', '2026-06-02 04:30:08'),
('4da34e00-13da-4ed3-83ea-9b26b694d57e', 'bc924c42-9397-48b8-9e55-1d8125933eb7', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -1, 1, '#20260526-0002', 'Sale: Order #20260526-0002', 'completed', '2026-05-26 04:34:55'),
('51861e75-e29b-49ce-942b-1d62b1545081', '647071f9-7d65-400f-a07d-5a6618dac916', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 1, '#20260529-0002', 'Sale: Order #20260529-0002', 'completed', '2026-05-29 04:19:10'),
('5ce5cf05-0a40-4a2c-a74d-b79044118ff3', '1dfee7ce-2674-4ce4-abb0-0c2a05e60b70', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -2, 3, '#20260616-0001', 'Sale: Order #20260616-0001', 'completed', '2026-06-16 13:17:19'),
('620b3ece-bd0b-4e60-b524-cdf651c7088b', '3d6b696f-f20a-4cad-a224-8e49432a2925', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 0, '#20260520-0002', 'Sale: Order #20260520-0002', 'completed', '2026-05-20 05:13:28'),
('6399131f-0f61-492f-bee8-7e78f9559e7f', '448e38c4-0e23-4b86-a879-805f3bafea70', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 1, '#20260601-0002', 'Sale: Order #20260601-0002', 'completed', '2026-06-01 01:57:00'),
('6acb8166-09a9-441d-b1d4-ddfa989ad1bb', '4b1faf54-5d0b-44d9-b23a-e49283a80bfc', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 3, '#20260520-0003', 'Sale: Order #20260520-0003', 'completed', '2026-05-20 05:18:42'),
('70c3effe-682c-479a-9008-aa8bebd970be', '32ca8640-c108-4c51-a82e-5768f023272a', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -1, 998, '#20260525-0001', 'Sale: Order #20260525-0001', 'completed', '2026-05-25 11:25:43'),
('79410509-fbf1-4851-b778-7fae26b31c4d', '0579ebb8-75cc-498f-8557-4e771bdac9fb', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -2, 995, '#20260525-0001', 'Sale: Order #20260525-0001', 'completed', '2026-05-25 11:25:43'),
('7be6f43e-c0c6-40ee-a849-d54ca49eed49', '084ccc68-9b54-4965-b70a-6f245729f96b', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -1, 9, '#20260520-0004', 'Sale: Order #20260520-0004', 'completed', '2026-05-20 06:44:53'),
('809edf7d-b1d6-4702-8e0e-36b1ddbc60e1', '084ccc68-9b54-4965-b70a-6f245729f96b', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -5, 11, '#20260520-0001', 'Sale: Order #20260520-0001', 'completed', '2026-05-20 05:12:05'),
('80faf2ad-3bf4-4177-88ec-02768e53f0ab', '961c732f-56da-4522-ac15-aab465c1132e', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -1, 8, '#20260601-0005', 'Sale: Order #20260601-0005', 'completed', '2026-06-01 13:06:30'),
('8bd9ebd1-b3e5-48ef-be91-005752747ff2', '961c732f-56da-4522-ac15-aab465c1132e', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 7, '#20260607-0001', 'Sale: Order #20260607-0001', 'completed', '2026-06-07 11:44:29'),
('93e6ded5-28ec-4b6b-9642-5127a514c339', 'bc924c42-9397-48b8-9e55-1d8125933eb7', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 0, '#20260531-0001', 'Sale: Order #20260531-0001', 'completed', '2026-05-31 07:35:52'),
('93ea5c6e-fa86-454b-84ea-4dea70ed268e', '0579ebb8-75cc-498f-8557-4e771bdac9fb', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -4, 991, '#20260601-0004', 'Sale: Order #20260601-0004', 'completed', '2026-06-01 06:12:50'),
('a18c921a-f4a5-40a0-b16c-d67e05c08df1', '961c732f-56da-4522-ac15-aab465c1132e', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -2, 10, '#20260524-0001', 'Sale: Order #20260524-0001', 'completed', '2026-05-24 07:54:15'),
('a930fbdf-8eca-4235-a25f-4458fa8193e2', '02fd12dd-83ae-41c9-bcde-daadb2d1bdf8', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -2, 2, '#20260607-0001', 'Sale: Order #20260607-0001', 'completed', '2026-06-07 11:44:29'),
('b7a5b76a-4474-455c-9bd0-d850672c653c', '4991da58-3df7-4a65-b7af-61ce53d71b18', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -2, 997, '#20260607-0001', 'Sale: Order #20260607-0001', 'completed', '2026-06-07 11:44:29'),
('b7c77b24-00ad-45b1-bef9-8b0f531a7a68', 'd6cddfc2-8dac-419d-a025-2b4bf58f6304', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -4, 995, '#20260627-0001', 'Sale: Order #20260627-0001', 'completed', '2026-06-27 12:31:25'),
('ba3c665d-6d34-4e9d-be07-8068d7b53e4c', '32ca8640-c108-4c51-a82e-5768f023272a', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -1, 997, '#20260627-0001', 'Sale: Order #20260627-0001', 'completed', '2026-06-27 12:31:25'),
('bb9361db-47a6-4005-9e8b-8bedade37cbb', '4a2b910c-52d9-4dbc-a40e-5c47f63b6ea1', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -1, 19, '#20260530-0001', 'Sale: Order #20260530-0001', 'completed', '2026-05-30 01:26:29'),
('bf46b80b-ef58-48be-b458-3b3b0e5412ae', '961c732f-56da-4522-ac15-aab465c1132e', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 9, '#20260531-0001', 'Sale: Order #20260531-0001', 'completed', '2026-05-31 07:35:52'),
('c75e933e-da04-45b5-bd71-2ce8801d1ad0', 'f92180f5-9a86-49a5-a123-37e722692e5f', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 6, '#20260529-0003', 'Sale: Order #20260529-0003', 'completed', '2026-05-29 09:48:54'),
('c838449e-71b8-4592-b3d2-3c5c87c875a8', '489ae3c7-76ba-470d-a7a5-5d9dad5d2de2', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'stock_out', -1, 3, 'SO-20260602-1E1A39', 'terjual salah input barang di harga yang sama', 'completed', '2026-06-02 02:48:17'),
('ce43dca8-ba42-4fe7-a292-8b7443992ff6', '4fdfd6cc-eaf3-4582-9ed3-fbd11e8cc439', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 2, '#20260607-0001', 'Sale: Order #20260607-0001', 'completed', '2026-06-07 11:44:29'),
('d13ff504-829b-470b-b3d9-cbef8d829842', '43a94f7f-5dbe-48d4-9951-ad74732a978b', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -1, 998, '#20260529-0001', 'Sale: Order #20260529-0001', 'completed', '2026-05-29 03:44:32'),
('e5c31cc6-399f-4743-aaf9-c0d6e6868c8b', '3d6b696f-f20a-4cad-a224-8e49432a2925', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 4, '#20260601-0001', 'Sale: Order #20260601-0001', 'completed', '2026-06-01 01:56:33'),
('e7de8803-f264-41d2-8d57-68d7a4a08cab', '961c732f-56da-4522-ac15-aab465c1132e', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 6, '#20260616-0001', 'Sale: Order #20260616-0001', 'completed', '2026-06-16 13:17:19'),
('ea76e6dd-7a6f-4e6d-8c9e-314c6649e633', '43a94f7f-5dbe-48d4-9951-ad74732a978b', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -2, 996, '#20260627-0001', 'Sale: Order #20260627-0001', 'completed', '2026-06-27 12:31:25'),
('eb84b93d-a94b-4d9a-81ff-11680e050e89', '4a2b910c-52d9-4dbc-a40e-5c47f63b6ea1', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -2, 17, '#20260607-0001', 'Sale: Order #20260607-0001', 'completed', '2026-06-07 11:44:29'),
('ee3f44bc-36da-4d7c-a413-b5931e5870a9', '0579c839-3c8a-4fea-9170-3ac6b8731b24', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -2, 48, '#20260526-0001', 'Sale: Order #20260526-0001', 'completed', '2026-05-26 04:33:42'),
('f43950c3-8c8d-4cc0-b43b-844ee7d0ca6c', '0579ebb8-75cc-498f-8557-4e771bdac9fb', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -4, 986, '#20260607-0001', 'Sale: Order #20260607-0001', 'completed', '2026-06-07 11:44:29'),
('f66b4066-c7ce-4a50-80f3-f45757b1eaba', '815be1d0-107f-4921-8192-bd5850c22a64', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 98, '#20260531-0001', 'Sale: Order #20260531-0001', 'completed', '2026-05-31 07:35:52'),
('fb598474-1ee8-4a48-8665-8b8c11ad9904', '3665ad78-25c4-4708-a6bd-c46500dab460', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, 'sale', -2, 997, '#20260627-0001', 'Sale: Order #20260627-0001', 'completed', '2026-06-27 12:31:25'),
('fb8e2b9b-c5d0-4478-b989-80cb1917cd7e', '02fd12dd-83ae-41c9-bcde-daadb2d1bdf8', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, 'sale', -1, 4, '#20260601-0003', 'Sale: Order #20260601-0003', 'completed', '2026-06-01 02:44:37');

-- --------------------------------------------------------

--
-- Struktur dari tabel `orders`
--

CREATE TABLE `orders` (
  `id` char(36) NOT NULL,
  `order_number` varchar(20) NOT NULL,
  `user_id` char(36) NOT NULL,
  `customer_id` char(36) DEFAULT NULL,
  `shift_id` char(36) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `amount_paid` decimal(15,2) NOT NULL DEFAULT '0.00',
  `payment_method` enum('cash','card','e-wallet','other') NOT NULL,
  `status` enum('pending','completed','refunded','cancelled') DEFAULT 'completed',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `user_id`, `customer_id`, `shift_id`, `subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `amount_paid`, `payment_method`, `status`, `notes`, `created_at`) VALUES
('007141da-ca04-4e43-b530-66f526ae7f9f', '#20260601-0001', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 57000.00, 0.00, 0.00, 57000.00, 57000.00, 'cash', 'completed', NULL, '2026-06-01 01:56:33'),
('05c96c60-5609-4345-bfda-bb923dab9e90', '#20260520-0004', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, NULL, 44000.00, 0.00, 0.00, 44000.00, 44000.00, 'cash', 'completed', NULL, '2026-05-20 06:44:53'),
('072aaf4d-699b-44e3-be5a-d07f0ce78d0f', '#20260520-0002', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 27000.00, 0.00, 0.00, 27000.00, 27000.00, 'cash', 'completed', NULL, '2026-05-20 05:13:28'),
('08fc103c-25c8-4907-98fd-5d6d9c55266e', '#20260529-0003', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 6000.00, 0.00, 0.00, 6000.00, 6000.00, 'cash', 'completed', NULL, '2026-05-29 09:48:54'),
('0a265e24-4301-44c8-92d9-991299e0cc56', '#20260520-0003', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 80000.00, 0.00, 5000.00, 75000.00, 75000.00, 'cash', 'completed', NULL, '2026-05-20 05:18:42'),
('122fe236-fa5f-4483-b61e-de3b5e1c8579', '#20260520-0005', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 2000.00, 0.00, 0.00, 2000.00, 2000.00, 'cash', 'completed', NULL, '2026-05-20 07:18:47'),
('1248aa00-edde-4916-a13f-45f7e9971902', '#20260526-0002', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, NULL, 35000.00, 0.00, 0.00, 35000.00, 35000.00, 'cash', 'completed', NULL, '2026-05-26 04:34:55'),
('1a72791d-6828-483d-b583-5884ce9aa1ed', '#20260601-0003', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 15000.00, 0.00, 0.00, 15000.00, 15000.00, 'cash', 'completed', NULL, '2026-06-01 02:44:37'),
('1afc7457-7057-463c-9461-4561b6c830b7', '#20260529-0002', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 18000.00, 0.00, 0.00, 18000.00, 18000.00, 'cash', 'completed', NULL, '2026-05-29 04:19:10'),
('1e73c795-f896-4e30-aafe-de3715fff701', '#20260601-0005', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, NULL, 65000.00, 0.00, 5000.00, 60000.00, 60000.00, 'cash', 'completed', NULL, '2026-06-01 13:06:30'),
('2ed53dfb-3049-4a6f-ae12-ce8d6aa7f08a', '#20260520-0001', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 220000.00, 0.00, 10000.00, 210000.00, 210000.00, 'cash', 'completed', NULL, '2026-05-20 05:12:05'),
('3807f13f-8c9b-4912-b8bc-be790f27ca97', '#20260525-0001', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, NULL, 5000.00, 0.00, 0.00, 5000.00, 5000.00, 'cash', 'completed', NULL, '2026-05-25 11:25:43'),
('3edc58a9-92db-4492-8b4f-bb45ed9b604c', '#20260601-0004', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 6000.00, 0.00, 1000.00, 5000.00, 5000.00, 'cash', 'completed', NULL, '2026-06-01 06:12:50'),
('4e976352-b1e4-4f19-966c-34796a186f19', '#20260530-0001', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, NULL, 17000.00, 0.00, 0.00, 17000.00, 17000.00, 'cash', 'completed', NULL, '2026-05-30 01:26:29'),
('6a64949c-5213-476d-a660-ceb231066dd1', '#20260601-0002', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 70000.00, 0.00, 0.00, 70000.00, 70000.00, 'cash', 'completed', NULL, '2026-06-01 01:57:00'),
('93c4b8c9-52b0-4e34-afc3-9ee30bf6cc2c', '#20260531-0001', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 106000.00, 0.00, 5000.00, 101000.00, 101000.00, 'cash', 'completed', NULL, '2026-05-31 07:35:52'),
('982d8bfc-73ef-4ff8-b75f-ed8076447cf0', '#20260701-0001', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, NULL, 6000.00, 0.00, 0.00, 6000.00, 6000.00, 'cash', 'completed', NULL, '2026-07-01 02:28:07'),
('a2b89e14-6144-4d83-b778-7ca4c3711bb0', '#20260524-0001', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, NULL, 130000.00, 0.00, 10000.00, 120000.00, 120000.00, 'cash', 'completed', NULL, '2026-05-24 07:54:15'),
('a598b7e8-e3b7-4fbf-8fb7-1df39286a2ef', '#20260526-0001', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, NULL, 12000.00, 0.00, 0.00, 12000.00, 12000.00, 'cash', 'completed', NULL, '2026-05-26 04:33:42'),
('af33064b-fbb9-4986-8f3a-e3373bd11c2c', '#20260602-0001', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 1500.00, 0.00, 0.00, 1500.00, 1500.00, 'cash', 'completed', NULL, '2026-06-02 04:30:08'),
('d3a901bc-e5ed-444f-bd55-bd56af010b94', '#20260616-0001', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 125000.00, 0.00, 0.00, 125000.00, 125000.00, 'cash', 'completed', NULL, '2026-06-16 13:17:19'),
('e3f980a4-b50a-4daf-982c-643bad60a35e', '#20260529-0001', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, NULL, 5000.00, 0.00, 0.00, 5000.00, 5000.00, 'cash', 'completed', NULL, '2026-05-29 03:44:32'),
('f2a5486c-d2fc-4728-bd9d-744ffd7d8459', '#20260607-0001', 'c2bc802f-508b-4a57-8974-9892c5890001', NULL, NULL, 286000.00, 0.00, 11000.00, 275000.00, 275000.00, 'cash', 'completed', NULL, '2026-06-07 11:44:29'),
('fb37a5ac-8e73-4c77-8745-5b045c57c4b8', '#20260627-0001', 'c2bc802f-508b-4a57-8974-9892c5890002', NULL, NULL, 20000.00, 0.00, 0.00, 20000.00, 20000.00, 'cash', 'completed', NULL, '2026-06-27 12:31:25');

-- --------------------------------------------------------

--
-- Struktur dari tabel `order_items`
--

CREATE TABLE `order_items` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `purchase_price` decimal(10,2) DEFAULT '0.00',
  `quantity` int NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `unit_price`, `purchase_price`, `quantity`, `subtotal`) VALUES
('06b4d2a3-0b70-4540-a807-18863e237fa2', '93c4b8c9-52b0-4e34-afc3-9ee30bf6cc2c', 'bc924c42-9397-48b8-9e55-1d8125933eb7', 'Kalkulator CC-90', 35000.00, 22000.00, 1, 35000.00),
('09c6a60e-61a2-44b3-bcac-68ca20fecab6', '007141da-ca04-4e43-b530-66f526ae7f9f', '02fd12dd-83ae-41c9-bcde-daadb2d1bdf8', 'Figura 5R', 15000.00, 9000.00, 2, 30000.00),
('0c0237bd-9e1c-4f9b-ad2f-03fc76da7db3', '6a64949c-5213-476d-a660-ceb231066dd1', '448e38c4-0e23-4b86-a879-805f3bafea70', 'Kalkulator CC-23CO', 70000.00, 34000.00, 1, 70000.00),
('162328c6-693d-4f0b-9795-2787c43968f2', '1a72791d-6828-483d-b583-5884ce9aa1ed', '02fd12dd-83ae-41c9-bcde-daadb2d1bdf8', 'Figura 5R', 15000.00, 9000.00, 1, 15000.00),
('197049f9-99a5-46c9-872b-e6914207cbee', '4e976352-b1e4-4f19-966c-34796a186f19', '4a2b910c-52d9-4dbc-a40e-5c47f63b6ea1', 'Undangan Nikah', 17000.00, 12500.00, 1, 17000.00),
('1b509d5d-072f-4d69-a757-edb5a3c35d33', '3807f13f-8c9b-4912-b8bc-be790f27ca97', '0579ebb8-75cc-498f-8557-4e771bdac9fb', 'Print Text Warna Satuan', 1500.00, 0.00, 2, 3000.00),
('1f12f2bf-d6cd-4a73-be10-d0ba34afa410', '1afc7457-7057-463c-9461-4561b6c830b7', '647071f9-7d65-400f-a07d-5a6618dac916', 'Paper Bag', 9000.00, 6000.00, 1, 9000.00),
('22b3c289-1a9b-4662-a53c-d26564fd5862', '982d8bfc-73ef-4ff8-b75f-ed8076447cf0', 'f92180f5-9a86-49a5-a123-37e722692e5f', 'Celengan Besar', 6000.00, 4000.00, 1, 6000.00),
('2383fd65-7296-423f-8927-96bc802af6d6', '007141da-ca04-4e43-b530-66f526ae7f9f', '3d6b696f-f20a-4cad-a224-8e49432a2925', 'Figura A4', 27000.00, 15500.00, 1, 27000.00),
('2556a1dc-0fc0-4ef4-8dee-f713b0090a4e', '05c96c60-5609-4345-bfda-bb923dab9e90', '084ccc68-9b54-4965-b70a-6f245729f96b', 'HVS A4 Copy Paper', 44000.00, 36000.00, 1, 44000.00),
('27790cca-6e9b-4a31-a445-16fcde003922', 'fb37a5ac-8e73-4c77-8745-5b045c57c4b8', '3665ad78-25c4-4708-a6bd-c46500dab460', 'Cetak 4 Foto 2x3cm ', 2000.00, 0.00, 2, 4000.00),
('2c49b027-2142-439d-b342-d330526ad888', 'fb37a5ac-8e73-4c77-8745-5b045c57c4b8', '32ca8640-c108-4c51-a82e-5768f023272a', 'Jasa Edit Foto', 2000.00, 0.00, 1, 2000.00),
('3bd0a914-0381-4717-98a9-9d627329cfb6', '1248aa00-edde-4916-a13f-45f7e9971902', 'bc924c42-9397-48b8-9e55-1d8125933eb7', 'Kalkulator CC-90', 35000.00, 22000.00, 1, 35000.00),
('3dcfc903-d5f7-4616-a1bb-23b4f70039b7', 'd3a901bc-e5ed-444f-bd55-bd56af010b94', '1dfee7ce-2674-4ce4-abb0-0c2a05e60b70', 'Peci Diamor', 30000.00, 15000.00, 2, 60000.00),
('4324554b-74d8-43a4-adf2-7646ac8a2049', 'e3f980a4-b50a-4daf-982c-643bad60a35e', '43a94f7f-5dbe-48d4-9951-ad74732a978b', 'Cetak 6 Foto 3x4cm', 5000.00, 0.00, 1, 5000.00),
('497bc8a8-502a-4abe-bded-beb364606928', '93c4b8c9-52b0-4e34-afc3-9ee30bf6cc2c', '815be1d0-107f-4921-8192-bd5850c22a64', 'Paper Bag Sedang', 6000.00, 3000.00, 1, 6000.00),
('4a7116eb-7282-4120-9fa2-739132aedbb4', 'a598b7e8-e3b7-4fbf-8fb7-1df39286a2ef', '0579c839-3c8a-4fea-9170-3ac6b8731b24', 'Sterofoam', 6000.00, 4000.00, 2, 12000.00),
('5579f414-54ea-4175-8e62-2d3421bbbf92', '1e73c795-f896-4e30-aafe-de3715fff701', '961c732f-56da-4522-ac15-aab465c1132e', 'Peci Aswad', 65000.00, 50000.00, 1, 65000.00),
('55e803bb-4a72-4259-8731-d9817f9c9fe8', 'f2a5486c-d2fc-4728-bd9d-744ffd7d8459', '4a2b910c-52d9-4dbc-a40e-5c47f63b6ea1', 'Undangan Nikah', 17000.00, 12500.00, 2, 34000.00),
('5f32d554-a41a-4374-b06f-b7e573fc7f8d', '0a265e24-4301-44c8-92d9-991299e0cc56', '4b1faf54-5d0b-44d9-b23a-e49283a80bfc', 'Jam Besar', 80000.00, 60000.00, 1, 80000.00),
('61289e5e-0c48-4e70-b78f-fbf91748f7fa', 'f2a5486c-d2fc-4728-bd9d-744ffd7d8459', '4991da58-3df7-4a65-b7af-61ce53d71b18', 'Print Text Saja satuan', 1000.00, 0.00, 2, 2000.00),
('68bae85b-d5bb-4ccf-9bb3-07257acd70b5', 'a2b89e14-6144-4d83-b778-7ca4c3711bb0', '961c732f-56da-4522-ac15-aab465c1132e', 'Peci Aswad', 65000.00, 50000.00, 2, 130000.00),
('7714c66b-1d33-444e-9f91-06dcba743f4c', 'f2a5486c-d2fc-4728-bd9d-744ffd7d8459', '02fd12dd-83ae-41c9-bcde-daadb2d1bdf8', 'Figura 5R', 15000.00, 9000.00, 2, 30000.00),
('781743eb-6479-4035-bea6-7e8a67ae9f91', 'f2a5486c-d2fc-4728-bd9d-744ffd7d8459', '647071f9-7d65-400f-a07d-5a6618dac916', 'Paper Bag', 9000.00, 6000.00, 1, 9000.00),
('7c94db48-15a0-4ddb-ac18-ffcf6105a4f0', 'af33064b-fbb9-4986-8f3a-e3373bd11c2c', '0579ebb8-75cc-498f-8557-4e771bdac9fb', 'Print Text Warna Satuan', 1500.00, 0.00, 1, 1500.00),
('80b2772c-9572-4668-8c89-836f87df1f40', 'f2a5486c-d2fc-4728-bd9d-744ffd7d8459', '0579ebb8-75cc-498f-8557-4e771bdac9fb', 'Print Text Warna Satuan', 1500.00, 0.00, 4, 6000.00),
('87e3daed-58aa-44c1-979f-21d519df6bdb', '93c4b8c9-52b0-4e34-afc3-9ee30bf6cc2c', '961c732f-56da-4522-ac15-aab465c1132e', 'Peci Aswad', 65000.00, 50000.00, 1, 65000.00),
('94e35a21-75b1-458f-bcc3-00df781955dc', '3807f13f-8c9b-4912-b8bc-be790f27ca97', '32ca8640-c108-4c51-a82e-5768f023272a', 'Jasa Edit Foto', 2000.00, 0.00, 1, 2000.00),
('99004619-2486-4c87-8705-7affea812380', 'fb37a5ac-8e73-4c77-8745-5b045c57c4b8', 'd6cddfc2-8dac-419d-a025-2b4bf58f6304', 'Cetak Foto 4x6', 1000.00, 0.00, 4, 4000.00),
('a1c750c0-fe47-480d-81c8-aa3c691ac6fc', '3edc58a9-92db-4492-8b4f-bb45ed9b604c', '0579ebb8-75cc-498f-8557-4e771bdac9fb', 'Print Text Warna Satuan', 1500.00, 0.00, 4, 6000.00),
('ab72d4b1-4015-43fd-a597-30ce06bb012a', 'f2a5486c-d2fc-4728-bd9d-744ffd7d8459', '6efb5d78-c182-43b9-81f0-a84ed360bd9c', 'Kalkulator CC-40', 65000.00, 37000.00, 1, 65000.00),
('afde139b-b641-487c-ad77-85261a9a3ad7', '08fc103c-25c8-4907-98fd-5d6d9c55266e', 'f92180f5-9a86-49a5-a123-37e722692e5f', 'Celengan Besar', 6000.00, 4000.00, 1, 6000.00),
('b01d462f-3559-493c-a45d-c823dafc1292', '1afc7457-7057-463c-9461-4561b6c830b7', '5579f855-95a2-441b-ab6c-c20232232c5c', 'Full Foto Ukuran A4', 9000.00, 0.00, 1, 9000.00),
('c407d598-a6a1-4bb6-a54f-044ef0edc0e1', 'f2a5486c-d2fc-4728-bd9d-744ffd7d8459', '961c732f-56da-4522-ac15-aab465c1132e', 'Peci Aswad', 65000.00, 50000.00, 1, 65000.00),
('c9d4c890-7421-4d07-9045-7f8369fc513d', '2ed53dfb-3049-4a6f-ae12-ce8d6aa7f08a', '084ccc68-9b54-4965-b70a-6f245729f96b', 'HVS A4 Copy Paper', 44000.00, 36000.00, 5, 220000.00),
('d4532739-af7e-41e7-b0d3-cf4ef083d1be', 'd3a901bc-e5ed-444f-bd55-bd56af010b94', '961c732f-56da-4522-ac15-aab465c1132e', 'Peci Aswad', 65000.00, 50000.00, 1, 65000.00),
('e5c0f698-c03b-4423-93ad-f1760c04d948', '122fe236-fa5f-4483-b61e-de3b5e1c8579', '0579ebb8-75cc-498f-8557-4e771bdac9fb', 'Print Text Warna Satuan', 1000.00, 0.00, 2, 2000.00),
('e63505da-e631-4a1e-9566-2d3ff31856f3', 'fb37a5ac-8e73-4c77-8745-5b045c57c4b8', '43a94f7f-5dbe-48d4-9951-ad74732a978b', 'Cetak 6 Foto 3x4cm', 5000.00, 0.00, 2, 10000.00),
('e9e582ff-e254-4ea8-b99d-b10e6bca5b30', 'f2a5486c-d2fc-4728-bd9d-744ffd7d8459', '4fdfd6cc-eaf3-4582-9ed3-fbd11e8cc439', 'Kalkulator CC-49', 75000.00, 57500.00, 1, 75000.00),
('feecd69d-9579-41f7-8e4f-35cdc011506a', '072aaf4d-699b-44e3-be5a-d07f0ce78d0f', '3d6b696f-f20a-4cad-a224-8e49432a2925', 'Figura A4', 27000.00, 15500.00, 1, 27000.00);

-- --------------------------------------------------------

--
-- Struktur dari tabel `products`
--

CREATE TABLE `products` (
  `id` char(36) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `purchase_price` decimal(10,2) DEFAULT '0.00',
  `stock_quantity` int DEFAULT '0',
  `low_stock_threshold` int DEFAULT '10',
  `category_id` int DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `products`
--

INSERT INTO `products` (`id`, `sku`, `name`, `description`, `price`, `purchase_price`, `stock_quantity`, `low_stock_threshold`, `category_id`, `image_url`, `is_active`, `created_at`, `updated_at`) VALUES
('02fd12dd-83ae-41c9-bcde-daadb2d1bdf8', 'SKU-FIG-06A7D', 'Figura 5R', NULL, 15000.00, 9000.00, 2, 10, 7, '/uploads/img_6a0d37e0d441b6.90300160.jpg', 1, '2026-05-20 04:04:33', '2026-06-07 04:44:29'),
('0579c839-3c8a-4fea-9170-3ac6b8731b24', 'SKU-ATK-STF', 'Sterofoam', NULL, 6000.00, 4000.00, 48, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a0d3f399076e5.60639682.jpg', 1, '2026-05-19 12:58:19', '2026-05-25 21:33:42'),
('0579ebb8-75cc-498f-8557-4e771bdac9fb', 'SKU-PRI-57DD4', 'Print Text Warna Satuan', NULL, 1500.00, 0.00, 986, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a127545704172.53087410.png', 1, '2026-05-20 07:18:36', '2026-06-07 04:44:29'),
('084ccc68-9b54-4965-b70a-6f245729f96b', 'SKU-KER-A4', 'HVS A4 Copy Paper', NULL, 44000.00, 36000.00, 9, 10, 3, '/uploads/img_6a0d392acfdb55.67035427.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 23:44:53'),
('0bab540e-caa4-4688-840c-3f0925cf0c0b', 'SKU-KER-FOL', 'Kertas Folio 1Rbx3L', NULL, 1000.00, 540.00, 999, 10, 3, '/uploads/img_6a0d3fac7103a5.10846682.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 22:20:37'),
('0cd5fd6f-156e-4f8c-924e-129d3d20f0e8', 'SKU-CET-6828C', 'Cetak Foto 2R (6x9cm)', NULL, 1500.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c6a8bf653.89207024.png', 1, '2026-05-20 04:42:16', '2026-05-19 21:45:32'),
('16e3554b-1c29-4bcd-a918-7a7c1f7d271f', 'SKU-PRI-8E05B', 'Print Text Saja >20Lembar', NULL, 500.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a127512ce9834.76915484.png', 1, '2026-05-23 12:01:17', '2026-05-23 20:48:37'),
('1adb7e82-17aa-497d-9b96-fbb7b1d9798e', 'SKU-FUL-E79A4', 'Full Foto Ukuran F4', NULL, 10000.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c90d1f893.61933744.png', 1, '2026-05-20 04:45:07', '2026-05-19 21:46:09'),
('1dfee7ce-2674-4ce4-abb0-0c2a05e60b70', 'SKU-PEC-DIA', 'Peci Diamor', NULL, 30000.00, 15000.00, 3, 10, 1, '/uploads/img_6a0d3fecb17737.99114687.jpg', 1, '2026-05-19 12:58:19', '2026-06-16 06:17:19'),
('2bc7ce81-8b87-45ab-97d8-c9c8b98cea21', 'SKU-CET-C7215', 'Cetak Foto 4R (10,2x15,2cm)', NULL, 4000.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c76bbcfd6.90363232.png', 1, '2026-05-20 04:43:42', '2026-05-19 21:45:43'),
('32ca8640-c108-4c51-a82e-5768f023272a', 'SKU-JAS-C8978', 'Jasa Edit Foto', NULL, 2000.00, 0.00, 997, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3cc1a13aa8.26319956.png', 1, '2026-05-20 04:46:58', '2026-06-27 05:31:25'),
('347f0490-871d-43cc-8685-f8214a297276', 'SKU-ATK-RWH', 'Riwayat Hidup', NULL, 500.00, 200.00, 1, 10, 4, '/uploads/img_6a0d3df429dda2.94781375.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 21:55:50'),
('3665ad78-25c4-4708-a6bd-c46500dab460', 'SKU-CET-83434', 'Cetak 4 Foto 2x3cm ', NULL, 2000.00, 0.00, 997, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c5ede7644.52261082.png', 1, '2026-05-20 04:40:37', '2026-06-27 05:31:25'),
('3756a249-6e52-482b-b7d7-27018e4f398f', 'SKU-KAL-32', 'Kalkulator CC-32', NULL, 50000.00, 29500.00, 3, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c602af04d43.11589924.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 06:05:47'),
('3936b7d2-c7ba-478c-8bc7-ae73f96b0bf2', 'SKU-CEL-0B40D', 'Celengan Kecil', NULL, 5000.00, 2500.00, 11, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a1962114d5cf5.12303446.jpg', 1, '2026-05-29 09:48:06', '2026-05-29 02:53:22'),
('3d6b696f-f20a-4cad-a224-8e49432a2925', 'SKU-FIG-D1E55', 'Figura A4', NULL, 27000.00, 15500.00, 4, 10, 7, '/uploads/img_6a0d37e7a6e641.03630251.jpg', 1, '2026-05-20 04:08:00', '2026-05-31 18:56:33'),
('43a94f7f-5dbe-48d4-9951-ad74732a978b', 'SKU-CET-C6A34', 'Cetak 6 Foto 3x4cm', NULL, 5000.00, 0.00, 996, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c646f6a70.51112498.png', 1, '2026-05-20 04:41:11', '2026-06-27 05:31:25'),
('448e38c4-0e23-4b86-a879-805f3bafea70', 'SKU-KAL-23C', 'Kalkulator CC-23CO', NULL, 55000.00, 34000.00, 1, 10, 5, '/uploads/img_6a0c60249ebe80.16568939.jpg', 1, '2026-05-19 12:58:19', '2026-08-27 20:58:27'),
('472af922-8bd6-470f-bec2-2fa8bfc12aa8', 'SKU-KER-F4', 'HVS F4 Copy Paper', NULL, 47000.00, 41000.00, 10, 10, 3, '/uploads/img_6a0d393f57e784.97302191.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 22:21:04'),
('489ae3c7-76ba-470d-a7a5-5d9dad5d2de2', 'SKU-KAL-071', 'Kalkulator PKC-0711HC', NULL, 35000.00, 25500.00, 3, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c615ea697c6.41323097.webp', 1, '2026-05-19 12:58:19', '2026-06-01 19:48:17'),
('4991da58-3df7-4a65-b7af-61ce53d71b18', 'SKU-PRI-DEB8C', 'Print Text Saja satuan', NULL, 1000.00, 0.00, 997, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a127527b66600.69601830.png', 1, '2026-05-23 12:00:43', '2026-06-07 04:44:29'),
('4a2b910c-52d9-4dbc-a40e-5c47f63b6ea1', 'SKU-ATK-UND', 'Undangan Nikah', NULL, 17000.00, 12500.00, 17, 10, 4, '/uploads/img_6a0d3f7f4f9ca2.99729112.jpg', 1, '2026-05-19 12:58:19', '2026-06-07 04:44:29'),
('4b1faf54-5d0b-44d9-b23a-e49283a80bfc', 'SKU-JAM-BES', 'Jam Besar', NULL, 80000.00, 60000.00, 3, 10, 2, '', 1, '2026-05-19 12:58:19', '2026-05-19 22:18:42'),
('4e006911-b937-4291-a33b-fab893b2601d', 'SKU-FIG-7F63F', 'Figura 10R', NULL, 20000.00, 12500.00, 3, 10, 7, '/uploads/img_6a0d37b0bf19b0.00963753.jpg', 1, '2026-05-20 04:05:07', '2026-05-19 21:33:34'),
('4e3a0940-681c-4ad0-915c-165f48dddd50', 'SKU-CER-EF27D', 'Cermin A4', NULL, 30000.00, 17000.00, 2, 10, 7, '/uploads/img_6a0d3689787120.60186806.jpg', 1, '2026-05-20 04:15:56', '2026-05-19 21:33:29'),
('4fdfd6cc-eaf3-4582-9ed3-fbd11e8cc439', 'SKU-KAL-49', 'Kalkulator CC-49', NULL, 75000.00, 57500.00, 2, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c6065665d91.13107028.jpg', 1, '2026-05-19 12:58:19', '2026-06-07 04:44:29'),
('551e7ded-3534-4461-8e7e-a074906c62fb', 'SKU-FIG-B5A9C', 'Figura 30x45', NULL, 50000.00, 32000.00, 3, 10, 7, '/uploads/img_6a0d37c87d2d96.80992383.jpg', 1, '2026-05-20 04:15:10', '2026-05-19 21:34:02'),
('5579f855-95a2-441b-ab6c-c20232232c5c', 'SKU-FUL-4B749', 'Full Foto Ukuran A4', NULL, 9000.00, 0.00, 998, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c8b006811.95441348.png', 1, '2026-05-20 04:44:49', '2026-05-28 21:19:10'),
('5b1474bd-ecb5-4a35-9d2b-c3f2d10346ae', 'SKU-KAL-11A', 'Kalkulator CC-11A', NULL, 60000.00, 43500.00, 4, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c5feda4a7a9.05114698.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 06:04:46'),
('647071f9-7d65-400f-a07d-5a6618dac916', 'SKU-PAP-16B58', 'Paper Bag', NULL, 9000.00, 6000.00, 0, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a196271372a41.14383285.jpg', 1, '2026-05-29 04:18:09', '2026-06-07 04:44:29'),
('6a92f616-d9ee-499a-9f83-aca776ae544b', 'SKU-CET-ABCC4', 'Cetak Foto 3R(8,9x12,7cm)', NULL, 3000.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c715028d2.94180362.png', 1, '2026-05-20 04:42:49', '2026-05-19 21:45:38'),
('6efb5d78-c182-43b9-81f0-a84ed360bd9c', 'SKU-KAL-40', 'Kalkulator CC-40', NULL, 65000.00, 37000.00, 3, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c605f755635.07851106.jpg', 1, '2026-05-19 12:58:19', '2026-06-07 04:44:29'),
('7189d709-1cf1-4b1a-a0e2-03a6113428a9', 'SKU-KAL-1313', 'Kalkulator DTC-1313CH', NULL, 55000.00, 32000.00, 3, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c615a6a4362.21554459.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 06:10:51'),
('815be1d0-107f-4921-8192-bd5850c22a64', 'SKU-PAP-5A533', 'Paper Bag Sedang', NULL, 6000.00, 3000.00, 98, 10, 4, '', 1, '2026-05-31 07:34:50', '2026-05-31 00:35:52'),
('83c04e7f-4232-47f0-9d16-8567ff2fa2a7', 'SKU-CEL-60558', 'Celengan Ayam', NULL, 6000.00, 4000.00, 11, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a19625363a2f1.42626894.jpg', 1, '2026-05-29 09:48:41', '2026-05-29 02:54:28'),
('84274284-b4c3-45da-84e0-908c9c77d3a2', 'SKU-CET-23C8F', 'Cetak Foto 5R (12.7x17,8cm)', NULL, 6000.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c85752f06.11473914.png', 1, '2026-05-20 04:44:18', '2026-05-19 21:45:58'),
('86573072-1041-4aeb-a567-8b1522da802b', 'SKU-ATK-SKB', 'Skets Book', NULL, 20000.00, 15000.00, 6, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a0d3f07c62341.63484979.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 21:56:40'),
('88d20515-f464-4145-bbcb-aceeef532b84', 'SKU-KAL-63A', 'Kalkulator CC-63ACO', NULL, 75000.00, 53500.00, 3, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c614eae8fe0.71785277.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 06:10:39'),
('8b6bce86-fb3e-4e86-ac24-87b8321bdc24', 'SKU-KAL-50', 'Kalkulator CC-50', NULL, 90000.00, 70500.00, 3, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c60b66964a0.84256031.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 06:08:07'),
('92716080-7c14-4298-8eca-15779066a94a', 'SKU-JAM-KEC', 'Jam Kecil', NULL, 0.00, 0.00, 1, 10, 2, NULL, 1, '2026-05-19 12:58:19', '2026-05-19 05:58:19'),
('961c732f-56da-4522-ac15-aab465c1132e', 'SKU-PEC-ASW', 'Peci Aswad', NULL, 65000.00, 50000.00, 6, 10, 1, 'http://127.0.0.1:8000/uploads/img_6a0d3fe0bb8365.73589987.jpg', 1, '2026-05-19 12:58:19', '2026-06-16 06:17:19'),
('984257bd-c9e0-43cd-ab80-7c787e0e223a', 'SKU-FIG-980DA', 'Figura 25x30', NULL, 30000.00, 18000.00, 3, 10, 7, '/uploads/img_6a0d37196079b8.86095080.jpg', 1, '2026-05-20 04:18:10', '2026-05-19 21:33:50'),
('99dc6f14-5baa-48eb-be04-1efa10c0bc50', 'SKU-FIG-B5F89', 'Figura 30x40', NULL, 40000.00, 26000.00, 4, 10, 7, '/uploads/img_6a0d37c2ee0e74.82985856.jpg', 1, '2026-05-20 04:16:44', '2026-05-19 21:33:58'),
('aace9982-af0f-4fb8-84a6-807d073298ed', 'SKU-FIG-1EDFD', 'Figura 4R', NULL, 14000.00, 7500.00, 3, 10, 7, '/uploads/img_6a0d37da6d0e84.60464559.jpg', 1, '2026-05-20 04:03:59', '2026-05-19 21:34:18'),
('af0e2b53-522b-45d0-8abf-8dc123d95928', 'SKU-KER-SDF4', 'HVS SIDU F4', NULL, 50000.00, 44000.00, 5, 10, 3, 'http://127.0.0.1:8000/uploads/img_6a0d386dc14074.77852996.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 21:28:30'),
('bc924c42-9397-48b8-9e55-1d8125933eb7', 'SKU-KAL-90', 'Kalkulator CC-90', NULL, 35000.00, 22000.00, 1, 10, 5, 'http://127.0.0.1:8000/uploads/img_6a0c6154a12288.15436154.webp', 1, '2026-05-19 12:58:19', '2026-06-01 19:47:15'),
('c966207b-cb54-423a-a8f4-45455a4322d1', 'SKU-FIG-6F622', 'Figura 12R', NULL, 40000.00, 27000.00, 4, 10, 7, '/uploads/img_6a0d37b6957a76.07630708.jpg', 1, '2026-05-20 04:07:34', '2026-05-19 21:33:40'),
('d3c34751-58f7-44dd-a49f-6f3943c10d33', 'SKU-FIG-8C465', 'Figura F4', NULL, 30000.00, 18000.00, 2, 10, 7, '/uploads/img_6a0d37ee83fb95.21250332.jpg', 1, '2026-05-20 04:11:04', '2026-05-19 21:34:27'),
('d56690fc-4317-44e2-9334-b2ecce24a55f', 'SKU-ATK-BTM', 'Buku Tamu', NULL, 15000.00, 10000.00, 10, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a0d39f21b53d8.40358462.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 21:34:58'),
('d6cddfc2-8dac-419d-a025-2b4bf58f6304', 'SKU-CET-A74DB', 'Cetak Foto 4x6', NULL, 1000.00, 0.00, 995, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a0d3c7d4b5c17.76570728.png', 1, '2026-05-20 04:41:31', '2026-06-27 05:31:25'),
('d7494b97-ff64-40cf-bd38-880fac0a40fc', 'SKU-PRI-E6EC9', 'Print Text Warna >20', NULL, 1000.00, 0.00, 999, 10, 6, 'http://127.0.0.1:8000/uploads/img_6a1275377d1133.75619900.png', 1, '2026-05-24 03:47:56', '2026-05-23 20:49:12'),
('d91624c3-19da-4ba1-ba15-d71822a6dddb', 'SKU-KER-SDA4', 'HVS SIDU A4', NULL, 45000.00, 40000.00, 4, 10, 3, 'http://127.0.0.1:8000/uploads/img_6a0d38662c92d0.11789068.jpg', 1, '2026-05-19 12:58:19', '2026-05-19 21:28:23'),
('e9c1ca78-caf8-4d44-a89d-af2943335033', 'SKU-FIG-634AB', 'Figura 3R', NULL, 13000.00, 6500.00, 3, 10, 7, '/uploads/img_6a0d37d515b541.63500049.jpg', 1, '2026-05-20 04:02:40', '2026-05-19 21:34:15'),
('f92180f5-9a86-49a5-a123-37e722692e5f', 'SKU-CEL-A3469', 'Celengan Besar', NULL, 6000.00, 4000.00, 5, 10, 4, 'http://127.0.0.1:8000/uploads/img_6a19621aeef6d3.89464935.jpg', 1, '2026-05-29 09:47:40', '2026-06-30 19:28:07'),
('fdd5cfd5-a08f-4cd8-aac8-0214f29c051d', 'SKU-FIG-97BD5', 'Figura 25x35', NULL, 40000.00, 21000.00, 3, 10, 7, '/uploads/img_6a0d37bc9ac360.64972306.jpg', 1, '2026-05-20 04:14:27', '2026-05-19 21:33:55');

-- --------------------------------------------------------

--
-- Struktur dari tabel `shifts`
--

CREATE TABLE `shifts` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` timestamp NULL DEFAULT NULL,
  `opening_cash` decimal(10,2) DEFAULT '0.00',
  `closing_cash` decimal(10,2) DEFAULT NULL,
  `status` enum('open','closed') DEFAULT 'open'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `suppliers`
--

CREATE TABLE `suppliers` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `phone`, `email`, `address`, `is_active`, `created_at`) VALUES
('s1bc802f-508b-4a57-8974-9892c5890001', 'Bean Suppliers Co.', 'John Smith', '+1234567890', 'john@beansuppliers.com', NULL, 1, '2026-05-19 12:44:05'),
('s1bc802f-508b-4a57-8974-9892c5890002', 'TechDistro Inc.', 'Jane Doe', '+0987654321', 'jane@techdistro.com', NULL, 1, '2026-05-19 12:44:05');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `username` varchar(50) NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `pin_code` varchar(4) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('admin','cashier','manager') NOT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `employee_id`, `password_hash`, `pin_code`, `full_name`, `email`, `role`, `avatar_url`, `is_active`, `created_at`, `updated_at`) VALUES
('c2bc802f-508b-4a57-8974-9892c5890001', 'admin', 'EMP001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Administrator', 'admin@pos.local', 'admin', NULL, 1, '2026-05-19 12:44:05', '2026-05-19 12:44:05'),
('c2bc802f-508b-4a57-8974-9892c5890002', 'cashier1', 'EMP002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '1234', 'Alex Morgan', 'alex@pos.local', 'cashier', NULL, 1, '2026-05-19 12:44:05', '2026-05-19 12:44:05');

--
-- Indeks untuk tabel yang dibuang
--

--
-- Indeks untuk tabel `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indeks untuk tabel `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_expenses_date` (`created_at`),
  ADD KEY `idx_expenses_category` (`category`);

--
-- Indeks untuk tabel `inventory_logs`
--
ALTER TABLE `inventory_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `idx_inventory_logs_product` (`product_id`),
  ADD KEY `idx_inventory_logs_date` (`created_at`),
  ADD KEY `idx_inventory_logs_type` (`type`);

--
-- Indeks untuk tabel `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `idx_orders_user` (`user_id`),
  ADD KEY `idx_orders_date` (`created_at`),
  ADD KEY `idx_orders_status` (`status`),
  ADD KEY `idx_orders_shift` (`shift_id`);

--
-- Indeks untuk tabel `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order` (`order_id`),
  ADD KEY `idx_order_items_product` (`product_id`);

--
-- Indeks untuk tabel `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_sku` (`sku`),
  ADD KEY `idx_products_active` (`is_active`);

--
-- Indeks untuk tabel `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_shifts_user` (`user_id`),
  ADD KEY `idx_shifts_status` (`status`);

--
-- Indeks untuk tabel `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `employee_id` (`employee_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Ketidakleluasaan untuk tabel `inventory_logs`
--
ALTER TABLE `inventory_logs`
  ADD CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `inventory_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `inventory_logs_ibfk_3` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`);

--
-- Ketidakleluasaan untuk tabel `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`);

--
-- Ketidakleluasaan untuk tabel `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Ketidakleluasaan untuk tabel `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Ketidakleluasaan untuk tabel `shifts`
--
ALTER TABLE `shifts`
  ADD CONSTRAINT `shifts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
