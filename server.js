//Connexion à la base de donnée POSTGRESQL
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://ozbctqqchiljth:5f22d877c8494e181c8a357c31fe010526b8794c23d13a55e0b9898d1e425bcb@ec2-46-137-121-216.eu-west-1.compute.amazonaws.com:5432/d7gccoqn0007v3',
  ssl: true,
});

client.connect();
/*
client.query("CREATE TABLE room (id_room INT PRIMARY KEY NOT NULL, anonyme bool);", (err, res) => {
if (err) throw err;
});
client.query("CREATE TABLE appuser (id_user SERIAL PRIMARY KEY NOT NULL, username text, role int, id_room int REFERENCES room (id_room));", (err, res) => {
if (err) throw err;
});
client.query("CREATE TABLE message (content text, id_room int REFERENCES room (id_room), id_user int REFERENCES appuser (id_user), id_message SERIAL PRIMARY KEY NOT NULL, answered bool, comment int, quizz jsonb);", (err, res) => {
if (err) throw err;
});
client.query("CREATE TABLE vote (id_user int REFERENCES appuser (id_user), id_message int REFERENCES message (id_message), vote int, PRIMARY KEY (id_user, id_message));", (err, res) => {
if (err) throw err;
});

client.query("INSERT INTO room VALUES (7000,FALSE);", (err, res) => {
if (err) throw err;
console.log(res);
});


client.query("INSERT INTO AppUser (username, id_room, role) VALUES ('VieuxMan',7000,0);", (err, res) => {
if (err) throw err;
console.log(res);
});

client.query("INSERT INTO message (content, id_room, id_user, answered) VALUES ('SALUT',7000,1,FALSE);", (err, res) => {
if (err) throw err;
console.log(res);
});

client.query("INSERT INTO vote VALUES (1,1,1);", (err, res) => {
if (err) throw err;
console.log(res);
});

client.query("SELECT * FROM room;", (err, res) => {
if (err) throw err;
console.log(res);

});
client.query("SELECT * FROM AppUser;", (err, res) => {
if (err) throw err;
console.log(res);
});
client.query("SELECT * FROM message;", (err, res) => {
if (err) throw err;
console.log(res);
});

client.query("SELECT * FROM vote;", (err, res) => {
if (err) throw err;
console.log(res);
});
*/

/*
var test;

client.query("SELECT * FROM room;", (err, res) => {
if (err) throw err;
test = res.rows[0];
console.log(res);
});

setTimeout(function(){ console.log(test.id_room); }, 2000);
*/

//constantes pour les prepared request
const insertTableRoom = 'INSERT INTO room VALUES ($1,$2);';
const insertTableAppUser ='INSERT INTO AppUser (username,id_room,role) VALUES ($1,$2,$3)';
const insertTableMessage = 'INSERT INTO message (content, id_room, id_user, answered, comment,quizz) VALUES ($1,$2,$3,$4,$5,$6);';

const express = require("express");
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 5000;
var ent = require('ent'); // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP


//POUR VIDER LES TABLES DE LA BD
/*
  client.query("DELETE FROM vote;", (err, res) => {
  if (err) throw err;
  console.log(res);
  });
  client.query("DELETE FROM message;", (err, res) => {
  if (err) throw err;
  console.log(res);
  });
  client.query("DELETE FROM AppUser;", (err, res) => {
  if (err) throw err;
  console.log(res);
  });
  client.query("DELETE FROM room;", (err, res) => {
  if (err) throw err;
  console.log(res);
  });
*/



  //Routage de base (racine) qui prend le contenu html (et autres fichiers) du repertoire home
  app.use('/', express.static('home'));

  //Lancer le serveur http et écoute les connection sur le port indiqué
  http.listen(PORT, function(){
    // Ecrit dans la console sur quel port le serveur écoute
    console.log('listening on *:' + PORT);
  });

  var roomno=[];
  client.query("SELECT id_room FROM room;", (err, res) => {
  if (err) throw err;
  console.log(res);
  res.rows.forEach(function(element) {
  console.log(element);
  });
  });


  io.on('connection', function(socket){

    socket.on('creation_room', function(pseudo) {
    var tempoId;
    var check = false;
    while(check!=true){
      var tempo = (Math.floor(Math.random() * 1000)+1);
      if (!roomno.includes(tempo)) {
        check=true;
        tempoId=tempo;
      }
    }
    roomno.push(tempoId);
    socket.join(tempoId);

    //insertion du tuple (id_room,anonyme) dans la TABLE room lors de la creation d'une room
    client.query(insertTableRoom, [tempoId, false], (err, res) => {
    if (err) throw err;
    console.log(res);
    });

    console.log("Creation d'une room ID: "+tempoId);


    client.query(insertTableAppUser, [pseudo, tempoId, 1], (err, res) => {
    if (err) throw err;
    console.log(res);
    });

    client.query("SELECT id_user FROM AppUser ORDER BY id_user DESC LIMIT 1", (err, res) => {
    if (err) throw err;

    io.sockets.in(tempoId).emit('connectToRoom', tempoId, res.rows[0].id_user);
    console.log(res.rows);
    });
  });

  socket.on('join_room', function(id, pseudo) {
    var tempoId = id;
    for(var i = 0; i<roomno.length;i++){
      if(roomno[i]==id){
        console.log("Un utilisateur a rejoint la room: "+id);

        client.query(insertTableAppUser, [pseudo, id, 0], (err, res) => {
        if (err) throw err;
        //console.log(res);
        });

        socket.join(id);
        client.query("SELECT id_user FROM AppUser ORDER BY id_user DESC LIMIT 1", (err, res) => {
        if (err) throw err;

        io.sockets.in(id).emit('connectToRoom', id, res.rows[0].id_user);
        console.log("id : "+id+ " send to : "+res.rows[0].id_user);
        //console.log(res.rows);
        });

      }
    }

  });

  // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
  socket.on('nouveau_client', function(pseudo) {
    if(pseudo!=null){
      pseudo = ent.encode(pseudo);
    }
    socket.pseudo = pseudo;
    socket.broadcast.emit('nouveau_client', pseudo);
  });

  //Ecrit dans la console lorsqu'un utilisateur se connecte
  console.log("un utilisateur s'est connecté");

  //Lors de l'evenement "disconnect", le socket lance la fonction
  socket.on('disconnect', function(){
    //Ecrit dans la console lorsqu'un utilisateur se déconnecte
    console.log("un utilisateur s'est déconnecté");

    //temporaire pour tester ce qu'il y a dans la bd
    client.query("SELECT * FROM AppUser;", (err, res) => {
    if (err) throw err;
    console.log(res.rows);
    });
    client.query("SELECT * FROM message;", (err, res) => {
    if (err) throw err;
    console.log(res.rows);
  });
  });

  //Lors de l'evenement "chat message", le socket lance la fonction
  socket.on('chat_message', function(id, message, userId){
    //Ecrit dans la console le msg
    console.log("(Room: "+id+") "+message);
    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personne
    if(message!=null){
      message = ent.encode(message);
    }

    client.query(insertTableMessage, [message,id,userId,false,null,null],(err, res) => {
    if (err) throw err;
    console.log(res);
    });

    socket.broadcast.to(id).emit('message', {pseudo: socket.pseudo, message: message});
  });

  socket.on('leave_room', function(idRoom){
    socket.leave(idRoom);
    console.log("Un utilisateur a quitté la room: "+idRoom);
  });

  //Sactive lors de l'appuie d'un bouton de vote
  socket.on('votes', function(pseudo, btn) {
    //temporaire, à remplacer quand la bd sera implémentée
    DicoDesVotes.add(btn, pseudo);
    var tmp = DicoDesVotes.entries();
    var tmp2 = DicoDesVotes.entries();
    while (tmp.next().value != null) {
      console.log("tmp = lesVotes.entries() : tmp : " + tmp2.next().value);
    }
    socket.broadcast.emit('votes', pseudo, btn);
  });
});
