
CREATE TABLE transactions (
  id              CHAR(36)       NOT NULL,
  wallet_id       CHAR(36)       NOT NULL,
  user_id         CHAR(36)       NOT NULL,
  type            ENUM('CREDIT', 'DEBIT') NOT NULL,
  amount          DECIMAL(19, 4) NOT NULL,
  idempotency_key VARCHAR(255)   NULL,
  description     VARCHAR(500)   NULL,
  status          ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_transactions                  PRIMARY KEY (id),
  CONSTRAINT uq_transactions_idempotency_key  UNIQUE (idempotency_key),
  CONSTRAINT fk_transactions_wallet_id        FOREIGN KEY (wallet_id) REFERENCES wallets (id),
  CONSTRAINT fk_transactions_user_id          FOREIGN KEY (user_id)  REFERENCES users (id),
  CONSTRAINT chk_transactions_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_transactions_user_created   ON transactions (user_id, created_at DESC);
CREATE INDEX idx_transactions_user_type      ON transactions (user_id, type);
CREATE INDEX idx_transactions_wallet_id      ON transactions (wallet_id);
