import { TokenPayload } from './auth'

declare module 'express' {
  interface Request {
    user?: TokenPayload
  }
}
