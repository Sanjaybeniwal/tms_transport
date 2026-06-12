const { Party } = require('../models');
const crud = require('./crudController');

exports.getAllParties = crud.getAll(Party, [], ['name', 'contactPerson', 'mobile']);
exports.getParty = crud.getOne(Party);
exports.createParty = crud.createOne(Party);
exports.updateParty = crud.updateOne(Party);
exports.deleteParty = crud.deleteOne(Party);
