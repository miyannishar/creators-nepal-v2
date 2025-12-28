import { JSX } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, DollarSign, Heart, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Landing page for Creators Nepal
 * Showcases the platform features and directs users to login/register
 */
export const LandingPage = (): JSX.Element => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Local Payment Solutions',
      description:
        'Seamlessly receive payments through eSewa and Khalti - Nepal\'s most trusted payment gateways. No need for international payment processors.',
      icon: DollarSign,
      gradient: 'from-green-400 to-emerald-500',
    },
    {
      title: 'Build Your Community',
      description:
        'Connect with supporters, share exclusive content, and build lasting relationships with your audience. Create posts, engage with followers, and grow your creative community.',
      icon: Heart,
      gradient: 'from-pink-400 to-rose-500',
    },
    {
      title: 'Made for Nepal',
      description:
        'Built specifically for Nepali creators with local language support, cultural understanding, and features tailored to the Nepali creative economy.',
      icon: Globe,
      gradient: 'from-blue-400 to-indigo-500',
    },
  ];

  const steps = [
    {
      title: 'Create Your Profile',
      description:
        'Sign up and create your creator profile. Add your bio, social links, and showcase your work. Set up your page in minutes and start sharing your creative journey.',
    },
    {
      title: 'Share Your Content',
      description:
        'Publish posts, share updates, and connect with your audience. Whether you\'re an artist, writer, musician, or content creator, share what you love with your community.',
    },
    {
      title: 'Accept Support',
      description:
        'Enable supporters to support you directly through eSewa and Khalti. Receive payments instantly and build sustainable income from your creative work.',
    },
    {
      title: 'Grow Your Community',
      description:
        'Build a loyal following, engage with supporters, and grow your creative business. Track your growth with analytics and insights designed for Nepali creators.',
    },
  ];

  const faqs = [
    {
      question: 'What is Creators Nepal?',
      answer:
        'Creators Nepal is a platform designed specifically for Nepali creators to monetize their content, build communities, and connect with supporters. We support local payment methods like eSewa and Khalti, making it easy for Nepali creators to receive support from their audience.',
    },
    {
      question: 'How do I receive payments?',
      answer:
        'Creators Nepal integrates with Nepal\'s most trusted payment gateways - eSewa and Khalti. Supporters can send you payments directly through these platforms, and you\'ll receive funds instantly in your local bank account. No need for international payment processors or complex setups.',
    },
    {
      question: 'What types of creators can use Creators Nepal?',
      answer:
        'Creators Nepal is for all types of creators in Nepal - artists, writers, musicians, content creators, educators, and anyone who creates content and wants to build a community around their work. Whether you create digital art, write stories, make music, or produce educational content, you can use Creators Nepal.',
    },
    {
      question: 'How much does it cost?',
      answer:
        'Creators Nepal is designed to be affordable for Nepali creators. We keep our fees low so you can keep more of what you earn. Contact us to learn about our current pricing and fee structure.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b-5 border-black bg-white">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold">Creators Nepal</h2>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button onClick={() => navigate('/register')}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative mt-20 flex min-h-[700px] w-full flex-col items-center justify-center bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500 px-6 py-20">
        <div className="container-content flex items-center justify-center xl:justify-between">
          <div className="flex w-full max-w-[750px] flex-col items-center gap-10 text-center xl:items-start xl:text-left">
            <h1 className="text-5xl font-bold leading-tight text-gray-900 md:text-6xl lg:text-7xl">
              Empowering Nepal's{' '}
              <span className="relative inline-block text-orange-500">
                Creative Economy
              </span>
            </h1>
            <p className="max-w-[600px] text-xl text-gray-800 md:text-2xl">
              The only platform designed specifically for Nepali creators. Accept payments
              through <em>eSewa & Khalti</em>, build communities, and turn your passion into
              sustainable income.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-blue-600 text-lg hover:bg-blue-700"
                onClick={() => navigate('/register')}
              >
                Start Creating Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-black bg-white text-lg hover:bg-gray-50"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </div>
          </div>

          {/* Fee Comparison Chart */}
          <div className="hidden w-[400px] xl:block">
            <div className="flex h-[400px] w-full items-end justify-between">
              <div className="relative h-10 w-[165px] overflow-hidden rounded-lg border-4 border-black bg-orange-400">
                <div className="flex h-full items-center justify-center">
                  <p className="text-2xl font-bold">1%</p>
                </div>
              </div>
              <div className="relative h-[400px] w-[165px] overflow-hidden rounded-lg border-4 border-black bg-white">
                <div className="flex h-full items-center justify-center">
                  <p className="text-2xl font-bold text-gray-600">10%</p>
                </div>
              </div>
            </div>
            <div className="mt-2.5 flex w-full items-end justify-between text-center text-xl">
              <div className="h-10 w-[165px]">
                <p className="font-semibold">Creators Nepal</p>
              </div>
              <div className="h-10 w-[165px]">
                <p className="text-gray-600">Other Platforms</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative border-y-5 border-y-black bg-gradient-to-br from-purple-400 via-violet-400 to-indigo-400 px-6 py-20 lg:py-32">
        <div className="container mx-auto text-center">
          <h2 className="mb-16 text-4xl font-bold text-gray-900 md:text-5xl">
            Built for Nepal's Creative Future
          </h2>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl border-5 border-black bg-gradient-to-br from-green-300 to-emerald-400 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex flex-col items-center gap-6">
                  <div
                    className={`rounded-full bg-gradient-to-br ${feature.gradient} p-6`}
                  >
                    <feature.icon className="h-16 w-16 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-lg leading-relaxed text-gray-800">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee Section */}
        <div className="absolute -bottom-32 left-0 h-64 w-full overflow-hidden">
          <div className="relative h-full w-full">
            <div className="absolute left-0 top-24 w-full rotate-[5deg] border-y-5 border-y-black bg-white py-6">
              <div className="animate-marquee whitespace-nowrap">
                <span className="mx-8 text-2xl font-bold">
                  MADE FOR NEPALI CREATORS • eSEWA & KHALTI SUPPORT
                </span>
                <span className="mx-8 text-2xl font-bold">
                  MADE FOR NEPALI CREATORS • eSEWA & KHALTI SUPPORT
                </span>
                <span className="mx-8 text-2xl font-bold">
                  MADE FOR NEPALI CREATORS • eSEWA & KHALTI SUPPORT
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="bg-gradient-to-br from-green-300 via-emerald-300 to-teal-400 px-6 py-32 pt-48">
        <div className="container mx-auto text-center">
          <h2 className="mb-16 text-4xl font-bold text-gray-900 md:text-5xl">
            Get Started in Minutes
          </h2>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl border-5 border-black bg-white p-8 text-left shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white">
                  {idx + 1}
                </div>
                <h3 className="mb-4 text-2xl font-bold text-gray-900">{step.title}</h3>
                <p className="text-lg leading-relaxed text-gray-700">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative border-t-5 border-t-black bg-gradient-to-br from-yellow-300 via-amber-300 to-orange-300 px-6 py-20">
        <div className="container mx-auto text-center">
          <h2 className="mb-16 text-4xl font-bold text-gray-900 md:text-5xl">
            Frequently Asked Questions
          </h2>

          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-2xl border-5 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <summary className="flex cursor-pointer items-center justify-between p-6 text-left text-xl font-bold text-gray-900">
                  {faq.question}
                  <ChevronDown className="h-6 w-6 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t-5 border-t-black bg-gray-50 p-6 text-left text-lg leading-relaxed text-gray-700">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t-5 border-t-black bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 px-6 py-20 text-center">
        <div className="container mx-auto">
          <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">
            Ready to Start Your Creative Journey?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-blue-100">
            Join thousands of Nepali creators who are already building sustainable income
            streams and thriving communities.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-white text-lg text-blue-600 hover:bg-gray-100"
              onClick={() => navigate('/register')}
            >
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white bg-transparent text-lg text-white hover:bg-white/10"
              onClick={() => navigate('/login')}
            >
              Already have an account?
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-5 border-t-black bg-gray-900 px-6 py-12 text-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-4 text-2xl font-bold">Creators Nepal</h3>
              <p className="text-gray-400">
                Empowering Nepal's creative economy with local payment solutions and
                community building tools.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-lg font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button
                    onClick={() => navigate('/register')}
                    className="hover:text-white"
                  >
                    Get Started
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/login')} className="hover:text-white">
                    Login
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-lg font-semibold">Contact</h4>
              <p className="text-gray-400">hello@creatorsnepal.com</p>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2024 CreatorsNepal. Made with ❤️ for Nepal's creative community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

