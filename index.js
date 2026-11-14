import express from 'express';
import cors from 'cors'
import 'dotenv/config'
import { MongoClient, ObjectId } from 'mongodb';

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
     const applications=database.collection('applications')
 
app.get('/all', async(req, res) => {
      const cursor = allUsers.find({});
  const allValues = await cursor.toArray();
  res.send(allValues);
});
app.get('/applications', async(req, res) => {
  const query={}
  if(req.query.applicantId){
    query.userId=req.query.applicantId
  }
      const cursor = applications.find(query);
  const allValues = await cursor.toArray();
  res.send(allValues);
});
app.get('/applications/count', async(req, res) => {
  const query={}
  if(req.query.applicantId){
    query.userId=req.query.applicantId
  }
      const result = await applications.countDocuments(query);
  res.send({count:result});
});

app.post('/jobs', async(req, res) => {
      const query = req.body
  const addValues = await jobs.insertOne(query)
  res.send(addValues);
});
app.post('/applications', async(req, res) => {
      const query = req.body
  const result = await applications.insertOne(query)
  res.send(result);
});
app.get('/jobs', async(req, res) => {
  const query={}
  console.log(req.query);
  if(req.query){
   if(req.query.jobType){
    query.jobType=req.query.jobType
   }
    if(req.query.isRemote){
    query.isRemote=req.query.isRemote==='true'
   }
    if(req.query.category){
    query.category=req.query.category
   }
  }
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { company: { $regex: req.query.search,$options: 'i' } },
      { responsibilities: { $regex: req.query.search, $options: 'i' } }
    ];
  }
      const cursor = jobs.find(query);
  const allValues = await cursor.toArray();
  res.send(allValues);
});
app.get('/jobs/:id',async(req,res)=>{
  const id=req.params.id
  const query={_id:new ObjectId(id)}
  const result=await jobs.findOne(query)
  res.send(result)
})
app.del
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});