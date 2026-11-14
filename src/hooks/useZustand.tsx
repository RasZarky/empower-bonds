import { TransferProp } from "@/types"
import { User } from "@/types/db"
import { ReactNode } from "react"
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface State {
	user: User | null
	dashboardPage: string
	open: boolean
	opened: boolean
	openSubmenu: boolean
	mobileNavopened: boolean
	openPin: boolean
	showDashMobileNav: boolean
	getStartedEmail?: string
	transferDetails?: TransferProp
	accountNumber?: string
	domesticAccount: boolean
	loading: boolean
	button: ReactNode | null
	content: ReactNode | null
	title: string
	description: string | ReactNode
	authenticated: boolean
	activeModal: string | null
	theme: "light" | "dark"
	selectedCardId: string | null
	selectedBankId: string | null
	showScrollIndicator: boolean
	setShowScrollIndicator: (visible: boolean) => void
	setSelectedCardId: (cardId: string | null) => void
	setSelectedBankId: (bankId: string | null) => void
	setOpen: (open: boolean) => void
	setOpened: (opened: boolean) => void
	setDashboardPage: (value: string) => void
	setOpenSubmenu: (openSubmenu: boolean) => void
	setMobileNavopened: (mobileNavopened: boolean) => void
	setLoading: (loading: boolean) => void
	setGetStartedEmail: (email: string) => void
	setOpenPin: (data: boolean) => void
	setShowDashMobileNav: (data: boolean) => void
	setTransferDetails: (data: TransferProp) => void
	setAccountNumber: (data: string) => void
	setDomesticAccount: (data: boolean) => void
	resetMenu: () => void
	setTitle: (title: string) => void
	setButton: (button: ReactNode | null) => void
	setContent: (content: ReactNode | null) => void
	setDescription: (desc: string) => void
	setUser: (user: User | null) => void
	setActiveModal: (modalName: string | null) => void
	setAuthenticated: (auth: boolean) => void
	setTheme: (theme: "light" | "dark") => void
}

/**
 * A custom Zustand hook for managing global application state, including user authentication,
 * theme settings, and user information. The state is persisted to local storage under the
 * name "app-storage".
 *
 * @returns {State} An object containing:
 *   - Current state values (user, authenticated, theme)
 *   - Setter functions (setUser, setAuthenticated, setTheme)
 *
 * @example
 * // Accessing state values
 * const { user, authenticated, theme } = useZustand();
 *
 * @example
 * // Updating state values
 * function UserControls() {
 *   const { setUser, setAuthenticated, setTheme } = useZustand();
 *
 *   const handleLogin = (username: string) => {
 *     setUser(username);
 *     setAuthenticated(true);
 *   };
 *
 *   const handleLogout = () => {
 *     setUser(null);
 *     setAuthenticated(false);
 *   };
 *
 *   const toggleTheme = () => {
 *     setTheme(useZustand.getState().theme === "light" ? "dark" : "light");
 *   };
 * }
 */
export const useZustand = create<State>()(
	persist(
		(set) => ({
			user: null,
			loading: false,
			authenticated: false,
			dashboardPage: "Dashboard",
			theme: "light",
			open: false,
			opened: false,
			openSubmenu: false,
			mobileNavopened: false,
			openPin: false,
			showDashMobileNav: false,
			getStartedEmail: undefined,
			transferDetails: undefined,
			accountNumber: undefined,
			domesticAccount: false,
			activeModal: null,
			title: "",
			button: null,
			content: null,
			description: "",
			selectedCardId: null, // Initial state: no card selected
			selectedBankId: null, // Initial state: no card selected
			showScrollIndicator: false, // Default to false, will be set by useEffect
			setShowScrollIndicator: (visible) =>
				set({ showScrollIndicator: visible }),
			setSelectedCardId: (cardId) => set({ selectedCardId: cardId }),
			setSelectedBankId: (bankId) => set({ selectedBankId: bankId }),
			setLoading: (loading) => set({ loading: loading }),
			setOpen: (open) => set({ open: open }),
			setOpened: (open) => set({ opened: open }),
			setDashboardPage: (value) => set({ dashboardPage: value }),
			setOpenSubmenu: (open) => set({ openSubmenu: open }),
			setGetStartedEmail: (email) => set({ getStartedEmail: email }),
			setMobileNavopened: (open) => set({ mobileNavopened: open }),
			setOpenPin: (open) => set({ openPin: open }),
			setShowDashMobileNav: (open) => set({ showDashMobileNav: open }),
			setTransferDetails: (data) => set({ transferDetails: data }),
			setAccountNumber: (account) => set({ accountNumber: account }),
			setDomesticAccount: (open) => set({ domesticAccount: open }),
			setButton: (button) => set({ button }),
			setContent: (content) => set({ content }),
			setTitle: (title) => set({ title }),
			setDescription: (description) => set({ description }),
			setUser: (user) => set({ user }),
			setAuthenticated: (auth) => set({ authenticated: auth }),
			setActiveModal: (modalName) => set({ activeModal: modalName }),
			setTheme: (theme) => set({ theme }),
			resetMenu: () => {
				set({
					opened: false,
					content: undefined,
					mobileNavopened: false,
					openSubmenu: false,
				})
			},
		}),
		{
			name: "app-storage",
			storage: createJSONStorage(() => localStorage),
		}
	)
)
