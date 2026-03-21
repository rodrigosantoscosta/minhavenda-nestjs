import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  IProdutoRepository,
  IPRODUTO_REPOSITORY,
} from '@domain/repositories/iproduto.repository';
import {
  ICategoriaRepository,
  ICATEGORIA_REPOSITORY,
} from '@domain/repositories/icategoria.repository';
import {
  IEstoqueRepository,
  IESTOQUE_REPOSITORY,
} from '@domain/repositories/iestoque.repository';
import { Produto } from '@domain/entities/produto.entity';
import { Estoque } from '@domain/entities/estoque.entity';
import { Money } from '@domain/value-objects/money.value-object';
import { CriarProdutoDto } from '@app/dtos/produto/criar-produto.dto';
import { ProdutoDto } from '@app/dtos/produto/produto.dto';
import { ProdutoMapper } from '@app/mappers/produto.mapper';
import { AppCacheService } from '@infra/cache/cache.service';
import { CACHE_PREFIXES } from '@infra/cache/cache-keys.constant';

@Injectable()
export class CriarProdutoUseCase {
  constructor(
    @Inject(IPRODUTO_REPOSITORY)
    private readonly produtoRepo: IProdutoRepository,
    @Inject(ICATEGORIA_REPOSITORY)
    private readonly categoriaRepo: ICategoriaRepository,
    @Inject(IESTOQUE_REPOSITORY)
    private readonly estoqueRepo: IEstoqueRepository,
    private readonly cacheService: AppCacheService,
  ) {}

  async executar(dto: CriarProdutoDto): Promise<ProdutoDto> {
    const categoria = dto.categoriaId
      ? await this.categoriaRepo.findByIdOrThrow(dto.categoriaId)
      : null;

    const produto = new Produto({
      id: randomUUID(),
      nome: dto.nome.trim(),
      descricao: dto.descricao.trim(),
      preco: Money.of(dto.preco),
      urlImagem: dto.urlImagem ?? null,
      pesoKg: dto.pesoKg ?? null,
      alturaCm: dto.alturaCm ?? null,
      larguraCm: dto.larguraCm ?? null,
      comprimentoCm: dto.comprimentoCm ?? null,
      categoria,
      ativo: dto.ativo ?? true,
      dataCadastro: new Date(),
    });

    const saved = await this.produtoRepo.save(produto);

    // Every new product must have a stock record (starting at zero).
    // Without this, all estoque use cases would throw ResourceNotFoundException.
    const estoque = new Estoque({
      produto: saved,
      quantidade: 0,
      atualizadoEm: new Date(),
    });
    await this.estoqueRepo.save(estoque);

    // Bust the produtos listing cache — new product must appear immediately
    await this.cacheService.delByPrefix(CACHE_PREFIXES.PRODUTOS_LISTA);

    return ProdutoMapper.toDto(saved);
  }
}
