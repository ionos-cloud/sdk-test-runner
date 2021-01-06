import {ArrayFilter} from './array.filter'
import {NumberFilter} from './number.filter'
import {BoolFilter} from './bool.filter'
import {ToLowerFilter} from './tolower.filter'

import filterService from '../services/filter.service'

filterService.register(new NumberFilter())
filterService.register(new ArrayFilter())
filterService.register(new BoolFilter())
filterService.register(new ToLowerFilter())
