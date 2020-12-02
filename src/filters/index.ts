import {ArrayFilter} from './array.filter'
import {NumberFilter} from './number.filter'
import filterService from '../services/filter.service'

filterService.register(new NumberFilter())
filterService.register(new ArrayFilter())
