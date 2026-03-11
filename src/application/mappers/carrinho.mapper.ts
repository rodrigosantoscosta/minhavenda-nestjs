import { Carrinho } from '@domain/entities/carrinho.entity';
import { ItemCarrinho } from '@domain/entities/item-carrinho.entity';
import { CarrinhoDto } from '../dtos/carrinho/carrinho.dto';
import { ItemCarrinhoDto } from '../dtos/carrinho/item-carrinho.dto';

export class CarrinhoMapper {
  static toDto(carrinho: Carrinho): CarrinhoDto {
    const dto = new CarrinhoDto();
    dto.id = carrinho.id;
    dto.usuarioId = carrinho.usuario.id;
    dto.status = carrinho.status;
    dto.itens = (carrinho.itens ?? []).map((i) => CarrinhoMapper.itemToDto(i));
    // DECIMAL(10,2) from PG driver returns as string — coerce to number
    dto.valorTotal = Number(carrinho.valorTotal);
    dto.quantidadeTotal = carrinho.quantidadeTotal;
    dto.dataCriacao = carrinho.dataCriacao;
    dto.dataAtualizacao = carrinho.dataAtualizacao;
    return dto;
  }

  static itemToDto(item: ItemCarrinho): ItemCarrinhoDto {
    const dto = new ItemCarrinhoDto();
    dto.id = item.id;
    dto.produtoId = item.produto?.id ?? null;
    dto.produtoNome = item.produto?.nome ?? null;
    dto.produtoUrlImagem = item.produto?.urlImagem ?? null;
    dto.quantidade = item.quantidade;
    // DECIMAL(10,2) from PG driver — coerce
    dto.precoUnitario = Number(item.precoUnitario);
    dto.subtotal = Number(item.subtotal);
    return dto;
  }
}
