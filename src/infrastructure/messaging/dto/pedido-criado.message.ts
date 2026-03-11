export interface PedidoCriadoMessage {
  eventId: string;
  pedidoId: string;
  usuarioId: string;
  emailUsuario: string;
  nomeUsuario: string;
  valorTotal: number;
  quantidadeItens: number;
  ocorridoEm: string; // ISO-8601
}
