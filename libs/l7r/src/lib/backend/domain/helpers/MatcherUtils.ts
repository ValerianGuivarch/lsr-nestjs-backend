// https://stackoverflow.com/questions/26246601/wildcard-string-comparison-in-javascript
export const starWildcardMatch = (str: string, rule: string): boolean => {
  return new RegExp(
    '^' +
      rule
        .split('*')
        .map((st) => st.replace(/([.*+?^=!:${}()|\\[\]\\/\\])/g, '\\$1'))
        .join('.*') +
      '$'
  ).test(str)
}
