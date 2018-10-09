import async from 'async';
import {appendToFile, ensureDir, readCsv} from '../../../commons/fsUtils';
import path from 'path';

class DefaultIndexStore {
  /*
  Exposes following functions:
  lookup(tokens) -> searches the tokens and returns the doc ids
  add(tokens, documentId) -> indexes the tokens and documentId as target

  Description: A very naive implementation of the index store that reverse
  indexes given tokens by creating nested directories(name made of characters
  split from the token) and then a data file refering the document id of the
  indexed document.

  For example: To index a document with id `1000` with tokens `abcd` and `xyz`,
  the following file are created.
    /ab/cd/data  //content `1000,` (csv of doc ids)
    /xy/z/data   //content `1000,` (csv of doc ids)

  */
  constructor(_basePath) {
    this.basePath = _basePath;
    this.DELIMITER = '||||';
    ensureDir(_basePath);
  }

  lookup(tokens) {
    return new Promise((resolve, reject) => {
      async.map(
        tokens,
        (token, cb) => this._lookupEachToken(token, cb),
        (err, results) => (err ? reject(err) : resolve(results))
      );
    });
  }

  add(tokens, documentId) {
    return new Promise((resolve, reject) => {
      const tokensWithTf = this._calculateTf(tokens);
      async.each(
        tokensWithTf,
        (tokenWithTf, cb) =>
          this._processEachToken(tokenWithTf, documentId, cb),
        err => (err ? reject(err) : resolve())
      );
    });
  }

  _lookupEachToken(token, cb) {
    const filePath = this._getIndexFilePath(token);
    return readCsv(filePath)
      .then(results =>
        results.map(result => {
          const [document, tf] = result.split(this.DELIMITER);
          return {document, tf, token};
        })
      )
      .then(result => cb(null, result))
      .catch(cb);
  }

  _calculateTf(tokens) {
    const tokensWithCount = tokens.reduce((result, token) => {
      if (!result[token]) {
        result[token] = 1;
        return result;
      }
      result[token] += 1;
      return result;
    }, {});
    const tokensWithTf = Object.keys(tokensWithCount).map(token => ({
      token,
      tf: tokensWithCount[token] / tokens.length,
    }));
    return tokensWithTf;
  }

  _processEachToken({token, tf}, documentId, cb) {
    const filePath = this._getIndexFilePath(token);
    try {
      appendToFile(filePath, `${documentId}${this.DELIMITER}${tf},`).then(() =>
        cb()
      );
    } catch (err) {
      cb(err);
    }
  }

  _getIndexFilePath(token) {
    return path.join(this.basePath, this._tokenToPath(token), 'data');
  }

  _tokenToPath(token, maxChunkSize = 2) {
    return path.join(
      ...token.split('').reduce((chunks, entry) => {
        if (
          chunks.length === 0 ||
          chunks[chunks.length - 1].length === maxChunkSize
        ) {
          chunks.push('');
        }
        chunks[chunks.length - 1] += entry;
        return chunks;
      }, [])
    );
  }
}

export default DefaultIndexStore;
