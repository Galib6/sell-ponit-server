const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config()
const app = express();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(`${process.env.STRIPE_KEY}`);

// middle ware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wjuepub.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// varify JWT
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();

    })

}



async function run() {
    try {
        const categoryCollection = client.db('Car-sell-point').collection('category');
        const productsCollection = client.db('Car-sell-point').collection('products');
        const usersCollection = client.db('Car-sell-point').collection('users');
        const bookingsCollection = client.db('Car-sell-point').collection('bookings');
        const advertisedCollection = client.db('Car-sell-point').collection('advertised');
        const reportedToAdmin = client.db('Car-sell-point').collection('reportedtoadmin');
        const paymentsCollection = client.db('Car-sell-point').collection('paymentsCollection');

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '20h' })
            res.send({ token })
        })


        app.get('/category', async (req, res) => {
            const query = {}
            const result = await categoryCollection.find(query).toArray();
            res.send(result);
        })

        app.get("/category/:id", async (req, res) => {
            const id = req.params.id
            const query = { categoryId: id }
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })



        app.get("/category/:id", async (req, res) => {
            const id = req.params.id
            const query = { categoryId: id }
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })


        app.post("/addproduct", verifyJWT, async (req, res) => {
            const product = req.body;
            // console.log(product);
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })



        app.get("/product", async (req, res) => {
            const query = { email: req.query.email }
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })

        app.get("/requser", async (req, res) => {
            const query = { email: req.query.email }
            // console.log(query)
            const result = await usersCollection.findOne(query);
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        app.get('/allsellers', async (req, res) => {
            const query = { type: "seller" };
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers);
        });
        app.get('/allbuyers', async (req, res) => {
            const query = { type: "buyer" };
            const buyers = await usersCollection.find(query).toArray();
            res.send(buyers);
        });
        app.delete('/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })
        app.delete('/buyer/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

        app.post('/bookings', verifyJWT, async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await bookingsCollection.insertOne(user);
            res.send(result);
        });

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) }

            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    bookingType: "Booked"
                }
            }
            const result = await productsCollection.updateOne(query, updatedDoc, options);
            res.send(result);
        });

        app.post('/advertise', verifyJWT, async (req, res) => {
            const product = req.body;
            // console.log(product);
            const result = await advertisedCollection.insertOne(product);
            res.send(result);
        });

        app.get('/advertise/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const query = { _id: ObjectId(id) }
            // console.log(query)
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    advertise: true
                }
            }
            const result = await productsCollection.updateOne(query, updatedDoc, options);
            res.send(result);
        });

        app.get("/myorders", async (req, res) => {
            const query = { emailadress: req.query.email }
            console.log(query)
            const result = await bookingsCollection.find(query).toArray();
            res.send(result);
        })
        app.get("/advertised", async (req, res) => {
            const query = {}
            const result = await advertisedCollection.find(query).toArray();
            res.send(result);
        })
        //_____________________________________

        app.delete('/advertised/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await advertisedCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/changestatus/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    advertise: false
                }
            }
            const result = await productsCollection.updateOne(query, updatedDoc, options);
            res.send(result);
        });

        app.post('/reportedtoadmin', async (req, res) => {
            const product = req.body;
            // console.log(product);
            const result = await reportedToAdmin.insertOne(product);
            res.send(result);
        });
        app.get('/reportedtoadmin', async (req, res) => {
            const query = {};
            // console.log(product);
            const result = await reportedToAdmin.find(query).toArray();
            res.send(result);
        });

        app.get("/payforbook/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            console.log(query)
            const result = await bookingsCollection.findOne();
            res.send(result);
        })



        // temporary toupdate feild on appointment options
        app.get('/aaa', async (req, res) => {
            const filter = {}
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    advertise: false,
                    bookingType: "Book Now"
                }
            }
            const result = await productsCollection.updateMany(filter, updatedDoc, options);
            res.send(result);
        })

        app.get('/varified', async (req, res) => {
            const filter = { email: req.query.email }
            console.log(filter)
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    varified: true,
                }
            }
            const result = await productsCollection.updateMany(filter, updatedDoc, options);
            res.send(result);
        })

        app.post('/gsignup', async (req, res) => {
            const product = req.body;
            // console.log(product);
            const result = await usersCollection.insertOne(product);
            res.send(result);
        });



        //payments 
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post("/payments", async (req, res) => {
            const payments = req.body
            const result = await paymentsCollection.insertOne(payments)
            const id = payments.productId
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transectionId: payments.transectionId
                }
            }
            const updateResult = await bookingsCollection.updateOne(filter, updatedDoc, options)
            res.send(result);
        })

        app.delete('/deleteproduct/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        })


    }
    finally {

    }
}
run().catch(console.log);




app.get("/", async (req, res) => {
    res.send("sell point server running")
})

app.listen(port, () => console.log("sell point running............."))