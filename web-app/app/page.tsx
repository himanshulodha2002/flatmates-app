import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, 
  ListChecks, 
  Receipt, 
  ShoppingCart, 
  Users, 
  ArrowRight, 
  Sparkles,
  Shield,
  Smartphone,
  Zap
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl stat-purple flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Flatmates</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link href="/auth/signin">
              <Button className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-pattern" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              Now with Android app sync
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="gradient-text">Harmonious</span>
              <br />
              <span className="text-foreground">Household Living</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              The all-in-one platform for roommates. Split expenses fairly, manage chores effortlessly, 
              and never argue about who bought the milk again.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signin">
                <Button size="lg" className="text-lg px-8 h-14 w-full sm:w-auto gap-2 glow">
                  Start for Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="text-lg px-8 h-14 w-full sm:w-auto">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to{" "}
              <span className="gradient-text">live better together</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Four powerful tools designed to eliminate household friction and keep everyone on the same page.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: "Household Hub",
                description: "Create your household, invite roommates, and manage who has access to what.",
                gradient: "stat-purple",
                iconBg: "bg-purple-100 dark:bg-purple-900/50",
                iconColor: "text-purple-600 dark:text-purple-400"
              },
              {
                icon: ListChecks,
                title: "Smart Tasks",
                description: "Assign chores, set recurring tasks, and track who's pulling their weight.",
                gradient: "stat-green",
                iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
                iconColor: "text-emerald-600 dark:text-emerald-400"
              },
              {
                icon: Receipt,
                title: "Expense Splitting",
                description: "Log shared expenses, split bills automatically, and settle up with one tap.",
                gradient: "stat-blue",
                iconBg: "bg-blue-100 dark:bg-blue-900/50",
                iconColor: "text-blue-600 dark:text-blue-400"
              },
              {
                icon: ShoppingCart,
                title: "Shopping Lists",
                description: "Collaborative lists that sync in real-time. Never forget the essentials.",
                gradient: "stat-orange",
                iconBg: "bg-orange-100 dark:bg-orange-900/50",
                iconColor: "text-orange-600 dark:text-orange-400"
              },
            ].map((feature, index) => (
              <Card key={index} className="group card-hover border-0 bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className={`h-1 ${feature.gradient}`} />
                <CardContent className="p-6 pt-8">
                  <div className={`h-14 w-14 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Smartphone,
                title: "Cross-Platform Sync",
                description: "Use our Android app on the go, web app at home. Your data stays perfectly in sync."
              },
              {
                icon: Shield,
                title: "Secure by Design",
                description: "Google OAuth authentication and encrypted data ensure your information stays private."
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Built with modern technology for instant updates and a seamless experience."
              },
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <Card className="relative overflow-hidden border-0">
            <div className="absolute inset-0 gradient-bg opacity-90" />
            <CardContent className="relative p-12 md:p-16 text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to simplify your shared living?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-xl mx-auto">
                Join thousands of roommates who've already made household management a breeze.
              </p>
              <Link href="/auth/signin">
                <Button size="lg" variant="secondary" className="text-lg px-8 h-14 gap-2">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg stat-purple flex items-center justify-center">
                <Home className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Flatmates</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Syncs with Android app • Built with ❤️ for roommates everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
