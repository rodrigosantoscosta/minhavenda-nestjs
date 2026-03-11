import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrinho } from '@domain/entities/carrinho.entity';
import {
  ICarrinhoRepository,
  assertCarrinhoFound,
} from '@domain/repositories/icarrinho.repository';
import { StatusCarrinho } from '@domain/enums/status-carrinho.enum';

/** Relations always loaded to ensure domain methods and mappers work correctly. */
const RELATIONS = ['usuario', 'itens', 'itens.produto'];

@Injectable()
export class CarrinhoTypeOrmRepository implements ICarrinhoRepository {
  constructor(
    @InjectRepository(Carrinho)
    private readonly repo: Repository<Carrinho>,
  ) {}

  async findById(id: string): Promise<Carrinho | null> {
    return this.repo.findOne({ where: { id }, relations: RELATIONS });
  }

  async findByIdOrThrow(id: string): Promise<Carrinho> {
    const carrinho = await this.findById(id);
    return assertCarrinhoFound(carrinho, id);
  }

  async findAtivoByUsuarioId(usuarioId: string): Promise<Carrinho | null> {
    return this.repo.findOne({
      where: { usuario: { id: usuarioId }, status: StatusCarrinho.ATIVO },
      relations: RELATIONS,
    });
  }

  async save(carrinho: Carrinho): Promise<Carrinho> {
    const saved = await this.repo.save(carrinho);
    // Reload with all relations so callers always receive a fully populated entity
    return this.findByIdOrThrow(saved.id);
  }
}
