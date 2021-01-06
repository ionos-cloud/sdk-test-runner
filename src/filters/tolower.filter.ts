import {Filter} from '../services/filter.service'

export class ToLowerFilter implements Filter {
  name = 'toLower'

  public process(value: string): any {
    return value.toLowerCase()
  }
}
