import async from 'async';
import DefaultTokenizer from './tokenizer';
import DefaultDataStore from './data-store';
import DefaultNormalizer from './normalizer';

class Indexer {
  /*
  Exposes following functions:
  index(doc) -> indexes the given document.
  search(keyword) -> search the data for the given keyword and return the
    matching docs.

  Description: A Indexer class that lets documents to be indexed and searched
  with keywords.
  */
  constructor(
    _dataBasePath,
    _tokenizer = DefaultTokenizer,
    _normalizer = DefaultNormalizer,
    _dataStore = DefaultDataStore
  ) {
    this.indexBasePath = _dataBasePath;
    this.tokenizer = _tokenizer;
    this.normalizer = _normalizer;
    this.dataStore = new _dataStore(_dataBasePath);
  }

  async index(doc) {
    const tokens = this._preProcess(this._contentToIndex(doc));
    const documentId = await this.dataStore.storeDocument(JSON.stringify(doc));
    return this.dataStore.addToIndex(tokens, documentId);
  }

  async search(text) {
    const tokens = this._preProcess(text);
    const lookupResults = await this.dataStore.lookup(tokens);
    if (lookupResults.length === 0) {
      return [];
    }
    const totalDocsCount = await this.dataStore.docCount();
    const resultByToken = lookupResults.reduce((result, entry) => {
      result[entry[0].token] = entry;
      return result;
    }, {});
    this._computeTfIdf(resultByToken, totalDocsCount);
    const sortedResults = this._aggregateAndSortByTfidf(resultByToken);
    return this._populateContent(sortedResults);
  }

  _contentToIndex(doc) {
    return doc.title + ' ' + doc.data;
  }

  _populateContent(results) {
    return new Promise((resolve, reject) => {
      async.map(
        results,
        async (entry, cb) => {
          const document = await this.dataStore.getDocument(entry.documentId);
          return cb(null, JSON.parse(document));
        },
        (err, results) => (err ? reject(err) : resolve(results))
      );
    });
  }

  _aggregateAndSortByTfidf(results) {
    let allResults = [];
    Object.keys(results).forEach(token => {
      allResults = [...allResults, ...results[token]];
    });
    const documentsAndScore = allResults.reduce((result, entry) => {
      if (!result[entry.document]) {
        result[entry.document] = 0;
      }
      result[entry.document] += entry.tfidf;
      return result;
    }, {});
    return Object.keys(documentsAndScore)
      .map(documentId => ({
        documentId,
        score: documentsAndScore[documentId],
      }))
      .sort((a, b) => b.score - a.score);
  }

  _computeTfIdf(results, totalDocsCount) {
    Object.keys(results).forEach(token => {
      const tokenResult = results[token];
      const idf = Math.log10(totalDocsCount / tokenResult.length);
      tokenResult.forEach(result => {
        result.tfidf = idf * parseFloat(result.tf, 10);
      });
    });
  }
  _preProcess(text) {
    return this.normalizer.normalize(this.tokenizer.tokenize(text));
  }
}

export default Indexer;
