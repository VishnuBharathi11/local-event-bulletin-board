import { Link } from 'react-router-dom'
import { PenLine, Users, Heart, TrendingUp, PartyPopper, Lightbulb, Send } from 'lucide-react'
import howItWorksHero from '../assets/how-it-works-hero.jpg'
import '../styles/howItWorks.css'

export default function HowItWorksPage() {
  const steps = [
    {
      stepNumber: '1',
      icon: <PenLine size={30} strokeWidth={2.2} />,
      title: 'Submit a Request',
      description: "Tell us what kind of event you'd like to see in your community. Share the details and why it matters to you."
    },
    {
      stepNumber: '2',
      icon: (
        <div className="step-icon-compound">
          <Users size={28} strokeWidth={2.2} />
          <span className="step-icon-compound__badge">
            <Heart size={10} fill="#ffffff" color="#ffffff" />
          </span>
        </div>
      ),
      title: 'Community Support',
      description: 'Others in your area can view your request and show support by voting or commenting.'
    },
    {
      stepNumber: '3',
      icon: <TrendingUp size={30} strokeWidth={2.2} />,
      title: 'Gain Momentum',
      description: 'The more support your request gets, the higher it ranks and gains visibility.'
    },
    {
      stepNumber: '4',
      icon: <PartyPopper size={30} strokeWidth={2.2} />,
      title: 'Event Happens',
      description: 'Event organizers review top requests and turn the most popular ones into real events!'
    }
  ]

  return (
    <div className="how-it-works-page">
      {/* 1. Hero Section matching reference screenshot */}
      <header className="how-it-works-hero">
        <div className="how-it-works-hero__content">
          <span className="how-it-works-hero__eyebrow">HOW IT WORKS</span>
          <h1 className="how-it-works-hero__title">
            Turn your ideas into<br />
            real community events
          </h1>
          <p className="how-it-works-hero__desc">
            Request what you want to see in your area.<br />
            Your community makes it happen.
          </p>
        </div>

        <div className="how-it-works-hero__illustration" aria-hidden="true">
          <img src={howItWorksHero} alt="" className="how-it-works-hero__img" />
        </div>
      </header>

      {/* 2. Process Section */}
      <section className="how-it-works-process" aria-labelledby="process-heading">
        <div className="how-it-works-process__header">
          <span className="how-it-works-process__eyebrow">THE PROCESS</span>
          <h2 id="process-heading" className="how-it-works-process__title">
            Simple steps to create impact
          </h2>
          <div className="how-it-works-process__divider" aria-hidden="true" />
        </div>

        {/* 3. Four Step Cards with Dashed Connectors */}
        <div className="how-it-works-steps">
          {/* Dashed connector line across cards */}
          <div className="how-it-works-steps__connector" aria-hidden="true" />

          <div className="how-it-works-steps__grid">
            {steps.map((step) => (
              <div key={step.stepNumber} className="how-it-works-card">
                <div className="how-it-works-card__badge" aria-hidden="true">
                  {step.stepNumber}
                </div>
                <div className="how-it-works-card__icon-wrap">
                  {step.icon}
                </div>
                <h3 className="how-it-works-card__title">{step.title}</h3>
                <p className="how-it-works-card__desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Bottom CTA Bar */}
        <div className="how-it-works-cta">
          <div className="how-it-works-cta__left">
            <div className="how-it-works-cta__icon" aria-hidden="true">
              <Lightbulb size={20} strokeWidth={2.2} />
            </div>
            <div className="how-it-works-cta__copy">
              <strong>Good ideas deserve to be heard.</strong>{' '}
              <span>Submit your request today and help build a stronger, more connected community.</span>
            </div>
          </div>

          <div className="how-it-works-cta__right">
            <Link className="how-it-works-cta__btn" to="/community-requests/new">
              <Send size={15} strokeWidth={2.2} />
              <span>Request an Event</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
