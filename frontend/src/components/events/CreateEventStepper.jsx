export default function CreateEventStepper({ currentStep = 1, onStepClick }) {
  const steps = [
    { number: '01', label: 'Basic Info', stepIndex: 1 },
    { number: '02', label: 'Date & Time', stepIndex: 2 },
    { number: '03', label: 'Location', stepIndex: 3 },
    { number: '04', label: 'Details', stepIndex: 4 },
    { number: '05', label: 'Review', stepIndex: 5 },
  ]

  return (
    <nav className="create-event-stepper" aria-label="Creation Progress">
      {/* Dashed connector line */}
      <div className="create-event-stepper__line" aria-hidden="true" />

      <ol className="create-event-stepper__list">
        {steps.map((step) => {
          const isActive = currentStep === step.stepIndex
          const isPassed = currentStep > step.stepIndex

          return (
            <li
              key={step.number}
              className={`create-event-stepper__item ${isActive ? 'create-event-stepper__item--active' : ''} ${isPassed ? 'create-event-stepper__item--passed' : ''}`}
            >
              <button
                type="button"
                className="create-event-stepper__btn"
                onClick={() => onStepClick && onStepClick(step.stepIndex)}
                disabled={!isPassed && !isActive}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="create-event-stepper__circle">
                  {step.number}
                </span>
                <span className="create-event-stepper__label">
                  {step.label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
