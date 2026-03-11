import { MigrationInterface, QueryRunner } from 'typeorm';

export class V6UpdateProdutosUrlImagem1000000006000 implements MigrationInterface {
  name = 'V6UpdateProdutosUrlImagem1000000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
UPDATE public.produtos
SET url_imagem = CASE
    WHEN nome ILIKE '%Notebook Dell%'
        THEN 'https://source.unsplash.com/600x600/?laptop,dell'

    WHEN nome ILIKE '%Samsung Galaxy S23%'
        THEN 'https://source.unsplash.com/600x600/?smartphone,samsung'

    WHEN nome ILIKE '%iPhone 15 Pro%'
        THEN 'https://source.unsplash.com/600x600/?iphone,apple'

    WHEN nome ILIKE '%Galaxy Tab S9%'
        THEN 'https://source.unsplash.com/600x600/?tablet,samsung'

    WHEN nome ILIKE '%Smart TV LG%'
        THEN 'https://source.unsplash.com/600x600/?smart-tv,lg'

    WHEN nome ILIKE '%WH-1000XM5%'
        THEN 'https://source.unsplash.com/600x600/?headphones,sony'

    WHEN nome ILIKE '%Apple Watch%'
        THEN 'https://source.unsplash.com/600x600/?smartwatch,apple'

    WHEN nome ILIKE '%Canon EOS R6%'
        THEN 'https://source.unsplash.com/600x600/?camera,canon'

    WHEN nome ILIKE '%G502%'
        THEN 'https://source.unsplash.com/600x600/?gaming-mouse,logitech'

    WHEN nome ILIKE '%Keychron K2%'
        THEN 'https://source.unsplash.com/600x600/?mechanical-keyboard'

    WHEN nome ILIKE '%UltraWide%'
        THEN 'https://source.unsplash.com/600x600/?ultrawide-monitor'

    WHEN nome ILIKE '%Kingston NV2%'
        THEN 'https://source.unsplash.com/600x600/?ssd,nvme'

    WHEN nome ILIKE '%Corsair Vengeance%'
        THEN 'https://source.unsplash.com/600x600/?ram-memory'

    WHEN nome ILIKE '%RTX 4070%'
        THEN 'https://source.unsplash.com/600x600/?graphics-card,nvidia'

    WHEN nome ILIKE '%C920%'
        THEN 'https://source.unsplash.com/600x600/?webcam,logitech'

    WHEN nome ILIKE '%Seagate%'
        THEN 'https://source.unsplash.com/600x600/?external-hard-drive'

    WHEN nome ILIKE '%PlayStation 5%'
        THEN 'https://source.unsplash.com/600x600/?playstation-5'

    WHEN nome ILIKE '%Xbox Series X%'
        THEN 'https://source.unsplash.com/600x600/?xbox-series-x'

    WHEN nome ILIKE '%Nintendo Switch%'
        THEN 'https://source.unsplash.com/600x600/?nintendo-switch'

    WHEN nome ILIKE '%God of War%'
        THEN 'https://source.unsplash.com/600x600/?ps5-game'

    WHEN nome ILIKE '%Zelda%'
        THEN 'https://source.unsplash.com/600x600/?zelda-game'

    WHEN nome ILIKE '%Controle Xbox%'
        THEN 'https://source.unsplash.com/600x600/?gaming-controller,xbox'

    WHEN nome ILIKE '%HyperX Cloud%'
        THEN 'https://source.unsplash.com/600x600/?gaming-headset'

    WHEN nome ILIKE '%DXRacer%'
        THEN 'https://source.unsplash.com/600x600/?gaming-chair'

    WHEN nome ILIKE '%Clean Code%'
        THEN 'https://source.unsplash.com/600x600/?programming-book'

    WHEN nome ILIKE '%Domain-Driven Design%'
        THEN 'https://source.unsplash.com/600x600/?software-architecture-book'

    WHEN nome ILIKE '%Arquitetura Limpa%'
        THEN 'https://source.unsplash.com/600x600/?software-architecture'

    WHEN nome ILIKE '%Refatoração%'
        THEN 'https://source.unsplash.com/600x600/?refactoring-book'

    WHEN nome ILIKE '%Programador Pragmático%'
        THEN 'https://source.unsplash.com/600x600/?programming-book'

    WHEN nome ILIKE '%Design Patterns%'
        THEN 'https://source.unsplash.com/600x600/?design-patterns-book'

    WHEN nome ILIKE '%Mesa Escrivaninha%'
        THEN 'https://source.unsplash.com/600x600/?office-desk'

    WHEN nome ILIKE '%Luminária%'
        THEN 'https://source.unsplash.com/600x600/?desk-lamp'

    WHEN nome ILIKE '%Quadro Decorativo%'
        THEN 'https://source.unsplash.com/600x600/?abstract-art'

    WHEN nome ILIKE '%Tapete%'
        THEN 'https://source.unsplash.com/600x600/?rug'

    ELSE url_imagem
END;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
