'use client'

import { login, signup } from './actions'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const verification = searchParams.get('verification')

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
          <div className="flex space-x-4">
            <button
              formAction={login}
              className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Log in
            </button>
            <button
              formAction={signup}
              className="flex w-full justify-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}