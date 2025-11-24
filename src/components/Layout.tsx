import { Link, useLocation } from "react-router-dom";
import { Home, Dumbbell, Heart, MessageCircle, Users, Calendar, BookOpen, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Dumbbell, label: "Workouts", path: "/workouts" },
  { icon: Heart, label: "Support", path: "/support" },
  { icon: MessageCircle, label: "Community", path: "/community" },
  { icon: Users, label: "Mentors", path: "/mentors" },
  { icon: Calendar, label: "Meetings", path: "/meetings" },
  { icon: BookOpen, label: "Resources", path: "/resources" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-hero" />
            <span className="font-bold text-xl">EmpowerHer</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-2 mt-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className="w-full justify-start gap-3"
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:border-r lg:bg-card">
        <div className="flex h-full flex-col gap-4 p-6">
          <Link to="/" className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-hero" />
            <span className="font-bold text-2xl">EmpowerHer</span>
          </Link>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start gap-3"
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
