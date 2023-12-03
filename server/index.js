const PORT = 8000
const express = require('express')
const {MongoClient} = require('mongodb')
const {v4: uuidv4} = require('uuid')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const bcrypt = require('bcrypt')
require('dotenv').config()

const uri = process.env.URI

const app = express()
app.use(cors())
app.use(express.json())

// Default
app.get('/', (req, res) => {
    res.json('Hello to my app')
})



// Sign up to the Database
app.post('/signup', async (req, res) => {
    const client = new MongoClient(uri)
    const {email, password} = req.body

    const generatedUserId = uuidv4()
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const existingUser = await users.findOne({email})

        if (existingUser) {
            return res.status(409).send('User already exists. Please login')
        }

        const sanitizedEmail = email.toLowerCase()

        const data = {
            user_id: generatedUserId,
            email: sanitizedEmail,
            hashed_password: hashedPassword
        }

        const insertedUser = await users.insertOne(data)

        const token = jwt.sign(insertedUser, sanitizedEmail, {
            expiresIn: 60 * 24
        })
        res.status(201).json({token, userId: generatedUserId})

    } catch (err) {
        console.log(err)
    } finally {
        await client.close()
    }
})

// Log in to the Database
app.post('/login', async (req, res) => {
    const client = new MongoClient(uri)
    const {email, password} = req.body

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const user = await users.findOne({email})

        const correctPassword = await bcrypt.compare(password, user.hashed_password)

        if (user && correctPassword) {
            const token = jwt.sign(user, email, {
                expiresIn: 60 * 24
            })
            res.status(201).json({token, userId: user.user_id})
        }

        res.status(400).json('Invalid Credentials')

    } catch (err) {
        console.log(err)
    } finally {
        await client.close()
    }
})

// Get individual user
app.get('/user', async (req, res) => {
    const client = new MongoClient(uri)
    const userId = req.query.userId

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const query = {user_id: userId}
        const user = await users.findOne(query)
        res.send(user)

    } finally {
        await client.close()
    }
})



// Update User with a match
app.put('/addmatch', async (req, res) => {
    const client = new MongoClient(uri)
    const {userId, matchedUserId} = req.body

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const query = {user_id: userId}
        const updateDocument = {
            $push: {matches: {user_id: matchedUserId}}
        }
        const user = await users.updateOne(query, updateDocument)
        res.send(user)
    } finally {
        await client.close()
    }
})

// Get all Users by userIds in the Database
app.get('/users', async (req, res) => {
    const client = new MongoClient(uri)
    const userIds = JSON.parse(req.query.userIds)

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const pipeline =
            [
                {
                    '$match': {
                        'user_id': {
                            '$in': userIds
                        }
                    }
                }
            ]

        const foundUsers = await users.aggregate(pipeline).toArray()

        res.json(foundUsers)

    } finally {
        await client.close()
    }
})
// Get all the Gendered Users in the Database
app.get('/gendered-users', async (req, res) => {
    const client = new MongoClient(uri);
    let gender;
    const everyone = {$exists: true};

    if (req.query.gender === "everyone") {
        gender = everyone;
    } else {
        gender = { $eq: req.query.gender };
    }

    try {
        await client.connect();
        const database = client.db('app-data');
        const users = database.collection('users');
        const query = { gender_identity: gender };
        const foundUsers = await users.find(query).toArray();

        // Calculando la edad actual y creando la tabla hash
        const calculateAge = (birthdate) => {
            const today = new Date();
            const birthDate = new Date(birthdate);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        };

        const ageHash = {};
        foundUsers.forEach((user) => {
            const age = calculateAge(`${user.dob_year}-${user.dob_month}-${user.dob_day}`);
            ageHash[user._id] = age;
        });
        foundUsers.forEach((user) => {
            user.age = ageHash[user._id];
        });

        res.send(foundUsers);
    } catch (error) {
    } finally {
        await client.close();
    }
});

// Update a User in the Database
app.put('/user', async (req, res) => {
    const client = new MongoClient(uri)
    const formData = req.body.formData

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const query = {user_id: formData.user_id}

        const updateDocument = {
            $set: {
                first_name: formData.first_name,
                dob_day: formData.dob_day,
                dob_month: formData.dob_month,
                dob_year: formData.dob_year,
                show_gender: formData.show_gender,
                gender_identity: formData.gender_identity,
                gender_interest: formData.gender_interest,
                url: formData.url,
                about: formData.about,
                matches: formData.matches
            },
        }

        const insertedUser = await users.updateOne(query, updateDocument)

        res.json(insertedUser)

    } finally {
        await client.close()
    }
})

class MessageNode {
    constructor(message) {
        this.message = message;
        this.left = null;
        this.right = null;
    }
}

class MessageTree {
    constructor() {
        this.root = null;
    }

    insertMessage(message) {
        const newNode = new MessageNode(message);
        if (this.root === null) {
            this.root = newNode;
        } else {
            this._insertRecursive(this.root, newNode);
        }
    }

    _insertRecursive(node, newNode) {
        if (newNode.message.timestamp < node.message.timestamp) {
            if (node.left === null) {
                node.left = newNode;
            } else {
                this._insertRecursive(node.left, newNode);
            }
        } else {
            if (node.right === null) {
                node.right = newNode;
            } else {
                this._insertRecursive(node.right, newNode);
            }
        }
    }

    findMessagesByUsers(userId, correspondingUserId) {
        const foundMessages = [];
        this._findMessagesRecursive(this.root, userId, correspondingUserId, foundMessages);
        return foundMessages;
    }

    _findMessagesRecursive(node, userId, correspondingUserId, foundMessages) {
        if (node !== null) {
            const message = node.message;
            if (
                (message.from_userId === userId && message.to_userId === correspondingUserId) ||
                (message.from_userId === correspondingUserId && message.to_userId === userId)
            ) {
                foundMessages.push(message);
            }
            this._findMessagesRecursive(node.left, userId, correspondingUserId, foundMessages);
            this._findMessagesRecursive(node.right, userId, correspondingUserId, foundMessages);
        }
    }
}

const messageTree = new MessageTree();

// Add a Message to our Database
app.post('/message', async (req, res) => {
    const client = new MongoClient(uri);
    const message = req.body.message;

    try {
        await client.connect();
        const database = client.db('app-data');
        const messages = database.collection('messages');

        const insertedMessage = await messages.insertOne(message);

        messageTree.insertMessage(message);

        res.send(insertedMessage);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al insertar el mensaje');
    } finally {
        await client.close();
    }
});

app.get('/messages-between-users', async (req, res) => {
    const { userId, correspondingUserId } = req.query;

    try {
        const messagesBetweenUsers = messageTree.findMessagesByUsers(userId, correspondingUserId);
        res.send(messagesBetweenUsers);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener los mensajes entre usuarios');
    }
});


app.listen(PORT, () => console.log('server running on PORT ' + PORT))

