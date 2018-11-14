//Initialisations Material Components
$(function() {
  mdc.autoInit();
});

/* Popup Nouvelle Room */
/*
jQuery(document).ready(function($){
	//open popup
	$('.cd-popup-trigger').on('click', function(event){
		event.preventDefault();
		$('.cd-popup').addClass('is-visible');
	});

	//close popup
	$('.cd-popup').on('click', function(event){
		if( $(event.target).is('.cd-popup-close') || $(event.target).is('.cd-popup') ) {
			event.preventDefault();
			$(this).removeClass('is-visible');
		}
	});
	//close popup when clicking the esc keyboard button
	$(document).keyup(function(event){
    	if(event.which=='27'){
    		$('.cd-popup').removeClass('is-visible');
	    }
    });
});
*/

/*
  Bouton connexion à un salon
  Lorsqu'on envoie le formulaire, on regarde dans la table si le numéro de salon existe,
  si oui on charge la page du salon,
  sinon on montre qu'il y a une erreur de numéro et on reste sur la page principal.
*/
/*
$('#join-room').on('click', function() {
  var numero = $('#num').val();

  if(numero != '') {
    for (var i = 0; i < ; i++) {
      if (numero == i) {
        windows.location.href="";
      }else {
        var elmt = document.getElementById("box-border");
        elmt.style.border-color = "red";
      }
    }
  }
}
*/
