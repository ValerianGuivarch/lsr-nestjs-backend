export interface INameProvider {
  generateName(): Promise<string>
}
