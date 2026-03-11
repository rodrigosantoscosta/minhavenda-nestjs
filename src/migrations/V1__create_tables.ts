import { MigrationInterface, QueryRunner } from 'typeorm';

export class V1CreateTables1000000001000 implements MigrationInterface {
  name = 'V1CreateTables1000000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE categorias (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ADMIN', 'CLIENTE')),
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL CHECK (preco >= 0),
    moeda VARCHAR(3) DEFAULT 'BRL' NOT NULL,
    url_imagem VARCHAR(255),
    peso_kg DECIMAL(10,2) CHECK (peso_kg >= 0),
    altura_cm INTEGER CHECK (altura_cm >= 0 AND altura_cm <= 1000),
    largura_cm INTEGER CHECK (largura_cm >= 0 AND largura_cm <= 1000),
    comprimento_cm INTEGER CHECK (comprimento_cm >= 0 AND comprimento_cm <= 1000),
    categoria_id BIGINT,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT fk_produtos_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE SET NULL
);

CREATE TABLE estoques (
    id BIGSERIAL PRIMARY KEY,
    produto_id UUID NOT NULL UNIQUE,
    quantidade INTEGER DEFAULT 0 NOT NULL CHECK (quantidade >= 0),
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT fk_estoques_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE CASCADE
);

CREATE TABLE carrinhos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO'
        CHECK (status IN ('ATIVO', 'FINALIZADO', 'ABANDONADO')),
    valor_total DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (valor_total >= 0),
    quantidade_total INTEGER DEFAULT 0 NOT NULL CHECK (quantidade_total >= 0),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT fk_carrinhos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE TABLE itens_carrinho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrinho_id UUID NOT NULL,
    produto_id UUID NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10,2) NOT NULL CHECK (preco_unitario >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),

    CONSTRAINT fk_itens_carrinho_carrinho
        FOREIGN KEY (carrinho_id)
        REFERENCES carrinhos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_itens_carrinho_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE RESTRICT,

    CONSTRAINT uk_carrinho_produto
        UNIQUE (carrinho_id, produto_id)
);

CREATE TABLE pedidos (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id       UUID                                NOT NULL,
    status           VARCHAR(20)  DEFAULT 'CRIADO'       NOT NULL CHECK (status IN ('CRIADO', 'PAGO', 'ENVIADO', 'ENTREGUE', 'CANCELADO')),
    subtotal         DECIMAL(10,2)                       NOT NULL CHECK (subtotal >= 0),
    valor_frete      DECIMAL(10,2) DEFAULT 0.00          NOT NULL CHECK (valor_frete >= 0),
    valor_desconto   DECIMAL(10,2) DEFAULT 0.00          NOT NULL CHECK (valor_desconto >= 0),
    valor_total      DECIMAL(10,2)                       NOT NULL CHECK (valor_total >= 0),
    quantidade_itens INTEGER       DEFAULT 0             NOT NULL CHECK (quantidade_itens >= 0),
    endereco_entrega VARCHAR(500)                        NOT NULL,
    observacoes      VARCHAR(1000),
    codigorastreio   VARCHAR(100),
    transportadora   VARCHAR(100),
    data_criacao     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_atualizacao TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_pagamento   TIMESTAMP,
    data_envio       TIMESTAMP,
    data_entrega     TIMESTAMP,

    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

CREATE TABLE itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL,
    produto_id UUID NOT NULL,
    produto_nome VARCHAR(200) NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10,2) NOT NULL CHECK (preco_unitario >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),

    CONSTRAINT fk_itens_pedido_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_itens_pedido_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE RESTRICT
);

CREATE TABLE pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL,
    metodo VARCHAR(30) NOT NULL CHECK (metodo IN ('CARTAO', 'PIX', 'BOLETO')),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'FAILED')),
    valor DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
    moeda_pagamento VARCHAR(3) DEFAULT 'BRL' NOT NULL,
    processado_em TIMESTAMP,

    CONSTRAINT fk_pagamentos_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);

CREATE TABLE entregas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED'
        CHECK (status IN ('CREATED', 'SHIPPED', 'DELIVERED')),
    endereco_entrega TEXT NOT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT fk_entregas_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);

CREATE TABLE notificacoes (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('EMAIL', 'SMS')),
    mensagem TEXT NOT NULL,
    enviado BOOLEAN DEFAULT FALSE NOT NULL,
    enviado_em TIMESTAMP,

    CONSTRAINT fk_notificacoes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE TABLE eventos_dominio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
    `);
  }

  // Down is intentionally left empty; production would add full rollback.
  // For this port we only need forward migrations to match the Java schema.

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
