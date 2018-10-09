import chai from 'chai';
import DocumentStore from '.';
import fs from 'fs-extra';
import path from 'path';
chai.should();

describe('Document Store Test', function() {
  let basePath;
  let store;
  beforeEach(function(done) {
    basePath = '/tmp/docStore' + Math.random();
    store = new DocumentStore(basePath);
    done();
  });

  afterEach(function(done) {
    fs.removeSync(basePath);
    done();
  });

  it('should create an data file for the given document', function(done) {
    const doc = 'test data';
    store.storeDocument(doc).then(() => {
      const contents = _readAllDocuments(basePath);
      contents.should.have.property(doc);
      done();
    });
  });

  it('should append data to same file non parallel requests', function(done) {
    const docs = ['test data1', 'test data2'];
    store
      .storeDocument(docs[0])
      .then(() => store.storeDocument(docs[1]))
      .then(() => {
        const contents = _readAllDocuments(basePath);
        contents.should.have.property(docs[0]);
        contents.should.have.property(docs[1]);
        done();
      });
  });

  it('should update count in a data file correctly', function(done) {
    const docs = ['test data1', 'test data2'];
    store
      .storeDocument(docs[0])
      .then(() => store.storeDocument(docs[1]))
      .then(() => {
        const count = _readCount(basePath);
        count.should.equal('2');
        done();
      });
  });

  it('should retrieve the document correctly after a save', function(done) {
    const doc = 'test doc';
    store.storeDocument(doc).then(documentId => {
      store
        .getDocument(documentId)
        .then(actualDocument => {
          actualDocument.should.equal(doc);
          done();
        })
        .catch(err => console.log(err));
    });
  });

  it('should retrieve multiple documents correctly after a save', function(done) {
    const doc1 = 'test doc1';
    const doc2 = 'test doc2';
    const doc3 = 'test doc3';
    let id1, id2, id3;
    store.storeDocument(doc1).then(id => {
      id1 = id;
      store.storeDocument(doc2).then(id => {
        id2 = id;
        store.storeDocument(doc3).then(id => {
          id3 = id;
          Promise.all([
            store.getDocument(id1),
            store.getDocument(id2),
            store.getDocument(id3),
          ]).then(([actualDoc1, actualDoc2, actualDoc3]) => {
            actualDoc1.should.equal(doc1);
            actualDoc2.should.equal(doc2);
            actualDoc3.should.equal(doc3);
            done();
          });
        });
      });
    });
  });

  function _readAllDocuments(basePath) {
    const contents = {};
    fs.readdirSync(basePath)
      .filter(entry => entry.startsWith('data'))
      .filter(entry => fs.statSync(path.join(basePath, entry)).isFile())
      .forEach(entry =>
        fs
          .readFileSync(path.join(basePath, entry), 'utf8')
          .split('||||')
          .forEach(content => (contents[content] = true))
      );
    return contents;
  }

  function _readCount(basePath) {
    let count;
    fs.readdirSync(basePath)
      .filter(entry => entry.startsWith('data'))
      .filter(entry => entry.endsWith('.count'))
      .filter(entry => fs.statSync(path.join(basePath, entry)).isFile())
      .forEach(
        entry => (count = fs.readFileSync(path.join(basePath, entry), 'utf8'))
      );
    return count;
  }
});
