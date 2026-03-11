import { Inject, Injectable } from '@nestjs/common';
import {
  IProdutoRepository,
  IPRODUTO_REPOSITORY,
} from '@domain/repositories/iproduto.repository';

@Injectable()
export class ExcluirProdutoUseCase {
  constructor(
    @Inject(IPRODUTO_REPOSITORY)
    private readonly produtoRepo: IProdutoRepository,
  ) {}

  async executar(id: string): Promise<void> {
    // Confirm the produto exists — throws ResourceNotFoundException if not
    await this.produtoRepo.findByIdOrThrow(id);
    await this.produtoRepo.deleteById(id);
  }
}
