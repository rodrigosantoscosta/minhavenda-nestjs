export interface PedidoCanceladoMessage {
  eventId: string;
  pedidoId: string;
  usuarioId: string;
  emailUsuario: string;
  motivo: string;
  ocorridoEm: string;
}
