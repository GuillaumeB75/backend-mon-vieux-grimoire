// Importation du module bcrypt pour le hachage des mots de passe.
const bcrypt = require('bcrypt');
// Importation de jsonwebtoken pour créer et gérer des tokens d'authentification.
const jwt = require('jsonwebtoken');

// Importation du modèle User, qui est un schéma Mongoose pour les utilisateurs.
const User = require('../models/User');

// Fonction pour l'inscription d'un nouvel utilisateur.
exports.signup = (req, res, next) => {
    // Hashage du mot de passe 
    bcrypt.hash(req.body.password, 10)
      .then(hash => {
        // Création d'un nouvel utilisateur avec l'email reçu et le mot de passe haché.
        const user = new User({
          email: req.body.email,
          password: hash
        });
        // Sauvegarde de l'utilisateur dans la base de données.
        user.save()
          .then(() => res.status(201).json({ message: 'Utilisateur créé !' })) // Succès : utilisateur créé.
          .catch(error => res.status(400).json({ error })); // Erreur : problème lors de l'enregistrement.
      })
      // Erreur de hachage.
      .catch(error => res.status(500).json({ error }));
  };

// Fonction pour connecter un utilisateur existant.
exports.login = (req, res, next) => {
    // Recherche de l'utilisateur par email.
    User.findOne({ email: req.body.email })
        .then(user => {
            // Si l'utilisateur n'existe pas, retourner une erreur.
            if (!user) {
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            // Comparaison du mot de passe envoyé avec le mot de passe haché stocké.
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    // Si la comparaison échoue, retourner une erreur.
                    if (!valid) {
                        return res.status(401).json({ error: 'Mot de passe incorrect !' });
                    }
                    // Si la comparaison est réussie, retourner l'ID utilisateur et un token d'authentification.
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            'RANDOM_TOKEN_SECRET',
                            { expiresIn: '24h' } // Le token expire après 24 heures.
                        )
                    });
                })
                // Erreur pendant la vérification du mot de passe.
                .catch(error => res.status(500).json({ error }));
        })
        // Erreur lors de la recherche de l'utilisateur.
        .catch(error => res.status(500).json({ error }));
 };
