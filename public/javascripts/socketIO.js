var socket_io = require('socket.io');
var io = socket_io();
var socketIO = {};

socketIO.io = io;

module.exports = socketIO;
