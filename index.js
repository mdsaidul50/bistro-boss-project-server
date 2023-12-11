const express = require('express');
const app = express();
const jwt =require("jsonwebtoken")
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port =process.env.PORT||5000;

app.use(cors());
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mbtil5d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    
    const userscalection = client.db("BossDb").collection("users");
    const menucalection = client.db("BossDb").collection("menu");
    const reviewscalection = client.db("BossDb").collection("reviews");
    const addcalection = client.db("BossDb").collection("itemcard");

   //JWT related api
   
  app.post("/jwt",async(req,res)=>{
    const user =req.body;
    
    const token =jwt.sign(user,process.env.ACCESE_SECURE,{
      expiresIn:"1h"});
    res.send({token});
  })


  // miderware

  const verifytoken = (req,res,next)=>{
    console.log("inside verify token",req.headers);
    if(!req.headers.authorization){
      return res.status(401).send({message:"forbidden access"});
    }
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token,process.env.ACCESE_SECURE,(err,decoded)=>{
      if(err){
        return res.status(401).send({message:"forbidden access"})
      }
      req.decoded =decoded;
      next();
    })
    
  }

  //verify admin

  const verifyAdmin =async(req,res,next)=>{
    const email =req.decoded.email;
    const query ={email:email};
    const user=await userscalection.findOne(query);
    const isAdmin =user?.role ==="admin";
    if(!isAdmin){
      return res.status(403).send({message:"forbidden access"})
    }
    next()
  }


// users api

    app.get("/users/admin/:email",verifytoken,async(req,res)=>{
      const email =req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message:"unauthorize access"})
      }
      const query ={email:email}
      const user=await userscalection.findOne(query);
      let admin= false;
      if(user){
        admin=user?.role =="admin"
      }
      res.send({admin});
    })

    app.patch("/users/admin/:id",verifytoken,verifyAdmin, async(req,res)=>{
      const id=req.params.id;
      const filter ={_id: new ObjectId(id)};
      const updataDoc ={
        $set:{
          role:"admin"
        }
       
      }
      const result =await userscalection.updateOne(filter,updataDoc);
      res.send(result);
    })

    app.delete("/users/:id",verifytoken,verifyAdmin, async(req,res)=>{
      const id =req.params.id;
      const query={_id: new ObjectId(id)}
      const result =await userscalection.deleteOne(query);
      res.send(result)
    })
    app.get("/users", verifytoken,verifyAdmin, async(req,res)=>{
      console.log(req.headers)
      const result =await userscalection.find().toArray()
      res.send(result)
    })
    app.post("/users",async(req,res)=>{
      
        const users =req.body;
      const query= {email:users.email}
      const existanuser = await userscalection.findOne(query)
      if(existanuser){
        return res.send({message:"user already exists"})
      }
        const result =await userscalection.insertOne(users)
        res.send(result)
     
    })

///menu api
    app.get("/menu",async(req,res)=>{
        const result =await menucalection.find().toArray()
        res.send(result)
    })
    app.delete('/menu/:id',verifytoken,verifyAdmin, async(req,res)=>{
      const id =req.params.id;
      const {query }={_id: new ObjectId(id)}
      const result=await menucalection.deleteOne(query);
      res.send(result)
    })

    app.post("/menu",async(req,res)=>{
      const item =req.body;
      const result =await menucalection.insertOne(item)
      res.send(result);
    })

    
    //reviws
    app.get("/reviews",async(req,res)=>{
        const result =await reviewscalection.find().toArray()
        res.send(result)
    })

    

    // card callection

    app.get("/card", async(req, res)=>{
      const email =req.query.email
      const query ={email:email}
      const result=await addcalection.find(query).toArray()
      res.send(result)
    })


    app.post("/card", async(req, res)=>{
      const carditem =req.body;
      const result =await addcalection.insertOne(carditem)
      res.send(result)
    })
    app.delete("/card/:id",async(req,res)=>{
      const id =req.params.id;
      const query ={_id: new ObjectId(id)}
      const result= await addcalection.deleteOne(query)
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res)=>{
    res.send("boss setting")
})
app.listen(port, ()=>{
    console.log(port);
})