import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '@domain/entities/categoria.entity';
import {
  ICategoriaRepository,
  assertCategoriaFound,
} from '@domain/repositories/icategoria.repository';

@Injectable()
export class CategoriaTypeOrmRepository implements ICategoriaRepository {
  constructor(
    @InjectRepository(Categoria)
    private readonly repo: Repository<Categoria>,
  ) {}

  async findById(id: number): Promise<Categoria | null> {
    return this.repo.findOneBy({ id });
  }

  async findByIdOrThrow(id: number): Promise<Categoria> {
    const categoria = await this.findById(id);
    return assertCategoriaFound(categoria, id);
  }

  async findAll(): Promise<Categoria[]> {
    return this.repo.find({ order: { nome: 'ASC' } });
  }

  async save(categoria: Categoria): Promise<Categoria> {
    return this.repo.save(categoria);
  }

  async deleteById(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
