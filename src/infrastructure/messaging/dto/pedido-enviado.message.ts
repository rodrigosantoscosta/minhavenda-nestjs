export interface PedidoEnviadoMessage {
  eventId: string;
  pedidoId: string;
  usuarioId: string;
  nomeUsuario: string;
  emailUsuario: string;
  telefone: string;
  codigoRastreio: string;
  transportadora: string;
  ocorridoEm: string;
}
