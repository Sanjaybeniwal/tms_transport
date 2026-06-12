const { User, ExpenseHead, Location, Pump, Party, Vehicle, Driver, Trip, Diesel, Expense, IncomeLog, PumpPayment, DriverAdvance, Owner } = require('../models');
const logger = require('../utils/logger');

const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding with Indian fleet owners...');

    // 1. Seed Users
    const usersCount = await User.count();
    if (usersCount === 0) {
      await User.bulkCreate([
        { name: 'Super Admin User', email: 'admin@tms.com', password: 'admin123', role: 'Super Admin', status: 'Active' },
        { name: 'Accountant User', email: 'accountant@tms.com', password: 'accountant123', role: 'Accountant', status: 'Active' },
        { name: 'Manager User', email: 'manager@tms.com', password: 'manager123', role: 'Manager', status: 'Active' },
        { name: 'Data Entry Operator', email: 'entry@tms.com', password: 'entry123', role: 'Data Entry Operator', status: 'Active' }
      ], { validate: true, individualHooks: true });
      logger.info('Default roles and users seeded successfully.');
    }

    // 2. Seed Expense Heads
    let dieselHead, tollHead, repairHead;
    const headsCount = await ExpenseHead.count();
    if (headsCount === 0) {
      const heads = await ExpenseHead.bulkCreate([
        { name: 'Diesel', description: 'Fuel expenses' },
        { name: 'Toll Tax', description: 'Highway toll payments' },
        { name: 'Repair', description: 'Vehicle maintenance and repairs' },
        { name: 'Salary', description: 'Driver and staff salaries' },
        { name: 'Tyre', description: 'Tyre changes or repair expenses' },
        { name: 'RTO', description: 'Regional Transport Office official fees' },
        { name: 'Challan', description: 'Traffic violation challan tickets' },
        { name: 'Miscellaneous', description: 'Other miscellaneous trip expenses' }
      ]);
      dieselHead = heads[0];
      tollHead = heads[1];
      repairHead = heads[2];
      logger.info('Default Expense Heads seeded successfully.');
    } else {
      dieselHead = await ExpenseHead.findOne({ where: { name: 'Diesel' } });
      tollHead = await ExpenseHead.findOne({ where: { name: 'Toll Tax' } });
      repairHead = await ExpenseHead.findOne({ where: { name: 'Repair' } });
    }

    // 3. Seed Locations
    let mumbaiLoc, BangaloreLoc, delhiLoc;
    const locationsCount = await Location.count();
    if (locationsCount === 0) {
      const locs = await Location.bulkCreate([
        { name: 'Mumbai Hub', state: 'Maharashtra', city: 'Mumbai', status: 'Active' },
        { name: 'Delhi Yard', state: 'Delhi', city: 'New Delhi', status: 'Active' },
        { name: 'Bangalore Center', state: 'Karnataka', city: 'Bangalore', status: 'Active' },
        { name: 'Kolkata Depot', state: 'West Bengal', city: 'Kolkata', status: 'Active' }
      ]);
      mumbaiLoc = locs[0];
      delhiLoc = locs[1];
      BangaloreLoc = locs[2];
      logger.info('Default Locations seeded successfully.');
    } else {
      mumbaiLoc = await Location.findOne({ where: { city: 'Mumbai' } });
      delhiLoc = await Location.findOne({ where: { city: 'New Delhi' } });
      BangaloreLoc = await Location.findOne({ where: { city: 'Bangalore' } });
    }

    // 4. Seed Pumps
    let highwayPump;
    const pumpsCount = await Pump.count();
    if (pumpsCount === 0) {
      const pumps = await Pump.bulkCreate([
        { name: 'Highway Petroleum Corp', contactPerson: 'John Doe', mobile: '9876543210', address: 'NH-48 Highway Side, Mumbai', openingBalance: 15000.00, allocatedLimit: 100000.00, status: 'Active' },
        { name: 'City Fuel Station', contactPerson: 'Jane Smith', mobile: '9876543211', address: 'Outer Ring Road, Bangalore', openingBalance: 0.00, allocatedLimit: 50000.00, status: 'Active' }
      ]);
      highwayPump = pumps[0];
      logger.info('Default Fuel Pumps seeded.');
    } else {
      highwayPump = await Pump.findOne({ where: { name: 'Highway Petroleum Corp' } });
    }

    // 5. Seed Parties (Customers)
    let abcLogistics;
    const partiesCount = await Party.count();
    if (partiesCount === 0) {
      const parties = await Party.bulkCreate([
        { name: 'ABC Logistics Pvt Ltd', contactPerson: 'Robert Wilson', mobile: '9988776655', gstNumber: '27ABCDE1234F1Z5', address: 'Industrial Area, Phase II, Mumbai', status: 'Active' },
        { name: 'Global Trade Syndicate', contactPerson: 'Sarah Connor', mobile: '9988776644', gstNumber: '29FGHIJ5678K2Z6', address: 'Tech Park Layout, Bangalore', status: 'Active' }
      ]);
      abcLogistics = parties[0];
      logger.info('Default Parties (Customers) seeded.');
    } else {
      abcLogistics = await Party.findOne({ where: { name: 'ABC Logistics Pvt Ltd' } });
    }

    // 6. Seed Indian Fleet Owners
    const ownersCount = await Owner.count();
    if (ownersCount === 0) {
      logger.info('Seeding mock Indian Owners, fleet vehicles, and transaction histories...');

      const owner1 = await Owner.create({
        name: 'Yadav Logistics (Rajesh Yadav)',
        mobile: '9822001122',
        email: 'rajesh@yadavlogistics.in',
        address: 'Plot 45, Kalamboli Transport Nagar, Navi Mumbai, Maharashtra',
        status: 'Active'
      });

      const owner2 = await Owner.create({
        name: 'Balaji Roadlines (Baldev Singh)',
        mobile: '9811223344',
        email: 'baldev@balajiroadlines.com',
        address: 'Sanjay Gandhi Transport Nagar, GT Road, Delhi',
        status: 'Active'
      });

      const owner3 = await Owner.create({
        name: 'Sri Kumaran Transports (K. Srinivasan)',
        mobile: '9443210987',
        email: 'srinivasan@kumarantrans.co.in',
        address: 'Salem Main Road, Namakkal, Tamil Nadu',
        status: 'Active'
      });

      // 7. Seed Vehicles under Indian Owners
      const today = new Date();
      
      const expSoon1 = new Date();
      expSoon1.setDate(today.getDate() + 12);
      
      const expSoon2 = new Date();
      expSoon2.setDate(today.getDate() + 25);

      const vehicle1 = await Vehicle.create({
        vehicleNumber: 'MH-12-PQ-5678',
        vehicleType: '10-Tyre Open Truck',
        ownerId: owner1.id,
        rcNumber: 'RC-MH12-876543',
        insuranceNumber: 'INS-99002233',
        insuranceExpiry: expSoon1.toISOString().split('T')[0],
        fitnessExpiry: expSoon2.toISOString().split('T')[0],
        permitExpiry: '2027-12-15',
        pollutionExpiry: expSoon1.toISOString().split('T')[0],
        status: 'Active'
      });

      const vehicle2 = await Vehicle.create({
        vehicleNumber: 'DL-01-AB-1234',
        vehicleType: 'Container 20ft',
        ownerId: owner2.id,
        rcNumber: 'RC-DL01-223344',
        insuranceNumber: 'INS-88776655',
        insuranceExpiry: '2027-01-10',
        fitnessExpiry: expSoon1.toISOString().split('T')[0],
        permitExpiry: '2027-06-30',
        pollutionExpiry: '2026-11-20',
        status: 'Active'
      });

      const vehicle3 = await Vehicle.create({
        vehicleNumber: 'TN-28-XY-9876',
        vehicleType: '14-Tyre Multi-Axle Trailer',
        ownerId: owner3.id,
        rcNumber: 'RC-TN28-556677',
        insuranceNumber: 'INS-11223344',
        insuranceExpiry: expSoon2.toISOString().split('T')[0],
        fitnessExpiry: '2027-08-15',
        permitExpiry: expSoon1.toISOString().split('T')[0],
        pollutionExpiry: expSoon2.toISOString().split('T')[0],
        status: 'Active'
      });

      // 8. Seed Drivers
      const licenseExp = new Date();
      licenseExp.setDate(today.getDate() + 15);

      const driver1 = await Driver.create({
        name: 'Rajesh Sharma',
        mobile: '9988112233',
        address: 'Pune Highway Road, Pune',
        licenseNumber: 'DL-MH12-20150003',
        licenseExpiry: licenseExp.toISOString().split('T')[0],
        joiningDate: '2020-03-15',
        salary: 18000.00,
        status: 'Active'
      });

      const driver2 = await Driver.create({
        name: 'Amit Patel',
        mobile: '9988112244',
        address: 'Delhi Bypass Chowk, New Delhi',
        licenseNumber: 'DL-DL01-20180009',
        licenseExpiry: '2030-05-12',
        joiningDate: '2022-06-01',
        salary: 22000.00,
        status: 'Active'
      });

      // 9. Seed Trips
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const startOfLastMonth = lastMonthDate.toISOString().split('T')[0];

      const tripCompleted = await Trip.create({
        tripNumber: 'TRP-100204',
        vehicleId: vehicle1.id,
        driverId: driver1.id,
        fromLocationId: mumbaiLoc.id,
        toLocationId: BangaloreLoc.id,
        partyId: abcLogistics.id,
        freightAmount: 65000.00,
        advance: 10000.00,
        startDate: startOfLastMonth,
        endDate: today.toISOString().split('T')[0],
        status: 'Completed'
      });

      const tripRunning = await Trip.create({
        tripNumber: 'TRP-100205',
        vehicleId: vehicle2.id,
        driverId: driver2.id,
        fromLocationId: delhiLoc.id,
        toLocationId: mumbaiLoc.id,
        partyId: abcLogistics.id,
        freightAmount: 85000.00,
        advance: 15000.00,
        startDate: today.toISOString().split('T')[0],
        status: 'Running'
      });

      // 10. Diesel Fuel Refueling logs
      await Diesel.create({
        vehicleId: vehicle1.id,
        pumpId: highwayPump.id,
        driverId: driver1.id,
        tripId: tripCompleted.id,
        quantity: 250.00,
        rate: 94.50,
        totalAmount: 23625.00,
        date: startOfLastMonth
      });

      await Diesel.create({
        vehicleId: vehicle2.id,
        pumpId: highwayPump.id,
        driverId: driver2.id,
        tripId: tripRunning.id,
        quantity: 300.00,
        rate: 95.00,
        totalAmount: 28500.00,
        date: today.toISOString().split('T')[0]
      });

      // 11. Other Expenses
      await Expense.create({
        expenseHeadId: tollHead.id,
        vehicleId: vehicle1.id,
        tripId: tripCompleted.id,
        amount: 4500.00,
        date: startOfLastMonth,
        remarks: 'NH48 highway toll plazas'
      });

      await Expense.create({
        expenseHeadId: repairHead.id,
        vehicleId: vehicle1.id,
        amount: 3200.00,
        date: today.toISOString().split('T')[0],
        remarks: 'Front tyre puncture and balance alignment'
      });

      // 12. Driver Advances
      await DriverAdvance.create({
        driverId: driver1.id,
        tripId: tripCompleted.id,
        amount: 8000.00,
        date: startOfLastMonth,
        remarks: 'Toll and food allowance'
      });

      // 13. Income logs
      await IncomeLog.create({
        partyId: abcLogistics.id,
        tripId: tripCompleted.id,
        amount: 65000.00,
        date: today.toISOString().split('T')[0],
        remarks: 'Received full payment bank transfer ABC Logistics'
      });

      // 14. Pump Payment Settlements
      await PumpPayment.create({
        pumpId: highwayPump.id,
        amount: 30000.00,
        date: today.toISOString().split('T')[0],
        paymentMethod: 'UPI',
        transactionNumber: 'TXN-98726514781',
        remarks: 'Settled outstanding fuel dues via UPI'
      });

      logger.info('Indian owners, fleet data, and transactions successfully seeded.');
    }

    logger.info('Database seeding completed successfully.');
  } catch (error) {
    logger.error('Error during database seeding:', error);
  }
};

module.exports = seedDatabase;
