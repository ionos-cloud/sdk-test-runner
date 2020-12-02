import {Filter} from '../services/filter.service'

export class NumberFilter implements Filter {
  name = 'number'

  public process(value: any): any {
    return Number(value)
  }
}
