
export default function StatusBadge({ type = 'status', value }) {
    // Define color mappings
    const colors = {
        // Product Statuses
        'Idea': 'var(--color-info)',
        'Researching': 'var(--color-warning)',
        'Sourcing': 'var(--color-primary)',
        'Live': 'var(--color-success)',

        // Priorities
        'High': 'var(--color-error)',
        'Medium': 'var(--color-warning)',
        'Low': 'var(--color-success)',

        // Todo Statuses
        'Todo': 'var(--color-text-muted)',
        'In Progress': 'var(--color-primary)',
        'Done': 'var(--color-success)',

        // Generic
        'default': 'var(--color-text-muted)'
    }

    const color = colors[value] || colors['default']

    // Create a background with opacity based on the color
    const bgStyle = {
        backgroundColor: color,
        opacity: 0.15,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 'var(--radius-sm)'
    }

    return (
        <span style={{
            position: 'relative',
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            color: color,
            fontWeight: '600',
            fontSize: '0.8rem',
            display: 'inline-block',
            whiteSpace: 'nowrap'
        }}>
            <span style={bgStyle}></span>
            <span style={{ position: 'relative', zIndex: 1 }}>{value}</span>
        </span>
    )
}
