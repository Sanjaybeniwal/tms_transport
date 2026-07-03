const { Page } = require('../models');

const newReactCode = `// React Contact Form widget
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
`;

async function run() {
  try {
    const [updatedCount] = await Page.update(
      { contentReact: newReactCode },
      { where: { slug: 'contact' } }
    );
    console.log(`Successfully updated ${updatedCount} contact page in the database.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
