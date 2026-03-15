import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from '@domain/entities/produto.entity';
import {
  FiltrosPaginados,
  FiltrosProduto,
  IProdutoRepository,
  PaginatedResult,
  assertProdutoFound,
} from '@domain/repositories/iproduto.repository';

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  nome: 'produto.nome',
  preco: 'produto.preco',
  criadoEm: 'produto.criadoEm',
};

@Injectable()
export class ProdutoTypeOrmRepository implements IProdutoRepository {
  constructor(
    @InjectRepository(Produto)
    private readonly repo: Repository<Produto>,
  ) {}

  async findById(id: string): Promise<Produto | null> {
    return this.repo.findOne({ where: { id }, relations: ['categoria'] });
  }

  async findByIdOrThrow(id: string): Promise<Produto> {
    const produto = await this.findById(id);
    return assertProdutoFound(produto, id);
  }

  /**
   * Filtered product listing via QueryBuilder.
   *
   * Defaults:
   *  - ativo: true (only active products unless caller specifies otherwise)
   *  - nome / termo: ILIKE '%value%' (case-insensitive partial match)
   *  - precoMin / precoMax: inclusive range on the preco column
   *  - categoriaId: exact match via the joined categoria alias
   */
  async findAll(filtros?: FiltrosProduto): Promise<Produto[]> {
    const qb = this.buildBaseQuery(filtros);
    return qb.orderBy('produto.nome', 'ASC').getMany();
  }

  /**
   * Same filters as findAll but with LIMIT/OFFSET pagination.
   * Returns items + total count for envelope construction.
   */
  async findAllPaginated(
    filtros: FiltrosPaginados,
  ): Promise<PaginatedResult<Produto>> {
    const sortColumn =
      ALLOWED_SORT_FIELDS[filtros.sort ?? 'nome'] ?? 'produto.nome';

    const qb = this.buildBaseQuery(filtros)
      .orderBy(sortColumn, 'ASC')
      .skip(filtros.page * filtros.size)
      .take(filtros.size);

    const [items, totalElements] = await qb.getManyAndCount();
    return { items, totalElements };
  }

  async save(produto: Produto): Promise<Produto> {
    const saved = await this.repo.save(produto);
    // Reload with relations so callers always get a fully populated entity
    return this.findByIdOrThrow(saved.id);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  // ─── private helpers ────────────────────────────────────────────────────────

  private buildBaseQuery(filtros?: FiltrosProduto) {
    const qb = this.repo
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.categoria', 'categoria');

    // Default: show only active products when ativo is not explicitly provided
    const ativo = filtros?.ativo ?? true;
    qb.where('produto.ativo = :ativo', { ativo });

    // Generic search term (nome OR descrição)
    if (filtros?.termo) {
      qb.andWhere(
        '(produto.nome ILIKE :termo OR produto.descricao ILIKE :termo)',
        { termo: `%${filtros.termo}%` },
      );
    }

    // Specific nome filter (more precise than termo)
    if (filtros?.nome) {
      qb.andWhere('produto.nome ILIKE :nome', { nome: `%${filtros.nome}%` });
    }

    if (filtros?.categoriaId !== undefined) {
      qb.andWhere('categoria.id = :categoriaId', {
        categoriaId: filtros.categoriaId,
      });
    }

    if (filtros?.precoMin !== undefined) {
      qb.andWhere('produto.preco >= :precoMin', { precoMin: filtros.precoMin });
    }

    if (filtros?.precoMax !== undefined) {
      qb.andWhere('produto.preco <= :precoMax', { precoMax: filtros.precoMax });
    }

    return qb;
  }
}
