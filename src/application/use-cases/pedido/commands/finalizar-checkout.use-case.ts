import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ICarrinhoRepository,
  ICARRINHO_REPOSITORY,
} from '@domain/repositories/icarrinho.repository';
import {
  IEstoqueRepository,
  IESTOQUE_REPOSITORY,
} from '@domain/repositories/iestoque.repository';
import {
  IPedidoRepository,
  IPEDIDO_REPOSITORY,
} from '@domain/repositories/ipedido.repository';
import { Pedido } from '@domain/entities/pedido.entity';
import { Estoque } from '@domain/entities/estoque.entity';
import { Carrinho } from '@domain/entities/carrinho.entity';
import { BusinessException } from '@domain/exceptions/business.exception';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { CheckoutRequestDto } from '@app/dtos/pedido/checkout-request.dto';
import { PedidoDetalhadoDto } from '@app/dtos/pedido/pedido-detalhado.dto';
import { PedidoMapper } from '@app/mappers/pedido.mapper';

@Injectable()
export class FinalizarCheckoutUseCase {
  constructor(
    @Inject(ICARRINHO_REPOSITORY)
    private readonly carrinhoRepo: ICarrinhoRepository,
    @Inject(IESTOQUE_REPOSITORY)
    private readonly estoqueRepo: IEstoqueRepository,
    @Inject(IPEDIDO_REPOSITORY) private readonly pedidoRepo: IPedidoRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async executar(
    usuarioId: string,
    dto: CheckoutRequestDto,
  ): Promise<PedidoDetalhadoDto> {
    // 1. Load and validate cart (fast fail before opening a transaction)
    const carrinho = await this.carrinhoRepo.findAtivoByUsuarioId(usuarioId);
    if (!carrinho) {
      throw new ResourceNotFoundException('Carrinho ativo não encontrado');
    }
    if (carrinho.itens.length === 0) {
      throw new BusinessException(
        'Não é possível fazer checkout com carrinho vazio',
      );
    }

    // 2. Validate stock for every item (fast fail)
    const estoques: Estoque[] = [];
    for (const item of carrinho.itens) {
      const estoque = await this.estoqueRepo.findByProdutoIdOrThrow(
        item.produto.id,
      );
      if (!estoque.temEstoqueSuficiente(item.quantidade)) {
        throw new BusinessException(
          `Estoque insuficiente para "${item.produto.nome}". Disponível: ${estoque.quantidade}, Solicitado: ${item.quantidade}`,
        );
      }
      estoques.push(estoque);
    }

    // 3. Build Pedido domain object (pure; no I/O)
    const pedido = Pedido.criarDoCarrinho({
      usuario: carrinho.usuario,
      itensCarrinho: carrinho.itens,
      enderecoEntrega: dto.enderecoEntrega,
      observacoes: dto.observacoes,
      telefoneUsuario: dto.telefoneUsuario,
    });

    // Collect events before the transaction so they can be published after commit
    const events = pedido.consumeEvents();

    // 4. Persist atomically
    await this.dataSource.transaction(async (manager) => {
      // Reserve stock for each cart item
      for (let i = 0; i < carrinho.itens.length; i++) {
        estoques[i].reservar(carrinho.itens[i].quantidade);
        await manager.save(Estoque, estoques[i]);
      }

      // Mark cart as finalised so it can no longer be modified
      carrinho.finalizar();
      await manager.save(Carrinho, carrinho);

      // Insert pedido + itens (cascade)
      await manager.save(Pedido, pedido);
    });

    // 5. Publish domain events after successful commit
    for (const event of events) {
      this.eventEmitter.emit(event.eventType, event);
    }

    // 6. Reload with full relations for the response DTO
    return PedidoMapper.toDetalhadoDto(
      await this.pedidoRepo.findByIdOrThrow(pedido.id),
    );
  }
}
