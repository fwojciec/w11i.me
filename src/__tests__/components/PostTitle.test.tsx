import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PostTitle from '../../components/PostTitle'

describe('PostTitle Component', () => {
  it('should render the title with the correct text and heading level', () => {
    const testTitle = 'Hello World'
    render(<PostTitle>{testTitle}</PostTitle>)

    // Find the h1 element
    // getByRole 'heading' with level 1 checks for an <h1>
    const headingElement = screen.getByRole('heading', { level: 1 })

    // Assert that the element is in the document
    expect(headingElement).toBeInTheDocument()

    // Assert that the element contains the correct text
    expect(headingElement).toHaveTextContent(testTitle)
  })

  it('should render correctly without children', () => {
    render(<PostTitle />)
    const headingElement = screen.getByRole('heading', { level: 1 })
    expect(headingElement).toBeInTheDocument()
    expect(headingElement).toHaveTextContent('')
  })

  it('should apply the correct CSS class', () => {
    const testTitle = 'CSS Test'
    const { container } = render(<PostTitle>{testTitle}</PostTitle>)
    const h1Element = container.querySelector('h1') // Find h1 directly
    expect(h1Element?.className).toContain('root') // CSS modules hash the class names
  })
})
