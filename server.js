const express = require('express')
const bodyParser = require('body-parser')
const { MongoClient } = require('mongodb')

const redisConfig = {
    port: 6379,
    host: '192.168.99.100'
}
const redis = require('redis')
const client = redis.createClient(redisConfig.port, redisConfig.host)

client.on('connect', () => {
    console.log('connect to redis is connected.')
})

// mongodb://192.168.99.100:27017/register
const mongodbName = 'register'
const mongodbUrl = 'mongodb://192.168.99.100:27017/' + mongodbName

const collectionUser = 'users'

let db

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Get user list
app.get('/users', (req, res) => {
    const keyGetUsers = 'userlist'

    client.get(keyGetUsers, (err, result) => {
        if (err) {
            console.log('redis get err ->', err)
        } else if (!result) {
            // db.users.find()
            db.collection(collectionUser).find().toArray((err, results) => {
                if (err) {
                    console.log('user list err ->', err)
                }

                // Set user list from Redis
                client.set(keyGetUsers, JSON.stringify(results), (err, setSuccess) => {
                    if (err) {
                        console.log('redis err ->', err)
                    }

                    console.log('results ->', results)

                    // setSuccess OK
                    res.send(results)
                })
            })
        }

        // get result from Redis as string
        res.send(JSON.parse(result))
    })
})

// Add new user
app.post('/users', (req, res) => {
    // db.users.save()
    db.collection(collectionUser).save(req.body, (err, result) => {
        if (err) {
            console.log('save user err ->', err)
        }

        console.log('user has been saved.')
        res.send('user has been saved.')
    })
})

MongoClient.connect(mongodbUrl, (err, database) => {
    if (err) {
        console.log('err ->', err)
    }
    db = database

    console.log('connect to database is successfuly')

    app.listen(port, () => {
        console.log('app is listening on port ' + port)
    })
})
