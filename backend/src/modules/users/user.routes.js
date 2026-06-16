const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userController = require('./user.controller');

const router = express.Router();

router.get('/me', auth(), userController.getMe);
router.get('/stats', auth(), userController.getStats);
router.patch(
  '/me',
  auth(),
  validate(['name', 'bio', 'avatar'], { allowPartial: true }),
  userController.updateMe
);

router
  .route('/')
  .get(auth('admin'), userController.getUsers)
  .post(
    auth('admin'),
    validate(['name', 'phone', 'role']),
    userController.createUser
  );

router
  .route('/:id')
  .get(auth(['admin', 'teacher']), userController.getUser)
  .patch(
    auth('admin'),
    validate(['name', 'phone', 'email', 'password', 'role', 'bio', 'avatar'], {
      allowPartial: true,
    }),
    userController.updateUser
  )
  .put(
    auth('admin'),
    validate(['name', 'phone', 'email', 'password', 'role', 'bio', 'avatar'], {
      allowPartial: true,
    }),
    userController.updateUser
  )
  .delete(auth('admin'), userController.deleteUser);

router.put(
  '/:id/role',
  auth('admin'),
  validate(['role']),
  userController.updateUserRole
);

module.exports = router;

