import { useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import BurnerProtocolStep from './BurnerProtocolStep'
import CriteriaFilterStep from './CriteriaFilterStep'
import GoldenRatioStep from './GoldenRatioStep'
import ValidationDeskStep from './ValidationDeskStep'
import VerdictScreen from './VerdictScreen'

const steps = [
  { id: 1, title: 'Burner Protocol', component: BurnerProtocolStep },
  { id: 2, title: '6 Criteria Filter', component: CriteriaFilterStep },
  { id: 3, title: 'Golden Ratio', component: GoldenRatioStep },
  { id: 4, title: 'Validation Desk', component: ValidationDeskStep }
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
      // Tüm adımlar tamamlandı, verdict ekranına geç
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
    <div>
      {/* Progress Bar */}
      {currentStep <= 4 && (
        <div style={{
          marginBottom: '2rem',
          background: 'rgba(30, 41, 59, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            {steps.map((step, idx) => (
              <div key={step.id} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: currentStep >= step.id
                    ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
                    : 'rgba(100, 116, 139, 0.3)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '16px',
                  marginRight: '0.5rem'
                }}>
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                {idx < steps.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    background: currentStep > step.id
                      ? 'linear-gradient(90deg, #8B5CF6, rgba(139, 92, 246, 0.3))'
                      : 'rgba(100, 116, 139, 0.3)',
                    margin: '0 0.5rem'
                  }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
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
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <button
            onClick={handleBack}
            style={{
              padding: '0.875rem 1.5rem',
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#F1F5F9',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <ChevronLeft size={18} />
            Geri
          </button>
        </div>
      )}
    </div>
  )
}

