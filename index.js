const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const verifyToken = require("./utils/verifyToken");
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rebh4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// middlewere
const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("safeHand");
    const volunteerCollection = db.collection("volunteer");
    const volunteerReqCollection = db.collection("request");
    // Send a ping to confirm a successful connection
    await db.command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    app.post('/createJWT', (req, res)=>{
      const {email} = req.body;
      const token = jwt.sign(email,'secret');
      res.send({token})
    })
    //create volunteer need data
    app.post("/volunteer", async (req, res) => {
      try {
        await volunteerCollection.insertOne(req.body);
        res.status(201).json({ message: "success" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error!" });
      }
    });
    // one volunteer delete
    app.delete("/volunteer/:id", async (req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await volunteerCollection.deleteOne(query);
      res.status(200).json(result);
    });
    // one volunteer update
    app.put("/volunteer/:id", async (req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const updateVolunteer = {
          $set: { ...req.body },
        }
      const result = await volunteerCollection.updateOne(query,updateVolunteer);
      console.log(result, updateVolunteer)
      res.status(200).json(result);
    });

    //get all volunteer data
    app.get("/volunteers", verifyToken, async (req, res) => {
      const data = await volunteerCollection.find().toArray();
      res.status(200).json(data);
    });
    //get single volunteer need data
    app.get("/volunteers/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const volunteer = await volunteerCollection.findOne({
          _id: new ObjectId(id),
        });
        res.status(200).json(volunteer);
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error!" });
      }
    });
    //request to join as volunteer
    app.post("/requestToJoin/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        await volunteerReqCollection.insertOne(req.body);
        const volunteer = await volunteerCollection.findOne({_id: new ObjectId(id)});
        const currentNumber = parseInt(volunteer.volunteerNumber, 10)
        const newNumber = currentNumber - 1;
        await volunteerCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: {volunteerNumber: newNumber.toString()} }
        );
        res.send("Request Successfully");
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error!" });
      }
    });
    //search by title
    app.post('/search', async(req, res)=>{
      const data = req.body.inputData;
      const searchedData = await volunteerCollection.find({ title: { $regex: data, $options: "i" } }).toArray();
      res.send(searchedData)
    })
    //volunteer by user
    app.get('/user/:email', verifyToken, async(req, res)=>{
      const email = req.params.email;
      const query = {email};
      const data = await volunteerCollection.find(query).toArray();
      res.status(200).json(data)
    })
    //volunteer request by user
    app.get('/requests/:email', verifyToken, async(req, res)=>{
      const email = req.params.email;
      const query = {email};
      const data = await volunteerReqCollection.find(query).toArray();
      res.status(200).json(data)
    })
    //cancel request
    app.delete("/requests/:id", verifyToken, async (req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await volunteerReqCollection.deleteOne(query);
      res.status(200).json(result);
    });
    //volunteer need section for home page
    app.get("/volunteersNeed", async (req, res) => {
      const data = await volunteerCollection.find().sort({ deadline: 1 }).limit(6).toArray();
      res.status(200).json(data);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is Running");
});

app.listen(port, () => {
  console.log(`server is running at port: ${port}`);
});
