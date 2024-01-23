// _IMPORTATIONS_ //

const express = require('express');
const booksControllers = require('../controllers/books');
const auth = require('../middleware/auth'); // importation de l'authentification avec token
const multer = require('../middleware/multer-config');


// ROUTING //

const router = express.Router();

router.get('/', booksControllers.getAllBooks);
router.get('/bestrating', booksControllers.getBestBooks);
router.get('/:id', booksControllers.getOneBook);
router.post('/', auth, multer, booksControllers.createBook);
router.put('/:id', auth, multer, booksControllers.modifyBook);
router.delete('/:id', auth, booksControllers.deleteBook);
router.post('/:id/rating', auth, booksControllers.ratingBook);

module.exports = router;