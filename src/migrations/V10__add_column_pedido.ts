import { MigrationInterface, QueryRunner } from 'typeorm';

export class V10AddColumnPedido1000000010000 implements MigrationInterface {
  name = 'V10AddColumnPedido1000000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE pedidos
    ADD COLUMN IF NOT EXISTS codigo_rastreio VARCHAR(255);
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
