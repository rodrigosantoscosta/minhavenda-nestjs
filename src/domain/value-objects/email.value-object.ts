import { BusinessException } from '../exceptions/business.exception';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private readonly _valor: string;

  constructor(valor: string) {
    if (!EMAIL_REGEX.test(valor)) {
      throw new BusinessException('Email inválido');
    }

    this._valor = valor.toLowerCase();
  }

  get valor(): string {
    return this._valor;
  }
}
