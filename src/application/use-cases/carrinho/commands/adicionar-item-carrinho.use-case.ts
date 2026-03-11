import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ICarrinhoRepository,
  ICARRINHO_REPOSITORY,
} from '@domain/repositories/icarrinho.repository';
import {
  IProdutoRepository,
  IPRODUTO_REPOSITORY,
} from '@domain/repositories/iproduto.repository';
import {
  IEstoqueRepository,
  IESTOQUE_REPOSITORY,
} from '@domain/repositories/iestoque.repository';
import { Carrinho } from '@domain/entities/carrinho.entity';
import { ItemCarrinho } from '@domain/entities/item-carrinho.entity';
import { Usuario } from '@domain/entities/usuario.entity';
import { StatusCarrinho } from '@domain/enums/status-carrinho.enum';
import { BusinessException } from '@domain/exceptions/business.exception';
import { AdicionarItemCarrinhoDto } from '@app/dtos/carrinho/adicionar-item-carrinho.dto';
import { CarrinhoDto } from '@app/dtos/carrinho/carrinho.dto';
import { CarrinhoMapper } from '@app/mappers/carrinho.mapper';

@Injectable()
export class AdicionarItemCarrinhoUseCase {
  constructor(
    @Inject(ICARRINHO_REPOSITORY)
    private readonly carrinhoRepo: ICarrinhoRepository,
    @Inject(IPRODUTO_REPOSITORY)
    private readonly produtoRepo: IProdutoRepository,
    @Inject(IESTOQUE_REPOSITORY)
    private readonly estoqueRepo: IEstoqueRepository,
  ) {}

  async executar(
    usuarioId: string,
    dto: AdicionarItemCarrinhoDto,
  ): Promise<CarrinhoDto> {
    // 1. Get or create active cart
    const carrinho = await this.obterOuCriarCarrinho(usuarioId);

    // 2. Validate produto exists and is active
    const produto = await this.produtoRepo.findByIdOrThrow(dto.produtoId);
    if (!produto.ativo) {
      throw new BusinessException('Produto não está disponível para compra');
    }

    // 3. Validate stock — account for any quantity already in the cart
    const estoque = await this.estoqueRepo.findByProdutoIdOrThrow(
      dto.produtoId,
    );
    const itemExistente = carrinho.itens.find(
      (i) => i.produto.id === dto.produtoId,
    );
    const quantidadeJaNoCarrinho = itemExistente?.quantidade ?? 0;
    const quantidadeTotal = quantidadeJaNoCarrinho + dto.quantidade;

    if (!estoque.temEstoqueSuficiente(quantidadeTotal)) {
      throw new BusinessException(
        `Estoque insuficiente. Disponível: ${estoque.quantidade}, já no carrinho: ${quantidadeJaNoCarrinho}`,
      );
    }

    // 4. Add item via domain method — merges into existing or pushes new
    const novoItem = new ItemCarrinho({
      id: randomUUID(),
      carrinho,
      produto,
      quantidade: dto.quantidade,
      precoUnitario: produto.preco.valor.toNumber(),
      subtotal: produto.preco.valor.toNumber() * dto.quantidade,
    });

    carrinho.adicionarItem(novoItem);

    // 5. Persist — cascade saves/updates items
    const saved = await this.carrinhoRepo.save(carrinho);
    return CarrinhoMapper.toDto(saved);
  }

  private async obterOuCriarCarrinho(usuarioId: string): Promise<Carrinho> {
    const ativo = await this.carrinhoRepo.findAtivoByUsuarioId(usuarioId);
    if (ativo) return ativo;

    const usuarioRef = Object.assign(new Usuario(), {
      id: usuarioId,
    }) as Usuario;
    const novoCarrinho = new Carrinho({
      id: randomUUID(),
      usuario: usuarioRef,
      status: StatusCarrinho.ATIVO,
      itens: [],
      valorTotal: 0,
      quantidadeTotal: 0,
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
    });

    return this.carrinhoRepo.save(novoCarrinho);
  }
}
