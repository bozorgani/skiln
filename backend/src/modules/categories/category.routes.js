const express = require('express');
const auth = require('../../middlewares/auth');
const schemaValidate = require('../../middlewares/schemaValidate');
const { categorySchemas } = require('../../validations/schemas');
const categoryController = require('./category.controller');

const router = express.Router();

router
  .route('/')
  .get(auth({ required: false }), categoryController.listCategories)
  .post(auth('admin'), schemaValidate(categorySchemas.create), categoryController.createCategory);

router
  .route('/:id')
  .get(auth({ required: false }), categoryController.getCategory)
  .patch(auth('admin'), schemaValidate(categorySchemas.update), categoryController.updateCategory)
  .put(auth('admin'), schemaValidate(categorySchemas.update), categoryController.updateCategory)
  .delete(auth('admin'), categoryController.deleteCategory);

module.exports = router;
