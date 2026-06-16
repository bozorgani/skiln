const ApiError = require('../../core/ApiError');
const Ticket = require('./ticket.model');

const createTicket = async ({ user, subject, message }) => {
  return Ticket.create({
    user,
    subject,
    messages: [
      {
        sender: user,
        body: message,
      },
    ],
  });
};

const listTickets = async (filter = {}) => {
  return Ticket.find(filter)
    .populate('user', 'name email')
    .populate('messages.sender', 'name role')
    .sort({ updatedAt: -1 });
};

const addMessage = async ({ id, sender, body, isAdmin }) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  if (ticket.status === 'closed') {
    throw new ApiError(400, 'Ticket already closed');
  }
  const isOwner = ticket.user.toString() === sender.toString();
  if (!isAdmin && !isOwner) {
    throw new ApiError(403, 'You cannot respond to this ticket');
  }
  ticket.messages.push({ sender, body });
  await ticket.save();
  return ticket.populate(['user', 'messages.sender']);
};

const closeTicket = async (id) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { status: 'closed' },
    { new: true }
  );
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  return ticket;
};

const getTicketById = async (id) => {
  const ticket = await Ticket.findById(id)
    .populate('user', 'name email')
    .populate('messages.sender', 'name role');
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  return ticket;
};

const updateTicketStatus = async (id, status) => {
  if (!['open', 'closed'].includes(status)) {
    throw new ApiError(400, 'Invalid ticket status');
  }
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  )
    .populate('user', 'name email')
    .populate('messages.sender', 'name role');
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  return ticket;
};

const assignTicket = async (id, assignedTo) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { assignedTo },
    { new: true }
  )
    .populate('user', 'name email')
    .populate('assignedTo', 'name email')
    .populate('messages.sender', 'name role');
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  return ticket;
};

const getTicketResponses = async (ticketId) => {
  const ticket = await Ticket.findById(ticketId)
    .populate('messages.sender', 'name email role')
    .select('messages');
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  return ticket.messages || [];
};

module.exports = {
  createTicket,
  listTickets,
  addMessage,
  closeTicket,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  getTicketResponses,
};

