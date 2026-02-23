
CREATE TABLE wallets (
  id         CHAR(36)       NOT NULL,
  user_id    CHAR(36)       NOT NULL,
  balance    DECIMAL(19, 4) NOT NULL DEFAULT 0.0000,
  version    INT UNSIGNED   NOT NULL DEFAULT 0,
  created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_wallets              PRIMARY KEY (id),
  CONSTRAINT uq_wallets_user_id      UNIQUE (user_id),
  CONSTRAINT fk_wallets_user_id      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_wallets_balance     CHECK (balance >= 0)
);
