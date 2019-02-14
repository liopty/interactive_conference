//Connexion à la base de donnée POSTGRESQL
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://cthedeimvkuhno:1df531b4487c8829aca49c497eaba86d68f030a9025331c905fd66f98df00610@ec2-79-125-4-96.eu-west-1.compute.amazonaws.com:5432/d1hti0tcnlaid1',
  ssl: true,
});

client.connect();

client.query("CREATE TABLE IF NOT EXISTS room (id_room INT PRIMARY KEY NOT NULL, anonyme bool);", (err, res) => {
  if (err) throw err;
});
client.query("CREATE TABLE IF NOT EXISTS appuser (id_user SERIAL PRIMARY KEY NOT NULL, username text, role int, id_room int REFERENCES room (id_room) ON DELETE CASCADE);", (err, res) => {
  if (err) throw err;
});
client.query("CREATE TABLE IF NOT EXISTS message (content text, id_room int REFERENCES room (id_room) ON DELETE CASCADE, id_user int REFERENCES appuser (id_user) ON DELETE CASCADE, id_message SERIAL PRIMARY KEY NOT NULL, answered bool, comment int, quizz jsonb);", (err, res) => {
  if (err) throw err;
});
client.query("CREATE TABLE IF NOT EXISTS vote (id_user int REFERENCES appuser (id_user) ON DELETE CASCADE, id_message int REFERENCES message (id_message) ON DELETE CASCADE, vote int, PRIMARY KEY (id_user, id_message));", (err, res) => {
  if (err) throw err;
});

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
var fs = require('fs');
var ent = require('ent'); // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP

const logs = [{timestamp: Math.round(new Date().getTime()/1000), flag: 'admin', psd: 'server', msg: 'Lancement du serveur'}];

//S'exécute toutes les 24h, supprime les room de plus de 24h
//il faut rajouter je pense un champs dans room genre date création ?
// on fait un trigger qui se déclenche à chaque fois qu'une nouvelle room est ajouté
//comparé CurrentTime avec le temps de cahque salon
/*setInterval(function () {
  CurrentTime = Math.round(new Date().getTime()/1000);
  client.query("SELECT id_room, date FROM room;", (err, res) => {
    if (err) throw err;
    console.log(res);
    res.rows.forEach(function(element) {
      if (element.date ) {

      }
      roomno.push(element.id_room);
    });
  });
}, 86400000);*/



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

app.get('/statistiques',(req, res) => {
  app.use('/', express.static('statistiques'));
});
//Lancer le serveur http et écoute les connection sur le port indiqué
http.listen(PORT, function(){
  // Ecrit dans la console sur quel port le serveur écoute
  console.log('listening on *:' + PORT);
});

// Téléchargement des logs
app.get('/download',(req, res) => {
  fs.unlinkSync('./logs/externalize.csv');
  console.log('Construction du fichier ...');
  const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const csvWriter = createCsvWriter({
      path: 'logs/externalize.csv',
      header: [
        {id: 'timestamp', title: 'TIMESTAMP'},
        {id: 'flag', title: 'FLAG'},
        {id: 'psd', title: 'PSEUDO'},
        {id: 'msg', title: 'MESSAGE'}
      ]
    });
  csvWriter.writeRecords(logs).then(() => {
    res.download('./logs/externalize.csv', 'externalize.csv');
    console.log('... téléchargé');
  });
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
    console.log(Math.round(new Date().getTime()/1000));
    var tempoId;
    var check = false;
    // On créer un nouvel identifiant unique entre 1 et 1000
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
    logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'room', psd: 'server', msg: 'Création du salon '+tempoId});

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
        logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'room', psd: pseudo, msg: 'Un utilisateur a rejoint le salon '+id});

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
        socket.emit('message', {pseudo: elem.username, message: elem.content, idMessage: elem.id_message, mind: "no"});
        actualiserVotes(elem.id_message);
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
  logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'admin', psd: 'server', msg: "Un utilisateur s'est connecté"});


  //Lors de l'evenement "disconnect", le socket lance la fonction
  socket.on('disconnect', function(){
    //Ecrit dans la console lorsqu'un utilisateur se déconnecte
    console.log("un utilisateur s'est déconnecté");
    logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'admin', psd: 'server', msg: "Un utilisateur s'est déconnecté"});


  });

  //Lors de l'evenement "chat message", le socket lance la fonction
  socket.on('chat_message', function(id, message, userId){
    //Ecrit dans la console le msg
    console.log("(Room: "+id+") "+message);
    logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'message', psd: userId, msg: "(Room: "+id+") "+message});

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
        socket.broadcast.to(id).emit('message', {pseudo: socket.pseudo, message: message, idMessage: res2.rows[0].id_message, mind: "no"});
        socket.emit('message', {pseudo: socket.pseudo, message: message, idMessage: res2.rows[0].id_message, mind: "yes"});
      });
    });
  });

    //Lors de l'evenement "chat quizz", le socket lance la fonction
    socket.on('chat_quizz', function(id, question, userId){
      var myJSON = JSON.stringify(question); // JSON 
      //Ecrit dans la console le msg
      console.log("(Room: "+id+") "+ question.titre);
      logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'quizz', psd: userId, msg: "(Room: "+id+") "+ question.titre});

      client.query(insertTableMessage, [null,id,userId,false,null,myJSON],(err, res) => {
        if (err) throw err;
        console.log(res);
        socket.broadcast.to(id).emit('quizz', {question : question, mind: "no"});
        socket.emit('quizz', {question : question, mind: "yes"});

      });


    });

  socket.on('leave_room', function(idRoom){
    socket.leave(idRoom);
    console.log("Un utilisateur a quitté la room: "+idRoom);
    logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'room', psd: 'server', msg: "Un utilisateur  a quitté le salon "+idRoom});
  });

  //S'active lors de l'appuie d'un bouton de vote
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
        //si le resultat de la requete n'est pas nul
          if (res.rows[0] !== undefined) {
            client.query('DELETE FROM vote WHERE id_user=$1 AND id_message=$2;', [userId,btnId[1]], (err, res2) => {
              if (err) throw err;
              console.log(res2);
            });
            if(res.rows[0].vote === vote){
              actualiserVotes(btnId[1]);
              reject("false");
            }
          }
          resolve("true");


        });
    });

    promise1.then(function(val) {
      client.query(insertTableVote, [userId, btnId[1], vote], (err, res) => {
        if (err) throw err;
        console.log(res);
        actualiserVotes(btnId[1]);
      });
    });

  });

  function actualiserVotes(idmessage) {
    client.query("SELECT vote FROM vote WHERE id_message=$1;",[idmessage], (err, res) => {
      if (err) throw err;
      console.log(res);
      let voteVal = 0;
      res.rows.forEach(function(element) {
        voteVal += element.vote;
      });
      console.log("voteVal "+voteVal);
      socket.emit('AfficherVote', idmessage, voteVal);
      socket.broadcast.emit('AfficherVote', idmessage, voteVal);
    });
  }

   socket.on("AffichageTopVote", function(idUser, idRoom){

      const promise3 = new Promise(function(resolve, reject) {
        let messagesTab = [];
        client.query("SELECT username, content, id_message  FROM message m, AppUser a WHERE m.id_user = a.id_user AND m.id_room=$1 ORDER by id_message ASC", [idRoom], (err, res) => {
          if (err) throw err;
          //console.log(res.rows);
          messagesTab = res.rows;
          resolve(messagesTab);
          console.log("messagesTab : "+messagesTab);

        });

      });

      promise3.then(function (messagesTab) {
        let votesTab = [];
        messagesTab.forEach(function(elem){
          elem.vote = 0;
          client.query("SELECT id_message, vote FROM vote WHERE id_message = $1;", [elem.id_message], (err, res2) => {
            if (err) throw err;
            console.log(res2.rows);

            res2.rows.forEach(function (e){
              console.log("e : "+e);
              votesTab.push(e);
              console.log("votesTab : "+votesTab);

            });

          });
        }).then(function(){
            console.log("votesTabJusteAvantRetour : "+votesTab);
            return { messages: messagesTab, votes: votesTab }
        }).then(function(data) {

        //pour tous les votes
        data.votes.forEach(function(element){
          console.log("element : "+element);
          //pour tous les msg de la room
          data.messages.forEach(function(ele){
            console.log("ele : "+ele);
            if(element.id_message === ele.id_message){
              ele.vote += element.vote;
            }
          });
        });

      });

        //  socket.emit('topMessage', {pseudo: elem.username, message: elem.content, idMessage: elem.id_message, mind: "no"});

  });



  });