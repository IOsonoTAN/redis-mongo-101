const express = require('express')

const app = express()




const server = app.listen(3333, () => {
    console.log("listen on port 3333")
})

const io = require('socket.io')(server)


io.on("connection", (socket) => {
    socket.on("new", (data) => {
        console.log(data)
    })
})
