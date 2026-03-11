import { Estoque } from './estoque.entity';
import { Produto } from './produto.entity';
import { Money } from '../value-objects/money.value-object';
import { BusinessException } from '../exceptions/business.exception';

function makeProduto(): Produto {
  return new Produto({
    id: 'prod-uuid-1',
    nome: 'Tablet',
    descricao: 'desc',
    preco: Money.of(1500),
    ativo: true,
    dataCadastro: new Date(),
  });
}

function makeEstoque(quantidade: number): Estoque {
  return new Estoque({
    produto: makeProduto(),
    quantidade,
    atualizadoEm: new Date(),
  });
}

describe('Estoque entity', () => {
  describe('constructor', () => {
    it('throws BusinessException when constructed with negative quantity', () => {
      expect(() => makeEstoque(-1)).toThrow(BusinessException);
    });

    it('constructs with zero quantity', () => {
      const e = makeEstoque(0);
      expect(e.quantidade).toBe(0);
    });
  });

  describe('adicionar()', () => {
    it('increases quantity', () => {
      const e = makeEstoque(10);
      e.adicionar(5);
      expect(e.quantidade).toBe(15);
    });

    it('throws on zero quantity', () => {
      expect(() => makeEstoque(10).adicionar(0)).toThrow(BusinessException);
    });

    it('throws on negative quantity', () => {
      expect(() => makeEstoque(10).adicionar(-3)).toThrow(BusinessException);
    });

    it('updates atualizadoEm', () => {
      const before = new Date(Date.now() - 1000);
      const e = makeEstoque(10);
      (e as { atualizadoEm: Date }).atualizadoEm = before;
      e.adicionar(1);
      expect(e.atualizadoEm.getTime()).toBeGreaterThan(before.getTime());
    });
  });

  describe('remover()', () => {
    it('decreases quantity', () => {
      const e = makeEstoque(20);
      e.remover(8);
      expect(e.quantidade).toBe(12);
    });

    it('throws when removal exceeds stock', () => {
      expect(() => makeEstoque(5).remover(10)).toThrow(BusinessException);
    });

    it('throws on zero quantity', () => {
      expect(() => makeEstoque(10).remover(0)).toThrow(BusinessException);
    });

    it('allows removing exactly all stock', () => {
      const e = makeEstoque(5);
      e.remover(5);
      expect(e.quantidade).toBe(0);
    });
  });

  describe('ajustar()', () => {
    it('sets quantity to the given value', () => {
      const e = makeEstoque(30);
      e.ajustar(100);
      expect(e.quantidade).toBe(100);
    });

    it('allows setting to zero', () => {
      const e = makeEstoque(10);
      e.ajustar(0);
      expect(e.quantidade).toBe(0);
    });

    it('throws on negative value', () => {
      expect(() => makeEstoque(10).ajustar(-1)).toThrow(BusinessException);
    });
  });

  describe('reservar()', () => {
    it('decreases quantity (delegates to remover)', () => {
      const e = makeEstoque(10);
      e.reservar(4);
      expect(e.quantidade).toBe(6);
    });

    it('throws when reservation exceeds stock', () => {
      expect(() => makeEstoque(3).reservar(5)).toThrow(BusinessException);
    });
  });

  describe('liberar()', () => {
    it('increases quantity (delegates to adicionar)', () => {
      const e = makeEstoque(5);
      e.liberar(3);
      expect(e.quantidade).toBe(8);
    });

    it('throws on zero quantity', () => {
      expect(() => makeEstoque(5).liberar(0)).toThrow(BusinessException);
    });
  });

  describe('temEstoqueSuficiente()', () => {
    it('returns true when stock >= requested', () => {
      expect(makeEstoque(10).temEstoqueSuficiente(10)).toBe(true);
    });

    it('returns false when stock < requested', () => {
      expect(makeEstoque(5).temEstoqueSuficiente(6)).toBe(false);
    });
  });

  describe('isSemEstoque()', () => {
    it('returns true when quantity is zero', () => {
      expect(makeEstoque(0).isSemEstoque()).toBe(true);
    });

    it('returns false when quantity > 0', () => {
      expect(makeEstoque(1).isSemEstoque()).toBe(false);
    });
  });

  describe('isEstoqueBaixo()', () => {
    it('returns true when quantity <= limiteMinimo', () => {
      expect(makeEstoque(5).isEstoqueBaixo(5)).toBe(true);
      expect(makeEstoque(3).isEstoqueBaixo(5)).toBe(true);
    });

    it('returns false when quantity > limiteMinimo', () => {
      expect(makeEstoque(6).isEstoqueBaixo(5)).toBe(false);
    });
  });
});
