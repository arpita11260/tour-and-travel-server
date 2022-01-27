const express = require('express')
const app = express()
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
const admin = require("firebase-admin");
require('dotenv').config()
const { MongoClient } = require('mongodb');

const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8ngda.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next){
    if(req.headers?.authorization?.startsWith('Bearer ')){
        const authToken = req.headers.authorization.split(' ')[1];

        try{
            const decodedUser = await admin.auth().verifyIdToken(authToken);
            req.decodedEmail = decodedUser.email;
        }
        catch{

        }
    }
    next();
}


async function run(){
    try{
        await client.connect();
        const database = client.db('travel');
        const productCollection = database.collection('products');
        const bookingCollection = database.collection('bookings');
        const reviewCollection = database.collection('reviews');
        const usersCollection = database.collection('users');

        //get

        //GET ALL PRODUCTS
        app.get('/products', async (req, res) => {
            const cursor = productCollection.find({});
            const page = req.query.page;
            const size = parseInt(req. query.size);
            let products;
            const count = await cursor.count();
            if(page){
                products = await cursor.skip(page*size).limit(size).toArray();
            }
            else{
                products = await cursor.toArray();
            }
            const product = await cursor.toArray();
            
            res.send({
                count,
                products});
        });

        //GET  PRODUCTS BY ID
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const product = await productCollection.findOne(query);
            res.json(product);
        });

        //GET  PRODUCTS BY ID
        app.get('/manageProducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const product = await productCollection.findOne(query);
            res.json(product);
        });
        //GET  BOOKINGS BY QUERY
        app.get('/bookings', async (req, res) => {
            
            const email = req.query.email;
            const query = { email: email };
            const cursor = bookingCollection.find(query);
            const bookings = await cursor.toArray();
            res.json(bookings);
        });

        //GET  ALL BOOKINGS
        app.get('/allBookings', async (req, res) => {
            const cursor = bookingCollection.find({});
            const bookings = await cursor.toArray();
            res.json(bookings);
        });

        //GET  ALL REVIEWS
        app.get('/reviews', async (req, res) => {
            const cursor = reviewCollection.find({});
            const reviews = await cursor.toArray();
            res.json(reviews);
        });
        //GET  USERS WHO ARE ADMIN
        app.get('/users', async (req, res) => {
            const role = req.query.role;
            const query = { role: role }
            const cursor = usersCollection.find(query);
            const users = await cursor.toArray();
            res.json(users);
        });

        //GET  USERS BY IS
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            console.log(user?.role);
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
        //POST

        //ADD NEW PRODUCT
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.json(result)
        });

        //ADD NEW USER
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result)
        });

        //ADD NEW BOOKING
        app.post('/bookings', async (req, res) => {
            
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.json(result)
        });

        //ADD NEW REVIEW
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.json(result)
        });
        //PUT

        //ADD NEW USER IF NOT HAVE
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        //MAKE ADMIN
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            console.log('put', req.headers.authorization);
            const requester = req.decodedEmail;
            if(requester){
                const requesterAccount = await usersCollection.findOne({email:requester});
                if(requesterAccount.role === 'admin'){
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else{
                res.status(403).json({message: 'YOu do not have access to make admin'})
            }
            
           
        })

        //UPDATE BOOKING
        app.put('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const updateDoc = {
                $set: { status: "approved" }
            };
            const result = await bookingCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

        //UPDATE PRODUCT
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const product = req.body;
            const filter = { _id: ObjectId(id) }
            const updateDoc = {
                $set: { ...product }
            };
            const result = await productCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

        //DELETE

        //DELETE BOOKING
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.json(result);
        });

        //DELETE PRODUCT
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.json(result);
        });
    }
    finally{
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello!')
})

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`)
})