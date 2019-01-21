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
var pseudo = prompt('Quel est votre pseudo ?');
document.cookie ="username="+pseudo;
socket.emit('nouveau_client', pseudo);

$('#creer_room').on('click', function() {
  socket.emit('creation_room');
  socket.on('connectToRoom', function(data) {
    //affiche sur le html l'id de la room
    document.cookie = "room="+data;
    actualRoom = lireCookie("room");
    window.location.pathname = '/chat';
  })
});

// évènement click sur le bouton qui appel la fontion 'rejoindre_room'
$('#rejoindre_room').on('click', function() {
  var id = document.getElementById('r_room').value;
  if (id != null) {
    socket.emit('join_room', id);
    socket.on('connectToRoom', function(data) {
      //affiche sur le html l'id de la room
      document.cookie = "room="+data;
      actualRoom = lireCookie("room");
      window.location.pathname = '/chat';
    })
  }
});

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
  return null;
}
