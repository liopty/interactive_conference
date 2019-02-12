var ID = 0;

//Initialisation socket io
var socket = io();

//variables temporaires concernant l'utilisateur et la room dans laquelle il se trouve
var actualRoom = null;
var pseudo = null;
var idIntoDB = null;


//--------ROOMS -----------------------//

//Si l'utilisateur n'est pas dans une room actuellement, on lui montre la page pour en rejoindre ou en creer une
if (actualRoom == null) {
  openPopup();
}

function openPopup() {
  $('.cd-popup').addClass('is-visible');
}

function closePopup() {
  $('.cd-popup').removeClass('is-visible');
}

/*Il se lance lorsque le client appuie sur "nouveau salon" et appel un évènement côté serveur
pour créer un nouveau salon*/
$('#creer_room').on('click', function() {
  userConnected();
  socket.emit('creation_room', pseudo); // appel 'création_room' côté serveur
  socket.on('connectToRoom', function(roomID, userId) {
    //affiche sur le html l'id de la room
    var element = document.getElementById('id01');
    actualRoom = roomID;
    element.innerHTML = "Room n°" + actualRoom;
    document.title = "Room "+actualRoom + ' - ' + document.title; // met la room dans l'onglet
    closePopup();
    if(idIntoDB === null && actualRoom !== null){
      idIntoDB = userId;
    }
  })
});

//Permet de récuperer la valeur de la textbox pseudo, si elle est vide alors on met "anonyme"
function userConnected(){
  pseudo = $('#pseudo_room').val();
  if (pseudo==null || pseudo==""){
    pseudo = "Anonyme";
  }
  socket.emit('nouveau_client', pseudo);
}

// évènement click sur le bouton qui appel la fontion 'rejoindre_room'
$('#rejoindre_room').on('click', function() {
  var id = document.getElementById('r_room').value; //on récupère l'id de la textbox
  userConnected();
  if (id != null) {
    socket.emit('join_room', id, pseudo); //appel la fonction 'join_room' du serveur en lui passant l'id et le pseudo
    socket.on('connectToRoom', function(data,userId) {
      if(idIntoDB === null && actualRoom === null){
        idIntoDB = userId;
      }
      var element = document.getElementById('id01');
      element.innerHTML = "Room n°" + data;
      actualRoom = data;
      document.title = "Room "+actualRoom + ' - ' + document.title; // met la room dans l'onglet
      closePopup();
    })
  }
});

//évènement click sur le bouton qui appel la fontion 'quitter_room'
$('#quitter_room').on('click', function() {
  document.getElementById('messages').innerHTML = "";
  socket.emit('leave_room', actualRoom);
  document.getElementById('messages').innerHTML = "";
  actualRoom = null;
  idIntoDB = null;
  var element = document.getElementById('id01');
  element.innerHTML = "Accueil";
  var d = document.getElementById("modal");
  d.className += " mdc-drawer--closing";
  openPopup();
});
//-------------------------------//



//--------MESSAGES -----------------------//

// Quand on reçoit un message, on l'insère dans la page
socket.on('message', function(data) {
  insereMessage(data.pseudo, data.message,data.idMessage, "no");
  var elem = document.getElementById('contentTabs');
  elem.scrollTop = elem.scrollHeight;
})

//on transmet le message et on l'affiche sur la page
function envoieMessage() {
  var message = $('#m').val();
  if (message != '') {
    socket.emit('chat_message', actualRoom, message, idIntoDB); // Transmet le message aux autres
    insereMessage(pseudo, message,null, "yes"); // Affiche le message aussi sur notre page
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

//Appuyer sur entrer envoi le message
$(document).keypress(function(event) {
  var keycode = (event.keyCode ? event.keyCode : event.which);
  if (keycode == '13') {
    envoieMessage();
  }
});

// Ajoute un message dans la page
function insereMessage(pseudo, message,idMessage, mind) {
  var buttonUPID = "UP_" + idMessage;
  var buttonDOWNID = "DOWN_" + idMessage;
  var msgID = "msg_" + idMessage;

  //Création d'un div avec le pseudo, le message et un ID
  var text = document.createElement('div');
  var content = document.createTextNode(pseudo + " : " + message);
  text.appendChild(content);
  text.id = msgID;

  var para = document.createElement("P");                       // Create a <p> element
  var t = document.createTextNode("This is a paragraph.");      // Create a text node
  para.appendChild(t);                                          // Append the text to <p>


  if(idMessage !== null){
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
  }



  if (mind == "yes") {
    $('#messages').append($('<div class="mindMsg">').append(text, btnUP, btnDOWN));
  } else {
    $('#messages').append($('<div class="notMindMsg">').append(text, btnUP, btnDOWN));
  }
}

socket.on('AfficherVote', function(msgId, voteValue) {
  /*let elem = document.getElementById('vote_'+msgId);
  elem.innerHTML(voteValue);*/
});

//Ajout d'un event listener sur les bouton qui ont pour class : vote
$(document).on("click", ".vote", function() {
  socket.emit("votes", idIntoDB, this.id);
  //alert(idIntoDB + " : " + this.id);
});
//-------------------------------//
