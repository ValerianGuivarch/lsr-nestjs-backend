import { createParamDecorator } from '@nestjs/common'

export const CurrentAccountDecorator = createParamDecorator((data, context) => {
  const request = context.switchToHttp().getRequest()
  return request.account
})
