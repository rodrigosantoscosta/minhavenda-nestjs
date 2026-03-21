import { Inject, Injectable } from '@nestjs/common';
import {
  IProdutoRepository,
  IPRODUTO_REPOSITORY,
} from '@domain/repositories/iproduto.repository';
import {
  ICategoriaRepository,
  ICATEGORIA_REPOSITORY,
} from '@domain/repositories/icategoria.repository';
import { Money } from '@domain/value-objects/money.value-object';
import { AtualizarProdutoDto } from '@app/dtos/produto/atualizar-produto.dto';
import { ProdutoDto } from '@app/dtos/produto/produto.dto';
import { ProdutoMapper } from '@app/mappers/produto.mapper';
import { AppCacheService } from '@infra/cache/cache.service';
import { CACHE_KEYS, CACHE_PREFIXES } from '@infra/cache/cache-keys.constant';

@Injectable()
export class AtualizarProdutoUseCase {
  constructor(
    @Inject(IPRODUTO_REPOSITORY)
    private readonly produtoRepo: IProdutoRepository,
    @Inject(ICATEGORIA_REPOSITORY)
    private readonly categoriaRepo: ICategoriaRepository,
    private readonly cacheService: AppCacheService,
  ) {}

  async executar(id: string, dto: AtualizarProdutoDto): Promise<ProdutoDto> {
    const produto = await this.produtoRepo.findByIdOrThrow(id);

    if (dto.nome !== undefined) produto.nome = dto.nome.trim();
    if (dto.descricao !== undefined) produto.descricao = dto.descricao.trim();
    if (dto.preco !== undefined) produto.preco = Money.of(dto.preco);
    if (dto.urlImagem !== undefined) produto.urlImagem = dto.urlImagem;
    if (dto.pesoKg !== undefined) produto.pesoKg = dto.pesoKg;
    if (dto.alturaCm !== undefined) produto.alturaCm = dto.alturaCm;
    if (dto.larguraCm !== undefined) produto.larguraCm = dto.larguraCm;
    if (dto.comprimentoCm !== undefined)
      produto.comprimentoCm = dto.comprimentoCm;
    if (dto.ativo !== undefined) produto.ativo = dto.ativo;

    if (dto.categoriaId !== undefined) {
      // null explicitly passed → remove category association
      produto.categoria = dto.categoriaId
        ? await this.categoriaRepo.findByIdOrThrow(dto.categoriaId)
        : null;
    }

    const updated = await this.produtoRepo.save(produto);

    // Bust the specific product entry and all listing variants
    await Promise.all([
      this.cacheService.del(CACHE_KEYS.PRODUTO_BY_ID(id)),
      this.cacheService.delByPrefix(CACHE_PREFIXES.PRODUTOS_LISTA),
    ]);

    return ProdutoMapper.toDto(updated);
  }
}
