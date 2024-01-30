const fs = require("fs");
const Book = require("../models/Book");


// création /ajout d'un nouveau livre
exports.createBook = (req, res, next) => {
  // extrait le contenu du champ book de la requête et convertit le JSON en objet JS
  const bookObject = JSON.parse(req.body.book);
  // supprime certaines propriétés non utilisées lors de la création d'un livre
  delete bookObject._id;
  delete bookObject._userId;
  // création nouvelle instance du modèle Book - combine les propriétés de bookObject avec l'ID de l'utilisateur et l'URL de l'image
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  // Enregistrement du livre dans la base de données
  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Objet enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// récupère un livre selon son ID
exports.getOneBook = async (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(400).json({ error }));
};

// modification d'un livre
exports.modifyBook = (req, res, next) => {
  // Objet contenant les informations du livre à mettre à jour
  // Si nouvelle image, l'URL est mise à jour
  // Sinon objet créé avec les informations du corps de la requête
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };
  // supprime la propriété _userId de l'objet bookObject pour éviter de modifier l'ID de l'utilisateur associé au livre
  delete bookObject._userId;
  // Recherche le livre spécifique à l'aide de son id
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      // vérifie si l'ID de l'utilisateur associé au livre correspond à l'ID de l'utilisateur authentifié
      if (book.userId !== req.auth.userId) {
        res.status(403).json({ message: "Unauthorized request" });
      } else {
        // on stocke l'url de l'ancienne image qui va être modifiée
        const oldImageUrl = book.imageUrl;
        // puis mise à jour avec les nouvelles informations
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => {
            // supprime l'ancienne image si une nouvelle image est téléchargée
            if (req.file) {
              // divise l'URL de l'ancienne image en utilisant "/images/" comme délimiteur et récupère le deuxième élément du tableau ainsi créé, donc le nom du fichier
              const filename = oldImageUrl.split("/images/")[1];
              // supprime le fichier spécifié
              fs.unlink(`images/${filename}`, (err) => {
                if (err) {
                  console.error("Error deleting old image:", err);
                }
              });
            }
            res.status(200).json({ message: "Livre modifié!" });
          })
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => res.status(400).json({ error }));
};

// suppression d'un livre
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      // vérifie si l'ID de l'utilisateur associé au livre correspond à l'ID de l'utilisateur authentifié
      if (book.userId !== req.auth.userId) {
        res.status(403).json({ message: "Unauthorized request" });
      } else {
        // divise l'URL de l'ancienne image en utilisant "/images/" comme délimiteur et récupère le deuxième élément du tableau ainsi créé, donc le nom du fichier
        const filename = book.imageUrl.split("/images/")[1];
        // suppression de l'image spécifiée
        fs.unlink(`images/${filename}`, () => {
          // Après avoir supprimé le fichier image, on supprime le livre de la base de données en utilisant son ID
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Livre supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

// affichage des 3 livres les mieux notés
exports.getBestBooks = (req, res, next) => {
  // recherche dans tous les livres
  // trie les résultats en fonction de la propriété averageRating par ordre décroissant donc les mieux notés en premier
  // limité à 3 résultats
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

// notation
exports.ratingBook = (req, res, next) => {
  // j'extrait les valeurs userId et rating du corps de la requête
  const { userId, rating } = req.body;

  // je vérifie que la note est comprise entre 0 et 5
  if (rating < 0 || rating > 5) {
    return res
      .status(400)
      .json({ message: "La note doit être comprise entre 0 et 5." });
  }

  // je recherche dans les données le livre avec l'ID fourni dans les paramètres de la requête
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      // je vérifie si l'utilisateur a déjà noté ce livre
      const userAlreadyRating = book.ratings.find((r) => r.userId === userId);
      if (userAlreadyRating) {
        return res.status(403).json(new Error());
      }

      // Puis j'ajoute la nouvelle note au tableau "ratings"
      book.ratings.push({ userId, grade: rating });
      // calcule le nombre total de livres notés
      const totalRatings = book.ratings.length;

      // calcule la somme totale des notes
      let sumRatings = 0;
      for (const ratingEntry of book.ratings) {
        const ratingValue = ratingEntry.grade; 
        sumRatings += ratingValue;
      }

      // calcul de la nouvelle moyenne des notes
      const averageRatingBeforeRounding = sumRatings / totalRatings;

      // Méthode pour arrondir la moyenne des notes à deux décimales
      const averageRatingRounded = parseFloat(
        averageRatingBeforeRounding.toFixed(2)
      );

      // Mise à jour de la moyenne des notes dans book
      book.averageRating = averageRatingRounded;

      // Sauvegarder les modifications en renvoyant le livre mis à jour
      return book
        .save()
        .then((updatedBook) => res.status(200).json(updatedBook))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

// affichage de tous les livres
exports.getAllBooks = async (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};
