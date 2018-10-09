import Indexer from './indexer';
import bodyParser from 'body-parser';
import express from 'express';

const app = express();
app.use(bodyParser.json());
const port = 3000;
const indexer = new Indexer('/tmp/test');

app.post('/index', async (req, res) => {
  const data = req.body;
  await indexer.index(data);
  res.sendStatus(200);
});

app.get('/search', async (req, res) => {
  const searchText = req.query.q;
  console.log(searchText);
  const result = await indexer.search(searchText);
  res.json(result);
});

app.listen(port, () =>
  console.log(`Search engine is running on port ${port}!`)
);
