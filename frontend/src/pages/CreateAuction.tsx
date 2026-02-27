import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAuction } from '../services/auctionService';
import './CreateAuction.css';

function toLocalDate(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

function toLocalTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${mi}`;
}

interface FieldErrors {
  title?: string;
  description?: string;
  start_price?: string;
  min_increment?: string;
  end_date?: string;
  end_time?: string;
}

const CreateAuction: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startPrice, setStartPrice] = useState('');
  const [minIncrement, setMinIncrement] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!title.trim()) {
      errors.title = 'Title is required.';
    } else if (title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    }

    if (!description.trim()) {
      errors.description = 'Description is required.';
    }

    const sp = parseFloat(startPrice);
    if (!startPrice || isNaN(sp) || sp <= 0) {
      errors.start_price = 'Starting price must be a number greater than 0.';
    }

    const mi = parseFloat(minIncrement);
    if (!minIncrement || isNaN(mi) || mi <= 0) {
      errors.min_increment = 'Minimum increment must be a number greater than 0.';
    }

    if (!endDate) {
      errors.end_date = 'End date is required.';
    }

    if (!endTime) {
      errors.end_time = 'End time is required.';
    }

    if (endDate && endTime) {
      const parsed = new Date(`${endDate}T${endTime}`);
      if (isNaN(parsed.getTime())) {
        errors.end_date = 'Invalid date/time.';
      } else if (parsed <= new Date()) {
        errors.end_date = 'End time must be in the future.';
      } else {
        const oneHourFromNow = new Date(Date.now() + 3600_000);
        if (parsed < oneHourFromNow) {
          errors.end_date = 'Auction must last at least 1 hour.';
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccess(null);

    if (!token) {
      setServerError('You must be signed in to create an auction.');
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      const auction = await createAuction(
        {
          title: title.trim(),
          description: description.trim(),
          start_price: parseFloat(startPrice),
          min_increment: parseFloat(minIncrement),
          end_time: new Date(`${endDate}T${endTime}`).toISOString(),
        },
        token,
      );

      setSuccess(`Auction "${auction.title}" created successfully!`);
      setTitle('');
      setDescription('');
      setStartPrice('');
      setMinIncrement('');
      setEndDate('');
      setEndTime('');
      setFieldErrors({});

      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.details?.map((d: any) => d.message).join(', ') ||
        err.message ||
        'Failed to create auction.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const minDate = toLocalDate(now);
  const minTime = toLocalTime(new Date(now.getTime() + 3600_000));

  return (
    <div className="create-auction-page">
      <nav className="navbar">
        <div className="navbar-inner">
          <span className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            BidMaster
          </span>
          <div className="navbar-right">
            {user && <span className="navbar-user">{user.email}</span>}
          </div>
        </div>
      </nav>

      <div className="create-auction-wrapper">
        <div className="back-bar">
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Back to Auctions
          </button>
        </div>

        <div className="create-auction-card">
          <h1>Create Auction</h1>
          <p className="subtitle">List a new item for bidding. All fields are required.</p>

          {user?.banned && (
            <div className="form-error">Your account has been banned and cannot create auctions.</div>
          )}

          {success && <div className="form-success">{success}</div>}
          {serverError && <div className="form-error">{serverError}</div>}

          {!user?.banned && (
            <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>
                Title <span className="required">*</span>
              </label>
              <input
                className={`form-input${fieldErrors.title ? ' error' : ''}`}
                type="text"
                placeholder="e.g. Vintage Swiss Watch"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
              {fieldErrors.title && <div className="field-error">{fieldErrors.title}</div>}
            </div>

            <div className="form-group">
              <label>
                Description <span className="required">*</span>
              </label>
              <textarea
                className={`form-input${fieldErrors.description ? ' error' : ''}`}
                placeholder="Describe the item — condition, history, specifications…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              {fieldErrors.description && <div className="field-error">{fieldErrors.description}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Starting Price ($) <span className="required">*</span>
                </label>
                <input
                  className={`form-input${fieldErrors.start_price ? ' error' : ''}`}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="100"
                  value={startPrice}
                  onChange={(e) => setStartPrice(e.target.value)}
                />
                {fieldErrors.start_price && <div className="field-error">{fieldErrors.start_price}</div>}
              </div>

              <div className="form-group">
                <label>
                  Min Increment ($) <span className="required">*</span>
                </label>
                <input
                  className={`form-input${fieldErrors.min_increment ? ' error' : ''}`}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="10"
                  value={minIncrement}
                  onChange={(e) => setMinIncrement(e.target.value)}
                />
                {fieldErrors.min_increment && (
                  <div className="field-error">{fieldErrors.min_increment}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>
                End Date &amp; Time <span className="required">*</span>
              </label>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    className={`form-input${fieldErrors.end_date ? ' error' : ''}`}
                    type="date"
                    min={minDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  {fieldErrors.end_date && <div className="field-error">{fieldErrors.end_date}</div>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    className={`form-input${fieldErrors.end_time ? ' error' : ''}`}
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                  {fieldErrors.end_time && <div className="field-error">{fieldErrors.end_time}</div>}
                </div>
              </div>
              <div className="date-hint">Must be at least 1 hour from now.</div>
            </div>

            <button className="btn-create" type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create Auction'}
            </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateAuction;
