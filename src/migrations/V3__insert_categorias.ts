import { MigrationInterface, QueryRunner } from 'typeorm';

export class V3InsertCategorias1000000003000 implements MigrationInterface {
  name = 'V3InsertCategorias1000000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
INSERT INTO categorias (nome, descricao, ativo) VALUES
('Eletrônicos', 'Produtos eletrônicos e tecnologia', true),
('Roupas', 'Vestuário masculino e feminino', true),
('Livros', 'Livros físicos e digitais', true),
('Casa e Decoração', 'Artigos para casa e decoração', true),
('Esportes', 'Equipamentos e roupas esportivas', true),
('Beleza', 'Produtos de beleza e cuidados pessoais', true),
('Alimentos', 'Alimentos e bebidas', true),
('Brinquedos', 'Brinquedos e jogos infantis', true),
('Automotivo', 'Peças e acessórios automotivos', true),
('Papelaria', 'Material escolar e de escritório', true);
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
