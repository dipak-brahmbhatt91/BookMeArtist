import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";

import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import BrowseArtists from "@/pages/browse-artists";
import ArtistProfile from "@/pages/artist-profile";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import ClaimProfile from "@/pages/claim-profile";
import NotFound from "@/pages/not-found";
import BlogIndex from "@/pages/blog/index";
import BlogPost from "@/pages/blog/post";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminArtists from "@/pages/admin/artists";
import AdminCategories from "@/pages/admin/categories";
import AdminBookings from "@/pages/admin/bookings";
import AdminUsers from "@/pages/admin/users";
import AdminSecurity from "@/pages/admin/security";
import AdminApplications from "@/pages/admin/applications";
import AdminContent from "@/pages/admin/content";
import AdminBlog from "@/pages/admin/blog";

const queryClient = new QueryClient();

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, user, navigate]);

  if (isLoading || !user) return <Spinner />;
  return <Component />;
}

function AdminProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== "admin" && user.role !== "superadmin"))) {
      navigate("/login?redirect=/admin");
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user || (user.role !== "admin" && user.role !== "superadmin")) return <Spinner />;
  return <Component />;
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function MainRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/claim-profile" component={ClaimProfile} />
      <Route path="/*">
        {() => (
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/artists" component={BrowseArtists} />
              <Route path="/artists/:slug" component={ArtistProfile} />
              <Route path="/blog" component={BlogIndex} />
              <Route path="/blog/:slug" component={BlogPost} />
              <Route path="/dashboard">
                {() => <ProtectedRoute component={Dashboard} />}
              </Route>
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ScrollToTop />
            <Switch>
              <Route path="/admin">
                {() => <AdminProtectedRoute component={AdminDashboard} />}
              </Route>
              <Route path="/admin/artists">
                {() => <AdminProtectedRoute component={AdminArtists} />}
              </Route>
              <Route path="/admin/categories">
                {() => <AdminProtectedRoute component={AdminCategories} />}
              </Route>
              <Route path="/admin/bookings">
                {() => <AdminProtectedRoute component={AdminBookings} />}
              </Route>
              <Route path="/admin/users">
                {() => <AdminProtectedRoute component={AdminUsers} />}
              </Route>
              <Route path="/admin/applications">
                {() => <AdminProtectedRoute component={AdminApplications} />}
              </Route>
              <Route path="/admin/security">
                {() => <AdminProtectedRoute component={AdminSecurity} />}
              </Route>
              <Route path="/admin/content">
                {() => <AdminProtectedRoute component={AdminContent} />}
              </Route>
              <Route path="/admin/blog">
                {() => <AdminProtectedRoute component={AdminBlog} />}
              </Route>
              <Route path="/*" component={MainRouter} />
            </Switch>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
