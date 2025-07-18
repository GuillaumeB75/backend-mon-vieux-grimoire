
const jwt = require('jsonwebtoken');

// Exportation d'un middleware qui sera utilisé pour protéger les routes
module.exports = (req, res, next) => {
   try {
       // Extraction du token du header 'Authorization' de la requête entrante
       const token = req.headers.authorization.split(' ')[1];

       // Vérification du token avec une clé secrète; la fonction verify lève une erreur si le token est invalide
       const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');

       // Extraction de l'identifiant utilisateur (userId) des données du token décodé
       const userId = decodedToken.userId;

       // Ajout de l'identifiant utilisateur à l'objet de requête 
       req.auth = {
           userId: userId
       };

       // Passage à la prochaine fonction middleware dans la pile
	next();
   } catch(error) {
       // Si une erreur se produit (par exemple, si le token est invalide), envoi d'une réponse avec le statut 401 Unauthorized
       res.status(401).json({ error });
   }
};
