const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Dishes = require('../models/dishes')

const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

dishRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, (req, res, next) => {
        Dishes.find({})
            .populate('comments.author')
            .then((dishes) => {
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(dishes);
            }, (err) => next(err))
            .catch((err) => {
                next(err);
            });
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdminUser, (req, res, next) => {
        Dishes.create(req.body)
            .then((dish) => {
                console.log('Dish Created', dish);
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(dish);
            }, (err) => next(err))
            .catch((err) => {
                next(err);
            })
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdminUser,
        (req, res, next) => {
            res.statusCode = 403;
            res.end('PUT operation is not supported!');
        })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdminUser, (req, res, next) => {
        Dishes.deleteMany({})
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => {
                next(err);
            })
    });

dishRouter.route('/:dishID')

    .get(cors.cors, (req, res, next) => {
        Dishes.findById(req.params.dishID)
            .options(cors.corsWithOptions, (req, res) => {
                res.statusCode(200)
            })
            .populate('comments.author')
            .then((dishes) => {
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(dishes);
            }, (err) => next(err))
            .catch((err) => {
                next(err);
            });
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdminUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on ${req.params.dishID}`);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdminUser, (req, res, next) => {
        Dishes.findByIdAndUpdate(req.params.dishID, {
                $set: req.body
            }, {
                new: true
            })
            .then((dishes) => {
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(dishes);
            }, (err) => next(err))
            .catch((err) => {
                next(err);
            });
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdminUser, (req, res, next) => {
        Dishes.findByIdAndRemove(req.params.dishID)
            .then((dishes) => {
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(dishes);
            }, (err) => next(err))
            .catch((err) => {
                next(err);
            });
    })

dishRouter.route('/:dishID/comments')

    .get(cors.cors, (req, res, next) => {
        Dishes.findById(req.params.dishID)
            .options(cors.corsWithOptions, (req, res) => {
                res.statusCode(200)
            })
            .populate('comments.author')
            .then((dish) => {
                if (dish != null) {
                    res.statusCode = 200;
                    res.setHeader('Content-type', 'application/json');
                    res.json(dish.comments);
                } else {
                    err = new Error('Dish ' + req.params.dishID + ' not found')
                    err.statusCode = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => {
                next(err);
            });
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Dishes.findById(req.params.dishID)
            .then((dish) => {
                if (dish != null) {
                    req.body.author = req.user._id
                    dish.comments.push(req.body);
                    dish.save()
                        .then((dish) => {
                            res.statusCode = 200;
                            res.setHeader('Content-type', 'application/json');
                            res.json(dish);
                        })
                } else {
                    err = new Error('Dish ' + req.params.dishID + ' not found')
                    err.statusCode = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => {
                next(err);
            });
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation is not supported!');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Dishes.findById(req.params.dishID)
            .then((dish) => {
                if (dish != null) {
                    for (var i = (dish.comments.length - 1); i >= 0; i--) {
                        dish.comments.id(dish.comments[i]._id).remove();
                    }
                    dish.save()
                        .then((dish) => {
                            res.statusCode = 200;
                            res.setHeader('Content-type', 'application/json');
                            res.json(dish);
                        })
                } else {
                    err = new Error('Dish ' + req.params.dishID + ' not found')
                    err.statusCode = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => {
                next(err);
            });
    })

dishRouter.route('/:dishID/comments/:commentId')
    .get(cors.cors, (req, res, next) => {
        Dishes.findById(req.params.dishID)
            .options(cors.corsWithOptions, (req, res) => {
                res.statusCode(200)
            })
            .populate('comments.author')
            .then((dish) => {
                if (dish != null && dish.comments.id(req.params.commentId) != null) {
                    res.statusCode = 200;
                    res.setHeader('Content-type', 'application/json');
                    res.json(dish.comments.id(req.params.commentId));
                } else if (dish === null) {
                    err = new Error('Dish ' + req.params.dishID + ' not found')
                    err.statusCode = 404;
                    return next(err);
                } else {
                    err = new Error('Comment ' + dish.comments.id(req.params.commentId) +
                        ' not found in dish ' + req.params.dishID)
                    err.statusCode = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => {
                next(err);
            });
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation is not supported on /dishes/' +
            req.params.dishID + '/comments/' + req.params.commentId);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Dishes.findById(req.params.dishID)
            .then((dish) => {
                if (dish != null &&
                    dish.comments.id(req.params.commentId) != null &&
                    dish.comments.id(req.params.commentId).author.equals(req.user._id) === true
                ) {
                    if (req.body.rating) {
                        dish.comments.id(req.params.commentId).rating = req.body.rating;
                    }
                    if (req.body.comment) {
                        dish.comments.id(req.params.commentId).comment = req.body.comment;
                    }
                    dish.save()
                        .then((dish) => {
                            res.statusCode = 200;
                            res.setHeader('Content-type', 'application/json');
                            res.json(dish);
                        }, (err) => next(err));
                } else if (dish === null) {
                    err = new Error('Dish ' + req.params.dishID + ' not found')
                    err.statusCode = 404;
                    return next(err);
                } else if (dish.comments.id(req.params.commentId).author.equals(req.user._id) === false) {
                    err = new Error('You are not authorized to perform this opration.')
                    err.statusCode = 403;
                    return next(err);
                } else {
                    err = new Error('Comment ' + dish.comments.id(req.params.commentId) +
                        ' not found in dish ' + req.params.dishID)
                    err.statusCode = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => {
                next(err);
            });
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Dishes.findById(req.params.dishID)
            .then((dish) => {
                if (dish != null &&
                    dish.comments.id(req.params.commentId) != null &&
                    dish.comments.id(req.params.commentId).author.equals(req.user._id) === true
                ) {
                    dish.comments.id(req.params.commentId).remove();
                    dish.save()
                        .then((dish) => {
                            res.statusCode = 200;
                            res.setHeader('Content-type', 'application/json');
                            res.json(dish);
                        })
                } else if (dish === null) {
                    err = new Error('Dish ' + req.params.dishID + ' not found')
                    err.statusCode = 404;
                    return next(err);
                } else if (dish.comments.id(req.params.commentId).author.equals(req.user._id) === false) {
                    err = new Error('You are not authorized to perform this opration.')
                    err.statusCode = 403;
                    return next(err);
                } else {
                    err = new Error('Comment ' + dish.comments.id(req.params.commentId) +
                        ' not found in dish ' + req.params.dishID)
                    err.statusCode = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => {
                next(err);
            });
    })
module.exports = dishRouter;