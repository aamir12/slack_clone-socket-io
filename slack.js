const express = require('express');
const path = require('path');
const app = express();
const socketio = require('socket.io');
const namespaces = require('./data/namespaces');



app.use(express.static(path.join(__dirname,'public')));

const expressServer = app.listen(9000);
const io = socketio(expressServer);
//let socketUsers = {};
//middleware call only at the time connection only
io.use((socket, next) => { 
    //console.log(socket);
    //console.log(socket.handshake.query.token);
    //console.log("Global Middleware")
    next();
});

//io.on = io.of('/').on = io.sockets.on('')
//io.emit() = io.of('/').emit =  io.sockets.emit('');

io.on('connection',(socket)=>{
   const nsList = namespaces.map(x=>{
       return {
           img : x.img,
           endPoint:x.endPoint
       }
   });
   
   //step1: emit list of all namespace
   socket.emit('nsList',nsList);
  // console.log(socketUsers);

   // both are similar send data to all
   // io.emit('message',data);
   // io.of('/').emit('message',data);

   //emit to everybody except sender
   //socket.broadcast.emit('an event', { some: 'data' });
});




//loop through all namespace to setup connection
namespaces.forEach((namespace)=>{
    io.of(namespace.endPoint).on('connection',(socket)=>{
        //send data by client at the time of connection
        const username = socket.handshake.query.username;
        // call every socket request; we filter the request by packet
        socket.use((packet, next) => {
            //console.log('+++++++Middleware+++++++');
            //packet return event name and namespace
            //console.log(packet);
            // if (packet.doge === true) return next();
            //next(new Error('AuthFailed'));
            next();
        });

        //return all the room of particular namespace;
        socket.on('getRooms',function(ns){
            const rooms = namespace.rooms;
            socket.emit('nsRoomLoad',rooms);
        });

        

        socket.on('joinRoom',(room)=>{
            //socket.rooms return the rooms info object(socket.id,rooms).
            //socket.rooms[1] is current room
            const roomToLeave = Object.keys(socket.rooms)[1];
            //leave room
            socket.leave(roomToLeave);
            updateNumUsers(namespace, roomToLeave)

            socket.join(room);
            // socketUsers[socket.id] = {
            //     'namespace':namespace.endPoint,
            //     'room': room
            // };

            const rm = namespace.rooms.find(x=>x.roomTitle ===room);
            socket.emit('chatHistory',rm.history);
            updateNumUsers(namespace,room);
        });

       
        socket.on('newMessageToServer',(data)=>{
            // let rooms = socket.rooms;
            //second key is always room name;

            const fullMsg = {
                text:data.message,
                time:Date.now(),
                username:username,
                avatar: 'https://via.placeholder.com/30' 
            }
            //volatile flag is used to flash the data,if the client network is slow
            //io.volatile.of(namespace.endPoint).to(data.room).emit('messageToClients',fullMsg);
            io.of(namespace.endPoint).to(data.room).emit('messageToClients',fullMsg);
            //const ns = namespaces.find(x=> x.endPoint === data.namespace);
            const rm = namespace.rooms.find(x=>x.roomTitle ===data.room);
            rm.history.push(fullMsg);

        });

        //call when socket is disconnect
        socket.on('disconnect',(reason)=>{
            //const userInfo = {...socketUsers[socket.id]};
            //delete socketUsers[socket.id];
            //updateNumUsers(namespace,userInfo.room);

            console.log('disconnect',reason);
        });

    });

    function updateNumUsers(namespace,room){
        //it return number of clients(user) in rooms
        io.of(namespace.endPoint).in(room).clients( (error,clients)=>{
            if(!error){
             let numUsers = clients.length;
             io.of(namespace.endPoint).in(room).emit('numberOfUser',numUsers);
            }
        });
    }

    
});