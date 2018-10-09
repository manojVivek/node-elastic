import DefaultDocumentStore from './document-store';
import DefaultIndexStore from './index-store';
import path from 'path';

class DefaultDataStore {
  constructor(
    _basePath,
    _documentStore = DefaultDocumentStore,
    _indexStore = DefaultIndexStore
  ) {
    this.documentStore = new _documentStore(path.join(_basePath, 'docs'));
    this.indexStore = new _indexStore(path.join(_basePath, 'index'));
  }

  storeDocument(document) {
    return this.documentStore.storeDocument(document);
  }

  getDocument(id) {
    return this.documentStore.getDocument(id);
  }

  lookup(tokens) {
    return this.indexStore.lookup(tokens);
  }

  addToIndex(tokens, documentId) {
    return this.indexStore.add(tokens, documentId);
  }

  docCount() {
    return this.documentStore.docsCount();
  }
}

export default DefaultDataStore;
