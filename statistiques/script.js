/* Nombre d'utilisateur dans la room*/
var nb_utilisateur = "...";
var nb_msg = "...";
var nb_thumb_up = "...";
var nb_thumb_down = "...";
var tps_salon = "...";

window.onload = function() {
	document.getElementById("nb_users").innerHTML = nb_utilisateur + " utilisateurs dans le salon";	
	document.getElementById("messages").innerHTML = nb_msg + " messages postés";	
	document.getElementById("nb_thumb_up").innerHTML = nb_thumb_up;	
	document.getElementById("nb_thumb_down").innerHTML = nb_thumb_down;	
	document.getElementById("temps").innerHTML = "Le salon est ouvert depuis " + tps_salon;	
}