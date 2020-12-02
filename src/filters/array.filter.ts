import {Filter} from '../services/filter.service'

export class ArrayFilter implements Filter {
  name = 'Array'

  public process(value: any): any {
    if (typeof value !== 'string') {
      return value
    }
    /* split values by comma and trim every element */
    return value.split(',').map(v => v.trim())
  }
}
