import functionService from '../services/function.service'
import {RandomStrFunc} from './random-str.func'
import {RandomIntFunc} from './random-int.func'
import {RandomEmailFunc} from './random-email.func'

functionService.register(new RandomStrFunc())
functionService.register(new RandomIntFunc())
functionService.register(new RandomEmailFunc())
