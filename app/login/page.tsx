// app/login/page.tsx
'use client'

import { login, signup } from './actions'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { Check } from "lucide-react"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const verification = searchParams.get('verification')
  const [isSignUp, setIsSignUp] = useState(false)
  
  // Form state
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  // Validation state
  const [emailError, setEmailError] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isUsernameChecking, setIsUsernameChecking] = useState(false)
  
  const debouncedUsername = useDebounce(username, 500)

  // Check username availability
  useEffect(() => {
    async function checkUsername() {
      if (!debouncedUsername || debouncedUsername.length < 3 || !isSignUp) return
      
      setIsUsernameChecking(true)
      try {
        const response = await fetch(`/api/validate-username?username=${debouncedUsername}`)
        const data = await response.json()
        
        if (!data.valid) {
          setUsernameError(data.message)
        } else {
          setUsernameError('')
        }
      } catch (error) {
        console.error('Error checking username:', error)
      } finally {
        setIsUsernameChecking(false)
      }
    }
    
    checkUsername()
  }, [debouncedUsername, isSignUp])

  // Show toast notifications based on URL parameters
  useEffect(() => {
    if (error) {
      toast.error(decodeURIComponent(error))
    }
    
    if (verification === 'true') {
      toast.success(
        'Check your email for the confirmation link!', 
        {
          description: 'You need to verify your email before you can sign in.',
          duration: 6000
        }
      )
    }
  }, [error, verification])

  // Basic email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setEmailError('Email is required')
      return false
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  // Password validation
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required')
      return false
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return false
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter')
      return false
    }
    if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter')
      return false
    }
    if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number')
      return false
    }
    setPasswordError('')
    return true
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-8 shadow-md">
        <h2 className="text-center text-2xl font-bold">Welcome to Whiteboard</h2>
        <div className="flex justify-center space-x-4 mb-6">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              !isSignUp 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isSignUp 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sign up
          </button>
        </div>
        
        <form className="space-y-6" action={isSignUp ? signup : login}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                validateEmail(e.target.value)
              }}
              onBlur={() => validateEmail(email)}
              required
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 ${
                emailError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {emailError && (
              <p className="mt-1 text-xs text-red-500">{emailError}</p>
            )}
          </div>
          
          {isSignUp && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium">
                Username:
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 ${
                    usernameError ? 'border-red-500' : username && !usernameError && !isUsernameChecking ? 'border-green-500' : 'border-gray-300'
                  }`}
                />
                {isUsernameChecking && (
                  <div className="absolute right-3 top-3 h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                )}
                {username && !usernameError && !isUsernameChecking && (
                  <div className="absolute right-3 top-3 text-green-500">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </div>
              {usernameError && (
                <p className="mt-1 text-xs text-red-500">{usernameError}</p>
              )}
            </div>
          )}
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password:
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (isSignUp) {
                  validatePassword(e.target.value)
                }
              }}
              onBlur={() => isSignUp && validatePassword(password)}
              required
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 ${
                passwordError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {passwordError && (
              <p className="mt-1 text-xs text-red-500">{passwordError}</p>
            )}
          </div>
          
          <div>
            {isSignUp ? (
              <button
                type="submit"
                disabled={!!emailError || !!usernameError || !!passwordError}
                className="w-full flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Account
              </button>
            ) : (
              <button
                type="submit"
                className="w-full flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Log in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}