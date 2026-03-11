import { MigrationInterface, QueryRunner } from 'typeorm';

export class V5InsertProdutos1000000005000 implements MigrationInterface {
  name = 'V5InsertProdutos1000000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
INSERT INTO produtos (nome, descricao, preco, moeda, categoria_id, ativo) VALUES
('Smartphone Samsung Galaxy S23', 'Smartphone Samsung Galaxy S23 128GB, 8GB RAM, Câmera 50MP', 2999.90, 'BRL', 1, true),
('Notebook Dell Inspiron 15', 'Notebook Dell i5 11ª geração, 8GB RAM, SSD 256GB', 3499.00, 'BRL', 1, true),
('Fone de Ouvido JBL Tune 510BT', 'Fone Bluetooth JBL com até 40h de bateria', 199.90, 'BRL', 1, true),
('Smart TV LG 50"', 'Smart TV LG 50 polegadas 4K UHD', 2199.00, 'BRL', 1, true),
('Mouse Gamer Logitech G203', 'Mouse Gamer RGB 8000 DPI', 129.90, 'BRL', 1, true);

INSERT INTO produtos (nome, descricao, preco, moeda, categoria_id, ativo) VALUES
('Camiseta Básica Preta', 'Camiseta 100% algodão, tamanho M', 49.90, 'BRL', 2, true),
('Calça Jeans Masculina', 'Calça jeans tradicional azul escuro', 159.90, 'BRL', 2, true),
('Vestido Floral Feminino', 'Vestido estampado para verão', 129.90, 'BRL', 2, true),
('Jaqueta Corta-Vento', 'Jaqueta impermeável com capuz', 199.00, 'BRL', 2, true),
('Tênis Esportivo Nike', 'Tênis para corrida e caminhada', 399.90, 'BRL', 2, true);

INSERT INTO produtos (nome, descricao, preco, moeda, categoria_id, ativo) VALUES
('Clean Code - Robert Martin', 'Guia de boas práticas em programação', 89.90, 'BRL', 3, true),
('O Senhor dos Anéis - Trilogia', 'Box completo da trilogia de Tolkien', 149.90, 'BRL', 3, true),
('Sapiens - Yuval Noah Harari', 'Uma breve história da humanidade', 54.90, 'BRL', 3, true),
('Domain-Driven Design', 'Atacando as complexidades no coração do software', 119.00, 'BRL', 3, true);

INSERT INTO produtos (nome, descricao, preco, moeda, categoria_id, ativo) VALUES
('Jogo de Cama Casal', 'Jogo de cama 4 peças 100% algodão', 179.90, 'BRL', 4, true),
('Conjunto de Panelas Tramontina', '5 peças em aço inox', 299.00, 'BRL', 4, true),
('Quadro Decorativo Abstrato', 'Quadro 60x80cm moldura preta', 149.90, 'BRL', 4, true),
('Luminária de Mesa LED', 'Luminária ajustável com controle de intensidade', 89.90, 'BRL', 4, true);

INSERT INTO produtos (nome, descricao, preco, moeda, categoria_id, ativo) VALUES
('Bola de Futebol Society', 'Bola oficial tamanho profissional', 119.90, 'BRL', 5, true),
('Halteres 5kg (Par)', 'Par de halteres emborrachados', 89.90, 'BRL', 5, true),
('Tapete de Yoga', 'Tapete antiderrapante 180x60cm', 79.90, 'BRL', 5, true),
('Bicicleta Ergométrica', 'Bike para exercícios com 8 níveis de resistência', 899.00, 'BRL', 5, true);

INSERT INTO produtos (nome, descricao, preco, moeda, categoria_id, ativo) VALUES
('Shampoo Pantene 400ml', 'Shampoo hidratação intensa', 24.90, 'BRL', 6, true),
('Perfume Importado 100ml', 'Fragrância masculina amadeirada', 299.00, 'BRL', 6, true),
('Kit Maquiagem Completo', 'Kit com 20 itens essenciais', 189.90, 'BRL', 6, true);

INSERT INTO produtos (nome, descricao, preco, moeda, categoria_id, ativo) VALUES
('Café Especial Torrado 500g', 'Café gourmet selecionado', 34.90, 'BRL', 7, true),
('Chocolate Belga Premium 200g', 'Chocolate ao leite belga', 29.90, 'BRL', 7, true),
('Azeite Extra Virgem 500ml', 'Azeite português premium', 49.90, 'BRL', 7, true);

INSERT INTO produtos (nome, descricao, preco, moeda, categoria_id, ativo) VALUES
('LEGO Star Wars Millennium Falcon', 'Set com 1351 peças', 899.00, 'BRL', 8, true),
('Boneca Barbie Dreamhouse', 'Casa dos sonhos da Barbie', 499.00, 'BRL', 8, true),
('Carrinho Hot Wheels Pack 10', 'Conjunto com 10 carrinhos', 79.90, 'BRL', 8, true);

INSERT INTO produtos (nome, descricao, preco, moeda, categoria_id, ativo) VALUES
('Óleo Motor Castrol 5W30 1L', 'Óleo sintético para motor', 49.90, 'BRL', 9, true),
('Pneu Aro 15 Pirelli', 'Pneu radial 185/65 R15', 349.00, 'BRL', 9, true),
('Kit Limpeza Automotiva', 'Kit completo para limpeza interna e externa', 89.90, 'BRL', 9, true);

INSERT INTO produtos (nome, descricao, preco, moeda, categoria_id, ativo) VALUES
('Caderno Universitário 200 folhas', 'Caderno espiral 10 matérias', 29.90, 'BRL', 10, true),
('Caneta Esferográfica Preta - Caixa 50un', 'Canetas BIC ponta fina', 49.90, 'BRL', 10, true),
('Mochila Escolar', 'Mochila com compartimento para notebook', 149.90, 'BRL', 10, true),
('Calculadora Científica Casio', 'Calculadora com 240 funções', 79.90, 'BRL', 10, true);
    `);

    // Every product must have a corresponding estoque row (starting at zero).
    // Without this, all estoque use cases throw ResourceNotFoundException for seeded products.
    await queryRunner.query(`
INSERT INTO estoques (produto_id, quantidade, atualizado_em)
SELECT id, 0, CURRENT_TIMESTAMP FROM produtos;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
