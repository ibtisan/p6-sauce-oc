const Thing = require('../models/thing');
const fs = require('fs');

exports.createThing = (req, res, next) => {
    const thingObject = JSON.parse(req.body.sauce);
    delete thingObject._id;
    const thing = new Thing({
      ...thingObject,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    thing.save()
      .then(() => res.status(201).json({ message: 'Objet enregistré !'}))
      .catch(error => res.status(400).json({ error }));
  };


exports.modifyThing = (req, res, next) => {
  Thing.findOne({ _id: req.params.id })
  .then(thing => {
    if (!thing) {
      res.status(404).json({
        error: new Error('No such Thing!')
      });
    }
    if (thing.userId !== req.auth.userId) {
      res.status(403).json({
        error: new Error('Unauthorized request!')
      });
    }
    const filename = thing.imageUrl.split('/images/')[1];
    fs.unlink(`images/${filename}`, () => {
      const thingObject = req.file ?
      {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      } : { ...req.body };
    Thing.updateOne({ _id: req.params.id }, { ...thingObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: 'Objet modifié !'}))
      .catch(error => res.status(400).json({ error }));

    });
  })
  .catch(error => res.status(500).json({ error }));
  };


  exports.deleteThing = (req, res, next) => {
    Thing.findOne({ _id: req.params.id })
      .then(thing => {
        if (!thing) {
          res.status(404).json({
            error: new Error('No such Thing!')
          });
        }
        if (thing.userId !== req.auth.userId) {
          res.status(403).json({
            error: new Error('Unauthorized request!')
          });
        }
        const filename = thing.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Thing.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
            .catch(error => res.status(400).json({ error }));
        });
      })
      .catch(error => res.status(500).json({ error }));
  };

  exports.getOneThing = (req, res, next) => {
    Thing.findOne({ _id: req.params.id })
    .then(thing => res.status(200).json(thing))
    .catch(error => res.status(400).json({ error }));
};


exports.getAllThing = (req, res, next) => {
  Thing.find()
  .then(things => res.status(200).json(things))
  .catch(error => res.status(400).json({ error }));
};


exports.likeThing = (req, res, next) => {
  
  const {like, userId} = req.body
  //like ===0, -1, 1
  if (![1, -1, 0].includes(like)) return res.status(403).send({ message:"Invalid like value" })
  Thing.findOne({ _id: req.params.id })
  .then((product) => updateVote(product, like, userId, res))
  .then((pr) => pr.save())
  .then((prod) => sendClientResponse(prod, res))
  .catch((err) => res.status(500).send(err))
}


function updateVote(product, like, userId, res) {
  if (like === 1 || like === -1) return incrementVote(product, userId, like)
  return resetVote(product, userId, res)
}

function sendClientResponse(product, res) {
  if (product == null) {
      console.log("NOTHING TO UPDATE")
      return res.status(404).send({ message: "Object not found in database" })
  }
  console.log("ALL GOOD, UPDATING:", product)
  return Promise.resolve(res.status(200).send(product)).then(() => product)        
}

function resetVote(product, userId, res) {
  const { usersLiked, usersDisliked } = product
  if ([usersLiked, usersDisliked].every((arr) => arr.includes(userId)))
  return Promise.reject("User seems to have voted both  ways")

  if (![usersLiked, usersDisliked].some((arr) => arr.includes(userId)))
  return Promise.reject("User seems to not have voted")

  
  if (usersLiked.includes(userId)) { 
      --product.likes
      product.usersLiked = product.usersLiked.filter((id) => id !== userId)
  } else {
      --product.dislikes
      product.usersDisliked = product.usersDisliked.filter((id) => id !== userId)
  }
  return product
  }

function incrementVote(product, userId, like) {
  const { usersLiked, usersDisliked } = product

  const votersArray = like === 1 ?  usersLiked : usersDisliked
  if (votersArray.includes(userId)) return product
  votersArray.push(userId)

  like === 1 ? ++product.likes : ++product.dislikes
  return product
}