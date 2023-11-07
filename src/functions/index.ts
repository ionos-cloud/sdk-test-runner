import functionService from '../services/function.service'
import {RandomStrFunc} from './random-str.func'
import {RandomStrLowerFunc} from './random-str-lower.func'
import {RandomIntFunc} from './random-int.func'
import {RandomEmailFunc} from './random-email.func'

functionService.register(new RandomStrFunc())
functionService.register(new RandomStrLowerFunc())
functionService.register(new RandomIntFunc())
functionService.register(new RandomEmailFunc())
