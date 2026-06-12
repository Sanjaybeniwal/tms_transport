const { Pump } = require('../models');
const crud = require('./crudController');

exports.getAllPumps = crud.getAll(Pump, [], ['name', 'contactPerson', 'mobile']);
exports.getPump = crud.getOne(Pump);
exports.createPump = crud.createOne(Pump);
exports.updatePump = crud.updateOne(Pump);
exports.deletePump = crud.deleteOne(Pump);
