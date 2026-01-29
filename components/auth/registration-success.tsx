"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, ExternalLink, Terminal, BookOpen, Copy, Check, FileText } from "lucide-react"
import type { GoogleUser, UserProfile } from "./register-card"
import Image from "next/image"
import { useState } from "react"
import Link from "next/link"

interface RegistrationSuccessProps {
  user: GoogleUser
  profile: UserProfile
}

export function RegistrationSuccess({ user, profile }: RegistrationSuccessProps) {
  const [copied, setCopied] = useState(false)

  const copyUsername = () => {
    navigator.clipboard.writeText(profile.username)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="p-3 rounded-full bg-primary/10 mb-4">
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </div>
        <Image
          src={user.picture || "/student-avatar.png"}
          alt={user.name}
          width={64}
          height={64}
          className="rounded-full mb-3"
        />
        <h3 className="text-lg font-semibold text-foreground">
          {profile.firstName} {profile.lastName}
        </h3>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {profile.faculty} - {profile.yearOfStudy}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">Your account has been created. You can now access:</p>

        <div className="grid gap-3">
          <a
            href="#"
            className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/80 transition-colors"
          >
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground">CTFd Platform</h4>
              <p className="text-sm text-muted-foreground">Access CTF challenges</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>

          <a
            href="#"
            className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/80 transition-colors"
          >
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground">Moodle Learning</h4>
              <p className="text-sm text-muted-foreground">Access course materials</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm text-muted-foreground mb-3">
          <strong className="text-foreground">Your Login Credentials:</strong>
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-background rounded border">
            <div>
              <span className="text-xs text-muted-foreground">CTFd Username</span>
              <p className="font-mono text-primary">{profile.username}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={copyUsername} className="h-8 w-8 p-0">
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="p-2 bg-background rounded border">
            <span className="text-xs text-muted-foreground">Password</span>
            <p className="text-sm text-foreground">The password you created during registration</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Go to Dashboard</Button>
      </div>
    </div>
  )
}
