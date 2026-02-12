import { Globe, Shield, Users, Award, Headphones, TrendingUp } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-950 to-primary-800 py-16 px-4">
        <div className="max-w-5xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About TravelBook</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Your trusted partner for seamless travel experiences. We connect you to flights, hotels, car rentals, and eSIM services worldwide.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Mission */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            To make travel booking simple, affordable, and accessible for everyone. 
            Whether you're a solo traveler, a family on vacation, or a business agency managing 
            hundreds of bookings — TravelBook is built for you.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: Shield,
              title: 'Trust & Security',
              desc: 'Your payments and personal data are protected with industry-leading security standards.',
            },
            {
              icon: Globe,
              title: 'Global Coverage',
              desc: 'Access flights, hotels, and services across 190+ countries and thousands of destinations.',
            },
            {
              icon: Headphones,
              title: '24/7 Support',
              desc: 'Our dedicated support team is available around the clock to help you with any queries.',
            },
            {
              icon: Award,
              title: 'Best Prices',
              desc: 'We negotiate directly with airlines and hotels to bring you competitive pricing.',
            },
            {
              icon: Users,
              title: 'B2B & B2C',
              desc: 'Serving both individual travelers and travel agents with tailored solutions and markup tools.',
            },
            {
              icon: TrendingUp,
              title: 'Growing Network',
              desc: 'Continuously expanding our partnerships and service offerings to serve you better.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-7 w-7 text-primary-950" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-primary-950 rounded-2xl p-10 text-white">
          <h2 className="text-2xl font-bold text-center mb-8">TravelBook in Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { stat: '190+', label: 'Countries Covered' },
              { stat: '50K+', label: 'Happy Travelers' },
              { stat: '500+', label: 'Partner Airlines' },
              { stat: '24/7', label: 'Customer Support' },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-3xl font-bold text-accent-400 mb-1">{item.stat}</div>
                <div className="text-sm text-white/70">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
