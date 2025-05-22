export class MidtransError extends Error {
  details: string;
  constructor(name: string, details: string) {
    super(`${name} \n ${details}`);
    this.details = details;
    this.name = name;
  }
}
