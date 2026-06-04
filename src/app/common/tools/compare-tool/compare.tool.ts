export class LocaleCompare {
  static compare(a: any, b: any, isAsc: boolean = true) {
    if (a === b) return 0
    if (a === undefined) return 1
    if (b === undefined) return -1
    if (a === null) return 1
    if (b === null) return -1

    if (typeof a == 'string' && typeof b == 'string') {
      if (this._localeCompareSupportsLocales()) {
        let collator = new Intl.Collator('zh-CN', {
          caseFirst: 'upper',
          sensitivity: 'variant',
          numeric: true,
        })
        return collator.compare(a, b) * (isAsc ? 1 : -1)
      } else {
        return (a.length - b.length || a.localeCompare(b)) * (isAsc ? 1 : -1)
      }
    }
    if (typeof a == 'number' && typeof b == 'number') {
      return isAsc ? a - b : b - a
    }
    if (typeof a == 'boolean' && typeof b == 'boolean') {
      return a < b ? (isAsc ? -1 : 1) : isAsc ? 1 : -1
    }
    if (a instanceof Date && b instanceof Date) {
      return (a.getTime() - b.getTime()) * (isAsc ? 1 : -1)
    }
    const aString = String(a)
    const bString = String(b)
    return (
      (aString == bString ? 0 : aString < bString ? -1 : 1) * (isAsc ? 1 : -1)
    )
  }
  private static _localeCompareSupportsLocales() {
    try {
      'foo'.localeCompare('bar', 'i')
    } catch (e: any) {
      return e.name === 'RangeError'
    }
    return false
  }
}
