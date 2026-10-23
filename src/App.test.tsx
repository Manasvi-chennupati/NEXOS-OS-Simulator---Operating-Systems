import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('NEXOS app', () => {
  it('opens CPU scheduling and runs the sample', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getAllByText('NEXOS').length).toBeGreaterThan(0)
    await user.click(screen.getAllByRole('button', { name: 'CPU Scheduling' })[0])
    await user.click(screen.getByRole('button', { name: 'Run schedule' }))
    expect(await screen.findByText(/Gantt chart/i)).toBeInTheDocument()
    expect(screen.getAllByText('5.75').length).toBeGreaterThan(0)
  })
})
