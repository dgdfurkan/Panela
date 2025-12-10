import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import WeekSelector from '../components/academy/WeekSelector'
import ResourcesTab from '../components/academy/ResourcesTab'
import ClassroomTab from '../components/academy/ClassroomTab'
import AssignmentsTab from '../components/academy/AssignmentsTab'
import NotesTab from '../components/academy/NotesTab'
import SummaryTab from '../components/academy/SummaryTab'
import QuizTab from '../components/academy/QuizTab'
import { BookOpen, Video, FileText, CheckSquare, PenTool, BookMarked, Brain } from 'lucide-react'

export default function AcademyHub() {
    const [weeks, setWeeks] = useState([])
    const [selectedWeek, setSelectedWeek] = useState(null)
    const [activeTab, setActiveTab] = useState('resources')
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        fetchWeeks()
    }, [])

    const fetchWeeks = async () => {
        try {
            const { data, error } = await supabase
                .from('academy_weeks')
                .select('*')
                .order('week_number', { ascending: true })

            if (error) throw error
            setWeeks(data || [])
            if (data && data.length > 0 && !selectedWeek) {
                setSelectedWeek(data[0])
            }
        } catch (error) {
            console.error('Error fetching weeks:', error)
        } finally {
            setLoading(false)
        }
    }

    const tabs = [
        { id: 'resources', label: 'Hazırlık & Kaynaklar', icon: BookOpen },
        { id: 'classroom', label: 'Ders Kaydı', icon: Video },
        { id: 'assignments', label: 'Ödevler', icon: CheckSquare },
        { id: 'notes', label: 'Dijital Defter', icon: PenTool },
        { id: 'summary', label: 'Genel Özet', icon: BookMarked },
        { id: 'quiz', label: 'AI Pratik Lab', icon: Brain }
    ]

    if (loading) {
        return (
            <div className="page-container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '18px', marginBottom: '0.5rem' }}>Yükleniyor...</div>
                </div>
            </div>
        )
    }

    if (weeks.length === 0) {
        return (
            <div className="page-container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '18px', marginBottom: '0.5rem' }}>Henüz hafta eklenmemiş.</div>
                    <div style={{ fontSize: '14px' }}>Yönetici panelinden hafta ekleyebilirsiniz.</div>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container fade-in" style={{ padding: 0, maxWidth: '100%', margin: 0 }}>
            <div style={{ display: 'flex', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
                {/* Week Selector Sidebar */}
                <WeekSelector
                    weeks={weeks}
                    selectedWeek={selectedWeek}
                    onSelectWeek={setSelectedWeek}
                />

                {/* Main Content Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>
                    {selectedWeek && (
                        <>
                            {/* Week Header */}
                            <div style={{
                                padding: '1.5rem 2rem',
                                background: 'white',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                                        {selectedWeek.title}
                                    </h1>
                                    {selectedWeek.description && (
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                            {selectedWeek.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Tabs */}
                            <div style={{
                                display: 'flex',
                                background: 'white',
                                borderBottom: '1px solid #e2e8f0',
                                padding: '0 2rem',
                                gap: '0.5rem',
                                overflowX: 'auto'
                            }}>
                                {tabs.map(tab => {
                                    const Icon = tab.icon
                                    const isActive = activeTab === tab.id
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            style={{
                                                padding: '1rem 1.5rem',
                                                border: 'none',
                                                background: 'transparent',
                                                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                                                color: isActive ? 'var(--color-primary)' : '#64748b',
                                                fontWeight: isActive ? '600' : '500',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                transition: 'all 0.2s',
                                                whiteSpace: 'nowrap'
                                            }}
                                            onMouseEnter={e => {
                                                if (!isActive) e.target.style.color = '#1e293b'
                                            }}
                                            onMouseLeave={e => {
                                                if (!isActive) e.target.style.color = '#64748b'
                                            }}
                                        >
                                            <Icon size={18} />
                                            <span>{tab.label}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Tab Content */}
                            <div style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
                                {activeTab === 'resources' && <ResourcesTab weekId={selectedWeek.id} />}
                                {activeTab === 'classroom' && <ClassroomTab weekId={selectedWeek.id} />}
                                {activeTab === 'assignments' && <AssignmentsTab weekId={selectedWeek.id} userId={user?.id} />}
                                {activeTab === 'notes' && <NotesTab weekId={selectedWeek.id} userId={user?.id} />}
                                {activeTab === 'summary' && <SummaryTab weekId={selectedWeek.id} userId={user?.id} />}
                                {activeTab === 'quiz' && <QuizTab weekId={selectedWeek.id} userId={user?.id} />}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

