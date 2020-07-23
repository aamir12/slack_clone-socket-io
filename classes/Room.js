class Room{
    constructor(roomId,rTitle,namespace,privateRoom = false){
      this.roomId = roomId;
      this.roomTitle = rTitle;
      this.namespace = namespace;
      this.privateRoom = privateRoom;
      this.history = [];
    }

    addMessage(message){
      this.history.push(message)
    }

    clearHistory(){
        this.history = [];
    }
}

module.exports = Room;