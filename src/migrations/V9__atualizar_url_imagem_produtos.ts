import { MigrationInterface, QueryRunner } from 'typeorm';

export class V9AtualizarUrlImagemProdutos1000000009000 implements MigrationInterface {
  name = 'V9AtualizarUrlImagemProdutos1000000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
UPDATE public.produtos
SET url_imagem = CASE
    WHEN nome LIKE '%Notebook Dell%' THEN 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800'
    WHEN nome LIKE '%Samsung Galaxy S23%' THEN 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'
    WHEN nome LIKE '%iPhone 15 Pro%' THEN 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800'
    WHEN nome LIKE '%Tablet Samsung%' THEN 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800'
    WHEN nome LIKE '%Smart TV LG%' THEN 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800'
    WHEN nome LIKE '%Fone Bluetooth Sony%' THEN 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800'
    WHEN nome LIKE '%Apple Watch%' THEN 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800'
    WHEN nome LIKE '%Câmera Canon%' THEN 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800'
    WHEN nome LIKE '%Mouse Gamer Logitech%' THEN 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800'
    WHEN nome LIKE '%Teclado Mecânico Keychron%' THEN 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800'
    WHEN nome LIKE '%Monitor LG UltraWide%' THEN 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'
    WHEN nome LIKE '%SSD Kingston%' THEN 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800'
    WHEN nome LIKE '%Memória RAM Corsair%' THEN 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800'
    WHEN nome LIKE '%Placa de Vídeo RTX%' THEN 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800'
    WHEN nome LIKE '%Webcam Logitech%' THEN 'https://images.unsplash.com/photo-1589739900243-c632e4b4b2c9?w=800'
    WHEN nome LIKE '%HD Externo Seagate%' THEN 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800'
    WHEN nome LIKE '%PlayStation 5%' THEN 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800'
    WHEN nome LIKE '%Xbox Series X%' THEN 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800'
    WHEN nome LIKE '%Nintendo Switch%' THEN 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800'
    WHEN nome LIKE '%God of War%' THEN 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800'
    WHEN nome LIKE '%Zelda%' THEN 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800'
    WHEN nome LIKE '%Controle Xbox Elite%' THEN 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800'
    WHEN nome LIKE '%Headset Gamer HyperX%' THEN 'https://images.unsplash.com/photo-1599669454699-248893623440?w=800'
    WHEN nome LIKE '%Cadeira Gamer DXRacer%' THEN 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800'
    WHEN nome LIKE '%Clean Code%' THEN 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800'
    WHEN nome LIKE '%Domain-Driven Design%' THEN 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800'
    WHEN nome LIKE '%Arquitetura Limpa%' THEN 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800'
    WHEN nome LIKE '%Refatoração%' THEN 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800'
    WHEN nome LIKE '%Programador Pragmático%' THEN 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800'
    WHEN nome LIKE '%Design Patterns%' THEN 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800'
    WHEN nome LIKE '%Cadeira Ergonômica%' THEN 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800'
    WHEN nome LIKE '%Mesa Escrivaninha%' THEN 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800'
    WHEN nome LIKE '%Luminária LED%' THEN 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800'
    WHEN nome LIKE '%Quadro Decorativo%' THEN 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800'
    WHEN nome LIKE '%Tapete Antiderrapante%' THEN 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800'
    WHEN nome LIKE '%iPhone 12%' THEN 'https://images.unsplash.com/photo-1603921326210-6edd2d60ca68?w=800'
    WHEN nome LIKE '%Mouse Básico%' THEN 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800'
    WHEN nome LIKE '%PS4 Slim%' THEN 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=800'
    WHEN nome LIKE '%Smartphone XYZ%' THEN 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'
    ELSE url_imagem
END;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
