document.getElementById('recent').style.display = "block";

$(function() {
  mdc.autoInit();
});

function openCity(evt, ongletPicked, activeOnglet) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  if (ongletPicked == 'recent') {
    document.getElementById('activeOnglet1').className = "mdc-tab mdc-tab--active";
    document.getElementById('activeOnglet2').className = "mdc-tab";
    document.getElementById('activeOnglet3').className = "mdc-tab";

    document.getElementById('activeOnglet1Underline').className = "mdc-tab-indicator mdc-tab-indicator--active";
    document.getElementById('activeOnglet2Underline').className = "mdc-tab-indicator";
    document.getElementById('activeOnglet3Underline').className = "mdc-tab-indicator";
  }
  if (ongletPicked == 'topvote') {
    document.getElementById('activeOnglet1').className = "mdc-tab";
    document.getElementById('activeOnglet2').className = "mdc-tab mdc-tab--active";
    document.getElementById('activeOnglet3').className = "mdc-tab";

    document.getElementById('activeOnglet1Underline').className = "mdc-tab-indicator";
    document.getElementById('activeOnglet2Underline').className = "mdc-tab-indicator mdc-tab-indicator--active";
    document.getElementById('activeOnglet3Underline').className = "mdc-tab-indicator";

  }
  if (ongletPicked == 'repondu') {
    document.getElementById('activeOnglet1').className = "mdc-tab";
    document.getElementById('activeOnglet2').className = "mdc-tab";
    document.getElementById('activeOnglet3').className = "mdc-tab mdc-tab--active";

    document.getElementById('activeOnglet1Underline').className = "mdc-tab-indicator";
    document.getElementById('activeOnglet2Underline').className = "mdc-tab-indicator";
    document.getElementById('activeOnglet3Underline').className = "mdc-tab-indicator mdc-tab-indicator--active";
  }

  document.getElementById(ongletPicked).style.display = "block";
  evt.currentTarget.className += " active";
}


  var socket = io();

  // On demande le pseudo, on l'envoie au serveur
  var pseudo = prompt('Quel est votre pseudo ?');
  socket.emit('nouveau_client', pseudo);
  document.title = pseudo + ' - ' + document.title; // met le pseudo dans l'onglet

  // Quand on reçoit un message, on l'insère dans la page
  socket.on('message', function(data) {
    insereMessage(data.pseudo, data.message)
  })

  // Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
  $('#envoyer').on('click', function() {
    var message = $('#m').val();
    if(message!=''){
      socket.emit('chat message', message); // Transmet le message aux autres
      insereMessage(pseudo, message); // Affiche le message aussi sur notre page
      $('#m').val('').focus(); // Vide la zone de Chat et remet le focus dessus
      return false; // Permet de bloquer l'envoi "classique" du formulaire
    }
  });

  // Ajoute un message dans la page
  function insereMessage(pseudo, message) {
    $('#messages').append($('<li>').text(pseudo + " : " + message));
  }
