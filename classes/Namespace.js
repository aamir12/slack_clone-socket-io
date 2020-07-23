class Namespace{
    constructor(id,nsTitle,img,endPoint){
       this.id = id;
       this.nsTitle = nsTitle;
       this.img= img;
       this.endPoint = endPoint;
       this.rooms = [];
    }

    addRoom(roomObj){
      this.rooms.push(roomObj);
    }
}

module.exports = Namespace; 