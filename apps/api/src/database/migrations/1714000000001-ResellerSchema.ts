import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResellerSchema1714000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS resellers (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        slug                 VARCHAR(100) NOT NULL UNIQUE,
        brand_name           VARCHAR(255) NOT NULL,
        logo                 TEXT,
        primary_color        VARCHAR(20) DEFAULT '#6366f1',
        max_clients          INT DEFAULT 10,
        max_bots_per_client  INT DEFAULT 3,
        commission_pct       DECIMAL(5,2) DEFAULT 20,
        active               BOOLEAN DEFAULT true,
        created_at           TIMESTAMP DEFAULT now(),
        updated_at           TIMESTAMP DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS reseller_clients (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id     UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
        client_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        max_bots        INT DEFAULT 1,
        monthly_price   DECIMAL(10,2) DEFAULT 0,
        active          BOOLEAN DEFAULT true,
        created_at      TIMESTAMP DEFAULT now(),
        UNIQUE(reseller_id, client_user_id)
      );

      CREATE TYPE commission_status AS ENUM ('pending', 'paid', 'cancelled');

      CREATE TABLE IF NOT EXISTS commissions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id     UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
        client_user_id  UUID NOT NULL,
        payment_ref     VARCHAR(255) NOT NULL,
        amount          DECIMAL(10,2) NOT NULL,
        status          commission_status DEFAULT 'pending',
        created_at      TIMESTAMP DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS commissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS reseller_clients`);
    await queryRunner.query(`DROP TABLE IF EXISTS resellers`);
    await queryRunner.query(`DROP TYPE IF EXISTS commission_status`);
  }
}
