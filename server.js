//Variables de connexion à la base de donnée POSTGRESQL
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://cthedeimvkuhno:1df531b4487c8829aca49c497eaba86d68f030a9025331c905fd66f98df00610@ec2-79-125-4-96.eu-west-1.compute.amazonaws.com:5432/d1hti0tcnlaid1',
  ssl: true,
});

//début de la connexion à la bd
client.connect();

//Creation des tables ROOM, APPUSER, MESSAGE, VOTE  // USER est une variable réservée
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

//Requetes préparées permettant l'insertion d'éléments dans différentes nos tables
const insertTableRoom = 'INSERT INTO room VALUES ($1,$2);';
const insertTableAppUser ='INSERT INTO AppUser (username,id_room,role) VALUES ($1,$2,$3)';
const insertTableMessage = 'INSERT INTO message (content, id_room, id_user, answered, comment,quizz) VALUES ($1,$2,$3,$4,$5,$6);';
const insertTableVote ='INSERT INTO vote VALUES ($1,$2,$3)';

//Variables liées à express et socket.io
const express = require("express");
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

//Le port prioritaire est 'process.env.PORT' (variable liée au serveur heroku)
//si la connexion au premier port est impossible ou que la variable n'est pas définie, l'application tourne sur le port local 5000
const PORT = process.env.PORT || 5000;
var fs = require('fs');
var ent = require('ent'); // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP

//Variable liée à l'externalisation des logs
const logs = [{timestamp: Math.round(new Date().getTime()/1000), flag: 'admin', psd: 'server', msg: 'Lancement du serveur'}];

//S'exécute toutes les 24h, supprime les room de plus de 24h
//il faut rajouter un attribut date dans la table room et ajouter la date lors de la creation du salon
//comparer CurrentTime avec le temps de chaque salon à inreval régulier (penser à envisager de tester aussi au lancement du serveur)
/*setInterval(function () {
  CurrentTime = Math.round(new Date().getTime()/1000);
  client.query("SELECT id_room, date FROM room;", (err, res) => {
    if (err) throw err;
    console.log(res);
    res.rows.forEach(function(element) {
      if (element.date <= CurrentTime - 86400000) {
        client.query("DELETE FROM room WHERE id_room = $1;",[{element.id_room}], (err2, res2) => {
          if (err2) throw err2;
          console.log(res2);
          roomno.splice(roomno.indexOf(element.id_room), 1);
        });
      }
    });
  });
}, 86400000);
*/


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
app.use('/statistiques', express.static('statistiques'));

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

//tableau contenant toutes les rooms existantes
var roomno=[];

//Initialise le tableau contenant les rooms existantes grâce à la table room de la bd
client.query("SELECT id_room FROM room;", (err, res) => { //On recupere les id de toutes les rooms existantes depuis la bd
  if (err) throw err;
  //console.log(res);
  res.rows.forEach(function(element) { //pour chaque tuple renvoyé
    roomno.push(element.id_room); // on ajoute l'id dans le tableau stocké sur le serveur
  });
});


io.on('connection', function(socket){
  //Permet de créer un nouveau salon et que le créateur rejoigne le salon qu'il a crée
  socket.on('creation_room', function(pseudo) {
    var tempoId;
    var check = false;
    // On créer un nouvel identifiant unique entre 1 et 1000 (arbitraire, augmenter en cas de nécessité et selon l'espace maximal de la bd)
    while(check!=true){
      var tempo = (Math.floor(Math.random() * 1000)+1);
      if (!roomno.includes(tempo)) {
        check=true;
        tempoId=tempo;
      }
    }
    roomno.push(tempoId); //Ajoute au tableau de salons le nouvel identifiant
    socket.join(tempoId); //Ajoute à la liste de la room avec comme identifiant tempoID le client

    //insertion du tuple (id_room,anonyme) dans la table ROOM lors de la creation d'une room "insertTableRoom" est une requete preparé definie plus haut
    client.query(insertTableRoom, [tempoId, false], (err, res) => { //[tempoId, false] sont les param à ajouter à la place des $ de "insertTableRoom"
      if (err) throw err;
      console.log(res);
      logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'BD', psd: 'server', msg: "Insertion du salon d'id :"+tempoId+"dans la table ROOM"});

  });

    //log visible sur heroku
    console.log("Creation d'une room ID: "+tempoId);
    //log externalisable
    logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'room', psd: 'server', msg: 'Création du salon '+tempoId});

    //on ajoute les informations du nouvel utilisateur à la table APPUSER
    client.query(insertTableAppUser, [pseudo, tempoId, 1], (err, res) => {
      if (err) throw err;
      console.log(res);
    });

    //on récupère les id de tous les utilisateurs puis on sélectionne uniquement le dernier créé
    client.query("SELECT id_user FROM AppUser ORDER BY id_user DESC LIMIT 1", (err, res) => {
      if (err) throw err;
      //on déclenche l'événement connectToRoom uniquement à celui qui vien de créer la room, on passe en paramètre l'id de la room et l'id de l'utilisateur
      io.sockets.in(tempoId).emit('connectToRoom', tempoId, res.rows[0].id_user);
      //console.log(res.rows);
    });
  });

  //Permet de rejoindre un salon déjà existant
  socket.on('join_room', function(id, pseudo) {
    var tempoId = id;
    for(var i = 0; i<roomno.length;i++){
      //On vérifie si l'identifiant existe dans le tableau de salon
      if(roomno[i]==id){
        console.log("Un utilisateur a rejoint la room: "+id);
        logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'room', psd: pseudo, msg: 'Un utilisateur a rejoint le salon '+id});

        //Insertion de la personne qui veut rejoindre (user = 0) avec son pseudo et l'id du salon
        client.query(insertTableAppUser, [pseudo, id, 0], (err, res) => {
          if (err) throw err;
          console.log(res);
          logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'BD', psd: 'server', msg: "Insertion de l'utilisateur : "+pseudo+" dans la room : "+id+" dans la table APPUSER"});
      });
        socket.join(id);
        client.query("SELECT id_user FROM AppUser ORDER BY id_user DESC LIMIT 1", (err, res) => {
          if (err) throw err;
          io.sockets.in(id).emit('connectToRoom', id, res.rows[0].id_user);
        //  console.log(res.rows);
        });

      }
    }
    client.query("SELECT username, content, id_message, m.quizz FROM message m, AppUser a WHERE m.id_user = a.id_user AND m.id_room=$1 ORDER by id_message ASC", [id], (err, res) => {
      if (err) throw err;
     // console.log(res.rows);
      res.rows.forEach(function(elem){
        if(elem.quizz === null){
            socket.emit('message', {pseudo: elem.username, message: elem.content, idMessage: elem.id_message, mind: "no"});

        } else {
           socket.emit('quizz', {question : elem.quizz, mind: "no"});
        }
        actualiserVotes(elem.id_message);
      });


    });
  });

  // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
  socket.on('nouveau_client', function(pseudo) {
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

  //Lors de l'evenement "chat message", le socket lance la fonction, cette evt correspond à l'envoie de message
  socket.on('chat_message', function(id, message, userId){
    //Ecrit dans la console le msg
    console.log("(Room: "+id+") "+message);
    logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'message', psd: userId, msg: "(Room: "+id+") "+message});

    //on ajoute dans la table message le nouveau message qui vient d'être envoyé
    client.query(insertTableMessage, [message,id,userId,false,null,null],(err, res) => {
      if (err) throw err;
      console.log(res);
      logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'BD', psd: 'server', msg: "Insertion du message : "+message+" d'id : "+id+" par : "+userId+" dans la table MESSAGE"});

    //on récupere l'id du dernier message ajouté à la bd
      client.query("SELECT id_message FROM Message ORDER BY id_message DESC LIMIT 1", (err, res2) => {
        if (err) throw err;
       // console.log(res2.rows);
        //on déclenche l'événement 'message' pour tout le monde sauf celui qui a initier la fonction
        socket.broadcast.to(id).emit('message', {pseudo: socket.pseudo, message: message, idMessage: res2.rows[0].id_message, mind: "no"});
        //on déclenche le mm evénement pour celui qui a envoyé le message mais avec le
        //param mind différent (variable qui modifie l'affichage des messages côté client)
        socket.emit('message', {pseudo: socket.pseudo, message: message, idMessage: res2.rows[0].id_message, mind: "yes"});
      });
    });
  });

    //Lors de la reception de l'evenement "chat quizz", le socket lance la fonction
    socket.on('chat_quizz', function(id, question, userId){
      var myJSON = JSON.stringify(question); // JSON, possiblement inutile, à verifier si question !== JSON.stringify(question)
      //Ecrit dans la console le msg
      console.log("(Room: "+id+") "+ question.titre);
      logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'quizz', psd: userId, msg: "(Room: "+id+") "+ question.titre});

      //on ajoute dans la table message le quizz qui vient d'être créé
      client.query(insertTableMessage, [null,id,userId,false,null,myJSON],(err, res) => {
        if (err) throw err;
        console.log(res);
        logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'BD', psd: 'server', msg: "Insertion du quizz : "+myJSON+" d'id : "+id+" par : "+userId+" dans la table MESSAGE"});

      //on déclenche l'événement 'quizz' pour tout le monde sauf celui qui a initier la fonction
        socket.broadcast.to(id).emit('quizz', {question : question, mind: "no"});
        //on déclenche l'événement 'quizz' pour celui qui a initier la fonction
        socket.emit('quizz', {question : question, mind: "yes"});
      });
    });

  //Permet de quitter un salon, se lance lors de la reception de l evt 'leave_room' lors de l'appuie sur le bouton quitter
  socket.on('leave_room', function(idRoom){
    socket.leave(idRoom); //Supprime de la liste du salon le client qui quitte le salon
    console.log("Un utilisateur a quitté la room: "+idRoom);
    logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'room', psd: 'server', msg: "Un utilisateur  a quitté le salon "+idRoom});
  });

  //S'active lors de l'appuie d'un bouton de vote
  socket.on('votes', function(userId, btnId) {
    //btnId est de la forme UP_X ou DOWN_X avec X id du message dans la bd
    btnId = btnId.split("_"); //on découpe le string sur le carac _  //btn ID = ['UP' ou 'DOWN', 'X']
    //vote prendra la valeur du vote (-1 ou 1)
    let vote;

    //on détecte si le vote était négatif ou positif
    if (btnId[0] === "DOWN") {
      vote = -1;
    } else { // si btnId[0] !== "DOWN" alors btnId[0] === "UP"
      vote = 1;
    }
    //on utilise une promesse pour être sûr que les requêtes à la bd aient fini leur exécution avant de continuer le code
    const promise1 = new Promise(function(resolve, reject) {
      //on vérifie si l'utilisateur avait déjà voté pour le message ou non en regardant dans la table vote
      client.query('SELECT vote FROM vote WHERE id_user=$1 AND id_message=$2;', [userId,btnId[1]], (err, res) => {
        if (err) {
          throw err;
          reject("false");
        }

        //si le resultat de la requete n'est pas undefined (donc vaut -1 ou 1)
          if (res.rows[0] !== undefined) {
            //on supprime le vote qui était présent dans la table vote puisque chaque utilisateurs n'a que 1 vote par message possible
            client.query('DELETE FROM vote WHERE id_user=$1 AND id_message=$2;', [userId,btnId[1]], (err, res2) => {
              if (err) throw err;
              console.log(res2);
              logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'BD', psd: 'server', msg: "Delete du vote : "+vote+" par : "+userId+" sur le message d'id : "+btnId[1]});

      });
            //si le vote était le même cela signifie que l'utilisateur veut juste annuler son vote
            if(res.rows[0].vote === vote){
              actualiserVotes(btnId[1]); //on exécute la fonction actualiserVotes avec l'id du message en param
              reject("false");//on rejette la promesse, les fonction qui dépendaient de cette promesse ne s'exécuteront pas
            }
          }
          //la promesse est respectée la suite peut s'exécuter
          resolve("true");


        });
    });

    //à la suite de la promesse1, si elle est respectée (le vote n'est pas identique à celui déjà present dans la bd)
    promise1.then(function(val) {
      //on ajoute le nouveau vote dans le table vote
      client.query(insertTableVote, [userId, btnId[1], vote], (err, res) => {
        if (err) throw err;
        console.log(res);
        logs.push({timestamp: Math.round(new Date().getTime()/1000), flag: 'BD', psd: 'server', msg: "Insertion du vote : "+vote+" par : "+userId+" sur le message d'id : "+btnId[1]+" dans la table VOTE"});

      actualiserVotes(btnId[1]);//on exécute la fonction actualiserVotes avec l'id du message en param
      });
    });

  });

  //Se déclenche à la réception de l'evt AffichageTopVote. Cette fonction sert à actualiser l'affichage des votes côté client lors des votes
  function actualiserVotes(idmessage) {
    //on récupère tous les votes du message présents dans la bd
    client.query("SELECT vote FROM vote WHERE id_message=$1;",[idmessage], (err, res) => {
      if (err) throw err;
      //console.log(res);
      //compteur servant à faire la somme des votes pour le message
      let voteVal = 0;
      //pour chaque votes du message
      res.rows.forEach(function(element) {
        voteVal += element.vote; //element.vote = -1 ou 1
      });
      //on déclenche l'événement 'AfficherVote' pour celui qui a initier la fonction
      socket.emit('AfficherVote', idmessage, voteVal);
      //on déclenche l'événement 'AfficherVote' pour tout le monde sauf celui qui a initier la fonction
      socket.broadcast.emit('AfficherVote', idmessage, voteVal); // à motifier en io.sockets.in(id).emit(XXX) avec id = id de la room ou le message est
    });
  }

   //Se déclenche à la réception de l'evt AffichageTopVote. Cette fonction sert à l'affichage de l'onget 2 TOP VOTE
   socket.on("AffichageTopVote", function(idUser, idRoom){
      //on créé un promesse
      const promise3 = new Promise(function(resolve, reject) {
        //Contiendra tous les messages de la room, présents dans la bd
        let messagesTab = [];
        //on récupère les informations, nécessaires à la suite, concernant tous les message de la room passée en param
        client.query("SELECT username, content, id_message, m.id_user, m.quizz  FROM message m, AppUser a WHERE m.id_user = a.id_user AND m.id_room=$1 ORDER by id_message ASC", [idRoom], (err, res) => {
          if (err) throw err;
          //console.log(res.rows);

          //on affecte le resultat de la requête à notre tableau
          messagesTab = res.rows;
          // la promesse est respectée on envoie un objet avec notre tableau de messages et l'id de l'utilisateur
          resolve({messagesTab : messagesTab, idUser : idUser});
        });
      });

      //Lorsque la promesse précédente est respectée
      promise3.then(function (data) { //data = l'objet passé en param de resolve(X)
        //tableau qui contiendra les couples (id_message, votes)
        let votesTab = [];
        //tableau qui verifira que toutes les promesses ont été respectées
        let promises = [];
        //pour chaque objet du tableau
        data.messagesTab.forEach(function(elem){ //elem = { username : X, content : X, id_message : X, id_user : X, quizz : X}
          //on rajoute un attribut vote et affect la valeur 0 à l'objet courant
          elem.vote = 0;
          //On ajoute une promesse à respecter à notre tableau de promesses
          promises.push(
            new Promise(res => {
              //On récupère tous les votes qui correspondent à l'id_message de l'objet courant
              client.query("SELECT id_message, vote FROM vote WHERE id_message = $1;", [elem.id_message], (err, res2) => {
                if (err) throw err;
                //console.log(res2.rows);

                //pour chaque couple (id_message,vote) du message
                res2.rows.forEach(function (e){
                  //on l'ajoute à notre tableau de votes
                  votesTab.push(e);
                });
                //on valide la promesse
                res();
              });
            }));
        });
        //attend que toutes les promesses du tableau soient respectées
        Promise.all(promises).then(function() {
            //pour tous les votes (id_message,vote)
            votesTab.forEach(function(element){
               //pour tous les msg de la room
               data.messagesTab.forEach(function(ele){
                   //si id_message des 2 objets sont les mêmes
                   if(element.id_message === ele.id_message){
                       //On ajoute la valeur du vote à l'attribut vote de l'objet message
                       ele.vote += element.vote;
                   }
               });
            });
            //on tri le tableau de messages selon l'attribut vote (ordre croissant)
            data.messagesTab.sort((a, b) => a.vote - b.vote);
            //pour chaque objet du tableau messagesTab
            data.messagesTab.forEach(function(el){
            // si l'attribut quizz est null (le message n'est pas un quizz)
            if (el.quizz === null){
                // si le message nous appartient
                if (el.id_user === data.idUser){
                    //on déclenche l'événement 'topMessage' pour celui qui a initier la fonction
                    socket.emit('topMessage', {pseudo: el.username, message: el.content, idMessage: el.id_message, vote: el.vote, mind: "yes"});
                } else { // sinon le message ne nous appartient pas
                    //on déclenche l'événement 'topMessage' pour tout le monde sauf celui qui a initier la fonction
                    socket.emit('topMessage', {pseudo: el.username, message: el.content, idMessage: el.id_message, vote: el.vote, mind: "no"});
                }
            }

            });
        });
      });

  //fermeture de socket.on("AffichageTopVote",...)
  });

  //fermeture de io.on('connection',...)
  });