export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}
