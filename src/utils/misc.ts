import {SimpleListrRenderer} from "./simple-listr-renderer";

export interface Duration {
  seconds: number;
  minutes: number;
  hours: number;
}

export function getDuration(seconds: number): Duration  {
  let s = seconds
  let m = 0
  let h = 0
  if (s > 60) {
    m = Math.floor(s / 60)
    s %= 60
  }
  if (m > 60) {
    h = Math.floor(m / 60)
    m %= 60
  }

  return {
    seconds: s,
    minutes: m,
    hours: h,
  }
}

export function formatDuration(d: Duration, ms = 0): string {
  const h = (d.hours > 10) ? `${d.hours}` : `0${d.hours}`
  const m = (d.minutes > 10) ? `${d.minutes}` : `0${d.minutes}`
  const s = (d.seconds > 10) ? `${d.seconds}` : `0${d.seconds}`
  const millis = ms.toFixed(2)
  let ret = ''
  if (d.hours > 0 || d.minutes > 0 || d.seconds > 0) {
    ret = `${h}:${m}:${s}`
  }
  if (ms > 0) {
    if (ret.length > 0) {
      ret += ' '
    }
    ret += `${millis}ms`
  }

  if (ret.length === 0) {
    ret = '0.00ms'
  }
  return ret
}

export function getListrRenderer() {
  if (!process.stdout.isTTY) {
    return SimpleListrRenderer
  }
  return null
}
