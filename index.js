import express from 'express';
import cors from 'cors'
import 'dotenv/config'
import { MongoClient, ObjectId } from 'mongodb';
import Stripe from 'stripe';

const stripe=new Stripe(process.env.STRIPE_SECRET_KEY)
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
     const payments=database.collection('payments')
 
app.get('/all', async(req, res) => {
      const cursor = allUsers.find({});
  const allValues = await cursor.toArray();
  res.send(allValues);
});
app.get('/all/:id/premium',async(req,res)=>{
  const id=req.params.id
  const query={_id:new ObjectId(id)}
  const result=await allUsers.findOne(query,{projection:{premium:1}})
  res.send(result)
})
app.patch('/all/:id/role',async(req,res)=>{
  const id=req.params.id
  const query={_id:new ObjectId(id)}
   const updatedDoc = { $set: { role: req.body.role } }
  const result=await allUsers.updateOne(query,updatedDoc)
  res.send(result)
})

app.get('/applications', async(req, res) => {
  const query={}
  if(req.query.applicantId){
    query.applicantId=req.query.applicantId
  }
   if(req.query.jobId){
    query.jobId=req.query.jobId
  }

      const cursor = applications.find(query);
  const allValues = await cursor.toArray();
  res.send(allValues);
});
app.patch('/applications/:id',async(req,res)=>{
  const id=req.params.id
  const query={_id:new ObjectId(id)}
  const updatedDoc={
    $set:{
      status:req.body.status
    }
  }
  const result=await applications.updateOne(query,updatedDoc)
  res.send(result)})
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
   if(req.query.recruiterId){
    query.recruiterId=req.query.recruiterId
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


app.post('/payments/checkVerify',async(req,res)=>{
  const {sessionId}=req.body
  const {
    status,
    customer_email,
   metadata,
   payment_intent,
   payment_status
  }=await stripe.checkout.sessions.retrieve(sessionId)
  if (status === 'complete'&&payment_status==='paid'){
    const sessionQuery={sessionId}
    const existingPayment=await payments.findOne(sessionQuery)
    if(existingPayment){
      return res.send({success:false,msg:'already paid'})
    }
const payment={
    sessionId,
     status,
    customer_email,
   payment_intent,
   payment_status,
   userId:metadata.userId
  }
  const result=await payments.insertOne(payment)
  const query={_id:new ObjectId(metadata.userId)}
 const updatedDoc = { $set: { premium: true } }
  const updatedResult=await allUsers.updateOne(query,updatedDoc)
  res.send({success:true,result,updatedResult})
  return
  }
  res.send({mes:'payment failed'})
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});