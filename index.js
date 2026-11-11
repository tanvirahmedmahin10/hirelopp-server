import express from 'express';
import cors from 'cors'
import 'dotenv/config'
import { MongoClient } from 'mongodb';

const app = express();
const port = 8000;
app.use(cors())
app.use(express.json())
app.get('/', (req, res) => {
  res.send('Hello World!');
});

const client = new MongoClient(process.env.MONGO_DB_URL);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const connectedClient=await connectToMongoDB()
 const database = connectedClient.db("hireloop_users");
     const allUsers = database.collection("user");
     const jobs=database.collection("job")
 
app.get('/all', async(req, res) => {
      const cursor = allUsers.find({});
  const allValues = await cursor.toArray();
  res.send(allValues);
});
app.post('/jobs', async(req, res) => {
      const query = req.body
  const addValues = await jobs.insertOne(query)
  res.send(addValues);
});
app.get('/jobs', async(req, res) => {
      const cursor = jobs.find({});
  const allValues = await cursor.toArray();
  res.send(allValues);
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});