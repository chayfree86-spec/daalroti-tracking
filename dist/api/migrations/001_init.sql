-- Migration: 001_init.sql
-- Relational schema for DaalRoti Tracker: entries, income, expense.

CREATE TABLE IF NOT EXISTS entries (
  id BIGINT PRIMARY KEY,
  entry_date DATE NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  remark VARCHAR(255) DEFAULT NULL,
  client_timestamp VARCHAR(64) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_entry_date (entry_date),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS income (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  entry_id BIGINT NOT NULL,
  cash_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  online_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_income_entry (entry_id),
  CONSTRAINT fk_income_entry FOREIGN KEY (entry_id)
    REFERENCES entries (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expense (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  entry_id BIGINT NOT NULL,
  cash_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  online_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_expense_entry (entry_id),
  CONSTRAINT fk_expense_entry FOREIGN KEY (entry_id)
    REFERENCES entries (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
