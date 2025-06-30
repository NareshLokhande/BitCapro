import {
  ArrowRight,
  Award,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Earth,
  Eye,
  FileText,
  Globe,
  Layers,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  Play,
  PlusCircle,
  Settings,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTeamMember, setActiveTeamMember] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate team members
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTeamMember((prev) => (prev + 1) % 4); // 4 team members
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle navbar background on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const heroHeight = window.innerHeight * 0.8; // 80% of viewport height

      if (scrollPosition > heroHeight) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on mount to set initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: FileText,
      title: 'Smart Request Submission',
      description:
        'Multi-step guided form with validation, compliance checklist, and automatic KPI calculations',
      color: 'from-blue-500 to-indigo-600',
      details: [
        'Intelligent form validation',
        'Real-time compliance checking',
        'Automatic KPI calculations',
        'Draft saving and recovery',
      ],
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description:
        'Real-time dashboards with interactive charts, trend analysis, and comprehensive reporting',
      color: 'from-purple-500 to-pink-600',
      details: [
        'Interactive data visualization',
        'Custom report generation',
        'Trend analysis and forecasting',
        'Export capabilities',
      ],
    },
    {
      icon: Shield,
      title: 'Approval Workflows',
      description:
        'Configurable approval matrix with role-based routing and complete audit trails',
      color: 'from-green-500 to-emerald-600',
      details: [
        'Role-based routing',
        'Configurable approval matrix',
        'Complete audit trails',
        'Escalation handling',
      ],
    },
    {
      icon: TrendingUp,
      title: 'Financial KPIs',
      description:
        'IRR, NPV, payback period calculations with basis documentation and portfolio analysis',
      color: 'from-orange-500 to-red-600',
      details: [
        'IRR and NPV calculations',
        'Payback period analysis',
        'Portfolio optimization',
        'Risk assessment',
      ],
    },
    {
      icon: Eye,
      title: 'Real-time Tracking',
      description:
        'Live status updates, progress visualization, and detailed approval history',
      color: 'from-teal-500 to-cyan-600',
      details: [
        'Live status updates',
        'Progress visualization',
        'Approval history tracking',
        'Notification system',
      ],
    },
    {
      icon: Settings,
      title: 'Admin Controls',
      description:
        'Complete system configuration, user management, and approval matrix customization',
      color: 'from-gray-500 to-slate-600',
      details: [
        'User management',
        'System configuration',
        'Approval matrix setup',
        'Security controls',
      ],
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Faster Approvals',
      description:
        'Reduce approval time by 60% with automated routing and clear workflows',
      metric: '60%',
      metricLabel: 'Faster',
    },
    {
      icon: Target,
      title: 'Better Decisions',
      description:
        'Data-driven insights with comprehensive KPI analysis and risk assessment',
      metric: '95%',
      metricLabel: 'Accuracy',
    },
    {
      icon: Globe,
      title: 'Full Transparency',
      description:
        'Complete visibility into request status, approval history, and system metrics',
      metric: '100%',
      metricLabel: 'Visibility',
    },
    {
      icon: Award,
      title: 'Compliance Ready',
      description:
        'Built-in compliance checklist ensuring all requirements are met before approval',
      metric: '100%',
      metricLabel: 'Compliant',
    },
  ];

  const stats = [
    { number: '60%', label: 'Faster Approvals', icon: Clock },
    { number: '100%', label: 'Audit Compliance', icon: Shield },
    { number: '24/7', label: 'Real-time Tracking', icon: Eye },
    { number: '∞', label: 'Scalable Workflows', icon: TrendingUp },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CFO',
      company: 'TechCorp Inc.',
      content:
        'Approvia transformed our investment approval process. What used to take weeks now happens in days, and we have complete visibility into every decision.',
      avatar: 'SJ',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Operations Director',
      company: 'Global Manufacturing',
      content:
        'The automated routing and real-time tracking features have eliminated bottlenecks in our approval workflow. Our team can focus on strategic decisions.',
      avatar: 'MC',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Investment Manager',
      company: 'Venture Capital Partners',
      content:
        'The KPI calculations and risk assessment tools help us make data-driven investment decisions. The platform is intuitive and powerful.',
      avatar: 'ER',
      rating: 5,
    },
  ];

  const quickActions = [
    {
      title: 'View Demo',
      description: 'See Approvia in action',
      icon: Play,
      action: () => setIsVideoModalOpen(true),
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Download Guide',
      description: 'Get started quickly',
      icon: Download,
      action: () => window.open('/guide.pdf', '_blank'),
      color: 'from-green-500 to-emerald-600',
    },
    {
      title: 'Schedule Demo',
      description: 'Book a personalized tour',
      icon: Calendar,
      action: () => window.open('mailto:demo@Approvia.com'),
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Contact Sales',
      description: 'Talk to our experts',
      icon: MessageCircle,
      action: () => window.open('mailto:sales@Approvia.com'),
      color: 'from-orange-500 to-red-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Bolt Badge */}
      {/* <div className="fixed top-16 right-4 z-50">
        <a
          href="https://bolt.new"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <Zap className="w-4 h-4 mr-2" />
          Built on Bolt
        </a>
      </div> */}

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full mx-4">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">Demo Video Coming Soon</p>
                  <p className="text-gray-400">
                    Interactive demo will be available here
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl p-6">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-gray-900">Menu</h3>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <nav className="space-y-4">
              <Link
                to="/login"
                className="block py-3 px-4 bg-blue-600 text-white rounded-lg text-center font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/submit"
                className="block py-3 px-4 border border-gray-300 text-gray-700 rounded-lg text-center font-medium"
              >
                Submit Request
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-30 navbar-transition ${
          isScrolled
            ? 'bg-white/20 backdrop-blur-xl shadow-lg border-b border-white/20'
            : 'bg-transparent'
        }`}
        id="navbar"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3">
                <h1
                  className={`text-xl font-bold transition-colors ${
                    isScrolled
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
                      : 'text-white'
                  }`}
                >
                  Approvia
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <a
                href="#features"
                className={`transition-colors font-medium ${
                  isScrolled
                    ? 'text-gray-700 hover:text-blue-600'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                Features
              </a>
              <a
                href="#benefits"
                className={`transition-colors font-medium ${
                  isScrolled
                    ? 'text-gray-700 hover:text-blue-600'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                Benefits
              </a>
              <a
                href="#testimonials"
                className={`transition-colors font-medium ${
                  isScrolled
                    ? 'text-gray-700 hover:text-blue-600'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                Testimonials
              </a>
              <Link
                to="/login"
                className={`transition-colors font-medium ${
                  isScrolled
                    ? 'text-gray-700 hover:text-blue-600'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="https://www.bitcollageconsulting.com/"
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  isScrolled
                    ? 'bg-white/60 backdrop-blur-xl text-gray-800 hover:bg-white/40 border border-white/40 shadow-md'
                    : 'bg-white/75 backdrop-blur-xl text-white hover:bg-white/50 border border-white/30 shadow-lg'
                }`}
              >
                <Earth className="w-4 h-4 mr-2" />
                <span className="font-bold drop-shadow-lg">
                  <span style={{ color: '#fe0200' }}>BIT</span>
                  <span style={{ color: '#009846' }}>COLLAGE</span>
                </span>
              </Link>
              <a
                href="https://bolt.new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <Zap className="w-4 h-4 mr-2" />
                Built on Bolt
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isScrolled
                  ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/20'
                  : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
              }`}
            >
              <Menu
                className={`w-6 h-6 ${
                  isScrolled ? 'text-gray-700' : 'text-white'
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800"></div>
        <div className="absolute inset-0 bg-black opacity-10"></div>

        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl">
                <CheckCircle2 className="w-10 h-10 text-blue-600" />
              </div>
              <div className="ml-4">
                <h1 className="text-4xl font-bold text-white">Approvia</h1>
                <p className="text-blue-100">Investment Management Platform</p>
              </div>
            </div>

            {/* Hero Content */}
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Streamline Your
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Investment Approvals
              </span>
            </h2>

            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your investment request process with intelligent
              workflows, real-time analytics, and comprehensive compliance
              tracking. Built for modern enterprises.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/login"
                className="group flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Sign In
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="group flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 border-2 border-white border-opacity-20"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center group">
                    <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                      {stat.number}
                    </div>
                    <div className="text-blue-200 text-sm font-medium">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className={`group p-6 bg-gradient-to-br ${action.color} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-left`}
                >
                  <Icon className="w-8 h-8 mb-3" />
                  <h4 className="font-semibold mb-1">{action.title}</h4>
                  <p className="text-sm opacity-90">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section
        id="features"
        className="py-20 bg-gradient-to-br from-white to-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              <Star className="w-4 h-4 mr-2" />
              Powerful Features
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Modern Investment Management
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools designed to streamline your investment
              approval process from start to finish
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Feature Details */}
            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = activeFeature === index;
                return (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                      isActive
                        ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                    }`}
                    onClick={() => setActiveFeature(index)}
                  >
                    <div className="flex items-start">
                      <div
                        className={`flex items-center justify-center w-14 h-14 bg-gradient-to-br ${
                          feature.color
                        } rounded-2xl mr-4 flex-shrink-0 shadow-lg ${
                          isActive ? 'scale-110' : ''
                        } transition-transform duration-300`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-3">
                          {feature.title}
                        </h4>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {feature.description}
                        </p>
                        {isActive && (
                          <div className="space-y-3">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                            <ul className="space-y-2">
                              {feature.details.map((detail, detailIndex) => (
                                <li
                                  key={detailIndex}
                                  className="flex items-center text-sm text-gray-700 animate-fadeIn"
                                  style={{
                                    animationDelay: `${detailIndex * 100}ms`,
                                  }}
                                >
                                  <div className="flex items-center justify-center w-5 h-5 bg-green-100 rounded-full mr-3 flex-shrink-0">
                                    <Check className="w-3 h-3 text-green-600" />
                                  </div>
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feature Preview */}
            <div className="relative lg:sticky lg:top-8">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 border border-gray-200 shadow-xl">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mx-auto mb-6 shadow-lg">
                    {(() => {
                      const Icon = features[activeFeature]?.icon;
                      return Icon ? (
                        <Icon className="w-10 h-10 text-white" />
                      ) : null;
                    })()}
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">
                    {features[activeFeature]?.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {features[activeFeature]?.description}
                  </p>
                </div>

                {/* Feature Stats */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      100%
                    </div>
                    <div className="text-sm text-gray-600">Reliability</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      24/7
                    </div>
                    <div className="text-sm text-gray-600">Availability</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="benefits"
        className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Approvia?
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your investment process with measurable improvements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="flex items-start p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mr-6 flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <h4 className="text-xl font-semibold text-gray-900">
                        {benefit.title}
                      </h4>
                      <div className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {benefit.metric} {benefit.metricLabel}
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied users who have transformed their
              investment processes
            </p>
          </div>

          <div className="relative">
            <div className="flex transition-transform duration-500 ease-in-out">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`w-full flex-shrink-0 transition-opacity duration-500 ${
                    index === activeTestimonial
                      ? 'opacity-100'
                      : 'opacity-0 absolute'
                  }`}
                >
                  <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-12 border border-gray-200">
                      <div className="flex justify-center mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-6 h-6 text-yellow-400 fill-current"
                          />
                        ))}
                      </div>
                      <blockquote className="text-xl text-gray-700 mb-8 leading-relaxed">
                        "{testimonial.content}"
                      </blockquote>
                      <div className="flex items-center justify-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                          {testimonial.avatar}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">
                            {testimonial.name}
                          </div>
                          <div className="text-gray-600">
                            {testimonial.role} at {testimonial.company}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial Navigation */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activeTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Approvia Works
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, efficient workflow from request to approval
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-6 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                1. Submit Request
              </h4>
              <p className="text-gray-600">
                Complete the guided form with project details, financials, and
                compliance checklist
              </p>
            </div>

            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                2. Auto-Route
              </h4>
              <p className="text-gray-600">
                System automatically routes to appropriate approvers based on
                amount and department
              </p>
            </div>

            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mx-auto mb-6 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                3. Review & Approve
              </h4>
              <p className="text-gray-600">
                Approvers review with full context, KPIs, and compliance status
              </p>
            </div>

            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mx-auto mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                4. Track & Analyze
              </h4>
              <p className="text-gray-600">
                Monitor progress, analyze trends, and optimize your investment
                process
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built with Modern Technology
            </h3>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              Powered by cutting-edge tools for performance, security, and
              scalability
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="text-2xl font-bold text-white mb-2">React</div>
              <div className="text-blue-200 text-sm">Frontend Framework</div>
            </div>
            <div className="text-center p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="text-2xl font-bold text-white mb-2">Supabase</div>
              <div className="text-blue-200 text-sm">Backend & Database</div>
            </div>
            <div className="text-center p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="text-2xl font-bold text-white mb-2">
                TypeScript
              </div>
              <div className="text-blue-200 text-sm">Type Safety</div>
            </div>
            <div className="text-center p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
              <div className="text-2xl font-bold text-white mb-2">Tailwind</div>
              <div className="text-blue-200 text-sm">Styling</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Investment Process?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join forward-thinking organizations using Approvia to streamline
            their investment workflows
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/login"
              className="group flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="group flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 border-2 border-white border-opacity-20"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-4">
              <Users className="w-4 h-4 mr-2" />
              Meet Our Team
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built by Passionate Developers
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A dedicated team of professionals committed to transforming
              investment management through innovative technology
            </p>
          </div>

          <div className="relative">
            <div className="flex justify-center items-center space-x-4">
              {/* Team Member 1  */}
              <div
                className={`transition-all duration-500 ease-in-out ${
                  activeTeamMember === 0
                    ? 'opacity-100 scale-100 z-10'
                    : activeTeamMember === 3
                    ? 'opacity-40 scale-75 -translate-x-8 z-0'
                    : activeTeamMember === 1
                    ? 'opacity-40 scale-75 translate-x-8 z-0'
                    : 'opacity-20 scale-50 translate-x-16 z-0'
                }`}
              >
                <div className="w-80">
                  <div className="group text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                      MK
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      Milind Kasar
                    </h4>
                    <p className="text-purple-600 font-medium mb-3 text-sm">
                      Business Development
                    </p>
                    <p className="text-gray-600 mb-4 text-sm">
                      Expert in Business Development and modern web
                      technologies.
                    </p>
                    <div className="flex flex-wrap justify-center gap-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        Business Dev
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Sales
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Marketing
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Member 2 */}
              <div
                className={`transition-all duration-500 ease-in-out ${
                  activeTeamMember === 1
                    ? 'opacity-100 scale-100 z-10'
                    : activeTeamMember === 0
                    ? 'opacity-40 scale-75 translate-x-8 z-0'
                    : activeTeamMember === 2
                    ? 'opacity-40 scale-75 -translate-x-8 z-0'
                    : 'opacity-20 scale-50 -translate-x-16 z-0'
                }`}
              >
                <div className="w-80">
                  <div className="group text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                      VK
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      Vedant Kindarley
                    </h4>
                    <p className="text-blue-600 font-medium mb-3 text-sm">
                      Full-Stack Developer
                    </p>
                    <p className="text-gray-600 mb-4 text-sm">
                      Expert in Prompt Engineering and modern web technologies.
                    </p>
                    <div className="flex flex-wrap justify-center gap-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        React
                      </span>
                      <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">
                        Prompt Eng
                      </span>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        Node.js
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        UI/UX
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        C#
                      </span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                        Java
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Member 3 */}
              <div
                className={`transition-all duration-500 ease-in-out ${
                  activeTeamMember === 2
                    ? 'opacity-100 scale-100 z-10'
                    : activeTeamMember === 1
                    ? 'opacity-40 scale-75 translate-x-8 z-0'
                    : activeTeamMember === 3
                    ? 'opacity-40 scale-75 -translate-x-8 z-0'
                    : 'opacity-20 scale-50 translate-x-16 z-0'
                }`}
              >
                <div className="w-80">
                  <div className="group text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                      NL
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      Naresh Lokhande
                    </h4>
                    <p className="text-green-600 font-medium mb-3 text-sm">
                      Full-Stack Developer
                    </p>
                    <p className="text-gray-600 mb-4 text-sm">
                      Expert in React, TypeScript, and modern web technologies.
                    </p>
                    <div className="flex flex-wrap justify-center gap-1">
                      <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">
                        Supabase
                      </span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                        React
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        Node.js
                      </span>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        Tailwind
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        UI/UX
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Member 4 */}
              <div
                className={`transition-all duration-500 ease-in-out ${
                  activeTeamMember === 3
                    ? 'opacity-100 scale-100 z-10'
                    : activeTeamMember === 2
                    ? 'opacity-40 scale-75 translate-x-8 z-0'
                    : activeTeamMember === 0
                    ? 'opacity-40 scale-75 -translate-x-8 z-0'
                    : 'opacity-20 scale-50 -translate-x-16 z-0'
                }`}
              >
                <div className="w-80">
                  <div className="group text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                      SA
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      Sapeksh Ahirrao
                    </h4>
                    <p className="text-purple-600 font-medium mb-3 text-sm">
                      Full-Stack Developer
                    </p>
                    <p className="text-gray-600 mb-4 text-sm">
                      Expert in React, TypeScript, and modern web technologies.
                    </p>
                    <div className="flex flex-wrap justify-center gap-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        Typescript
                      </span>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        Prompt Eng
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        UI/UX
                      </span>
                      <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">
                        Tailwind
                      </span>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        C#
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Python
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Member Navigation */}
            <div className="flex justify-center mt-8 space-x-2">
              {[0, 1, 2, 3].map((index) => (
                <button
                  key={index}
                  onClick={() => setActiveTeamMember(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activeTeamMember ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Approvia
                  </h1>
                  <p className="text-sm text-gray-400">
                    Investment Management Platform
                  </p>
                </div>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Transform your investment approval process with intelligent
                workflows, real-time analytics, and comprehensive compliance
                tracking.
              </p>
              <div className="flex space-x-4">
                <a
                  href="mailto:contact@Approvia.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Mail className="w-5 h-5" />
                </a>
                <a
                  href="tel:+1234567890"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </a>
                <a
                  href="https://bolt.new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Zap className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#benefits"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Benefits
                  </a>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/submit"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Submit Request
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    API Reference
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                © 2024 Approvia. Built with modern technology for modern teams.
              </p>
              <div className="flex items-center space-x-6">
                <a
                  href="https://bolt.new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Built on Bolt
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
