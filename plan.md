# Whiteboard

## Description

Whiteboard is a simplistic social media website where users can post content and interact with other's content. Either the most recently posted post OR the most recently interacted with post (interactions are unique user comments) will be appended to the top. The core feature sets are described below:

### Features

1. When a user makes a post, it receives a unique ID and a cosmetic ID. The cosmetic ID is an ascending unique number starting from the integer 1. The unique id is simply a UUID which cannot be null and must be unique.

2. A post can have comments. Commenting on a post as a unique user will push it to the 'top' of the board that it belongs to. This means that heavily interacted with posts will be pushed to the top of the board frequently. However, any new post will also be put first at the top of the board. What this does is create a place where either new content is always first, or the latest interacted with content. However, spamming comments as the same user on a post will not push it to the top, as it is not a unique user. Also, there is a maximum number of times that a post can be pushed to the top (50). Following this, it can still be commented on, but it will not be pushed to the top anymore.

3. Posts are grouped under 'boards'. For now, we will have one board, but we do need a mechanism to create new unique boards in the future.

4. New posts on boards will still have a unique ID, but the cosmetic ID will start from 1 again.

5. Users can sign-up and login to the application. We are using Supabase auth and Supabase for our database layer.

6. Users can only make 1 post per day. Users can comment an unlimited number of times.

7. For now, posts are text only, but we will include images in a later update.

### Additional Considerations

I have a few additional rules. You should create types for any type you use in this project, since it is typescript. You should define any schemas that need to be created in Supabase and write all SQL required to do so. You should consider what RLS policies will be required for access to any of these tables (I believe so long as the user is authenticated they should be fine). Your API code should abide by the app/api pattern. You should use the middleware based security pattern within Supabase. The instructions for setting it up will be appended to the bottom of this instruction set. Your frontend code should be well structured, reusable, and D.R.Y. Any and all components you create should be created at the /components level. If you need to add packages, indicate that you do and provide the installation CLI command. You should use the shadcn-ui design system for as many components as you can; we can adjust this later but for now this will simplify things drastically.

### Authentication

Authentication should be done through Supabase Auth.

### What to Create

Here is what you should create:

1. Database schemas and RLS policies
2. Authentication configuration through Supabase Auth
3. Backend routes necessary for this application (app/api typescript)
4. Middleware security / authentication checks (check the instructions at the bottom for how to do this)
5. Frontend layer which creates:
a. A main page with a header and footer with as little content as possible for now (we will add to it later)
b. sign-up / login buttons on the header
c. Avatar in the header that can be clicked to view and manage user
d. main page shows the posts in the manner described above

### Other Functional Requirements

Other functional requirements:
1. posts should have comments
2. posts should have an author
3. comments should have an author
4. posts can be thumbed up
5. comments can be thumbed up
6. There should be a togglable light/dark theme (shadcn-ui handles this well)


#### Supabase Server-side Auth

Below are the instructions for setting up server-side auth in Supabase. Abide by this carefully.

 Install Supabase packages
Install the @supabase/supabase-js package and the helper @supabase/ssr package.

npm install @supabase/supabase-js @supabase/ssr
2
Set up environment variables
Create a .env.local file in your project root directory.

Fill in your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY:

.env.local
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
3
Write utility functions to create Supabase clients
To access Supabase from your Next.js app, you need 2 types of Supabase clients:

Client Component client - To access Supabase from Client Components, which run in the browser.
Server Component client - To access Supabase from Server Components, Server Actions, and Route Handlers, which run only on the server.
Create a utils/supabase folder with a file for each type of client. Then copy the utility functions for each client type.


What does the `cookies` object do?

Do I need to create a new client for every route?

utils/supabase/client.ts

utils/supabase/server.ts
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
4
Hook up middleware
Create a middleware.ts file at the root of your project, or inside the ./src folder if you are using one.

Since Server Components can't write cookies, you need middleware to refresh expired Auth tokens and store them.

The middleware is responsible for:

Refreshing the Auth token (by calling supabase.auth.getUser).
Passing the refreshed Auth token to Server Components, so they don't attempt to refresh the same token themselves. This is accomplished with request.cookies.set.
Passing the refreshed Auth token to the browser, so it replaces the old token. This is accomplished with response.cookies.set.
Copy the middleware code for your app.

Add a matcher so the middleware doesn't run on routes that don't access Supabase.

Be careful when protecting pages. The server gets the user session from the cookies, which can be spoofed by anyone.

Always use supabase.auth.getUser() to protect pages and user data.

Never trust supabase.auth.getSession() inside server code such as middleware. It isn't guaranteed to revalidate the Auth token.

It's safe to trust getUser() because it sends a request to the Supabase Auth server every time to revalidate the Auth token.


middleware.ts

utils/supabase/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

Create a login page
Create a login page for your app. Use a Server Action to call the Supabase signup function.

Since Supabase is being called from an Action, use the client defined in @/utils/supabase/server.ts.

Note that cookies is called before any calls to Supabase, which opts fetch calls out of Next.js's caching. This is important for authenticated data fetches, to ensure that users get access only to their own data.

See the Next.js docs to learn more about opting out of data caching.


app/login/page.tsx
import { login, signup } from './actions'
export default function LoginPage() {
  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      <button formAction={login}>Log in</button>
      <button formAction={signup}>Sign up</button>
    </form>
  )
}
app/login/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
app/error/page.tsx
import { login, signup } from './actions'
export default function LoginPage() {
  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      <button formAction={login}>Log in</button>
      <button formAction={signup}>Sign up</button>
    </form>
  )
}
6
Change the Auth confirmation path
If you have email confirmation turned on (the default), a new user will receive an email confirmation after signing up.

Change the email template to support a server-side authentication flow.

Go to the Auth templates page in your dashboard. In the Confirm signup template, change {{ .ConfirmationURL }} to {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email.

7
Create a route handler for Auth confirmation
Create a Route Handler for auth/confirm. When a user clicks their confirmation email link, exchange their secure code for an Auth token.

Since this is a Router Handler, use the Supabase client from @/utils/supabase/server.ts.


app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'
  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // redirect user to specified redirect URL or root of app
      redirect(next)
    }
  }
  // redirect the user to an error page with some instructions
  redirect('/error')
}
8
Access user info from Server Component
Server Components can read cookies, so you can get the Auth status and user info.

Since you're calling Supabase from a Server Component, use the client created in @/utils/supabase/server.ts.

Create a private page that users can only access if they're logged in. The page displays their email.

Be careful when protecting pages. The server gets the user session from the cookies, which can be spoofed by anyone.

Always use supabase.auth.getUser() to protect pages and user data.

Never trust supabase.auth.getSession() inside Server Components. It isn't guaranteed to revalidate the Auth token.

It's safe to trust getUser() because it sends a request to the Supabase Auth server every time to revalidate the Auth token.


app/private/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
export default async function PrivatePage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }
  return <p>Hello {data.user.email}</p>
}


#### Shadnc-ui Setup

Next.js
Install and configure shadcn/ui for Next.js.

Note: The following guide is for Tailwind v4. If you are using Tailwind v3, use shadcn@2.3.0.

Create project
Run the init command to create a new Next.js project or to setup an existing one:

npx shadcn@latest init

Add Components
You can now start adding components to your project.

npx shadcn@latest add button

The command above will add the Button component to your project. You can then import it like this:

import { Button } from "@/components/ui/button"
 
export default function Home() {
  return (
    <div>
      <Button>Click me</Button>
    </div>
  )
}

For setting up the light/dark mode:

Dark mode
Install next-themes
Start by installing next-themes:

npm install next-themes

Create a theme provider
components/theme-provider.tsx
"use client"
 
import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
 
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
Copy
Wrap your root layout
Add the ThemeProvider to your root layout and add the suppressHydrationWarning prop to the html tag.

app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"
 
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}

Add a mode toggle
Place a mode toggle on your site to toggle between light and dark mode.

"use client"
 
import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
 
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
 
export function ModeToggle() {
  const { setTheme } = useTheme()
 
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}