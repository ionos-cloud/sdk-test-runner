/**
 * Generates a random number between min (included) and max (included)
 * @param {number} min min
 * @param {number} max max
 *
 * @return {number} random number
 * @throws Error if min > max
 */
export function getRandomInt(min: number, max: number): number {
  const start = Math.ceil(min)
  const stop = Math.floor(max)

  if (Number(min) > Number(max)) {
    throw new Error(`getRandomInt(${min}, ${max}): min > max`)
  }
  return Math.floor(Math.random() * (stop - start + 1)) + start
}

/**
 * Generates a random string between min (included) and max (included) characters
 * @param {number} min min
 * @param {number} max max
 *
 * @return {string} random string
 * @throws Error if min > max
 */
export function getRandomStr(min: number, max: number): string {
  /* number of characters to generate */
  const n = getRandomInt(min, max)

  const getChars = (from: string, to: string): string[] => {
    const chars: string[] = []
    for (let i = from.charCodeAt(0); i <= to.charCodeAt(0); i++) {
      chars.push(String.fromCharCode(i))
    }
    return chars
  }

  /* generate array of chars to use */
  const chars = [...getChars('a', 'z'), ...getChars('A', 'Z')]

  /* generate random string */
  let ret = ''
  for (let i = 0; i < n; i++) {
    ret += chars[getRandomInt(0, chars.length - 1)]
  }

  return ret
}

