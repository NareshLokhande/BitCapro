import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Shield,
  Users,
  Zap,
  TrendingUp,
  FileText,
  Clock,
  DollarSign,
  Target,
  Award,
  Globe,
  Layers,
  Settings,
  Eye,
  PlusCircle,
  ClipboardCheck
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: FileText,
      title: "Smart Request Submission",
      description: "Multi-step guided form with validation, compliance checklist, and automatic KPI calculations"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time dashboards with interactive charts, trend analysis, and comprehensive reporting"
    },
    {
      icon: Shield,
      title: "Approval Workflows",
      description: "Configurable approval matrix with role-based routing and complete audit trails"
    },
    {
      icon: TrendingUp,
      title: "Financial KPIs",
      description: "IRR, NPV, payback period calculations with basis documentation and portfolio analysis"
    },
    {
      icon: Eye,
      title: "Real-time Tracking",
      description: "Live status updates, progress visualization, and detailed approval history"
    },
    {
      icon: Settings,
      title: "Admin Controls",
      description: "Complete system configuration, user management, and approval matrix customization"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Faster Approvals",
      description: "Reduce approval time by 60% with automated routing and clear workflows"
    },
    {
      icon: Target,
      title: "Better Decisions",
      description: "Data-driven insights with comprehensive KPI analysis and risk assessment"
    },
    {
      icon: Globe,
      title: "Full Transparency",
      description: "Complete visibility into request status, approval history, and system metrics"
    },
    {
      icon: Award,
      title: "Compliance Ready",
      description: "Built-in compliance checklist ensuring all requirements are met before approval"
    }
  ];

  const stats = [
    { number: "60%", label: "Faster Approvals" },
    { number: "100%", label: "Audit Compliance" },
    { number: "24/7", label: "Real-time Tracking" },
    { number: "∞", label: "Scalable Workflows" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Bolt Badge */}
      <div className="fixed top-4 right-4 z-50">
        <a 
          href="https://bolt.new" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <Zap className="w-4 h-4 mr-2" />
          Built with Bolt
        </a>
      </div>

      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800"></div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
        
        {/* Decorative elements */}
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
              Transform your investment request process with intelligent workflows, real-time analytics, 
              and comprehensive compliance tracking. Built for modern enterprises.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/dashboard"
                className="group flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                View Dashboard
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/submit"
                className="group flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 border-2 border-white border-opacity-20"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Submit Request
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-blue-200 text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Teams
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage investment requests efficiently, from submission to approval
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group p-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
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
                <div key={index} className="flex items-start p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mr-6 flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
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
              <h4 className="text-lg font-semibold text-gray-900 mb-3">1. Submit Request</h4>
              <p className="text-gray-600">Complete the guided form with project details, financials, and compliance checklist</p>
            </div>

            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">2. Auto-Route</h4>
              <p className="text-gray-600">System automatically routes to appropriate approvers based on amount and department</p>
            </div>

            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mx-auto mb-6 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">3. Review & Approve</h4>
              <p className="text-gray-600">Approvers review with full context, KPIs, and compliance status</p>
            </div>

            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mx-auto mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">4. Track & Analyze</h4>
              <p className="text-gray-600">Monitor progress, analyze trends, and optimize your investment process</p>
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
              Powered by cutting-edge tools for performance, security, and scalability
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm border border-white border-opacity-20">
              <div className="text-2xl font-bold text-white mb-2">React</div>
              <div className="text-blue-200 text-sm">Frontend Framework</div>
            </div>
            <div className="text-center p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm border border-white border-opacity-20">
              <div className="text-2xl font-bold text-white mb-2">Supabase</div>
              <div className="text-blue-200 text-sm">Backend & Database</div>
            </div>
            <div className="text-center p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm border border-white border-opacity-20">
              <div className="text-2xl font-bold text-white mb-2">TypeScript</div>
              <div className="text-blue-200 text-sm">Type Safety</div>
            </div>
            <div className="text-center p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm border border-white border-opacity-20">
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
            Join forward-thinking organizations using Approvia to streamline their investment workflows
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/dashboard"
              className="group flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Explore Dashboard
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/submit"
              className="group flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 border-2 border-white border-opacity-20"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Start Your First Request
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Approvia
              </h1>
              <p className="text-sm text-gray-400">Investment Management Platform</p>
            </div>
          </div>
          
          <div className="text-center text-gray-400">
            <p className="mb-4">© 2024 Approvia. Built with modern technology for modern teams.</p>
            <div className="flex items-center justify-center space-x-6">
              <a href="https://bolt.new" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:text-blue-300 transition-colors">
                <Zap className="w-4 h-4 mr-1" />
                Built with Bolt
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;