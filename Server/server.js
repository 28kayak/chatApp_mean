/**
 * Created by kaya on 12/18/16.
 */

//import all our dependencies
//Some are configuring it for you
var express = require('express');
var mongoose = require('mongoose');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

//To server static file, express expose a method to help configure the static file folder
app.use(express.static(__dirname + '/Public'));
mongoose.connect("mongodb://127.0.0.1:27017/scotch-chat");

//Create Schema for chat
var ChatSchema = mongoose.Schema({
    created: Date,
    content: String,
    username: String,
    room: String
});
//chat a model from the chat schema
var Chat = mongoose.model('Chat', ChatSchema);
//allow CORS
app.all('*', function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT, POST, DELETE, OPTION');
    res.header("Access-Control-Allow-Headers", 'Content-type, Accept, X-Access-Token, X-Key');
    if(req.method == 'OPTIONS')
    {
        res.status(200).end();
    }
    else
    {
        next();
    }
});//app.all
//------------------------Routers--------------------------------
//route for our index file
app.get('/', function(req, res){
    //send the index.html in our public directory
    res.sendfile('index.html');
});
//this route is simply run only on first launch just to generate some chat history
//hit just once and at the initial launch of the application
app.post('/setup', function(req,res){
    //Array of chat data. Each object properties mush match the schema object properties
    var chatData = [{

        created: new Date() ,
        content: "Hi",
        username: 'Chris',
        room: 'php'
    },{
        created: new Date(),
        content: 'Ait',
        username: 'Bill',
        room: 'angular'
    },{
        created: new Date(),
        content: 'Amazing room',
        username: 'Patience',
        room: 'socet.io'
    }];
    //loop through each od the chat data and insert into the database
    for(var c = 0; c < chatData.length; c++)
    {
        //create an instance of the chat model
        var newChat = new Chat(chatData[c]);
        //call save to insert the chat
        newChat.save(function (err, savedChat) {
            console.log(savedChat);

        });
    }//for
    // send a response to the serve would not get stuck
    res.send('created');
});
app.get('/msg', function(req,res){
    //find
    Chat.find({
        'room': req.query.room.toLowerCase()
    }).exec(function(err, msgs){
        res.json(msgs);//send
    });
});//app.get


//---------------------------Socket -------------------------
//Need to know for real time application:
//1)know when our application is launched
//2)send all the available rooms on connection
//3)listen for a user to connect and assign him/her to a default room
//4)listen for when he/she switches room
//5)finally listen for a new message and only send the message to those in the room at which it was created
io.on('connection', function(socket){
    //Globals
    var defalutRoom = 'general';
    var rooms = ['General', 'angular', 'sockets.io','express', 'node','mongo', 'PHP', 'laravel'];
    //emit the rooms array
    socket.emit('setup', {
        rooms: room
    });
    //listen for new user
    socket.on('new user', function(data){
        data.room = defalutRoom;
        //new user joins the default room
        socket.join(defalutRoom);
        //tell all those in the room that a new user joined
        io.in(defalutRoom).emit('user joined', data);
    });//sockets.on
    //listens for switch room
    socket.on('switch room', function(data){
        //Handles joining and leaving rooms
        //console.log(data);
        socket.leave(data.oldRoom);
        socket.join(data.newRoom);
        io.in(data.oldRoom).emit('user left', data);
        io.in(data.newRoom).emit('user joined', data);
    });
    //Listen for a new chat message
    socket.on('new message', function(data){
        //create message
        var newMsg = new Chat({
            username: data.username,
            content: data.message,
            room: data.room.toLocaleLowerCase(),
            created: new Date()
        });
        //save it to DB
        newMsg.save(function(err, msg){
            //send message to those connected in the room
            io.in(msg.room).emit('message created', msg);
        })//newMsg.save
    });//socket.on
});//io.in
//--------------------end of sockets---------------------
server.listen(2015);
console.log("it's going down in 2015");