import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacao } from '@domain/entities/notificacao.entity';
import {
  INotificacaoRepository,
  assertNotificacaoFound,
} from '@domain/repositories/inotificacao.repository';

@Injectable()
export class NotificacaoTypeOrmRepository implements INotificacaoRepository {
  constructor(
    @InjectRepository(Notificacao)
    private readonly repo: Repository<Notificacao>,
  ) {}

  async findById(id: number): Promise<Notificacao | null> {
    return this.repo.findOne({ where: { id }, relations: ['usuario'] });
  }

  async findByIdOrThrow(id: number): Promise<Notificacao> {
    const notificacao = await this.findById(id);
    return assertNotificacaoFound(notificacao, id);
  }

  async save(notificacao: Notificacao): Promise<Notificacao> {
    const saved = await this.repo.save(notificacao);
    return this.findByIdOrThrow(saved.id);
  }
}
