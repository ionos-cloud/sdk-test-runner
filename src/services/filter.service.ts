export interface Filter {
  name: string;
  process(value: any): any;
}

export class FilterService {
  private filters: { [key: string]: Filter } = {}

  public register(filter: Filter) {
    this.filters[filter.name.toLowerCase()] = filter
  }

  public get(name: string): Filter | undefined {
    return this.filters[name.toLowerCase()]
  }
}

export default new FilterService()
