import { MigrationInterface, QueryRunner } from 'typeorm';

export class V4InsertUsuarios1000000004000 implements MigrationInterface {
  name = 'V4InsertUsuarios1000000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
INSERT INTO usuarios (nome, email, senha, tipo, ativo) VALUES
('Administrador', 'admin@loja.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN', true);

INSERT INTO usuarios (nome, email, senha, tipo, ativo) VALUES
('João Silva', 'joao.silva@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CLIENTE', true),
('Maria Santos', 'maria.santos@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CLIENTE', true),
('Pedro Oliveira', 'pedro.oliveira@email.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CLIENTE', true),
('Ana Costa', 'ana.costa@email.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CLIENTE', true),
('Carlos Ferreira', 'carlos.ferreira@email.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CLIENTE', true);
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
