class WhiteSpaceTokenizer {
  static tokenize(text) {
    return text.split(' ').filter(value => value.length);
  }
}

export default WhiteSpaceTokenizer;
