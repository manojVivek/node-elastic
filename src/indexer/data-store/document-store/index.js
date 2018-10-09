import async from 'async';
import path from 'path';
import uuid from 'uuid/v4';
import fs from 'fs-extra';
import {
  appendToFile,
  ensureDir,
  readFromOffset,
  writeToFile,
  readContent,
} from '../../../commons/fsUtils';

class DefaultDocumentStore {
  /*
    Exposes following functions:
    storeDocument(doc) -> Stores the document and returns an id to access it.
    getDocument(documentId) -> Retrieves the document with given id.
    docsCount() - Returns the total count of the docs in the store.

    Description: A document store that stores documents contigiously in data
    files and uses the combination of data file name and offset as the stored
    documents internal id.

    Eg. A document stored in file `abcd` at an offset of 100th byte will have
    its id as: `abcd:100` which will be used to retrieve the document when
    needed later.

    To improve the efficiency to index parallel requests, the document store will
    create new data file when all current data files are being locked for writing.
  */
  constructor(_basePath) {
    this.basePath = _basePath;
    ensureDir(this.basePath);
    this.DOC_DELIMITER = '||||';
    this.FILE_OFFSET_DELIMITER = ':';
    this.allFiles = fs
      .readdirSync(this.basePath)
      .filter(entry => entry.startsWith('data'))
      .filter(entry => !entry.endsWith('.count'))
      .filter(entry => fs.statSync(path.join(this.basePath, entry)).isFile())
      .reduce((result, entry) => {
        result[entry] = false; // false as the file is not being written right now.
        return result;
      }, {});
  }

  getDocument(id) {
    const [fileName, offset] = id.split(this.FILE_OFFSET_DELIMITER);
    return readFromOffset(
      path.join(this.basePath, fileName),
      parseInt(offset, 10),
      this.DOC_DELIMITER
    );
  }

  storeDocument(data) {
    return new Promise((resolve, reject) => {
      let offset;
      const fileName = this._getAFreeFile();
      const filePath = path.join(this.basePath, fileName);
      const dataToWrite = data + this.DOC_DELIMITER;
      const that = this;
      fs.stat(filePath, function(err, stats) {
        if (err) {
          return reject(err);
        }
        offset = stats.size;
        appendToFile(filePath, dataToWrite).then(() => {
          return that._incrementCount(fileName).then(() => {
            that._releaseFile(fileName);
            resolve(fileName + that.FILE_OFFSET_DELIMITER + offset);
          });
        });
      });
    });
  }

  docsCount() {
    return new Promise((resolve, reject) => {
      async.map(
        Object.keys(this.allFiles),
        (fileName, cb) => {
          const countFile = this._getCountFilepath(fileName);
          readContent(countFile)
            .then(count => cb(null, parseInt(count, 10)))
            .catch(cb);
        },
        (err, results) => {
          if (err) {
            return reject(err);
          }
          return resolve(results.reduce((result, count) => result + count, 0));
        }
      );
    });
  }

  _incrementCount(fileName) {
    const countFilePath = this._getCountFilepath(fileName);
    return readContent(countFilePath)
      .then(countStr => parseInt(countStr, 10) + 1)
      .then(count => writeToFile(countFilePath, count.toString()));
  }

  _getCountFilepath(fileName) {
    return path.join(this.basePath, fileName + '.count');
  }

  _releaseFile(fileName) {
    this.allFiles[fileName] = false;
  }

  _getAFreeFile() {
    let freeFile;
    Object.keys(this.allFiles).some(file => {
      if (this.allFiles[file]) {
        return false;
      }
      freeFile = file;
      return true;
    });
    if (freeFile) {
      this.allFiles[freeFile] = true;
      return freeFile;
    }
    const newFile = this._createANewFile();
    this.allFiles[newFile] = true;
    return newFile;
  }

  _createANewFile() {
    while (true) {
      const newFile = 'data-' + uuid().substr(0, 5);
      const fileName = path.join(this.basePath, newFile);
      if (!fs.existsSync(fileName)) {
        fs.closeSync(fs.openSync(fileName, 'w'));
        const countFilePath = this._getCountFilepath(newFile);
        fs.writeFileSync(countFilePath, '0');
        return newFile;
      }
    }
  }
}

export default DefaultDocumentStore;
