console.log("1");

var uri = "mongodb://liopty:mdptmp@interactive-conferencebd-shard-00-00-vbsf2.gcp.mongodb.net:27017,interactive-conferencebd-shard-00-01-vbsf2.gcp.mongodb.net:27017,interactive-conferencebd-shard-00-02-vbsf2.gcp.mongodb.net:27017/test?ssl=true&replicaSet=interactive-conferenceBD-shard-0&authSource=admin&retryWrites=true";
console.log("2");

MongoClient.connect(uri, function(err, db) {
  if (err) throw err;
  var dbo = db.db("mydb");
  dbo.createCollection("customers", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });
});


//Initialisations Material Components
$(function() {
  mdc.autoInit();
});

//Initialisation socket io
var socket = io();

// On demande le pseudo, on l'envoie au serveur
var pseudo = prompt('Quel est votre pseudo ?');
socket.emit('nouveau_client', pseudo);
document.title = pseudo + ' - ' + document.title; // met le pseudo dans l'onglet

// Quand on reçoit un message, on l'insère dans la page
socket.on('message', function(data) {
  insereMessage(data.pseudo, data.message);
  var elem = document.getElementById('contentTabs');
  elem.scrollTop = elem.scrollHeight;
})

// Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
$('#envoyer').on('click', function() {
  var message = $('#m').val();
  if (message != '') {
    socket.emit('chat message', message); // Transmet le message aux autres
    insereMessage(pseudo, message); // Affiche le message aussi sur notre page
    $('#m').val('').focus(); // Vide la zone de Chat et remet le focus dessus
    var elem = document.getElementById('contentTabs');
    elem.scrollTop = elem.scrollHeight;
    return false; // Permet de bloquer l'envoi "classique" du formulaire
  }
});

//Appuyer sur entrer envoi le message
$(document).keypress(function(event) {
  var keycode = (event.keyCode ? event.keyCode : event.which);
  if (keycode == '13') {
    var message = $('#m').val();
    if (message != '') {
      socket.emit('chat message', message); // Transmet le message aux autres
      insereMessage(pseudo, message); // Affiche le message aussi sur notre page
      $('#m').val('').focus(); // Vide la zone de Chat et remet le focus dessus
      var elem = document.getElementById('contentTabs');
      elem.scrollTop = elem.scrollHeight;
      return false; // Permet de bloquer l'envoi "classique" du formulaire
    }
  }
});

// Ajoute un message dans la page
function insereMessage(pseudo, message) {
  $('#messages').append($('<li>').text(pseudo + " : " + message));
}


//Gestion des onglets
document.getElementById('recent').style.display = "block";

function openCity(evt, ongletPicked, activeOnglet) {
  var i, tabcontent, tablinks;

  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

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
