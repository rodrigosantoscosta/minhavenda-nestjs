import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from '@domain/entities/produto.entity';
import {
  FiltrosProduto,
  IProdutoRepository,
  assertProdutoFound,
} from '@domain/repositories/iproduto.repository';

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
   *  - nome:  ILIKE '%value%' (case-insensitive partial match)
   *  - precoMin / precoMax: inclusive BETWEEN on the preco column
   *  - categoriaId: exact match via the joined categoria alias
   */
  async findAll(filtros?: FiltrosProduto): Promise<Produto[]> {
    const qb = this.repo
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.categoria', 'categoria');

    // Default: show only active products when ativo is not explicitly provided
    const ativo = filtros?.ativo ?? true;
    qb.where('produto.ativo = :ativo', { ativo });

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

    return qb.orderBy('produto.nome', 'ASC').getMany();
  }

  async save(produto: Produto): Promise<Produto> {
    const saved = await this.repo.save(produto);
    // Reload with relations so callers always get a fully populated entity
    return this.findByIdOrThrow(saved.id);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
