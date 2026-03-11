import { Produto } from '@domain/entities/produto.entity';
import { ProdutoDto } from '../dtos/produto/produto.dto';

export class ProdutoMapper {
  static toDto(produto: Produto): ProdutoDto {
    const dto = new ProdutoDto();
    dto.id = produto.id;
    dto.nome = produto.nome;
    dto.descricao = produto.descricao;
    // Convert Decimal to a plain JS number for JSON serialisation
    dto.preco = produto.preco != null ? produto.preco.valor.toNumber() : 0;
    dto.moeda = produto.moeda;
    dto.urlImagem = produto.urlImagem;
    dto.pesoKg = produto.pesoKg !== null ? Number(produto.pesoKg) : null;
    dto.alturaCm = produto.alturaCm;
    dto.larguraCm = produto.larguraCm;
    dto.comprimentoCm = produto.comprimentoCm;
    dto.categoriaId = produto.categoria ? Number(produto.categoria.id) : null;
    dto.categoriaNome = produto.categoria?.nome ?? null;
    dto.ativo = produto.ativo;
    dto.dataCadastro = produto.dataCadastro;
    return dto;
  }

  static toDtoList(produtos: Produto[]): ProdutoDto[] {
    return produtos.map((p) => ProdutoMapper.toDto(p));
  }
}
