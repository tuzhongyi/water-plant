export class LocationTool {
  static query = {
    decode(url: string) {
      let index = url.indexOf('?')
      let search = url.substring(index + 1)
      let result: any = {}
      let keyValues = search.split('&')
      for (let i = 0; i < keyValues.length; i++) {
        let keyValue = keyValues[i].split('=')
        let key = keyValue[0]
        let value = keyValue[1]
        result[key] = decodeURIComponent(value)
      }
      return result
    },
    encode(url: string, params: { [key: string]: string }) {
      let index = 0
      for (const key in params) {
        if (index === 0) {
          url += '?'
        } else {
          url += '&'
        }
        url += `${key}=${encodeURIComponent(params[key])}`
        index++
      }
      return url
    },
  }
}
