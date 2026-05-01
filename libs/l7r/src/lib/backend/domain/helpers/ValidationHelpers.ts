export class ValidationHelper {
  static readonly MIN_STRING_LENGTH = 1
  static readonly REGEX_BSON_ID = '^[a-fA-F0-9]{24}$'
  static readonly NON_EMPTY_STRING = '^(?!\\s*$).+'
}
