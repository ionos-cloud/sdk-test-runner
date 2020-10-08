import {Driver} from '../models/driver'
import configService from '../services/config.service'

export class DriverService {
  public findDriver(name: string): Driver | undefined {
    const config = configService.get()
    return config.drivers.find(d => d.name === name)
  }
}

export default new DriverService()
