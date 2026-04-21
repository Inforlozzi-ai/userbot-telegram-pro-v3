import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1714000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabela de usuários
    await queryRunner.query(`
      CREATE TYPE user_plan AS ENUM ('free', 'starter', 'pro', 'agency');

      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          VARCHAR(255) NOT NULL,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        plan          user_plan NOT NULL DEFAULT 'free',
        asaas_customer_id   VARCHAR(255),
        asaas_subscription_id VARCHAR(255),
        created_at    TIMESTAMP DEFAULT now(),
        updated_at    TIMESTAMP DEFAULT now()
      );
    `);

    // Tabela de bots
    await queryRunner.query(`
      CREATE TYPE bot_status AS ENUM ('stopped', 'starting', 'running', 'error');

      CREATE TABLE IF NOT EXISTS bots (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug                VARCHAR(100) NOT NULL,
        workspace_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status              bot_status NOT NULL DEFAULT 'stopped',
        container_id        VARCHAR(255),
        api_id_enc          TEXT NOT NULL,
        api_hash_enc        TEXT NOT NULL,
        bot_token_enc       TEXT NOT NULL,
        session_enc         TEXT NOT NULL,
        admin_telegram_id   BIGINT NOT NULL,
        target_group_ids    TEXT,
        source_chat_ids     TEXT,
        forward_mode        VARCHAR(20) DEFAULT 'copy',
        openai_key_enc      TEXT,
        gemini_key_enc      TEXT,
        last_error          TEXT,
        created_at          TIMESTAMP DEFAULT now(),
        updated_at          TIMESTAMP DEFAULT now(),
        UNIQUE(workspace_id, slug)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS bots`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TYPE IF EXISTS bot_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_plan`);
  }
}
