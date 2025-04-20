// app/login/page.tsx
'use client'

import { login, signup } from './actions'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const verification = searchParams.get('verification')
  const [isSignUp, setIsSignUp] = useState(false)

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
        
        <form className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          {isSignUp && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium">
                Username:
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
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
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div>
            {isSignUp ? (
              <button
                formAction={signup}
                className="w-full flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Account
              </button>
            ) : (
              <button
                formAction={login}
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