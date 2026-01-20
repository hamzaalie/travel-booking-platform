import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plane, Upload, Building, User, CreditCard, FileText, Globe, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DocumentFile {
  file: File;
  preview: string;
}

export default function AgentRegistrationPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Account
    email: '',
    password: '',
    confirmPassword: '',
    
    // Personal Info
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    panNumber: '',
    citizenshipNumber: '',
    
    // Contact Info
    secondaryPhone: '',
    secondaryEmail: '',
    emergencyContact: '',
    emergencyPhone: '',
    
    // Business Info
    agencyName: '',
    agencyLicense: '',
    businessType: '',
    registrationNumber: '',
    taxVatNumber: '',
    websiteUrl: '',
    yearEstablished: '',
    numberOfEmployees: '',
    monthlyBookingVolume: '',
    
    // Address
    address: '',
    city: '',
    country: 'Nepal',
    
    // Bank Details
    bankName: '',
    bankBranch: '',
    bankAccountName: '',
    bankAccountNumber: '',
  });

  // Document uploads
  const [documents, setDocuments] = useState<{
    citizenshipFront?: DocumentFile;
    citizenshipBack?: DocumentFile;
    panCard?: DocumentFile;
    companyRegistration?: DocumentFile;
    vatCertificate?: DocumentFile;
    profilePhoto?: DocumentFile;
    signature?: DocumentFile;
    passport?: DocumentFile;
    bankStatement?: DocumentFile;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed');
        return;
      }

      const preview = URL.createObjectURL(file);
      setDocuments(prev => ({
        ...prev,
        [fieldName]: { file, preview }
      }));
    }
  };

  const removeDocument = (fieldName: string) => {
    setDocuments(prev => {
      const newDocs = { ...prev };
      if (newDocs[fieldName as keyof typeof newDocs]?.preview) {
        URL.revokeObjectURL(newDocs[fieldName as keyof typeof newDocs]!.preview);
      }
      delete newDocs[fieldName as keyof typeof newDocs];
      return newDocs;
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          toast.error('Please fill in all account details');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return false;
        }
        if (formData.password.length < 8) {
          toast.error('Password must be at least 8 characters');
          return false;
        }
        return true;
      case 2:
        if (!formData.firstName || !formData.lastName || !formData.phone) {
          toast.error('Please fill in required personal information');
          return false;
        }
        return true;
      case 3:
        if (!formData.agencyName) {
          toast.error('Agency name is required');
          return false;
        }
        return true;
      case 4:
        return true;
      case 5:
        if (!documents.citizenshipFront || !documents.citizenshipBack) {
          toast.error('Citizenship documents (front and back) are required');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(5)) return;
    
    setIsLoading(true);

    try {
      const submitData = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value && key !== 'confirmPassword') {
          submitData.append(key, value);
        }
      });
      
      // Set role
      submitData.append('role', 'B2B_AGENT');
      
      // Append documents
      Object.entries(documents).forEach(([key, docFile]) => {
        if (docFile?.file) {
          submitData.append(key, docFile.file);
        }
      });

      const response = await fetch(`${API_URL}/auth/register/agent`, {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      toast.success('Registration submitted successfully! Your application is pending review.');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Account', icon: User },
    { number: 2, title: 'Personal', icon: User },
    { number: 3, title: 'Business', icon: Building },
    { number: 4, title: 'Bank', icon: CreditCard },
    { number: 5, title: 'Documents', icon: FileText },
  ];

  const DocumentUpload = ({ 
    fieldName, 
    label, 
    required = false 
  }: { 
    fieldName: string; 
    label: string; 
    required?: boolean;
  }) => {
    const doc = documents[fieldName as keyof typeof documents];
    
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-400 transition-colors">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {doc ? (
          <div className="relative">
            {doc.file.type.startsWith('image/') ? (
              <img src={doc.preview} alt={label} className="w-full h-32 object-cover rounded" />
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                <FileText className="h-12 w-12 text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">{doc.file.name}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => removeDocument(fieldName)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <div className="flex flex-col items-center justify-center h-32 bg-gray-50 rounded hover:bg-gray-100">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Click to upload</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 10MB</span>
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange(fieldName)}
              className="hidden"
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-3 rounded-full">
              <Plane className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Registration</h1>
          <p className="text-gray-600 mt-2">Complete your registration to become a travel agent partner</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep >= step.number
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${currentStep >= step.number ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${currentStep > step.number ? 'bg-primary-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Details</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={handleChange}
                      className="input"
                      placeholder="Min 8 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="input"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
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
                      Last Name <span className="text-red-500">*</span>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="input"
                      placeholder="+977-9XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Phone
                    </label>
                    <input
                      type="tel"
                      name="secondaryPhone"
                      value={formData.secondaryPhone}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Citizenship Number
                    </label>
                    <input
                      type="text"
                      name="citizenshipNumber"
                      value={formData.citizenshipNumber}
                      onChange={handleChange}
                      className="input"
                      placeholder="XX-XX-XX-XXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Business Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agency Name <span className="text-red-500">*</span>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="">Select Business Type</option>
                      <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
                      <option value="PARTNERSHIP">Partnership</option>
                      <option value="PRIVATE_LIMITED">Private Limited</option>
                      <option value="PUBLIC_LIMITED">Public Limited</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agency License Number
                    </label>
                    <input
                      type="text"
                      name="agencyLicense"
                      value={formData.agencyLicense}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Registration Number
                    </label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      VAT/Tax Number
                    </label>
                    <input
                      type="text"
                      name="taxVatNumber"
                      value={formData.taxVatNumber}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year Established
                    </label>
                    <input
                      type="number"
                      name="yearEstablished"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.yearEstablished}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Employees
                    </label>
                    <input
                      type="number"
                      name="numberOfEmployees"
                      min="1"
                      value={formData.numberOfEmployees}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="url"
                      name="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={handleChange}
                      className="input"
                      placeholder="https://www.yourwebsite.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Monthly Booking Volume
                  </label>
                  <select
                    name="monthlyBookingVolume"
                    value={formData.monthlyBookingVolume}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select Volume</option>
                    <option value="1-10">1-10 bookings</option>
                    <option value="11-50">11-50 bookings</option>
                    <option value="51-100">51-100 bookings</option>
                    <option value="101-500">101-500 bookings</option>
                    <option value="500+">500+ bookings</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Bank Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Bank Details</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Bank details are required for commission payments and refunds.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., Nepal Bank Limited"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch
                    </label>
                    <input
                      type="text"
                      name="bankBranch"
                      value={formData.bankBranch}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., Kathmandu Main Branch"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      name="bankAccountName"
                      value={formData.bankAccountName}
                      onChange={handleChange}
                      className="input"
                      placeholder="As per bank records"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Document Upload */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Upload</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Please upload clear, readable copies of your documents. Files should be in JPG, PNG, or PDF format.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <DocumentUpload 
                    fieldName="citizenshipFront" 
                    label="Citizenship (Front)" 
                    required 
                  />
                  <DocumentUpload 
                    fieldName="citizenshipBack" 
                    label="Citizenship (Back)" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DocumentUpload 
                    fieldName="panCard" 
                    label="PAN Card" 
                  />
                  <DocumentUpload 
                    fieldName="passport" 
                    label="Passport (Optional)" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DocumentUpload 
                    fieldName="companyRegistration" 
                    label="Company Registration Certificate" 
                  />
                  <DocumentUpload 
                    fieldName="vatCertificate" 
                    label="VAT Certificate" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DocumentUpload 
                    fieldName="profilePhoto" 
                    label="Profile Photo" 
                  />
                  <DocumentUpload 
                    fieldName="signature" 
                    label="Signature" 
                  />
                </div>

                <DocumentUpload 
                  fieldName="bankStatement" 
                  label="Bank Statement (Last 3 months)" 
                />

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> All documents will be verified by our team. Your account will be activated once all documents are verified.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
              ) : (
                <Link to="/register" className="btn btn-secondary">
                  Back to Register
                </Link>
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
