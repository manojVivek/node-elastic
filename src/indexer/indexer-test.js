import Indexer from './index';
import chai from 'chai';
import fs from 'fs-extra';
import path from 'path';
chai.should();

describe('Indexer Test', function() {
  const testDoc1 = {
    id: '1',
    title: 'quick fox',
    data: 'A fox is usually quick and brown.',
  };
  const testDoc2 = {
    id: '2',
    title: 'lazy dog',
    data: 'A quick brown fox jumped over lazy dog. A fox is always jumping.',
  };
  let basePath;
  let indexer;
  beforeEach(function(done) {
    basePath = '/tmp/docStore' + Math.random();
    indexer = new Indexer(basePath);
    done();
  });

  afterEach(function(done) {
    fs.removeSync(basePath);
    done();
  });

  it('should satisfy given test case 1 - "quick fox"', function(done) {
    _indexTestDocs(indexer).then(() => {
      indexer
        .search('quick fox')
        .then(result => {
          result.should.deep.includes(testDoc1);
          result.should.deep.includes(testDoc2);
        })
        .then(() => done());
    });
  });

  it('should satisfy given test case 2 - "dog"', function(done) {
    _indexTestDocs(indexer).then(() => {
      indexer
        .search('dog')
        .then(result => result.should.deep.equal([testDoc2]))
        .then(() => done());
    });
  });

  it('should satisfy given test case 3 - "quick dog"', function(done) {
    _indexTestDocs(indexer).then(() => {
      indexer
        .search('quick dog')
        .then(result => result.should.deep.equal([testDoc2, testDoc1]))
        .then(() => done());
    });
  });

  function _indexTestDocs(indexer) {
    return Promise.all([indexer.index(testDoc1), indexer.index(testDoc2)]);
  }
});
