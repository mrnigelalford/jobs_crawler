import { MongoClient } from "mongodb";
import dotenv from 'dotenv'
dotenv.config();

const dbname = 'pubsub';

const client = new MongoClient(process.env.mongo_url || '');
const db = client.db('evhunt');

const messages = db.collection('messages');

const changeStream = messages.watch([
  {
    $match: { "companyListingsUpdated": { $exists: true, isComplete: false } }
  }
]);

// message process
// post message: rivian has jobs
// go to corresponding job board
// query for jobs.  "published": true, "closed": false,


changeStream.on('change', next => {
  console.log('event: ', next);
});

/* , function (err, collection) {
  if (err) throw err;

  var latest = collection.find({}).limit(1); //.sort({ $natural: -1 })

  latest.next(function (err, doc) {
    if (err) throw err;

    var query = { _id: { $gt: doc._id } };

    var options = { tailable: true, awaitdata: true, numberOfRetries: -1 };
    var cursor = collection.find(query, options); //.sort({ $natural: 1 })

    (function next() {
      cursor.next(function (err, message) {
        if (err) throw err;
        console.log(message);
        next();
        //or better process.nextTick(() => next());
      });
    })();
  });
}); */

  //client.close();

  // Steps

  // start mongod manually
  // mongod --config /opt/homebrew/etc/mongod.conf --fork

  // shutdown mongod
  // db.adminCommand({ "shutdown" : 1 })

  rs.initiate(
    {
       _id: "myReplSet",
       version: 1,
       members: [
          { _id: 0, host : "mongodb0.example.net:27017" },
          { _id: 1, host : "mongodb1.example.net:27017" },
          { _id: 2, host : "mongodb2.example.net:27017" }
       ]
    }
 )

 rs.initiate(
  {
     _id: "rs0",
     version: 1,
     members: [
        { _id: 0, host : "mongodb0.example.net:27017" },
        { _id: 1, host : "mongodb1.example.net:27017" },
        { _id: 2, host : "mongodb2.example.net:27017" }
     ]
  }
)

// 4JnY7ypZt!^3