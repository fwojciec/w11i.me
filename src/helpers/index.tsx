export const toKebabCase = (value: string) => {
  return value.replace(new RegExp('(\\s|_|-)+', 'gmi'), '-')
}
