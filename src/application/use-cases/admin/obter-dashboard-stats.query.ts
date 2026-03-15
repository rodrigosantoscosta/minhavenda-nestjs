import { Inject, Injectable } from '@nestjs/common';
import {
  IUsuarioRepository,
  IUSUARIO_REPOSITORY,
} from '@domain/repositories/iusuario.repository';
import {
  IPedidoRepository,
  IPEDIDO_REPOSITORY,
} from '@domain/repositories/ipedido.repository';
import {
  IProdutoRepository,
  IPRODUTO_REPOSITORY,
} from '@domain/repositories/iproduto.repository';
import {
  IEstoqueRepository,
  IESTOQUE_REPOSITORY,
} from '@domain/repositories/iestoque.repository';
import { StatusPedido } from '@domain/enums/status-pedido.enum';
import { DashboardStatsDto, EstoqueBaixoItem } from '@app/dtos/admin/dashboard-stats.dto';

const ESTOQUE_BAIXO_LIMITE = 5;
const STATUS_RECEITA = new Set([StatusPedido.PAGO, StatusPedido.ENVIADO, StatusPedido.ENTREGUE]);

@Injectable()
export class ObterDashboardStatsQuery {
  constructor(
    @Inject(IUSUARIO_REPOSITORY) private readonly usuarioRepo: IUsuarioRepository,
    @Inject(IPEDIDO_REPOSITORY) private readonly pedidoRepo: IPedidoRepository,
    @Inject(IPRODUTO_REPOSITORY) private readonly produtoRepo: IProdutoRepository,
    @Inject(IESTOQUE_REPOSITORY) private readonly estoqueRepo: IEstoqueRepository,
  ) {}

  async executar(): Promise<DashboardStatsDto> {
    const [usuarios, pedidos, produtos, estoques] = await Promise.all([
      this.usuarioRepo.findAll(),
      this.pedidoRepo.findAll(),
      this.produtoRepo.findAll(),
      this.estoqueRepo.findAll(),
    ]);

    // Group pedidos by status
    const pedidosPorStatus = Object.values(StatusPedido).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<StatusPedido, number>,
    );
    for (const pedido of pedidos) {
      pedidosPorStatus[pedido.status] = (pedidosPorStatus[pedido.status] ?? 0) + 1;
    }

    // Count active/inactive products
    const totalProdutosAtivos = produtos.filter((p) => p.ativo).length;
    const totalProdutosInativos = produtos.filter((p) => !p.ativo).length;

    // Low stock items (quantidade <= limite)
    const estoqueBaixo: EstoqueBaixoItem[] = estoques
      .filter((e) => e.quantidade <= ESTOQUE_BAIXO_LIMITE)
      .map((e) => ({
        produtoId: e.produto.id,
        nome: e.produto.nome,
        quantidade: e.quantidade,
      }));

    // Revenue: sum valorTotal for paid/shipped/delivered orders
    const receitaTotal = pedidos
      .filter((p) => STATUS_RECEITA.has(p.status))
      .reduce((sum, p) => sum + Number(p.valorTotal), 0);

    return {
      pedidosPorStatus,
      totalProdutosAtivos,
      totalProdutosInativos,
      totalUsuarios: usuarios.length,
      estoqueBaixo,
      receitaTotal,
    };
  }
}
