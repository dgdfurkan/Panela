import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import BurnerProtocolStep from './BurnerProtocolStep'
import CriteriaFilterStep from './CriteriaFilterStep'
import GoldenRatioStep from './GoldenRatioStep'
import ValidationDeskStep from './ValidationDeskStep'
import VerdictScreen from './VerdictScreen'

const steps = [
  { id: 1, title: 'Hazırlık Protokolü', component: BurnerProtocolStep },
  { id: 2, title: '6 Kriter Filtresi', component: CriteriaFilterStep },
  { id: 3, title: 'Altın Oran', component: GoldenRatioStep },
  { id: 4, title: 'Doğrulama Masası', component: ValidationDeskStep }
]

export default function WinnerHunterWizard({ onSave, userId }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState({})

  const handleStepComplete = (stepData) => {
    const newData = { ...wizardData, ...stepData }
    setWizardData(newData)
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      setCurrentStep(5)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSave = async (finalData) => {
    await onSave({ ...finalData, user_id: userId })
  }

  const handleReset = () => {
    setCurrentStep(1)
    setWizardData({})
  }

  const CurrentStepComponent = steps.find(s => s.id === currentStep)?.component

  return (
    <>
      <div>
        {/* Progress Bar */}
        {currentStep <= 4 && (
          <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              {steps.map((step, idx) => (
                <div key={step.id} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: currentStep >= step.id
                      ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
                      : 'rgba(0,0,0,0.05)',
                    color: currentStep >= step.id ? 'white' : 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '16px',
                    marginRight: '0.5rem',
                    border: currentStep >= step.id ? 'none' : '2px solid var(--color-border)'
                  }}>
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  {idx < steps.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: '2px',
                      background: currentStep > step.id
                        ? 'linear-gradient(90deg, var(--color-primary), rgba(0,0,0,0.1))'
                        : 'var(--color-border)',
                      margin: '0 0.5rem'
                    }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Adım {currentStep} / {steps.length}
            </div>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 5 ? (
          <VerdictScreen
            data={wizardData}
            onSave={handleSave}
            onReset={handleReset}
          />
        ) : CurrentStepComponent ? (
          <CurrentStepComponent
            onComplete={handleStepComplete}
            initialData={wizardData}
          />
        ) : null}

        {/* Navigation (only for steps 1-4) */}
        {currentStep > 1 && currentStep <= 4 && (
          <div style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'flex-start',
            gap: '1rem'
          }}>
            <button
              onClick={handleBack}
              className="ghost"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ChevronLeft size={18} />
              Geri
            </button>
          </div>
        )}
      </div>

      <style>{`
        .ghost {
          padding: 0.65rem 1.1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: white;
          font-weight: 600;
          color: var(--color-text-main);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .ghost:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }
      `}</style>
    </>
  )
}
