export const assertFiniteNumber = (value: number, label: string): void => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number, got ${value}`)
  }
}

export const assertFinitePositiveInteger = (value: number, label: string): void => {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be an integer >= 1, got ${value}`)
  }
}
