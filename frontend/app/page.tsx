import Link from "next/link";
import { ArrowRight, Shield, TrendingUp, Zap, Globe, Lock, Users, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-surface-elevated border border-border rounded-full px-4 py-2 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm text-foreground-muted">Now Live: Fractional Asset Ownership</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-foreground">Real Estate Investment,</span>
              <br />
              <span className="gradient-text">Made Accessible for Tunisia</span>
            </h1>
            
            <p className="text-xl text-foreground-muted mb-10 max-w-2xl mx-auto leading-relaxed">
              Carthage Gate brings real-world asset tokenization to Tunisia. Invest in premium real estate 
              with as little as 300 TND — no big money needed to start building wealth.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link
                href="/register"
                className="group bg-primary text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary-hover transition-all shadow-2xl shadow-primary/30 glow-primary flex items-center justify-center"
              >
                Start Investing
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/marketplace"
                className="bg-surface-elevated border border-border text-foreground px-8 py-4 rounded-xl text-lg font-semibold hover:bg-surface-hover transition-all flex items-center justify-center"
              >
                Explore Marketplace
              </Link>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { value: "300 TND", label: "Minimum Investment", color: "success" },
                { value: "12K+", label: "Tunisian Investors", color: "accent" },
                { value: "50+", label: "Real Estate Projects", color: "primary" },
                { value: "24/7", label: "Platform Access", color: "gold" },
              ].map((stat, i) => (
                <div key={i} className="glass p-6 rounded-xl">
                  <p className={`text-3xl font-bold mb-1 text-${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-foreground-subtle">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Democratizing Real Estate for Tunisia
          </h2>
          <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
            Breaking down barriers to premium property investment with blockchain technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: "Start Small, Dream Big",
              description: "Begin investing in premium Tunisian real estate with as little as 300 TND. No large capital required.",
              color: "success",
            },
            {
              icon: TrendingUp,
              title: "Fractional Ownership",
              description: "Buy fractions of high-value properties that were previously out of reach for everyday investors.",
              color: "primary",
            },
            {
              icon: Zap,
              title: "Instant Transactions",
              description: "Buy and sell property shares instantly on our blockchain platform — no lengthy paperwork.",
              color: "accent",
            },
            {
              icon: Globe,
              title: "Built for Tunisia",
              description: "Designed specifically for the Tunisian market with local payment methods and TND currency.",
              color: "primary",
            },
            {
              icon: Lock,
              title: "Secure & Transparent",
              description: "Blockchain technology ensures every transaction is recorded, verified, and permanently secure.",
              color: "warning",
            },
            {
              icon: BarChart3,
              title: "Track Your Growth",
              description: "Monitor your real estate portfolio performance in real-time with comprehensive analytics.",
              color: "accent",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass p-8 rounded-2xl card-hover group"
            >
              <div className={`w-14 h-14 rounded-xl bg-${feature.color}-muted border border-${feature.color}-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-7 h-7 text-${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-foreground-muted leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Premium Tunisian Real Estate
          </h2>
          <p className="text-xl text-foreground-muted">
            Invest in diverse property types across Tunisia's growing markets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              category: "Residential Properties",
              description: "Apartments and homes in Tunis, Sousse, and beyond",
              value: "85M TND",
              growth: "+15.2%",
              image: "🏘️",
            },
            {
              category: "Commercial Real Estate",
              description: "Office spaces, retail centers, and business properties",
              value: "45M TND",
              growth: "+12.8%",
              image: "🏢",
            },
            {
              category: "Tourist Developments",
              description: "Hotels, resorts, and vacation properties",
              value: "32M TND",
              growth: "+18.5%",
              image: "🏖️",
            },
            {
              category: "Industrial Assets",
              description: "Warehouses, factories, and logistics centers",
              value: "28M TND",
              growth: "+10.3%",
              image: "🏭",
            },
          ].map((asset, i) => (
            <div key={i} className="glass p-8 rounded-2xl card-hover group">
              <div className="flex items-start justify-between mb-4">
                <div className="text-5xl mb-4">{asset.image}</div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{asset.value}</p>
                  <p className="text-success text-sm font-medium">{asset.growth}</p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">{asset.category}</h3>
              <p className="text-foreground-muted">{asset.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="glass p-12 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20"></div>
          <div className="relative z-10">
            <Users className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Your Real Estate Journey Starts Here
            </h2>
            <p className="text-xl text-foreground-muted mb-8 max-w-2xl mx-auto">
              Join thousands of Tunisians building wealth through real estate. Start with just 300 TND — no big money needed.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center bg-primary text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-primary-hover transition-all shadow-2xl shadow-primary/40 glow-primary"
            >
              Create Your Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-foreground-subtle">
            <p className="mb-2">© 2024 Carthage Gate. All rights reserved.</p>
            <p className="text-sm">Democratizing Real Estate Investment in Tunisia</p>
          </div>
        </div>
      </div>
    </div>
  );
}
