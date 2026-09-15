import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-blue-900 px-6 py-16 text-center text-white shadow-lg">
        <p className="mb-2 text-sm font-semibold tracking-widest text-orange-400 uppercase">
          NSHS Thespian Society
        </p>
        <h1 className="text-4xl font-bold sm:text-5xl">Welcome to the NSHS Thespian Society</h1>
        <p className="mx-auto mt-4 max-w-2xl text-blue-100">
          Celebrating student achievement in theatre — on stage, backstage, and everywhere in between.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-block rounded-md bg-orange-500 px-6 py-3 font-semibold text-blue-900 transition-colors hover:bg-orange-400"
        >
          Login
        </Link>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <InfoCard
          title="What is the Thespian Society?"
          body="The International Thespian Society honors students for their contributions to theatre — on stage, backstage, and everywhere in between — through a point-based induction system."
        />
        <InfoCard
          title="Earn Your Rank"
          body="Log points for productions, crew work, officer service, and festival participation, working your way up the induction rank ladder."
        />
        <InfoCard
          title="Get Started"
          body="Create an account to start logging your participation. Your teacher will review and approve each entry."
        />
      </section>
    </div>
  )
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
      <h3 className="mb-2 text-lg font-bold text-blue-700">{title}</h3>
      <p className="text-sm text-blue-600">{body}</p>
    </div>
  )
}
