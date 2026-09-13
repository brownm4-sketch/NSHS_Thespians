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
          Member Login
        </Link>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <InfoCard
          title="What is the Thespian Society?"
          body="The International Thespian Society honors students for their contributions to theatre — on stage, backstage, and everywhere in between — through a point-based induction system."
        />
        <InfoCard
          title="Earn Your Rank"
          body="Members log points for productions, crew work, officer service, and festival participation, working their way up the induction rank ladder."
        />
        <InfoCard
          title="Get Involved"
          body="Ready to join? Fill out a membership application and an officer will follow up with next steps."
        />
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-blue-800">Meet Our Officers</h2>
        <p className="mt-2 text-blue-600">
          Learn who leads our troupe and how to get in touch.{' '}
          <Link to="/officers" className="font-semibold text-orange-600 hover:underline">
            View the officer roster &rarr;
          </Link>
        </p>
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
