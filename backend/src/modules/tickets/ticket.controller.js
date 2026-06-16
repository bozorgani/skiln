const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const ticketService = require('./ticket.service');

exports.createTicket = catchAsync(async (req, res) => {
  const ticket = await ticketService.createTicket({
    user: req.user._id,
    subject: req.body.subject,
    message: req.body.message,
  });
  sendResponse(res, {
    statusCode: 201,
    message: 'Ticket created',
    data: ticket,
  });
});

exports.listMyTickets = catchAsync(async (req, res) => {
  const tickets = await ticketService.listTickets({ user: req.user._id });
  sendResponse(res, { data: tickets, message: 'Tickets retrieved' });
});

exports.listAllTickets = catchAsync(async (_req, res) => {
  const tickets = await ticketService.listTickets();
  sendResponse(res, { data: tickets, message: 'All tickets retrieved' });
});

exports.reply = catchAsync(async (req, res) => {
  const ticket = await ticketService.addMessage({
    id: req.params.id,
    sender: req.user._id,
    body: req.body.message,
    isAdmin: req.user.role === 'admin',
  });
  sendResponse(res, { data: ticket, message: 'Reply sent' });
});

exports.close = catchAsync(async (req, res) => {
  const ticket = await ticketService.closeTicket(req.params.id);
  sendResponse(res, { data: ticket, message: 'Ticket closed' });
});

exports.getTicketById = catchAsync(async (req, res) => {
  const ticket = await ticketService.getTicketById(req.params.id);
  sendResponse(res, { data: ticket, message: 'Ticket retrieved' });
});

exports.updateTicketStatus = catchAsync(async (req, res) => {
  const ticket = await ticketService.updateTicketStatus(req.params.id, req.body.status);
  sendResponse(res, { data: ticket, message: 'Ticket status updated' });
});

exports.assignTicket = catchAsync(async (req, res) => {
  const ticket = await ticketService.assignTicket(req.params.id, req.body.assignedTo);
  sendResponse(res, { data: ticket, message: 'Ticket assigned' });
});

exports.getTicketResponses = catchAsync(async (req, res) => {
  const responses = await ticketService.getTicketResponses(req.params.ticketId);
  sendResponse(res, { data: responses, message: 'Ticket responses retrieved' });
});

exports.createResponse = catchAsync(async (req, res) => {
  const ticket = await ticketService.addMessage({
    id: req.params.ticketId,
    sender: req.user._id,
    body: req.body.message || req.body.body,
    isAdmin: req.user.role === 'admin',
  });
  sendResponse(res, {
    statusCode: 201,
    message: 'Response created',
    data: ticket,
  });
});

