import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estoque } from '@domain/entities/estoque.entity';
import {
  assertEstoqueFound,
  assertEstoqueProdutoFound,
  IEstoqueRepository,
} from '@domain/repositories/iestoque.repository';

@Injectable()
export class EstoqueTypeOrmRepository implements IEstoqueRepository {
  constructor(
    @InjectRepository(Estoque)
    private readonly repo: Repository<Estoque>,
  ) {}

  async findById(id: number): Promise<Estoque | null> {
    return this.repo.findOne({ where: { id }, relations: ['produto'] });
  }

  async findByIdOrThrow(id: number): Promise<Estoque> {
    const estoque = await this.findById(id);
    return assertEstoqueFound(estoque, id);
  }

  async findByProdutoId(produtoId: string): Promise<Estoque | null> {
    return this.repo.findOne({
      where: { produto: { id: produtoId } },
      relations: ['produto'],
    });
  }

  async findByProdutoIdOrThrow(produtoId: string): Promise<Estoque> {
    const estoque = await this.findByProdutoId(produtoId);
    return assertEstoqueProdutoFound(estoque, produtoId);
  }

  async save(estoque: Estoque): Promise<Estoque> {
    const saved = await this.repo.save(estoque);
    // Reload with relations to guarantee a fully populated entity is returned
    return this.findByIdOrThrow(Number(saved.id));
  }
}
