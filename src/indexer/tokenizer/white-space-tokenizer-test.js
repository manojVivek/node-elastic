import whiteSpaceTokenizer from './white-space-tokenizer';
import chai from 'chai';
chai.should();

describe('White Space Tokenizer test', function() {
  it('should return the words as token', function() {
    const tokens = whiteSpaceTokenizer.tokenize('two words');
    tokens.should.have.length(2);
    tokens[0].should.equal('two');
    tokens[1].should.equal('words');
  });
  it('should handle multi spaced sentenses', function() {
    const tokens = whiteSpaceTokenizer.tokenize('two   words');
    tokens.should.have.length(2);
    tokens[0].should.equal('two');
    tokens[1].should.equal('words');
  });
});
