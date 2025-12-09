import { Calendar } from 'lucide-react'

export default function WeekSelector({ weeks, selectedWeek, onSelectWeek }) {
    return (
        <div style={{
            width: '280px',
            background: 'white',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
            }}>
                <Calendar size={20} color="var(--color-primary)" />
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                    Haftalar
                </h2>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                {weeks.map(week => {
                    const isSelected = selectedWeek?.id === week.id
                    return (
                        <button
                            key={week.id}
                            onClick={() => onSelectWeek(week)}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                marginBottom: '0.5rem',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                background: isSelected ? 'var(--color-primary)' : 'transparent',
                                color: isSelected ? 'white' : '#1e293b',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: isSelected ? '600' : '500',
                                fontSize: '14px'
                            }}
                            onMouseEnter={e => {
                                if (!isSelected) {
                                    e.target.style.background = '#f1f5f9'
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isSelected) {
                                    e.target.style.background = 'transparent'
                                }
                            }}
                        >
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                Hafta {week.week_number}
                            </div>
                            {week.title && (
                                <div style={{ fontSize: '12px', opacity: isSelected ? 0.9 : 0.7 }}>
                                    {week.title}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

