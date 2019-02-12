//Connexion à la base de donnée POSTGRESQL
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://etkwjaoexqkwmq:2754f201df86138b0165acd82f257c04e18d0fdef1114bf574b690f827e94310@ec2-54-228-224-37.eu-west-1.compute.amazonaws.com:5432/d2tuuaoos6ikd5',
  ssl: true,
});

client.connect();

client.query("CREATE TABLE IF NOT EXISTS room (id_room INT PRIMARY KEY NOT NULL, anonyme bool);", (err, res) => {
  if (err) throw err;
});
client.query("CREATE TABLE IF NOT EXISTS appuser (id_user SERIAL PRIMARY KEY NOT NULL, username text, role int, id_room int REFERENCES room (id_room));", (err, res) => {
  if (err) throw err;
});
client.query("CREATE TABLE IF NOT EXISTS message (content text, id_room int REFERENCES room (id_room), id_user int REFERENCES appuser (id_user), id_message SERIAL PRIMARY KEY NOT NULL, answered bool, comment int, quizz jsonb);", (err, res) => {
  if (err) throw err;
});
client.query("CREATE TABLE IF NOT EXISTS vote (id_user int REFERENCES appuser (id_user), id_message int REFERENCES message (id_message), vote int, PRIMARY KEY (id_user, id_message));", (err, res) => {
  if (err) throw err;
});
/*
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
const insertTableVote ='INSERT INTO vote VALUES ($1,$2,$3)';

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
//actualise le tableau roonno a chaque lancement du serveur grâce à la base de données
client.query("SELECT id_room FROM room;", (err, res) => {
  if (err) throw err;
  console.log(res);
  res.rows.forEach(function(element) {
    roomno.push(element.id_room);
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
          console.log(res);
        });
        socket.join(id);
        client.query("SELECT id_user FROM AppUser ORDER BY id_user DESC LIMIT 1", (err, res) => {
          if (err) throw err;

          io.sockets.in(id).emit('connectToRoom', id, res.rows[0].id_user);
          console.log(res.rows);
        });

      }
    }
    client.query("SELECT username, content, id_message FROM message m, AppUser a WHERE m.id_user = a.id_user AND m.id_room=$1 ORDER by id_message ASC", [id], (err, res) => {
      if (err) throw err;
      console.log(res.rows);
      res.rows.forEach(function(elem){
        socket.emit('message', {pseudo: elem.username, message: elem.content, idMessage: elem.id_message});
      });
    });
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
      client.query("SELECT id_message FROM Message ORDER BY id_message DESC LIMIT 1", (err, res2) => {
        if (err) throw err;
        console.log(res2.rows);
        socket.broadcast.to(id).emit('message', {pseudo: socket.pseudo, message: message, idMessage: res2.rows[0].id_message});
      });

    });


  });

  socket.on('leave_room', function(idRoom){
    socket.leave(idRoom);
    console.log("Un utilisateur a quitté la room: "+idRoom);
  });

  //Sactive lors de l'appuie d'un bouton de vote
  socket.on('votes', function(userId, btnId) {
    btnId = btnId.split("_");
    let vote;
    if (btnId[0] === "DOWN") {
      vote = -1;
    } else {
      vote = 1;
    }
    const promise1 = new Promise(function(resolve, reject) {
      client.query('SELECT vote FROM vote WHERE id_user=$1 AND id_message=$2;', [userId,btnId[1]], (err, res) => {
        if (err) {
          throw err;
          reject("false");
        }
          console.log("val requete idU,idM : "+res[0]);
          console.log("res.rows[0].vote !== null : "+res[0] !== null);
          console.log("val res.rows[0].vote !== [] : "+res[0] !== []);
          console.log("val res.rows[0].vote !== {} : "+res[0] !== {});

          if (res.rows !== null) {
            client.query('DELETE FROM vote WHERE id_user=$1 AND id_message=$2;', [userId,btnId[1]], (err, res2) => {
              if (err) throw err;
              console.log(res2);
            });
          }
          resolve("true");
        });
    });

    promise1.then(function(val) {
      client.query(insertTableVote, [userId, btnId[1], vote], (err, res) => {
        if (err) throw err;
        console.log(res);
      });
    });

    //socket.broadcast.emit('votes', pseudo, btn);
  });
});
