import { MigrationInterface, QueryRunner } from 'typeorm';

export class V11UpdateAdminPassword1000000011000 implements MigrationInterface {
  name = 'V11UpdateAdminPassword1000000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
UPDATE usuarios
SET senha = '$2a$12$9J/ZSpHMwklvFN1iQhzD4e0zYOjnT1.4PcqBtW/QR5k5RLASwI.62'
WHERE email = 'admin@loja.com';
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Cannot reverse a password change — intentionally left empty
  }
}
