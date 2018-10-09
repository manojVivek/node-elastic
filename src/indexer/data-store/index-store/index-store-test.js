import chai from 'chai';
import IndexStore from './index';
import fs from 'fs-extra';
import path from 'path';
chai.should();

describe('Index Store Test', function() {
  let basePath;
  let store;
  before(function(done) {
    basePath = '/tmp/indexStore' + Math.random();
    store = new IndexStore(basePath);
    done();
  });

  after(function(done) {
    fs.removeSync(basePath);
    done();
  });

  it('should create an index file for the given document', function(done) {
    const documentId = Math.random().toString();
    const tf = 1;
    store.add(['testtoken'], documentId).then(() => {
      fs.readFileSync(path.join(basePath, 'te/st/to/ke/n/data'), 'utf8')
        .split(',')
        .should.include(`${documentId}||||${tf}`);
      done();
    });
  });

  it('should create an index file for the each token', function(done) {
    const documentId = Math.random().toString();
    const tf = 0.5;
    store.add(['testtoken1', 'testtoken2'], documentId).then(() => {
      fs.readFileSync(path.join(basePath, 'te/st/to/ke/n1/data'), 'utf8')
        .split(',')
        .should.include(`${documentId}||||${tf}`);
      fs.readFileSync(path.join(basePath, 'te/st/to/ke/n2/data'), 'utf8')
        .split(',')
        .should.include(`${documentId}||||${tf}`);
      done();
    });
  });

  it('should create an index file with multiple documents', function(done) {
    const documentIds = [Math.random().toString(), Math.random().toString()];
    const tf = 1;
    Promise.all([
      store.add(['testtoken'], documentIds[0]),
      store.add(['testtoken'], documentIds[1]),
    ]).then(() => {
      fs.readFileSync(path.join(basePath, 'te/st/to/ke/n/data'), 'utf8')
        .split(',')
        .should.include(`${documentIds[0]}||||${tf}`);
      fs.readFileSync(path.join(basePath, 'te/st/to/ke/n/data'), 'utf8')
        .split(',')
        .should.include(`${documentIds[1]}||||${tf}`);
      done();
    });
  });

  it('should compute the tf correctly', function(done) {
    const documentId = Math.random().toString();
    const token1Tf = 0.6666666666666666;
    const token2Tf = 0.3333333333333333;
    store
      .add(['testtoken1', 'testtoken2', 'testtoken1'], documentId)
      .then(() => {
        fs.readFileSync(path.join(basePath, 'te/st/to/ke/n1/data'), 'utf8')
          .split(',')
          .should.include(`${documentId}||||${token1Tf}`);
        fs.readFileSync(path.join(basePath, 'te/st/to/ke/n2/data'), 'utf8')
          .split(',')
          .should.include(`${documentId}||||${token2Tf}`);
        done();
      });
  });

  it('should lookup and return the document correctly', function(done) {
    const documentId = Math.random().toString();
    const tf = 1;
    store.add(['lookuptoken'], documentId).then(() => {
      store.lookup(['lookuptoken']).then(results => {
        results[0][0].should.have.property('document');
        results[0][0].document.should.equal(documentId);
        done();
      });
    });
  });

  it('should split token into 2 letter chunks', function() {
    store._tokenToPath('testtoken', 2).should.equals('te/st/to/ke/n');
  });

  it('should split token into 3 letter chunks', function() {
    store._tokenToPath('testtoken', 3).should.equals('tes/tto/ken');
  });
});
