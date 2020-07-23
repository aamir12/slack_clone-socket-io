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
   
   // console.log(nsList);
   socket.emit('nsList',nsList);
  // console.log(socketUsers);
});




//loop through all namespace to setup connection
namespaces.forEach((namespace)=>{
    io.of(namespace.endPoint).on('connection',(socket)=>{
        const username = socket.handshake.query.username;
        // call every socket request; we filter the request by packet
        socket.use((packet, next) => {
            //console.log('+++++++Middleware+++++++');
            // if (packet.doge === true) return next();
            // next(new Error('Not a doge error'));
            next();
        });

        socket.on('getRooms',function(ns){
            const rooms = namespace.rooms;
            socket.emit('nsRoomLoad',rooms);
        });

        

        socket.on('joinRoom',(room)=>{
            const roomToLeave = Object.keys(socket.rooms)[1];
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
            
            io.of(namespace.endPoint).to(data.room).emit('messageToClients',fullMsg);
            //const ns = namespaces.find(x=> x.endPoint === data.namespace);
            const rm = namespace.rooms.find(x=>x.roomTitle ===data.room);
            rm.history.push(fullMsg);

        });

        // socket.on('disconnect',(reson)=>{
        //     const userInfo = {...socketUsers[socket.id]};
        //     delete socketUsers[socket.id];
        //     updateNumUsers(namespace,userInfo.room);
        // });

    });

    function updateNumUsers(namespace,room){
        io.of(namespace.endPoint).in(room).clients( (error,clients)=>{
            if(!error){
             let numUsers = clients.length;
             io.of(namespace.endPoint).in(room).emit('numberOfUser',numUsers);
            }
        });
    }

    
});