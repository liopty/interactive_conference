

// Connexion à socket.io
var socket = io();

// On demande le pseudo, on l'envoie au serveur et on l'affiche dans le titre
var pseudo = prompt('Quel est votre pseudo ?');
socket.emit('nouveau_client', pseudo);
document.title = pseudo + ' - ' + document.title;

// Quand on reçoit un message, on l'insère dans la page
socket.on('message', function(data) {
  insereMessage(data.pseudo, data.message)
})


// Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
$('#envoyer').on('click', function () {
  var message = $('#m').val();
  socket.emit('chat message', message); // Transmet le message aux autres
  insereMessage(pseudo, message); // Affiche le message aussi sur notre page
  $('#m').val('').focus(); // Vide la zone de Chat et remet le focus dessus
  return false; // Permet de bloquer l'envoi "classique" du formulaire
});

// Ajoute un message dans la page
function insereMessage(pseudo, message) {
  $('#messages').append($('<li>').text(pseudo +" : "+ message));
}
