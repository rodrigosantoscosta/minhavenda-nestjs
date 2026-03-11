import Decimal from 'decimal.js';
import { BusinessException } from '../exceptions/business.exception';

export class Money {
  private readonly _valor: Decimal;
  private readonly _moeda: 'BRL';

  private constructor(valor: Decimal, moeda: 'BRL' = 'BRL') {
    if (valor.isNegative()) {
      throw new BusinessException('Valor monetário não pode ser negativo');
    }

    this._valor = valor;
    this._moeda = moeda;
  }

  static of(valor: number | string | Decimal): Money {
    return new Money(new Decimal(valor));
  }

  static zero(): Money {
    return new Money(new Decimal(0));
  }

  get valor(): Decimal {
    return this._valor;
  }

  get moeda(): 'BRL' {
    return this._moeda;
  }

  somar(outro: Money): Money {
    this.ensureSameCurrency(outro);
    return new Money(this._valor.add(outro._valor));
  }

  subtrair(outro: Money): Money {
    this.ensureSameCurrency(outro);
    const resultado = this._valor.sub(outro._valor);
    if (resultado.isNegative()) {
      throw new BusinessException('Resultado monetário não pode ser negativo');
    }

    return new Money(resultado);
  }

  multiplicar(quantidade: number): Money {
    if (quantidade < 0) {
      throw new BusinessException(
        'Quantidade para multiplicação não pode ser negativa',
      );
    }

    return new Money(this._valor.mul(quantidade));
  }

  maiorQue(outro: Money): boolean {
    this.ensureSameCurrency(outro);
    return this._valor.gt(outro._valor);
  }

  private ensureSameCurrency(outro: Money): void {
    if (this._moeda !== outro._moeda) {
      throw new BusinessException('Moedas diferentes não podem ser combinadas');
    }
  }
}
