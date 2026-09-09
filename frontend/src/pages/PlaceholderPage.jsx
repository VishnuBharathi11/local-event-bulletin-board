import { Link } from 'react-router-dom'

export default function PlaceholderPage({ title, description }) {
  return (
    <section className="page-placeholder" aria-labelledby="page-title">
      <p className="eyebrow">Local Event Bulletin Board</p>
      <h1 id="page-title">{title}</h1>
      <p className="page-description">{description}</p>
      <Link className="secondary-link" to="/">
        Return to Event Board
      </Link>
    </section>
  )
}
