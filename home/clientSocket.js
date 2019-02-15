var ID = 0;

//Initialisation socket io
var socket = io();

//variables temporaires concernant l'utilisateur et la room dans laquelle il se trouve
var actualRoom = null; //id de la room dans laquelle le client se trouve
var pseudo = null;
var idIntoDB = null; //id du client dans la bd

//-------------------------------//
//            ONGLET 1
//-------------------------------//

//lors de l'appuie sur l'onglet 1 RECENTS
$(document).on("click", "#activeOnglet1", function() {
  //on rend visible la boite d'envoie de messages
  document.getElementById('chatBox').style.visibility='visible';
  //on place le scroll en bas (sur les dernier messages)
  let elem = document.getElementById('contentTabs');
  elem.scrollTop = elem.scrollHeight;
});

//--------ROOMS -----------------------//

//Si l'utilisateur n'est pas dans une room actuellement, on lui montre la popup pour en rejoindre ou en creer une
if (actualRoom == null) {
  openPopup();
}

function openPopup() {
  $('.cd-popup').addClass('is-visible');
}

function closePopup() {
  $('.cd-popup').removeClass('is-visible');
}

/*Se lance lorsque le client appuie sur "nouveau salon" et appel un évènement côté serveur
pour créer un nouveau salon*/
$('#creer_room').on('click', function() {
  userConnected();
  socket.emit('creation_room', pseudo); // appel 'création_room' côté serveur
  socket.on('connectToRoom', function(roomID, userId) { //attend de reçevoir l'évenement 'connectToRoom'
    //affiche sur le html l'id de la room
    var element = document.getElementById('id01');
    actualRoom = roomID;
    element.innerHTML = "Room n°" + actualRoom;
    document.title = "Room "+actualRoom + ' - ' + "Interactive Conference"; // met la room dans l'onglet
    closePopup();
    if(idIntoDB === null && actualRoom !== null){ //si le client n'a pas d'id mais se trouve dans une room on lui donne l'id généré côté serveur
      idIntoDB = userId;
    }
  });
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
    socket.on('connectToRoom', function(data,userId) { // tres surement de la duplication de code ici
      if(idIntoDB === null && actualRoom === null){
        idIntoDB = userId;
      }
      var element = document.getElementById('id01');
      element.innerHTML = "Room n°" + data;
      actualRoom = data;
      document.title = "Room "+actualRoom + ' - ' + "Interactive Conference"; // met la room dans l'onglet
      closePopup(); // On part de la page d'accueil
    });
  }
});

//évènement click sur le bouton qui appel la fontion 'quitter_room'
$('#quitter_room').on('click', function() {
  document.getElementById('messages').innerHTML = ""; // On efface les messages pour le client qui veut quitter le salon
  socket.emit('leave_room', actualRoom);
  actualRoom = null; //On dit que le client n'est plus dans un salon
  idIntoDB = null; // On dit que le client n''a plus d'identifiant
  var element = document.getElementById('id01');
  element.innerHTML = "Accueil";
  var d = document.getElementById("modal");
  d.className += " mdc-drawer--closing";
  document.title = "Interactive Conference";
  openPopup(); //On revient sur la page d'accueil
});

//-------------- Quizz -----------------//

$('#quizz').on('click', function() {
  document.getElementById('card-quizz').style.display = "grid";
  document.getElementById('chatBox').style.display = "none";
});

$(document).mouseup(function (e){  //Erreur a modifier
  var container = $("#card-quizz");
  if (container.has(e.target).length === 0){
    //alert ("j'ai cliqué à l'extérieur de mon élément");
    document.getElementById('chatBox').style.display = "block";
    document.getElementById('card-quizz').style.display = "none";
}
});

//-------------------------------//

//évènement click sur le bouton 'sortirDuTiroir'
$('#sortirDuTiroir').on('click', function() {
  var d = document.getElementById("modal");
  d.className += " mdc-drawer--closing";
});

//--------MESSAGES -----------------------//

// Quand on reçoit un message, on l'insère dans la page
socket.on('message', function(data) {
  insereMessage(data.pseudo, data.message,data.idMessage, data.mind);
});

//on transmet le message et on l'affiche sur la page
function envoieMessage() {
  var message = $('#m').val();
  if (message != '') {
    socket.emit('chat_message', actualRoom, message, idIntoDB); // Transmet le message aux autres
    $('#m').val('').focus(); // Vide la zone de Chat et remet le focus dessus
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
function insereMessage(pseudo, message,idMessage, mind, div = '#messages', vote = 0, onglet = 1) {
  var buttonUPID = "UP_" + idMessage;
  var buttonDOWNID = "DOWN_" + idMessage;
  var msgID = "msg_" + idMessage;
  var voteID ="vote_"+idMessage;

  //Création d'un div avec le pseudo, le message et un ID
  var text = document.createElement('div');
  var content = document.createTextNode(pseudo + " : " + message);
  text.appendChild(content);
  text.id = msgID;

  // si le message n est pas le mien et u'il est dans l'onglet 1
  if(mind !== "yes" && onglet === 1){
    //Création du bouton UP avec un text, un id et une class
    var btnUP = document.createElement("BUTTON");
    var textUP = document.createTextNode("✚");//⯅ ❤ ✚ ➕ ☺ ⮝
    btnUP.appendChild(textUP);
    btnUP.id = buttonUPID;
    btnUP.className = "vote upvote";
    btnUP.style.color = "lightgray";

    //Création du bouton DOWN avec un text, un id et une class
    var btnDOWN = document.createElement("BUTTON");
    var textDOWN = document.createTextNode("⚊");//⯆ ✖ ⚊ ⮟ ☹ −
    btnDOWN.appendChild(textDOWN);
    btnDOWN.id = buttonDOWNID;
    btnDOWN.className = "vote";
    btnDOWN.style.color = "lightgray";
  }

  // creation balise p avec la valeur du vote en texte
  var para = document.createElement("P");
  var t = document.createTextNode(vote);
  para.appendChild(t);
  para.id = voteID;
  para.style.display = "inline-block";

  //si le message m'appartient on lui donne le visuel approprié
  if (mind == "yes") {
    var divVote = document.createElement('div');
    divVote.appendChild(para);
    divVote.className = "zoneDeVote";
    divVote.id = "zoneDeVoteMind";
    divVote.style.display = "block";
    $(div).append($('<div class="mindMsg">').append(text, divVote));
  } else { // sinon on lui donne le 2e visuel
    var divVote = document.createElement('div');
    if (onglet !== 1){ //si il n'est pas dans l'onglet 1 on n'ajoute pas les boutons de vote
        divVote.append(para);
    } else {
        divVote.append(btnUP, para, btnDOWN);
    }
    divVote.className = "zoneDeVote";
    divVote.id = "zoneDeVotenotMind";
    divVote.style.display = "block";
    $(div).append($('<div class="notMindMsg">').append(text, divVote));
  }

  let elem = document.getElementById('contentTabs');
  elem.scrollTop = elem.scrollHeight;
}

socket.on('AfficherVote', function(msgId, voteValue) {
  try {
    document.getElementById('vote_'+msgId).innerHTML = voteValue;
  } catch (e) {

  }
});

//Ajout d'un event listener sur les bouton qui ont pour class : vote
$(document).on("click", ".vote", function() {
  socket.emit("votes", idIntoDB, this.id);
  var couleur = document.getElementById(this.id).style.color;
  var numMsg = this.id.split("_");
  var idBtnOpp;

  if (numMsg[0] == "UP") {
    idBtnOpp = "DOWN_"+numMsg[1];
  } else {
    idBtnOpp = "UP_"+numMsg[1];
  }

  if (couleur == "lightgray") {
    document.getElementById(this.id).style.color = "orchid";
    document.getElementById(idBtnOpp).style.color = "lightgray";
  } else{
    document.getElementById(this.id).style.color = "lightgray";
  }
  //alert(idIntoDB + " : " + this.id);
});

//------------------ QUIZZ -----------------------//

// Quand on reçoit un quizz, on l'insère dans la page
socket.on('quizz', function(data) {
  insereQuizz(data.question, data.mind);
})

//on transmet le quizz et on l'affiche sur la page
function envoieQuizz() {
  var question = { //Objet question + proposition + solution
    titre: $('#quizz-titre').val(),
    proposition1 : $('#quizz-propo1').val(),
    solution1 : $('#checkbox1').is(":checked"),
    proposition2 : $('#quizz-propo2').val(),
    solution2 : $('#checkbox2').is(":checked"),
    proposition3 : $('#quizz-propo3').val(),
    solution3 : $('#checkbox3').is(":checked"),
    proposition4 : $('#quizz-propo4').val(),
    solution4 : $('#checkbox4').is(":checked"),
  };

  if (question.titre != '' & question.proposition1 != '' & question.proposition2 != '') {
    socket.emit('chat_quizz', actualRoom, question, idIntoDB); // Transmet le quizz aux autres
    $('#quizz-titre').val('').focus(); // Vide la zone de Chat et remet le focus dessus
    $('#quizz-propo1').val('').focus();
    $('#quizz-propo2').val('').focus();
    $('#quizz-propo3').val('').focus();
    $('#quizz-propo4').val('').focus();
    return false; // Permet de bloquer l'envoi "classique" du formulaire
  }
}

// Lorsqu'on envoie le formulaire, on transmet le quizz et on l'affiche sur la page
$('#envoyer-quizz').on('click', function() {
  envoieQuizz();
  document.getElementById('card-quizz').style.display = "none";
  document.getElementById('chatBox').style.display = "block";
});


// Ajoute un quizz dans la page
function insereQuizz(question, mind) {
  var propo1, propo2, propo3, propo4;
  var compteur1 = 0, compteur2 = 0, compteur3 = 0, compteur4 = 0; // Compteur de vote pour chaque choix

  if(question.proposition1 != ''){
    propo1 = '<button class="mdc-button" id="choixQuizz1"><span class="mdc-button__label"></span>' + question.proposition1 + '</span></button>' + " " + compteur1;
  }
  if(question.proposition2 != ''){
    propo2 = '<br>' + '<button class="mdc-button" id="choixQuizz2"><span class="mdc-button__label"></span>' + question.proposition2 + '</span></button>' + " " + compteur2;
  }
  if(question.proposition3 != ''){
    propo3 = '<br>' + '<button class="mdc-button" id="choixQuizz3"><span class="mdc-button__label"></span>' + question.proposition3 + '</span></button>' + " " + compteur3;
  }else{
    propo3 = '';
  }
  if(question.proposition4 != ''){
    propo4 = '<br>' + '<button class="mdc-button" id="choixQuizz4"><span class="mdc-button__label"></span>' + question.proposition4 + '</span></button>' + " " + compteur4;
  }else{
    propo4 = '';
  }

  var parent = "<div>" + '<p class="msgQuizz">' + question.titre + "</p>" + propo1 + propo2 + propo3 + propo4 + "</div>";

  if (mind == "yes") {
    $('#messages').append($('<div class="mindMsg">').append(parent));
  } else {
    $('#messages').append($('<div class="notMindMsg">').append(parent));
  }
  let elem = document.getElementById('contentTabs');
  elem.scrollTop = elem.scrollHeight;
}

var q1 = false, q2 = false, q3 = false, q4 = false;

// Récupération des click sur les bouton dans les quizz
// A implémenter (compte des votes pour chaque proposition de réponse à la question)
$(document).on("click", "#choixQuizz1", function() {
  if(!q1){
    document.getElementById('choixQuizz1').style.backgroundColor = "white";
    document.getElementById('choixQuizz1').color = "#8860D0";
    q1 = true;
  }else{
    document.getElementById('choixQuizz1').style.backgroundColor = "#11ffee00";
    document.getElementById('choixQuizz3').color = white;
    q1 = false;
  }
});
$(document).on("click", "#choixQuizz2", function() {
  if(!q2){
    document.getElementById('choixQuizz2').style.backgroundColor = "white";
    document.getElementById('choixQuizz2').color = "#8860D0";
    q2 = true;
  }else{
    document.getElementById('choixQuizz2').style.backgroundColor = "#11ffee00";
    document.getElementById('choixQuizz3').color = white;
    q2 = false;
  }
});
$(document).on("click", "#choixQuizz3", function() {
  if(!q3){
    document.getElementById('choixQuizz3').style.backgroundColor = "white";
    document.getElementById('choixQuizz3').color = "#8860D0";
    q3 = true;
  }else{
    document.getElementById('choixQuizz3').style.backgroundColor = "#11ffee00";
    document.getElementById('choixQuizz3').color = white;
    q3 = false;
  }
});
$(document).on("click", "#choixQuizz4", function() {
  if(!q4){
    document.getElementById('choixQuizz4').style.backgroundColor = "white";
    document.getElementById('choixQuizz4').color = "#8860D0";
    q4 = true;
  }else{
    document.getElementById('choixQuizz4').style.backgroundColor = "#11ffee00";
    document.getElementById('choixQuizz3').color = white;
    q4 = false;
  }
});

//-------------------------------//
//            ONGLET 2
//-------------------------------//

//lors du clique sur l'onglet 2 TOP VOTE
$(document).on("click", "#activeOnglet2", function() {
  //on vide les message présents dans l'onglet 2
  document.getElementById('sortedMessages').innerHTML = "";
  //on cache la boite d'envoie de messages
  document.getElementById('chatBox').style.visibility='hidden';
  //on envoie l'événement au serveur avec id utilisateur et id room en param
  socket.emit("AffichageTopVote", idIntoDB, actualRoom);

  let elem = document.getElementById('contentTabs');
  elem.scrollTop = elem.scrollHeight;
});

//lorsque l'on reçoit l'evénement 'topMessage'
socket.on('topMessage', function(data) {
  //on appel la fonction avec les bons parmetres pour afficher le message dans l'onglet 2 top Vote
  insereMessage(data.pseudo, data.message,data.idMessage, data.mind, '#sortedMessages', data.vote, 2);
});
