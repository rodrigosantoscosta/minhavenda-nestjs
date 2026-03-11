export interface PedidoPagoMessage {
  eventId: string;
  pedidoId: string;
  usuarioId: string;
  emailUsuario: string;
  valorPago: number;
  metodoPagamento: string;
  ocorridoEm: string;
}
