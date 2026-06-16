const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const ticketController = require('./ticket.controller');

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    validate(['subject', 'message']),
    ticketController.createTicket
  )
  .get(auth('admin'), ticketController.listAllTickets);

router.get('/me', auth(), ticketController.listMyTickets);

router.get('/:id', auth('admin'), ticketController.getTicketById);

router.post(
  '/:id/messages',
  auth(),
  validate(['message']),
  ticketController.reply
);

router.patch('/:id/close', auth('admin'), ticketController.close);

router.put(
  '/:id/status',
  auth('admin'),
  validate(['status']),
  ticketController.updateTicketStatus
);

router.put(
  '/:id/assign',
  auth('admin'),
  validate(['assignedTo']),
  ticketController.assignTicket
);

router.get(
  '/:ticketId/responses',
  auth('admin'),
  ticketController.getTicketResponses
);

router.post(
  '/:ticketId/responses',
  auth(),
  validate(['message', 'body'], { allowPartial: true }),
  ticketController.createResponse
);

module.exports = router;

