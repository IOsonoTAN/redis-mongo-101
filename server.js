const express = require('express')
const bodyParser = require('body-parser')
const { MongoClient } = require('mongodb')
const Promise = require('bluebird')
const redis = require('redis')
const path = require('path')

let db
let io

const app = express()
const port = 3000

const redisConfig = {
    port: 6379,
    host: '192.168.99.100'
}
const client = Promise.promisifyAll(redis.createClient(redisConfig.port, redisConfig.host))
client.on('connect', () => {
    console.log('connect to redis is connected.')
})

// mongodb://192.168.99.100:27017/register
const mongodbName = 'register'
const mongodbUrl = 'mongodb://192.168.99.100:27017/' + mongodbName

const collectionUser = 'users'

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'public')))

const keyGetUsers = 'userlist'

// Get user list
app.get('/users', async (req, res) => {
    try {
        const result = await client.getAsync(keyGetUsers)
        if (!result) {
            const dbResults = await db.collection(collectionUser).find().toArray()
            client.set(keyGetUsers, JSON.stringify(dbResults))
            res.send(dbResults)
            return
        }
        res.send(JSON.parse(result))
    } catch (err) {
        console.log('err ->', err)
    }
})


app.get('/', (req, res) => {
    res.render(__dirname + "/index.html")
})

// Add new user
app.post('/users', async (req, res) => {
    try {
        const body = req.body

        const result = await db.collection(collectionUser).save(body)
        console.log('user has been added.')

        io.on('connection', (socket) => {
            console.log('io on connection')
            socket.emit('new', body)
        })

        await client.delAsync(keyGetUsers)
        console.log('redis key removed.')

        res.send(req.body)
    } catch (err) {
        console.log('err ->', err)
    }
})

MongoClient.connect(mongodbUrl, (err, database) => {
    if (err) {
        console.log('err ->', err)
    }
    db = database

    console.log('connect to database is successfuly')

    const server = app.listen(port, () => {
        console.log('app is listening on port ' + port)
    })
    io = require('socket.io')(server)
})
