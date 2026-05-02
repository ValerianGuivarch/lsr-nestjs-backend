export type LinkedObject<
  T extends {
    id: string
  }
> = Pick<T, 'id'>
