
CREATE TABLE idempotency_keys (
  `key`            VARCHAR(255) NOT NULL,
  user_id          CHAR(36)     NOT NULL,
  request_method   VARCHAR(10)  NOT NULL,
  request_path     VARCHAR(500) NOT NULL,
  request_hash     CHAR(64)     NOT NULL,
  response_status  SMALLINT     NOT NULL,
  response_body    JSON         NOT NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at       TIMESTAMP    NOT NULL,
  CONSTRAINT pk_idempotency_keys        PRIMARY KEY (`key`),
  CONSTRAINT fk_idempotency_user_id     FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys (expires_at);
CREATE INDEX idx_idempotency_keys_user_id    ON idempotency_keys (user_id);
