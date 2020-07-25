let app = angular.module('myapp', []);
app.controller('mycontroller', function scripts($scope) {
    const username = prompt("Enter your username");
    const socket1 = io('http://localhost:9000',{
        query:{
            username:username
        }
    }); //global namespace
    let nsSocket = null;
    $scope.nameSpaces = [];
    $scope.rooms = [];
    $scope.namespace = '/wiki';
    $scope.numberOfUsers = 0;
    $scope.chats = [];
    socket1.on('nsList',(data)=>{
       $scope.$apply(function(){
        $scope.nameSpaces = data;
       });
    });

    //on connection error
    socket1.on('connect_error', (error) => {
       console.log(error);
    });

    //when reconnect successfully
    socket1.on('reconnect', (attemptNumber) => {
       console.log(attemptNumber);
    });
    
    
    $scope.joinNameSpace = function(ns){
        if(nsSocket){
            nsSocket.close();
        }
        $scope.chats = [];
        nsSocket = io(`http://localhost:9000${ns}`);
        nsSocket.emit('getRooms',ns);
        nsSocket.on('nsRoomLoad',(rooms)=>{
            $scope.$apply(function(){
            $scope.rooms = rooms;
            if($scope.rooms.length>0){
                $scope.joinRoom($scope.rooms[0]);
            }
            });
        });

        nsSocket.on('numberOfUser',clients =>{
            $scope.$apply(function(){
                $scope.numberOfUsers = clients;
            })
        });

        nsSocket.on('messageToClients',(data)=>{
            $scope.$apply(function(){
              $scope.chats.push(data);
            });
        });

        nsSocket.on('chatHistory',(data)=>{
            $scope.$apply(function(){
                $scope.chats = data;
               // let messgesEle = document.getElementById("#messages");
               // messgesEle.scrollTop(0,messgesEle.scrollHeight);
            });
        })

        //when error generate from server
        nsSocket.on('error', (error) => {
            console.log(error);
            if(error == 'AuthFailed'){
                nsSocket.close();
                socket1.close();
            }

        });
    }

    $scope.joinNameSpace($scope.namespace);

    $scope.onChangeNameSpace = function(ns){
        $scope.namespace = ns;
        $scope.joinNameSpace(ns);
    }

    $scope.joinRoom = function(room){
        $scope.chats = [];
        $scope.room = room;
        nsSocket.emit('joinRoom',room.roomTitle);
    }

    $scope.onMessageSend = function(event){
        console.log("onMessageSend");
        event.preventDefault();
        if($scope.message.trim() == ''){
            return;
        }

        if(nsSocket){
            nsSocket.emit('newMessageToServer',{room:$scope.room.roomTitle,message:$scope.message});
            $scope.message = '';
        }
    }

});


app.filter("localDate",function(){
	return function(utcdate){
		if (typeof utcdate !== 'undefined'){
            var startd = new Date(utcdate);
            var startTime = startd.toString().split(" ")[4];
            var getstartDate = startd.getDate();
            var getstartMonth = startd.getMonth() + 1;
            var getstartFullYear = startd.getFullYear();
            if(getstartMonth < 10)
            getstartMonth = "0"+getstartMonth;
            if(getstartDate < 10)
            getstartDate = "0"+getstartDate;
            var startDate = getstartFullYear+"-"+getstartMonth+"-"+getstartDate;
            var openOn =  startDate.substring(2, 10) + " " + startTime; 
            return openOn;
		}else{
			return '';
		}
	}
});

   


