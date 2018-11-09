//Qu'est ce qu'un websocket ?
//Le protocole WebSocket vise à développer un canal de communication full-duplex sur un socket TCP pour les navigateurs et les serveurs web.

const express = require("express");
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 5000
ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
//var MongoClient = require('mongodb').MongoClient;


//Routage de base (racine) qui prend le contenu html (et autres fichiers) du repertoire home
app.use('/', express.static('home'));

//Lancer le serveur http et écoute les connection sur le port indiqué
http.listen(PORT, function(){
// Ecrit dans la console sur quel port le serveur écoute
  console.log('listening on *:' + PORT);
});

/*
var uri = "mongodb://liopty:mdptmp@interactive-conferencebd-shard-00-00-vbsf2.gcp.mongodb.net:27017,interactive-conferencebd-shard-00-01-vbsf2.gcp.mongodb.net:27017,interactive-conferencebd-shard-00-02-vbsf2.gcp.mongodb.net:27017/test?ssl=true&replicaSet=interactive-conferenceBD-shard-0&authSource=admin&retryWrites=true";

MongoClient.connect(uri, function(err, db) {
  if (err) throw err;
  var dbo = db.db("mydb");
  dbo.createCollection("customers", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });
});
*/

io.on('connection', function(socket){

// Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
  socket.on('nouveau_client', function(pseudo) {
          pseudo = ent.encode(pseudo);
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
  socket.on('chat message', function(message){
    //Ecrit dans la console le msg
    console.log(message);
    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
    message = ent.encode(message);
    socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message});
  });

});
