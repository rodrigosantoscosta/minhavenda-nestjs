export class EntityAlreadyExistsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EntityAlreadyExistsException';
  }
}
