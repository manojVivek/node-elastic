import async from 'async';
import fs from 'fs-extra';
import randomAccessFile from 'random-access-file';
import path from 'path';

export async function appendToFile(file, data) {
  await fs.ensureFile(file);
  return new Promise((resolve, reject) => {
    fs.appendFile(file, data, err => (err ? reject(err) : resolve()));
  });
}

export async function writeToFile(file, data) {
  await fs.ensureFile(file);
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, err => (err ? reject(err) : resolve()));
  });
}

export function readContent(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, {encoding: 'utf8'}, (err, result) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve('');
        }
        return reject(err);
      }
      if (!result) {
        return resolve('');
      }
      return resolve(result);
    });
  });
}

export function ensureDir(dir) {
  return fs.ensureDirSync(dir);
}

export async function readCsv(path) {
  const content = await readContent(path);
  return content.split(',').filter(entry => entry.length);
}

export async function readFromOffset(path, offset, EOF) {
  return new Promise((resolve, reject) => {
    const file = randomAccessFile(path);
    let isReading = true;
    let doc = '';
    let currentOffset = offset;
    const chunkSize = 10;
    fs.stat(path).then(stats => {
      const fileSize = stats.size;
      async.whilst(
        () => isReading,
        cb => {
          if (currentOffset >= fileSize) {
            isReading = false;
            return cb();
          }
          let readSize =
            currentOffset + chunkSize > fileSize
              ? fileSize - currentOffset
              : chunkSize;
          file.read(currentOffset, readSize, (err, buffer) => {
            if (err) {
              return cb(err);
            }
            const data = buffer.toString('utf8');
            doc += data;
            if (doc.indexOf(EOF) > -1) {
              doc = doc.split(EOF)[0];
              isReading = false;
              return file.close(() => cb());
            }
            currentOffset += readSize;
            return cb();
          });
        },
        err => (err ? reject(err) : resolve(doc))
      );
    });
  });
}

export default {
  appendToFile,
  ensureDir,
  readCsv,
  readFromOffset,
  writeToFile,
  readContent,
};
