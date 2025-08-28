import React, { ReactElement, createContext, useContext } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { vi } from 'vitest'

// Mock ProfileProvider context value
export const createMockProfileData = (overrides = {}) => ({
  profileDetailsData: {
    upWallet: '0x1234567890123456789012345678901234567890',
    networkId: 42,
    ...overrides
  },
  isProfileLoading: false,
  profileError: null,
  refreshProfile: vi.fn(),
  ...overrides
})

// Create mock context
const MockProfileContext = createContext<any>(createMockProfileData())

// Mock ProfileProvider component
const MockProfileProvider = ({ 
  children, 
  value = createMockProfileData() 
}: { 
  children: React.ReactNode
  value?: any 
}) => {
  return (
    <MockProfileContext.Provider value={value}>
      {children}
    </MockProfileContext.Provider>
  )
}

// Mock the useProfile hook
export const useProfile = () => useContext(MockProfileContext)

// Custom render function that includes providers
const AllTheProviders = ({ 
  children, 
  profileData = createMockProfileData() 
}: { 
  children: React.ReactNode
  profileData?: any 
}) => {
  return (
    <ChakraProvider>
      <MockProfileProvider value={profileData}>
        {children}
      </MockProfileProvider>
    </ChakraProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    profileData?: any
  }
) => {
  const { profileData, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: (props) => <AllTheProviders {...props} profileData={profileData} />,
    ...renderOptions,
  })
}

export * from '@testing-library/react'
export { customRender as render }