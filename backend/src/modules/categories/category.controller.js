const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const categoryService = require('./category.service');

exports.listCategories = catchAsync(async (req, res) => {
  const categories = await categoryService.listCategories(req.query, req.user);
  sendResponse(res, { data: { categories }, message: 'Categories retrieved' });
});

exports.createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  sendResponse(res, { statusCode: 201, data: { category }, message: 'Category created' });
});

exports.getCategory = catchAsync(async (req, res) => {
  const category = await categoryService.getCategory(req.params.id);
  sendResponse(res, { data: { category }, message: 'Category retrieved' });
});

exports.updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  sendResponse(res, { data: { category }, message: 'Category updated' });
});

exports.deleteCategory = catchAsync(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  sendResponse(res, { message: 'Category deleted' });
});
