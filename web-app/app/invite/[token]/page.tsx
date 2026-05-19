"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Home,
  UserPlus,
  Check,
  X,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

interface Invite {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  household: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    full_name: string;
    email: string;
  };
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const token = params.token as string;

  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetchInvite();
  }, [token]);

  const fetchInvite = async () => {
    try {
      const res = await fetch(`/api/invite/${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load invite");
        return;
      }

      setInvite(data.invite);
    } catch (err) {
      setError("Failed to load invite");
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to accept invite");
        setAccepting(false);
        return;
      }

      setAccepted(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError("Failed to accept invite");
      setAccepting(false);
    }
  };

  if (loading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/">
              <Button variant="outline">Go to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Welcome to {invite?.household.name}!</CardTitle>
            <CardDescription>
              You've successfully joined the household. Redirecting to dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Join {invite?.household.name}</CardTitle>
            <CardDescription>
              {invite?.inviter.full_name} has invited you to join their household.
              Sign in to accept this invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted">
              <Avatar>
                <AvatarFallback>
                  {getInitials(invite?.inviter.full_name || "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{invite?.inviter.full_name}</p>
                <p className="text-sm text-muted-foreground">{invite?.inviter.email}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Link href={`/sign-in?callbackUrl=/invite/${token}`} className="w-full">
              <Button className="w-full">
                Sign In to Accept
              </Button>
            </Link>
            <Link href="/">
              <Button variant="link" className="text-muted-foreground">
                Decline Invitation
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Home className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Join {invite?.household.name}</CardTitle>
          <CardDescription>
            You've been invited by {invite?.inviter.full_name} to join their household.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inviter Info */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            <Avatar>
              <AvatarFallback>
                {getInitials(invite?.inviter.full_name || "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">Invited by {invite?.inviter.full_name}</p>
              <p className="text-sm text-muted-foreground">{invite?.inviter.email}</p>
            </div>
          </div>

          {/* Invite Details */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Expires {new Date(invite?.expires_at || "").toLocaleDateString()}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button
            className="w-full"
            onClick={acceptInvite}
            disabled={accepting}
          >
            {accepting ? (
              "Accepting..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Accept Invitation
              </>
            )}
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost" className="text-muted-foreground">
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
