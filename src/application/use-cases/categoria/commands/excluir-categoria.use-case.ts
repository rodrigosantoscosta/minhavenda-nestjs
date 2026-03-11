import { Inject, Injectable } from '@nestjs/common';
import {
  ICategoriaRepository,
  ICATEGORIA_REPOSITORY,
} from '@domain/repositories/icategoria.repository';

@Injectable()
export class ExcluirCategoriaUseCase {
  constructor(
    @Inject(ICATEGORIA_REPOSITORY)
    private readonly categoriaRepo: ICategoriaRepository,
  ) {}

  async executar(id: number): Promise<void> {
    // Confirm the categoria exists — throws ResourceNotFoundException if not
    await this.categoriaRepo.findByIdOrThrow(id);
    await this.categoriaRepo.deleteById(id);
  }
}
