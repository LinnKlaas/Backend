// Imports
const axios = require('axios').default;
const express = require('express');
const cors = require('cors');
const mongo = require('mongodb').MongoClient;

// mongodb client init
async function initMongoDB() {
  const client = await mongo.connect('mongodb://localhost:27017/mensa')
    .catch((err) => { console.log(err); });
  const db = await client.db();
  return db;
}

//insert a document
async function updateDatabase(data){
  const db = await initMongoDB();
  const insertresult = await db.collection('essen').insertOne(data, (err) => {
    if (err) throw err;
    console.log('Document added');
  });
  return insertresult;
}

async function getFromDatabase(keyword) {
  const db = await initMongoDB();
  const getData = await db.collection('essen').find(keyword).toArray();
  return getData;
}

// Library inits
const app = express();
app.use(express.json());
app.use(cors());

let data = '';
const uri = 'https://gist.githubusercontent.com/fg-uulm/666847dd7f11607fc2b6234c6d84d188/raw/2ca994ada633143903b10b2bf7ada3fd039cae35/mensa.json';

async function getData() {
  await axios.get(uri)
    .then((req) => {
      data = req.data;
    })
    .catch(() => {
      data = undefined;
    });
}
getData();

// webserver endpoints
app.get('/mensa/:day', async (req, res) => {
  const findResults = await getFromDatabase({ day: req.params.day });
  if (findResults.length > 0) {
    res.send(findResults);
  } else {
    res.status(404).send('Error: 404');
  }
});

app.post('/mensa/insert', (req, res) => {
  //Rausfinden ob Mahlzeit für gegebene Kategorie und Tag schon existiert
  Object.keys(req.body).forEach(async (essen) => {
    // TODO: Database search by keywords / identifiying key instead of comparing the complete object (independence)
      const findResults = await getFromDatabase(essen);
      if (findResults.length === 0) {
        await updateDatabase(req.body[essen]);
        res.status(200).send();
      } else {
        res.status(409).send('Conflict: This meal already exists');
      }
    });
  });

app.get('/api/getData/', (req, res) => {
  // eslint-disable-next-line no-console
  console.log('Access');
  res.status(200).send(data);
});

// Server starten
app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Example app listening on port 3000!');
});