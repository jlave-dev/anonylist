const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const app = express();

app.use(cors('http://localhost:8080'));
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// simple in-memory data store
const db = {};

app.get('/', (req, res) => {
  const code = req.get('X-Code');
  const items = db[code] || [];
  return res.json({ items });
});

app.post('/', (req, res) => {
  const code = req.get('X-Code');
  const { item } = req.body;
  if (db[code]) {
    if (db[code].includes(item)) {
      return res.status(409).send({ message: 'Item already exists' });
    }
    db[code].push(item);
  } else {
    db[code] = [item];
  }
  return res.sendStatus(200);
});

app.listen(8081);
