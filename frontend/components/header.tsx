"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { FileText, LogOut } from "lucide-react"

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <FileText className="h-5 w-5" />
          <span>Methods Generator</span>
        </Link>

        <nav>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
              <Button variant="ghost" size="sm" onClick={logout} className="flex items-center gap-1">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

