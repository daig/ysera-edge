import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Beaker, Lock, Sparkles } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="py-12 md:py-24 lg:py-32 flex flex-col items-center text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Research Methods Generator</h1>
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Transform high-level research descriptions into detailed methods sections suitable for grant applications
            and publications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24 lg:py-32 bg-muted/30 rounded-lg">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Beaker className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Scientific Precision</h3>
              <p className="text-muted-foreground">
                Generate technically accurate methods sections that follow academic writing conventions.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Time-Saving</h3>
              <p className="text-muted-foreground">
                Convert brief descriptions into comprehensive methods in seconds, not hours.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">Your research ideas remain confidential with our secure platform.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter mb-6">Ready to transform your research writing?</h2>
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground mb-8">
            Join thousands of researchers who save time and improve their grant applications and publications.
          </p>
          <Button asChild size="lg">
            <Link href="/signup">Create Free Account</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

