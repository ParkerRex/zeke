/**
 * Layout for stories section
 */

import type { ReactNode } from 'react'

interface StoriesLayoutProps {
  children: ReactNode
}

export default function StoriesLayout({ children }: StoriesLayoutProps): JSX.Element {
  return <>{children}</>
}
