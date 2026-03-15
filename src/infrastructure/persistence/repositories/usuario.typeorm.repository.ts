import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '@domain/entities/usuario.entity';
import {
  IUsuarioRepository,
  assertUsuarioFound,
} from '@domain/repositories/iusuario.repository';

@Injectable()
export class UsuarioTypeOrmRepository implements IUsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>,
  ) {}

  async findById(id: string): Promise<Usuario | null> {
    return this.repo.findOneBy({ id });
  }

  async findByIdOrThrow(id: string): Promise<Usuario> {
    const usuario = await this.findById(id);
    return assertUsuarioFound(usuario, id, 'id');
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    // email column stores the plain string; the transformer converts on read
    return this.repo
      .createQueryBuilder('u')
      .where('u.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('u')
      .where('u.email = :email', { email: email.toLowerCase() })
      .getCount();
    return count > 0;
  }

  async findAll(): Promise<Usuario[]> {
    return this.repo.find();
  }

  async save(usuario: Usuario): Promise<Usuario> {
    return this.repo.save(usuario);
  }
}
