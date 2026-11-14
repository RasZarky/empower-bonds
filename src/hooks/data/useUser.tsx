// hooks/useUser.ts
import { useEffect, useState } from "react"
import { useZustand } from "@/hooks/useZustand"
import { authClient } from "@/lib/auth-client"
import { User } from "@/types/db"
import { useDidMount } from "../useDidMount"

interface UserSession {
	user: User | null
	isAuthenticated: boolean
}

/**
 * Custom hook to fetch the current user session.
 * It checks if the user is authenticated and returns user data.
 * @returns {Object} - An object containing user data and loading state.
 */
async function fetchSessionUser(): Promise<UserSession | null> {
	try {
		const { data, error } = authClient.useSession()

		if (error) throw error
		if (!data?.user) return null

		return {
			user: {
				name: data.user.name,
				email: data.user.email,
				id: data.user.id,
				image: data.user.image || null,
			} as User,
			isAuthenticated: true,
		}
	} catch (error) {
		console.error("Failed to fetch user session:", error)
		return null
	}
}

export function useUser() {
	const { user, setUser } = useZustand()
	const [isLoading, setIsLoading] = useState(!user)
	const didMount = useDidMount()

	const { data, error } = authClient.useSession()

	useEffect(() => {
		const user = data?.user || null
		if (error) {
			console.error("Error fetching user session:", error)
		}

		const checkAuth = async () => {
			if (!user || user === null) {
				const sessionUser = await fetchSessionUser()
				if (didMount && sessionUser) {
					setUser(sessionUser.user)
				}
			}
			if (didMount) setIsLoading(false)
		}

		checkAuth()
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, setUser, didMount])

	// Return null if not authenticated, user object if authenticated
	return {
		user: user ? user : null,
		isLoading,
	}
}
