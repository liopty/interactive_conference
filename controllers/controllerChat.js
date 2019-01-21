var ID = 0;
/*var lesVotes = new Dict({a: 1}, function (key) {
return "default: " + key;
});*/

//Initialisations Material Components
$(function() {
  mdc.autoInit();
  //const topAppBarElement = document.querySelector('.mdc-top-app-bar');
  //const topAppBar = new mdc.topAppBar.MDCTopAppBar(topAppBarElement);
  const drawer = mdc.drawer.MDCDrawer.attachTo(document.querySelector('.mdc-drawer'));

  const topAppBar = mdc.topAppBar.MDCTopAppBar.attachTo(document.getElementById('app-bar'));
  topAppBar.listen('MDCTopAppBar:nav', () => {
    drawer.open = !drawer.open;
  });
});

//Initialisation socket io
var socket = io();
var actualRoom = null;

// On demande le pseudo, on l'envoie au serveur
var pseudo = lireCookie("username");

var element = document.getElementById('id01');
element.innerHTML = "You are in room no. " + lireCookie("room");

socket.emit('nouveau_client', pseudo);
//document.title = pseudo + ' - ' + document.title; // met le pseudo dans l'onglet

function lireCookie(nom) {
  var nom2 = nom + "=";
  var arrCookies = document.cookie.split(';');
  for(var i=0;i < arrCookies.length;i++) {
    var a = arrCookies[i];
    while (a.charAt(0)==' ') {
      a = a.substring(1,a.length);
    }
    if (a.indexOf(nom2) == 0) {
      return a.substring(nom2.length,a.length);
    }
  }
  return "anonyme";
}

// Quand on reçoit un message, on l'insère dans la page
socket.on('message', function(data) {
  insereMessage(data.pseudo, data.message);
  var elem = document.getElementById('contentTabs');
  elem.scrollTop = elem.scrollHeight;
})

//on transmet le message et on l'affiche sur la page
function envoieMessage() {
  var message = $('#m').val();
  if (message != '') {
    socket.emit('chat_message', actualRoom, message); // Transmet le message aux autres
    insereMessage(pseudo, message, "yes"); // Affiche le message aussi sur notre page
    $('#m').val('').focus(); // Vide la zone de Chat et remet le focus dessus
    var elem = document.getElementById('contentTabs');
    elem.scrollTop = elem.scrollHeight;
    return false; // Permet de bloquer l'envoi "classique" du formulaire
  }
}

// Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
$('#envoyer').on('click', function() {
  envoieMessage();
});

//évènement click sur le bouton qui appel la fontion 'quitter_room'
$('#quitter_room').on('click', function() {
  socket.emit('leave_room', actualRoom);
  var element = document.getElementById('id01');
  element.innerHTML = "Accueil";
  window.location.pathname = '/';
});

//Appuyer sur entrer envoi le message
$(document).keypress(function(event) {
  var keycode = (event.keyCode ? event.keyCode : event.which);
  if (keycode == '13') {
    envoieMessage();
  }
});

// Ajoute un message dans la page
function insereMessage(pseudo, message, mind) {
  ID += 1;
  var buttonUPID = "btnUP" + ID;
  var buttonDOWNID = "btnDOWN" + ID;
  var msgID = "msg" + ID;

  //Création d'un div avec le pseudo, le message et un ID
  var text = document.createElement('div');
  var content = document.createTextNode(pseudo + " : " + message);
  text.appendChild(content);
  text.id = msgID;

  //Création du bouton UP avec un text, un id et une class
  var btnUP = document.createElement("BUTTON");
  var textUP = document.createTextNode("👍");
  btnUP.appendChild(textUP);
  btnUP.id = buttonUPID;
  btnUP.className = "vote upvote";

  //Création du bouton DOWN avec un text, un id et une class
  var btnDOWN = document.createElement("BUTTON");
  var textDOWN = document.createTextNode("👎");
  btnDOWN.appendChild(textDOWN);
  btnDOWN.id = buttonDOWNID;
  btnDOWN.className = "vote";


  if (mind == "yes") {
    $('#messages').append($('<div class="mindMsg">').append(text, btnUP, btnDOWN));
  } else {
    $('#messages').append($('<div class="notMindMsg">').text(pseudo + " : " + message), $('<div class="notMindBtn">').append(btnUP, btnDOWN));
  }
}

//Ajout d'un event listener sur les bouton qui ont pour class : vote
$(document).on("click", ".vote", function() {
  socket.emit("votes", pseudo, this.id);
  alert(pseudo + " : " + this.id);

});

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
