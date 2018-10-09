import EnglishLangNormalizer from './english-lang-normalizer';
import chai from 'chai';
chai.should();

describe('English Lang Normalizer test', function() {
  it('should convert the tokens to lowercase', function() {
    const tokens = EnglishLangNormalizer.normalize(['Two', 'words']);
    tokens.should.have.length(2);
    tokens[0].should.equal('two');
    tokens[1].should.equal('words');
  });
  it('should remove all punctuations', function() {
    const tokens = EnglishLangNormalizer.normalize(['two', 'words.']);
    tokens.should.have.length(2);
    tokens[0].should.equal('two');
    tokens[1].should.equal('words');
  });
});
