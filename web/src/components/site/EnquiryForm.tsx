import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { request } from '@/lib/api';
import { useContact } from '@/lib/settings';

interface EnquiryFormProps {
  source: string;
  idPrefix: string;
}

export function EnquiryForm({ source, idPrefix }: EnquiryFormProps) {
  const c = useContact();
  const [name, setName] = useState('');
  const [business, setBusiness] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      alert('Please fill in Name, Phone and Message fields.');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      alert('Please enter a valid phone or WhatsApp number (7 to 15 digits).');
      return;
    }

    const waText =
      'Hello Neha Crockery House,\n\n' +
      `Name: ${name}\n` +
      (business ? `Business: ${business}\n` : '') +
      `Phone: ${phone}\n` +
      (category ? `Category: ${category}\n` : '') +
      `\nMessage:\n${message}`;

    const waWin = window.open('', '_blank');
    const goWhatsApp = () => {
      const url = c.wa(waText);
      if (waWin) {
        waWin.location.href = url;
      } else {
        window.location.href = url;
      }
    };

    const fullMsg = (category ? `[Category: ${category}] ` : '') + message;

    setSubmitting(true);
    try {
      await request('/enquiries', {
        method: 'POST',
        body: {
          name: name.trim(),
          companyName: business.trim() || null,
          phone: phone.trim(),
          message: fullMsg.slice(0, 2000),
          source,
        },
      });
      alert('Thank you. Your enquiry has been received. WhatsApp will open so you can reach us instantly.');
    } catch {
      alert('We could not save your enquiry online, but you can still send it on WhatsApp.');
    } finally {
      setSubmitting(false);
      goWhatsApp();
    }
  };

  return (
    <form className="enquiry-form" id={`${idPrefix}-enquiry-form`} onSubmit={handleSubmit} noValidate>
      <h3 className="enquiry-form-title">Send an Enquiry</h3>
      <div className="form-group">
        <label className="form-label" htmlFor={`${idPrefix}-name`}>
          Your Name *
        </label>
        <input
          type="text"
          id={`${idPrefix}-name`}
          name="name"
          className="form-input"
          placeholder="Full name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor={`${idPrefix}-business`}>
          Business / Shop Name
        </label>
        <input
          type="text"
          id={`${idPrefix}-business`}
          name="business"
          className="form-input"
          placeholder="Your business or shop name"
          autoComplete="organization"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor={`${idPrefix}-phone`}>
            Phone / WhatsApp *
          </label>
          <input
            type="tel"
            id={`${idPrefix}-phone`}
            name="phone"
            className="form-input"
            placeholder="+91 XXXXX XXXXX"
            required
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor={`${idPrefix}-category`}>
            Product Category
          </label>
          <select
            id={`${idPrefix}-category`}
            name="category"
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select category</option>
            <option value="crockery">Crockery &amp; Dinnerware</option>
            <option value="cutlery">Cutlery</option>
            <option value="glassware">Glassware &amp; Bottles</option>
            <option value="kitchenware">Kitchenware</option>
            <option value="hotelware">Hotelware &amp; Institutional</option>
            <option value="cookware">Cookware</option>
            <option value="storage-containers">Storage &amp; Containers</option>
            <option value="stainless-steel-items">Stainless Steel Items</option>
            <option value="taroba">Taroba Brand</option>
            <option value="other">Other / General</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor={`${idPrefix}-message`}>
          Message *
        </label>
        <textarea
          id={`${idPrefix}-message`}
          name="message"
          className="form-textarea"
          rows={4}
          placeholder="Describe what you need — products, quantities, business type, etc."
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button type="submit" className="form-submit" id={`${idPrefix}-submit`} disabled={submitting}>
        {submitting ? 'Sending…' : <>Send Enquiry &#8594;</>}
      </button>
      <p className="form-note">
        Your enquiry is saved securely so our team can respond, and WhatsApp opens with your message pre-filled. See our{' '}
        <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </form>
  );
}

