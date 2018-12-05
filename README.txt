Chopper le projet Git:

git clone https://gitlab.univ-nantes.fr/E174399P/interactive-conference.git
cd interactive-conference/
git config --global user.name "Maxime CLAIRAND"
git config user.email "maxime.clairand@etu.univ-nantes.fr"

Effectuer un commit:

git add .
git commit -m "message du commit"
git push origin master
-> La il demande à se connecter

Récuperer la derniere version du projet:

git pull origin master


Lancer le serveur:

npm start
