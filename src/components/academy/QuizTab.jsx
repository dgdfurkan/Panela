import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Brain, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react'
import { fetchAiSuggestions } from '../../lib/aiClient'

export default function QuizTab({ weekId, userId }) {
    const [questions, setQuestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [userAnswers, setUserAnswers] = useState({})
    const [feedback, setFeedback] = useState({})
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        if (weekId) fetchQuestions()
    }, [weekId])

    const fetchQuestions = async () => {
        try {
            const { data, error } = await supabase
                .from('academy_quiz_questions')
                .select('*')
                .eq('week_id', weekId)
                .order('created_at', { ascending: true })

            if (error) throw error
            setQuestions(data || [])
        } catch (error) {
            console.error('Error fetching questions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAnswer = async (questionId, answer) => {
        const question = questions.find(q => q.id === questionId)
        if (!question) return

        const isCorrect = answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()
        setUserAnswers({ ...userAnswers, [questionId]: answer })
        setFeedback({ ...feedback, [questionId]: { isCorrect, explanation: question.explanation } })

        // Save attempt
        try {
            await supabase
                .from('academy_quiz_attempts')
                .insert([{
                    question_id: questionId,
                    user_id: userId,
                    user_answer: answer,
                    is_correct: isCorrect
                }])
        } catch (error) {
            console.error('Error saving attempt:', error)
        }
    }

    const handleGenerateQuestions = async () => {
        setGenerating(true)
        try {
            // Fetch week resources and videos for context
            const [resourcesRes, videosRes] = await Promise.all([
                supabase.from('academy_resources').select('*').eq('week_id', weekId),
                supabase.from('academy_videos').select('*').eq('week_id', weekId)
            ])

            const context = {
                resources: resourcesRes.data || [],
                videos: videosRes.data || []
            }

            const prompt = `Bu haftanın eğitim içeriğinden quiz soruları oluştur. 
Kaynaklar: ${context.resources.map(r => r.title || r.url).join(', ')}
Videolar: ${context.videos.map(v => v.title).join(', ')}

3 farklı soru tipinde sorular oluştur:
1. Boşluk doldurma (fill_blank)
2. Eşleştirme (matching)
3. Çoktan seçmeli (multiple_choice)

Her soru için JSON formatında döndür:
{
  "questions": [
    {
      "question_type": "fill_blank|matching|multiple_choice",
      "question_text": "...",
      "options": {...},
      "correct_answer": "...",
      "explanation": "..."
    }
  ]
}`

            const response = await fetchAiSuggestions(prompt)
            const parsed = JSON.parse(response)
            
            if (parsed.questions && parsed.questions.length > 0) {
                const questionsToInsert = parsed.questions.map(q => ({
                    week_id: weekId,
                    ...q,
                    ai_generated: true
                }))

                const { error } = await supabase
                    .from('academy_quiz_questions')
                    .insert(questionsToInsert)

                if (error) throw error
                fetchQuestions()
            }
        } catch (error) {
            console.error('Error generating questions:', error)
            alert('Sorular oluşturulurken hata oluştu: ' + error.message)
        } finally {
            setGenerating(false)
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Loader2 className="animate-spin" size={24} color="var(--color-primary)" />
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex]
    const currentFeedback = currentQuestion ? feedback[currentQuestion.id] : null
    const currentAnswer = currentQuestion ? userAnswers[currentQuestion.id] : ''

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Brain size={24} color="var(--color-primary)" />
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                        AI Pratik Lab
                    </h2>
                </div>
                <button
                    onClick={handleGenerateQuestions}
                    disabled={generating}
                    style={{
                        padding: '0.6rem 1.2rem',
                        background: generating ? '#cbd5e1' : 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: generating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {generating ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Oluşturuluyor...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={14} />
                            <span>AI ile Soru Oluştur</span>
                        </>
                    )}
                </button>
            </div>

            {questions.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    background: 'white',
                    borderRadius: 'var(--radius-lg)',
                    color: '#64748b'
                }}>
                    <Brain size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Henüz soru eklenmemiş
                    </div>
                    <div style={{ fontSize: '14px' }}>
                        "AI ile Soru Oluştur" butonuna tıklayarak başlayın
                    </div>
                </div>
            ) : (
                <>
                    {/* Progress */}
                    <div style={{
                        background: 'white',
                        padding: '1rem 1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: '1.5rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
                            Soru {currentQuestionIndex + 1} / {questions.length}
                        </div>
                        <div style={{
                            width: '100%',
                            height: '8px',
                            background: '#e2e8f0',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                                height: '100%',
                                background: 'var(--color-primary)',
                                transition: 'width 0.3s'
                            }} />
                        </div>
                    </div>

                    {/* Question Card */}
                    {currentQuestion && (
                        <div style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                display: 'inline-block',
                                padding: '0.3rem 0.8rem',
                                background: '#f0f9ff',
                                color: 'var(--color-primary)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '12px',
                                fontWeight: '600',
                                marginBottom: '1rem'
                            }}>
                                {currentQuestion.question_type === 'fill_blank' && 'Boşluk Doldurma'}
                                {currentQuestion.question_type === 'matching' && 'Eşleştirme'}
                                {currentQuestion.question_type === 'multiple_choice' && 'Çoktan Seçmeli'}
                            </div>

                            <h3 style={{
                                margin: '0 0 1.5rem 0',
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#1e293b',
                                lineHeight: '1.6'
                            }}>
                                {currentQuestion.question_text}
                            </h3>

                            {/* Answer Input */}
                            {currentQuestion.question_type === 'fill_blank' && (
                                <div>
                                    <input
                                        type="text"
                                        value={currentAnswer}
                                        onChange={e => setUserAnswers({ ...userAnswers, [currentQuestion.id]: e.target.value })}
                                        onBlur={() => handleAnswer(currentQuestion.id, currentAnswer)}
                                        placeholder="Cevabınızı yazın..."
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '15px'
                                        }}
                                    />
                                </div>
                            )}

                            {currentQuestion.question_type === 'multiple_choice' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {currentQuestion.options?.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setUserAnswers({ ...userAnswers, [currentQuestion.id]: option })
                                                handleAnswer(currentQuestion.id, option)
                                            }}
                                            style={{
                                                padding: '1rem',
                                                border: `2px solid ${currentAnswer === option ? 'var(--color-primary)' : '#e2e8f0'}`,
                                                borderRadius: 'var(--radius-md)',
                                                background: currentAnswer === option ? '#f0f9ff' : 'white',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {currentQuestion.question_type === 'matching' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    {currentQuestion.options?.pairs?.map((pair, idx) => (
                                        <div key={idx} style={{
                                            padding: '1rem',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 'var(--radius-md)',
                                            background: '#f8fafc'
                                        }}>
                                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                {pair.term}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Tanımı yazın..."
                                                onBlur={e => {
                                                    const answer = `${pair.term}:${e.target.value}`
                                                    setUserAnswers({ ...userAnswers, [currentQuestion.id]: answer })
                                                    handleAnswer(currentQuestion.id, answer)
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: '13px'
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Feedback */}
                            {currentFeedback && (
                                <div style={{
                                    marginTop: '1.5rem',
                                    padding: '1rem',
                                    background: currentFeedback.isCorrect ? '#f0fdf4' : '#fef2f2',
                                    border: `2px solid ${currentFeedback.isCorrect ? '#10b981' : '#ef4444'}`,
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'start',
                                    gap: '0.75rem'
                                }}>
                                    {currentFeedback.isCorrect ? (
                                        <CheckCircle size={20} color="#10b981" />
                                    ) : (
                                        <XCircle size={20} color="#ef4444" />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontWeight: '600',
                                            color: currentFeedback.isCorrect ? '#10b981' : '#ef4444',
                                            marginBottom: '0.5rem'
                                        }}>
                                            {currentFeedback.isCorrect ? 'Doğru!' : 'Yanlış!'}
                                        </div>
                                        {currentFeedback.explanation && (
                                            <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                                                {currentFeedback.explanation}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '1rem'
                    }}>
                        <button
                            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                            disabled={currentQuestionIndex === 0}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: currentQuestionIndex === 0 ? '#f1f5f9' : 'white',
                                color: currentQuestionIndex === 0 ? '#94a3b8' : '#1e293b',
                                border: '1px solid #e2e8f0',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            ← Önceki
                        </button>
                        <button
                            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                            disabled={currentQuestionIndex === questions.length - 1}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: currentQuestionIndex === questions.length - 1 ? '#f1f5f9' : 'var(--color-primary)',
                                color: currentQuestionIndex === questions.length - 1 ? '#94a3b8' : 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                cursor: currentQuestionIndex === questions.length - 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Sonraki →
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

