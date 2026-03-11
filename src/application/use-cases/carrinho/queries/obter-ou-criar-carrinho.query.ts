import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ICarrinhoRepository,
  ICARRINHO_REPOSITORY,
} from '@domain/repositories/icarrinho.repository';
import { Carrinho } from '@domain/entities/carrinho.entity';
import { Usuario } from '@domain/entities/usuario.entity';
import { StatusCarrinho } from '@domain/enums/status-carrinho.enum';
import { CarrinhoDto } from '@app/dtos/carrinho/carrinho.dto';
import { CarrinhoMapper } from '@app/mappers/carrinho.mapper';

@Injectable()
export class ObterOuCriarCarrinhoQuery {
  constructor(
    @Inject(ICARRINHO_REPOSITORY)
    private readonly carrinhoRepo: ICarrinhoRepository,
  ) {}

  /**
   * Returns the authenticated user's active cart.
   * If no active cart exists, a new one is created transparently.
   */
  async executar(usuarioId: string): Promise<CarrinhoDto> {
    const ativo = await this.carrinhoRepo.findAtivoByUsuarioId(usuarioId);
    if (ativo) {
      return CarrinhoMapper.toDto(ativo);
    }

    // Use a partial entity reference — avoids loading the full Usuario while still
    // satisfying the FK constraint in the DB (the JWT guarantees the user exists).
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

    const saved = await this.carrinhoRepo.save(novoCarrinho);
    return CarrinhoMapper.toDto(saved);
  }
}
