import { Pedido } from '@domain/entities/pedido.entity';
import { ItemPedido } from '@domain/entities/item-pedido.entity';
import { PedidoDto } from '../dtos/pedido/pedido.dto';
import { PedidoDetalhadoDto } from '../dtos/pedido/pedido-detalhado.dto';
import { ItemPedidoDto } from '../dtos/pedido/item-pedido.dto';

export class PedidoMapper {
  static toDto(pedido: Pedido): PedidoDto {
    const dto = new PedidoDto();
    dto.id = pedido.id;
    dto.status = pedido.status;
    // DECIMAL(10,2) columns come back as strings from the PG driver
    dto.subtotal = Number(pedido.subtotal);
    dto.valorFrete = Number(pedido.valorFrete);
    dto.valorDesconto = Number(pedido.valorDesconto);
    dto.valorTotal = Number(pedido.valorTotal);
    dto.quantidadeItens = pedido.quantidadeItens;
    dto.enderecoEntrega = pedido.enderecoEntrega;
    dto.codigoRastreio = pedido.codigoRastreio;
    dto.transportadora = pedido.transportadora;
    dto.dataCriacao = pedido.dataCriacao;
    dto.dataAtualizacao = pedido.dataAtualizacao;
    dto.dataPagamento = pedido.dataPagamento;
    dto.dataEnvio = pedido.dataEnvio;
    dto.dataEntrega = pedido.dataEntrega;
    return dto;
  }

  static toDetalhadoDto(pedido: Pedido): PedidoDetalhadoDto {
    const dto = new PedidoDetalhadoDto();
    // Base fields (reuse toDto logic)
    Object.assign(dto, PedidoMapper.toDto(pedido));
    dto.observacoes = pedido.observacoes;
    dto.itens = (pedido.itens ?? []).map((i) => PedidoMapper.toItemDto(i));
    return dto;
  }

  private static toItemDto(item: ItemPedido): ItemPedidoDto {
    const dto = new ItemPedidoDto();
    dto.id = item.id;
    dto.produtoId = item.produto?.id ?? null;
    dto.produtoNome = item.produtoNome;
    dto.quantidade = item.quantidade;
    dto.precoUnitario = Number(item.precoUnitario);
    dto.subtotal = Number(item.subtotal);
    return dto;
  }
}
