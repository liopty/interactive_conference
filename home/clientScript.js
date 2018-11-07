$(function() {
  var socket = io();
  mdc.ripple.MDCRipple.attachTo(document.querySelector('.foo-button'));

  $('#envoyer').on('click', function() {
    socket.emit('chat message', $('#user').val() + ': ' + $('#m').val());
    $('#m').val('');
    return false;
  });

  socket.on('chat message', function(msg) {
    $('#messages').append($('<li>').text(msg));
  });

});
