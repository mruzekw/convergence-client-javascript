// These are the various inputs in the example page.
var usernameInput = document.getElementById("username");
var roomInput = document.getElementById("roomId");
var messageInput = document.getElementById("message");
var chatHistoryArea = document.getElementById("chatHistory");

var chatRoom;
var domain;

function connect() {
  var url = "http://localhost:8080/domain/test/example";
  ConvergenceDomain.debugFlags.protocol.messages = true;
  ConvergenceDomain.connect(url, usernameInput.value, "password").then(function(d) {
    domain = d;
    domain.chatService().joinRoom(roomInput.value).then(function(room) {
      chatRoom = room;
      chatRoom.events().subscribe(function(event) {
        chatHistoryArea.value += JSON.stringify(event);
        chatHistoryArea.value += '\n';
      });
    });

});
}

//
// Handle the number increment / decrement buttons.
//

function sendChat() {
  chatRoom.send(messageInput.value);
  chatHistoryArea.value += "You Sent: " + messageInput.value;
  chatHistoryArea.value += '\n';
  messageInput.value = "";
}

function disconnect() {
  chatRoom.leave();
  domain.dispose();
}
