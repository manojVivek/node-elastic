class EnglishLangNormalizer {
  static normalize(tokens) {
    return tokens.map(token => token.toLowerCase().replace(/[^a-z]/g, ''));
  }
}

export default EnglishLangNormalizer;
