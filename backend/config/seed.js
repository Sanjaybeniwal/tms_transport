const { User, ExpenseHead, Location, Pump, Party, Vehicle, Driver, Trip, Diesel, Expense, IncomeLog, PumpPayment, DriverAdvance, Owner, Page } = require('../models');
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
        docAlertResponsibility: 'Admin',
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
        docAlertResponsibility: 'Admin',
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
        docAlertResponsibility: 'Other',
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
        advanceDate: startOfLastMonth,
        balanceHoldAmount: 3000.00,
        podStatus: 'Approved',
        balanceReceivedDate: today.toISOString().split('T')[0],
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
        advanceDate: today.toISOString().split('T')[0],
        balanceHoldAmount: 5000.00,
        podStatus: 'Pending',
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

    // 15. Seed Public Pages
    const pagesCount = await Page.count();
    if (pagesCount === 0) {
      await Page.bulkCreate([
        {
          title: 'Home',
          slug: 'home',
          contentHtml: `
            <div class="hero-section bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-24 px-6 text-center relative overflow-hidden">
              <div class="max-w-4xl mx-auto relative z-10">
                <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">Bombay Uttaranchal Tempo Service</h1>
                <p class="text-xl md:text-2xl text-blue-200 mb-8 max-w-2xl mx-auto">Your most trusted transport partner connecting Mumbai and Mumbai Metropolitan Region to Uttaranchal and beyond.</p>
                <div class="flex justify-center gap-4">
                  <a href="/services" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-200">Our Services</a>
                  <a href="/contact" class="bg-white hover:bg-gray-100 text-blue-900 font-bold py-3 px-8 rounded-lg shadow-lg transition duration-200">Book Cargo</a>
                </div>
              </div>
            </div>
            <div class="py-16 px-6 max-w-6xl mx-auto">
              <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose BUTS Express?</h2>
              <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition duration-200">
                  <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4 text-2xl font-bold">1</div>
                  <h3 class="text-xl font-bold text-gray-900 mb-2">MMR-to-Hill Specialized Route</h3>
                  <p class="text-gray-600">Daily express scheduled cargo routes connecting Maharashtra centers directly to Uttaranchal locations.</p>
                </div>
                <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition duration-200">
                  <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4 text-2xl font-bold">2</div>
                  <h3 class="text-xl font-bold text-gray-900 mb-2">Modern Fleet Management</h3>
                  <p class="text-gray-600">GPS tracked, fully insured commercial tempos and trucks ensuring security of your premium shipments.</p>
                </div>
                <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition duration-200">
                  <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4 text-2xl font-bold">3</div>
                  <h3 class="text-xl font-bold text-gray-900 mb-2">Professional Execution</h3>
                  <p class="text-gray-600">Prompt delivery schedules, digitized document control, and automated billing ledgers for business partners.</p>
                </div>
              </div>
            </div>
          `,
          contentReact: `// React Custom Widget Script for Home Page
const WelcomeBanner = () => {
  const [cargoCount, setCargoCount] = React.useState(12450);
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCargoCount(prev => prev + Math.floor(Math.random() * 3));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-xl max-w-3xl mx-auto my-8">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🚚</span>
        <div>
          <h4 className="text-lg font-bold text-blue-900">Live Delivery Counter</h4>
          <p className="text-2xl font-extrabold text-blue-700">{cargoCount.toLocaleString()} Tons of Cargo Delivered</p>
        </div>
      </div>
    </div>
  );
};

// Render entrypoint
ReactDOM.render(<WelcomeBanner />, document.getElementById('react-root-welcome'));
`,
          metaDescription: 'Welcome to Bombay Uttaranchal Tempo Service. We provide top-class MM-to-Hill route logistics services.',
          status: 'Active'
        },
        {
          title: 'About',
          slug: 'about',
          contentHtml: `
            <div class="bg-gray-50 py-16 px-6">
              <div class="max-w-4xl mx-auto text-center mb-12">
                <h1 class="text-4xl font-extrabold text-gray-900 mb-4">About Us</h1>
                <p class="text-lg text-gray-600">Connecting Mumbai and Uttarakhand through professional cargo logistics services since 2012.</p>
              </div>
              <div class="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-2xl font-bold text-blue-900 mb-4">Our History</h3>
                <p class="text-gray-700 mb-6 leading-relaxed">
                  Bombay Uttaranchal Tempo Service (BUTS) was founded with the mission of establishing a seamless, secure, and rapid highway cargo network between Maharashtra industrial hubs and the hill regions of Uttarakhand. Starting with just 3 tempos, we have expanded to over 50 commercial vehicles, serving multiple B2B logistics firms, local businesses, and individual clients.
                </p>
                <h3 class="text-2xl font-bold text-blue-900 mb-4">Our Mission & Values</h3>
                <p class="text-gray-700 mb-6 leading-relaxed">
                  We aim to exceed customer expectations by delivering cargo on-time, every time. Safety, integrity, and operational transparency are the core pillars of our enterprise.
                </p>
              </div>
            </div>
          `,
          contentReact: ``,
          metaDescription: 'Learn more about Bombay Uttaranchal Tempo Service history and values.',
          status: 'Active'
        },
        {
          title: 'Services',
          slug: 'services',
          contentHtml: `
            <div class="py-16 px-6 max-w-5xl mx-auto">
              <h1 class="text-4xl font-extrabold text-center text-gray-900 mb-4">Our Logistics Services</h1>
              <p class="text-center text-gray-600 mb-12 max-w-2xl mx-auto">We offer customized transport configurations to match your cargo weight, dimensions, and timeline requirements.</p>
              
              <div class="grid md:grid-cols-2 gap-8">
                <div class="border border-gray-200 rounded-xl p-6 hover:border-blue-500 transition duration-200">
                  <h3 class="text-2xl font-bold text-blue-900 mb-2">Part Load (LTL) Services</h3>
                  <p class="text-gray-600 mb-4">Cost-effective shipping solution for smaller cargo volumes. Ship goods securely on shared schedules.</p>
                  <ul class="text-gray-700 space-y-1.5">
                    <li>✓ Standardized packaging control</li>
                    <li>✓ Weekly schedules to major towns</li>
                    <li>✓ Digital warehouse receipt tracking</li>
                  </ul>
                </div>
                <div class="border border-gray-200 rounded-xl p-6 hover:border-blue-500 transition duration-200">
                  <h3 class="text-2xl font-bold text-blue-900 mb-2">Full Truck Load (FTL)</h3>
                  <p class="text-gray-600 mb-4">Dedicated tempo or truck booking for bulk business cargo with customizable route schedules.</p>
                  <ul class="text-gray-700 space-y-1.5">
                    <li>✓ On-demand vehicle dispatch</li>
                    <li>✓ Express direct transport route</li>
                    <li>✓ Real-time GPS alerts</li>
                  </ul>
                </div>
              </div>
            </div>
          `,
          contentReact: ``,
          metaDescription: 'Browse the cargo, LTL, and FTL transportation services offered by BUTS.',
          status: 'Active'
        },
        {
          title: 'Contact',
          slug: 'contact',
          contentHtml: `
            <div class="bg-gray-50 py-16 px-6">
              <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
                <div>
                  <h1 class="text-4xl font-extrabold text-gray-900 mb-4">Get In Touch</h1>
                  <p class="text-gray-600 mb-8">Have a shipment ready for Mumbai to Uttarakhand? Fill out the form or reach us via phone or email for a quick quote.</p>
                  
                  <div class="space-y-4">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">📍</div>
                      <div>
                        <h4 class="font-bold">Main Yard Depot</h4>
                        <p class="text-gray-600 text-sm">12, Transport Nagar, Phase-II, New Delhi - 110045</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">📞</div>
                      <div>
                        <h4 class="font-bold">Phone Number</h4>
                        <p class="text-gray-600 text-sm">+91-9876543210</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">✉</div>
                      <div>
                        <h4 class="font-bold">Email Support</h4>
                        <p class="text-gray-600 text-sm">billing@tmsexpress.com</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  <div id="contact-form-root"></div>
                </div>
              </div>
            </div>
          `,
          contentReact: `// React Contact Form widget
const ContactForm = () => {
  const [formData, setFormData] = React.useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.message) return alert("Please fill out Name and Message.");
    
    fetch('/api/v1/public/enquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        setSubmitted(true);
      } else {
        alert(data.message || 'Failed to submit booking request.');
      }
    })
    .catch(err => {
      console.error(err);
      alert('Network error. Please try again.');
    });
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <span className="text-5xl">✅</span>
        <h3 className="text-xl font-bold text-gray-900 mt-4">Thank you!</h3>
        <p className="text-gray-600 mt-2">Our booking agent will call you shortly with a rate quote.</p>
        <button onClick={() => setSubmitted(false)} className="mt-6 text-blue-600 font-bold hover:underline">Send another message</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Request Transport Quote</h3>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Your Name</label>
        <input 
          type="text" 
          value={formData.name} 
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
          placeholder="Enter your name" 
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Email / Phone</label>
        <input 
          type="text" 
          value={formData.email} 
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
          placeholder="Email address or mobile" 
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Cargo Details / Requirements</label>
        <textarea 
          value={formData.message} 
          onChange={e => setFormData({ ...formData, message: e.target.value })}
          rows="4" 
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
          placeholder="E.g., 2 Tons MM-to-Rishikesh LTL delivery next Tuesday"
        ></textarea>
      </div>
      <button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition duration-200 shadow-md"
      >
        Submit Booking Request
      </button>
    </form>
  );
};

ReactDOM.render(<ContactForm />, document.getElementById('contact-form-root'));
`,
          metaDescription: 'Contact Bombay Uttaranchal Tempo Service for cargo bookings and price quotes.',
          status: 'Active'
        }
      ]);
      logger.info('Default Public Pages seeded successfully.');
    }

    logger.info('Database seeding completed successfully.');
  } catch (error) {
    logger.error('Error during database seeding:', error);
  }
};

module.exports = seedDatabase;
