import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { register } from '@/store/slices/authSlice';
import { AppDispatch } from '@/store';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'B2C_CUSTOMER',
    agencyName: '',
    agencyLicense: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await dispatch(register(formData)).unwrap();
      
      // Check if agent is pending approval (no tokens returned)
      if (formData.role === 'B2B_AGENT' && (!result.accessToken || result.agent?.status === 'PENDING')) {
        alert('Registration successful! Your agent application has been submitted for approval. You will receive an email once approved.');
        navigate('/login');
        return;
      }
      
      // For approved users and customers, redirect to dashboard
      if (formData.role === 'B2B_AGENT') {
        navigate('/agent');
      } else {
        navigate('/customer');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      alert(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/images/Peakpass%20Travel%20Brand%20Kit/Peakpass%20Logo%20Full%20Color.png" 
                alt="Peakpass Travel" 
                className="h-16 w-auto" 
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="text-gray-600 mt-2">Join our travel booking platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input"
              >
                <option value="B2C_CUSTOMER">Customer</option>
                <option value="B2B_AGENT">Travel Agent</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                className="input"
              />
            </div>

            {formData.role === 'B2B_AGENT' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agency Name *
                  </label>
                  <input
                    type="text"
                    name="agencyName"
                    required
                    value={formData.agencyName}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agency License (Optional)
                  </label>
                  <input
                    type="text"
                    name="agencyLicense"
                    value={formData.agencyLicense}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 text-lg"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-950 hover:text-primary-900 font-medium">
                Sign in here
              </Link>
            </p>
            {formData.role === 'B2B_AGENT' && (
              <p className="text-sm text-gray-600 mt-2">
                Need to submit documents?{' '}
                <Link to="/register/agent" className="text-primary-950 hover:text-primary-900 font-medium">
                  Complete Agent Registration
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
