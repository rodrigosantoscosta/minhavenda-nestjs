import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * V12 — Mockup images for all products seeded in V5.
 *
 * Uses stable Unsplash photo IDs (photo-XXXX format) which do not redirect
 * randomly on every request, unlike the deprecated source.unsplash.com.
 * All URLs use ?w=800 for a consistent resolution.
 *
 * Only updates rows where url_imagem IS NULL to be safe on re-runs.
 */
export class V12AddUrlImagemProdutosV51000000012000 implements MigrationInterface {
  name = 'V12AddUrlImagemProdutosV51000000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
UPDATE public.produtos
SET url_imagem = CASE nome

  -- ─── Eletrônicos ────────────────────────────────────────────────────────
  WHEN 'Smartphone Samsung Galaxy S23'
    THEN 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'

  WHEN 'Notebook Dell Inspiron 15'
    THEN 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800'

  WHEN 'Fone de Ouvido JBL Tune 510BT'
    THEN 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'

  WHEN 'Smart TV LG 50"'
    THEN 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800'

  WHEN 'Mouse Gamer Logitech G203'
    THEN 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800'

  -- ─── Roupas ─────────────────────────────────────────────────────────────
  WHEN 'Camiseta Básica Preta'
    THEN 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'

  WHEN 'Calça Jeans Masculina'
    THEN 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800'

  WHEN 'Vestido Floral Feminino'
    THEN 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800'

  WHEN 'Jaqueta Corta-Vento'
    THEN 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'

  WHEN 'Tênis Esportivo Nike'
    THEN 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'

  -- ─── Livros ─────────────────────────────────────────────────────────────
  WHEN 'Clean Code - Robert Martin'
    THEN 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800'

  WHEN 'O Senhor dos Anéis - Trilogia'
    THEN 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=800'

  WHEN 'Sapiens - Yuval Noah Harari'
    THEN 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800'

  WHEN 'Domain-Driven Design'
    THEN 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800'

  -- ─── Casa e Decoração ───────────────────────────────────────────────────
  WHEN 'Jogo de Cama Casal'
    THEN 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'

  WHEN 'Conjunto de Panelas Tramontina'
    THEN 'https://images.unsplash.com/photo-1584990347449-a2d4c2c044c9?w=800'

  WHEN 'Quadro Decorativo Abstrato'
    THEN 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800'

  WHEN 'Luminária de Mesa LED'
    THEN 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800'

  -- ─── Esportes ───────────────────────────────────────────────────────────
  WHEN 'Bola de Futebol Society'
    THEN 'https://images.unsplash.com/photo-1552318965-6e6be7484ada?w=800'

  WHEN 'Halteres 5kg (Par)'
    THEN 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'

  WHEN 'Tapete de Yoga'
    THEN 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800'

  WHEN 'Bicicleta Ergométrica'
    THEN 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'

  -- ─── Beleza ─────────────────────────────────────────────────────────────
  WHEN 'Shampoo Pantene 400ml'
    THEN 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=800'

  WHEN 'Perfume Importado 100ml'
    THEN 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=800'

  WHEN 'Kit Maquiagem Completo'
    THEN 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800'

  -- ─── Alimentos ──────────────────────────────────────────────────────────
  WHEN 'Café Especial Torrado 500g'
    THEN 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800'

  WHEN 'Chocolate Belga Premium 200g'
    THEN 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800'

  WHEN 'Azeite Extra Virgem 500ml'
    THEN 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800'

  -- ─── Brinquedos ─────────────────────────────────────────────────────────
  WHEN 'LEGO Star Wars Millennium Falcon'
    THEN 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800'

  WHEN 'Boneca Barbie Dreamhouse'
    THEN 'https://images.unsplash.com/photo-1530988836860-b7b7f9b4b3a1?w=800'

  WHEN 'Carrinho Hot Wheels Pack 10'
    THEN 'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800'

  -- ─── Automotivo ─────────────────────────────────────────────────────────
  WHEN 'Óleo Motor Castrol 5W30 1L'
    THEN 'https://images.unsplash.com/photo-1635073908681-4e74564a0720?w=800'

  WHEN 'Pneu Aro 15 Pirelli'
    THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'

  WHEN 'Kit Limpeza Automotiva'
    THEN 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800'

  -- ─── Papelaria ──────────────────────────────────────────────────────────
  WHEN 'Caderno Universitário 200 folhas'
    THEN 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800'

  WHEN 'Caneta Esferográfica Preta - Caixa 50un'
    THEN 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800'

  WHEN 'Mochila Escolar'
    THEN 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'

  WHEN 'Calculadora Científica Casio'
    THEN 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800'

  ELSE url_imagem
END
WHERE url_imagem IS NULL;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
