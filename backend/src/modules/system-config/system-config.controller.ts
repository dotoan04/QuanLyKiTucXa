import { Request, Response, NextFunction } from 'express'
import { systemConfigService } from './system-config.service'
import { sendSuccess } from '../../common/utils/response'

class SystemConfigController {
  getAll = async (req: Request, res: Response, _next: NextFunction) => {
    const configs = await systemConfigService.getAll()
    return sendSuccess(res, configs)
  }

  getByKey = async (req: Request, res: Response, _next: NextFunction) => {
    const { key } = req.params
    const config = await systemConfigService.getByKey(key)
    return sendSuccess(res, config)
  }

  set = async (req: Request, res: Response, _next: NextFunction) => {
    const { key } = req.params
    const { value, description } = req.body
    const config = await systemConfigService.set(key, value, description)
    return sendSuccess(res, config)
  }

  setBatch = async (req: Request, res: Response, _next: NextFunction) => {
    const configs = req.body
    const result = await systemConfigService.setBatch(configs)
    return sendSuccess(res, result)
  }
}

export const systemConfigController = new SystemConfigController()
