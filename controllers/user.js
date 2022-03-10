require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const token = process.env.JWT_PASSWORD
const User = require('./../models/User');

exports.signup = (req, res, next) => {
  const testEmail = isEmailInvalid(req.body.email);
  if (testEmail) {
    return res.status(403).json({ error: 'Email invalid,Veuillez saisir un email valid !' })
  } else {
    bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: req.body.email,
        password: hash
      });
      user.save()
        .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
  }  
};

function isEmailInvalid(email) {
  const regex = /^[a-zA-Z0-9.-_]+[@]{1}[a-zA-Z0-9.-_]+[.]{1}[a-z]{2,10}$/
  if (regex.test(email) === false) {
      return true
  }
  return false
  }


exports.login = (req, res, next) => {
  const testEmail = isEmailInvalid(req.body.email);
  if (testEmail) {
    return res.status(403).json({ error: 'Email invalid,Veuillez saisir un email valid !' })
  } else {
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          return res.status(401).json({ error: 'Utilisateur non trouvé !' });
        }
        bcrypt.compare(req.body.password, user.password)
          .then(valid => {
            if (!valid) {
              return res.status(401).json({ error: 'Mot de passe incorrect !' });
            }
            res.status(200).json({
              userId: user._id,
              token: jwt.sign(
                { userId: user._id },
                token,
                { expiresIn: '24h' }
              )
            });
          })
          .catch(error => res.status(500).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
  }
};