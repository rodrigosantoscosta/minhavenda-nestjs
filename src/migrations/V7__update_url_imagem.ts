import { MigrationInterface, QueryRunner } from 'typeorm';

export class V7UpdateUrlImagem1000000007000 implements MigrationInterface {
  name = 'V7UpdateUrlImagem1000000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
UPDATE public.produtos
SET url_imagem = CASE nome

    WHEN 'Notebook Dell Inspiron 15'
        THEN 'https://source.unsplash.com/600x600/?laptop,dell'

    WHEN 'Smartphone Samsung Galaxy S23'
        THEN 'https://source.unsplash.com/600x600/?smartphone,samsung'

    WHEN 'iPhone 15 Pro'
        THEN 'https://source.unsplash.com/600x600/?iphone,apple'

    WHEN 'Tablet Samsung Galaxy Tab S9'
        THEN 'https://source.unsplash.com/600x600/?tablet,samsung'

    WHEN 'Smart TV LG 55\" 4K'
        THEN 'https://source.unsplash.com/600x600/?smart-tv,lg'

    WHEN 'Fone Bluetooth Sony WH-1000XM5'
        THEN 'https://source.unsplash.com/600x600/?headphones,sony'

    WHEN 'Apple Watch Series 9'
        THEN 'https://source.unsplash.com/600x600/?smartwatch,apple'

    WHEN 'Câmera Canon EOS R6'
        THEN 'https://source.unsplash.com/600x600/?camera,canon'

    WHEN 'Mouse Gamer Logitech G502 Hero'
        THEN 'https://source.unsplash.com/600x600/?gaming-mouse,logitech'

    WHEN 'Teclado Mecânico Keychron K2'
        THEN 'https://source.unsplash.com/600x600/?mechanical-keyboard'

    WHEN 'Monitor LG UltraWide 34\"'
        THEN 'https://source.unsplash.com/600x600/?ultrawide-monitor,lg'

    WHEN 'SSD Kingston NV2 1TB'
        THEN 'https://source.unsplash.com/600x600/?ssd,nvme'

    WHEN 'Memória RAM Corsair Vengeance 32GB'
        THEN 'https://source.unsplash.com/600x600/?ram-memory'

    WHEN 'Placa de Vídeo RTX 4070'
        THEN 'https://source.unsplash.com/600x600/?graphics-card,nvidia'

    WHEN 'Webcam Logitech C920e'
        THEN 'https://source.unsplash.com/600x600/?webcam,logitech'

    WHEN 'HD Externo Seagate 2TB'
        THEN 'https://source.unsplash.com/600x600/?external-hard-drive'

    WHEN 'PlayStation 5'
        THEN 'https://source.unsplash.com/600x600/?playstation-5'

    WHEN 'Xbox Series X'
        THEN 'https://source.unsplash.com/600x600/?xbox-series-x'

    WHEN 'Nintendo Switch OLED'
        THEN 'https://source.unsplash.com/600x600/?nintendo-switch'

    WHEN 'God of War Ragnarök - PS5'
        THEN 'https://source.unsplash.com/600x600/?ps5-game'

    WHEN 'The Legend of Zelda TOTK'
        THEN 'https://source.unsplash.com/600x600/?zelda-game'

    WHEN 'Controle Xbox Elite Series 2'
        THEN 'https://source.unsplash.com/600x600/?gaming-controller,xbox'

    WHEN 'Headset Gamer HyperX Cloud II'
        THEN 'https://source.unsplash.com/600x600/?gaming-headset'

    WHEN 'Cadeira Gamer DXRacer Formula'
        THEN 'https://source.unsplash.com/600x600/?gaming-chair'

    WHEN 'Clean Code - Robert C. Martin'
        THEN 'https://source.unsplash.com/600x600/?programming-book'

    WHEN 'Domain-Driven Design - Eric Evans'
        THEN 'https://source.unsplash.com/600x600/?software-architecture-book'

    WHEN 'Arquitetura Limpa - Robert Martin'
        THEN 'https://source.unsplash.com/600x600/?software-architecture'

    WHEN 'Refatoração - Martin Fowler'
        THEN 'https://source.unsplash.com/600x600/?refactoring-book'

    WHEN 'O Programador Pragmático'
        THEN 'https://source.unsplash.com/600x600/?programming-book'

    WHEN 'Design Patterns - Gang of Four'
        THEN 'https://source.unsplash.com/600x600/?design-patterns-book'

    WHEN 'Cadeira Ergonômica Premium'
        THEN 'https://source.unsplash.com/600x600/?office-chair'

    WHEN 'Mesa Escrivaninha Madesa'
        THEN 'https://source.unsplash.com/600x600/?office-desk'

    WHEN 'Luminária LED de Mesa'
        THEN 'https://source.unsplash.com/600x600/?desk-lamp'

    WHEN 'Quadro Decorativo Kit 3 Peças'
        THEN 'https://source.unsplash.com/600x600/?abstract-art'

    WHEN 'Tapete Antiderrapante'
        THEN 'https://source.unsplash.com/600x600/?rug'

    WHEN 'iPhone 12 - DESCONTINUADO'
        THEN 'https://source.unsplash.com/600x600/?iphone,apple'

    WHEN 'Mouse Básico - ESGOTADO'
        THEN 'https://source.unsplash.com/600x600/?computer-mouse'

    WHEN 'PS4 Slim - DESCONTINUADO'
        THEN 'https://source.unsplash.com/600x600/?playstation-4'

    WHEN 'Smartphone XYZ'
        THEN 'https://source.unsplash.com/600x600/?smartphone'

    ELSE url_imagem
END;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
