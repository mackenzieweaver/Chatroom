$(document).ready(function() {
  /*global io*/
  var socket = io();

  // nickname button
  let nickname = $("button#nickname");

  // Form submittion with new message in field with id 'm'
  $("form").submit(function(e) {
    e.preventDefault();

    // Chat messages
    socket.emit("chat message", $("#m").val());
    $("#m").val("");
    return false;
  });

  socket.on("user", function(data) {
    $("#num-users").text(data.currentUsers + " users online");
    var message = data.name;
    if (data.connected) {
      message += " has joined the chat.";
    } else {
      message += " has left the chat.";
    }
    $("#messages").append($("<li>").html("<b>" + message + "</b>"));
  });

  // Chat messages
  socket.on("chat message", function(data) {
    $("#messages").append($("<li>").text(data.name + ': ' + data.message));
  });
});
