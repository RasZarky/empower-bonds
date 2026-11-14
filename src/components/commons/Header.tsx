"use client"

import React, { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
	motion,
	useScroll,
	useMotionValueEvent,
	useMotionValue,
	animate,
	useTransform,
} from "framer-motion"
import { BsPersonCircle } from "react-icons/bs"
import { IoClose, IoPersonAddSharp } from "react-icons/io5"
import {
	RiDashboardHorizontalLine,
	RiLogoutBoxLine,
	RiSettings3Line,
} from "react-icons/ri"
import { TbLogin2, TbMenu3 } from "react-icons/tb"
import Logo from "./Logo"
import { Session } from "@/types/auth"
import { authClient } from "@/lib/auth-client"
import { useClickOutside } from "@/hooks/useClickOutside"
import { Separator } from "../ui/separator"

// Navigation link interface
interface NavLink {
	href: string
	label: string
}

// Navigation links configuration
const navLinks: NavLink[] = [
	{ href: "/", label: "Home" },
	{ href: "/careers", label: "Careers" },
	{ href: "/about", label: "About" },
	{ href: "/security", label: "Security" },
]

const redirect_link = "/auth/login" // Redirect link after logout

// Header component props
interface HeaderProps {
	session: Session | null
}

interface CursorPosition {
	left: number
	width: number
	opacity: number
}

/**
 * Header component with responsive navigation, scroll-based behavior,
 * and user authentication controls.
 */
const Header: React.FC<HeaderProps> = ({ session }) => {
	const { scrollY } = useScroll()
	const pathname = usePathname()
	const router = useRouter()

	const [isHidden, setIsHidden] = useState<boolean>(false)
	const [lastScrollY, setLastScrollY] = useState<number>(0)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false)

	// Refs for click outside detection
	const mobileMenuRef = useRef<HTMLDivElement>(null)
	const profileMenuRef = useRef<HTMLDivElement>(null)

	// Thresholds for scroll behavior
	const FIXED_THRESHOLD = 90
	const HIDE_THRESHOLD = 100

	// Motion values for header animation
	const headerY = useMotionValue(0)
	const headerPosition = useTransform(headerY, (y) =>
		y <= FIXED_THRESHOLD ? "relative" : "fixed"
	)
	const headerOpacity = useTransform(headerY, [0, FIXED_THRESHOLD], [1, 1])

	// Close menus on outside click
	useClickOutside(mobileMenuRef, () => {
		if (isMobileMenuOpen) setIsMobileMenuOpen(false)
	})
	useClickOutside(profileMenuRef, () => {
		if (isProfileMenuOpen) setIsProfileMenuOpen(false)
	})

	// Handle scroll events
	useMotionValueEvent(scrollY, "change", (latestScrollY: number) => {
		const scrollDirection = latestScrollY > lastScrollY ? "down" : "up"
		headerY.set(latestScrollY)
		const beyondThreshold = latestScrollY > FIXED_THRESHOLD

		if (beyondThreshold) {
			if (
				scrollDirection === "down" &&
				latestScrollY > lastScrollY + HIDE_THRESHOLD
			) {
				setIsHidden(true)
			} else if (scrollDirection === "up") {
				setIsHidden(false)
			}
		} else {
			setIsHidden(false)
		}
		setLastScrollY(latestScrollY)
	})

	// Animate header visibility
	useEffect(() => {
		animate(headerY, isHidden ? lastScrollY + 100 : lastScrollY, {
			type: "spring",
			stiffness: 300,
			damping: 30,
		})
	}, [isHidden, lastScrollY, headerY])

	// Handle logout action
	const handleLogout = async (): Promise<void> => {
		console.log("Logout clicked")
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push(redirect_link) // redirect to login page
				},
			},
		})
	}

	return (
		<motion.header
			style={{
				position: headerPosition,
				y: isHidden ? "-100%" : 0,
				opacity: headerOpacity,
				top: 24,
				left: 0,
				right: 0,
				zIndex: 50,
			}}
			className="font-lex px-4 py-0 lg:py-4 w-screen relative"
		>
			<div className="container mx-auto px-6 lg:px-10 py-2 backdrop-blur-md bg-gray-70/70 border-[0.5px] border-gray-50 rounded-full flex items-center justify-between">
				<Logo />

				{/* Desktop Navigation */}
				<DesktopNavigation
					navLinks={navLinks}
					pathname={pathname}
				/>

				{/* Authentication/Profile Controls */}
				<AuthControls
					session={session}
					// @ts-expect-error not null assertion
					profileMenuRef={profileMenuRef}
					isProfileMenuOpen={isProfileMenuOpen}
					setIsProfileMenuOpen={setIsProfileMenuOpen}
					handleLogout={handleLogout}
				/>

				{/* Mobile Menu Button */}
				<MobileMenuButton setIsMobileMenuOpen={setIsMobileMenuOpen} />
			</div>

			{/* Mobile Menu Overlay */}
			<MobileMenu
				// @ts-expect-error not null assertion
				mobileMenuRef={mobileMenuRef}
				isMobileMenuOpen={isMobileMenuOpen}
				setIsMobileMenuOpen={setIsMobileMenuOpen}
				navLinks={navLinks}
				pathname={pathname}
				session={session}
				handleLogout={handleLogout}
			/>
		</motion.header>
	)
}

// Renders the animated background shape
const NavCursor: React.FC<{ position: CursorPosition }> = ({ position }) => (
	<motion.div
		animate={{
			left: position.left,
			width: position.width,
			opacity: position.opacity,
		}}
		className="absolute top-0 bottom-0 z-0 rounded-full bg-gray-60"
		transition={{
			type: "spring",
			stiffness: 300,
			damping: 30,
		}}
	/>
)

// Individual navigation item wrapper to calculate position
const NavTab: React.FC<{
	children: React.ReactNode
	href: string
	pathname: string
	setPosition: React.Dispatch<React.SetStateAction<CursorPosition>>
	setActivePosition: React.Dispatch<React.SetStateAction<CursorPosition>>
	isActive: boolean
}> = ({
	children,
	href,
	pathname,
	setPosition,
	setActivePosition,
	isActive,
}) => {
	const ref = useRef<HTMLLIElement>(null)

	const handleMouseEnter = () => {
		if (!ref.current) return
		const { width } = ref.current.getBoundingClientRect()

		// Use offsetLeft relative to the parent UL/NAV element
		setPosition({
			left: ref.current.offsetLeft,
			width: width,
			opacity: 1,
		})
	}

	// Set initial active state position on mount
	const setInitialPosition = () => {
		if (isActive && ref.current) {
			const { width } = ref.current.getBoundingClientRect()
			setPosition({
				left: ref.current.offsetLeft,
				width: width,
				opacity: 1, // Keep cursor visible if active
			})
			setActivePosition({
				left: ref.current.offsetLeft,
				width: width,
				opacity: 1,
			})
		}
	}

	// Set initial active position on first render or when pathname changes
	useEffect(() => {
		const timer = setTimeout(setInitialPosition, 50)
		return () => clearTimeout(timer)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname])

	return (
		<li
			ref={ref}
			onMouseEnter={handleMouseEnter}
			className="relative z-10 list-none flex items-center h-full"
		>
			<Link
				href={href}
				className={`text-white relative px-4 py-2 font-medium transition-colors duration-300`}
			>
				{children}
			</Link>
		</li>
	)
}

// Desktop navigation component
const DesktopNavigation: React.FC<{
	navLinks: NavLink[]
	pathname: string
}> = ({ navLinks, pathname }) => {
	const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
		left: 0,
		width: 0,
		opacity: 0,
	})
	const [activePosition, setActivePosition] = useState<CursorPosition>({
		left: 0,
		width: 0,
		opacity: 0,
	})

	return (
		<nav
			onMouseLeave={() => {
				// Find the active link's position to snap back to it on mouse leave
				const activeLink = navLinks.find(
					(link) => link.href === pathname
				)

				if (activeLink) {
					// Temporarily hide the cursor immediately
					setCursorPosition(activePosition)
				} else {
					// If no link is active, hide it completely
					setCursorPosition((pv) => ({
						...pv,
						opacity: 0,
					}))
				}
			}}
			// Added space-x-2 for spacing and flex-row to ensure list items are laid out correctly
			className="hidden lg:flex relative items-center justify-center p-1 rounded-full space-x-2"
		>
			<NavCursor position={cursorPosition} />

			{navLinks.map((link) => {
				const isActive = pathname === link.href
				return (
					<NavTab
						key={link.href}
						href={link.href}
						pathname={pathname}
						setPosition={setCursorPosition}
						setActivePosition={setActivePosition}
						isActive={isActive}
					>
						{link.label}
					</NavTab>
				)
			})}
		</nav>
	)
}

// Authentication controls component
const AuthControls: React.FC<{
	session: Session | null
	profileMenuRef: React.RefObject<HTMLDivElement>
	isProfileMenuOpen: boolean
	setIsProfileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
	handleLogout: () => void
}> = ({
	session,
	profileMenuRef,
	isProfileMenuOpen,
	setIsProfileMenuOpen,
	handleLogout,
}) => (
	<div
		ref={profileMenuRef}
		className="hidden lg:flex items-center space-x-4"
	>
		{session ? (
			<div className="relative">
				<button
					type="button"
					onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
					className="cursor-pointer flex items-center space-x-2 text-white hover:text-green-80 transition-colors duration-300 focus:outline-none"
				>
					<BsPersonCircle className="text-2xl" />
					<span>Hi, {session.user.name.split(" ")[0]}</span>
				</button>
				{isProfileMenuOpen && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2 }}
						className="absolute right-0 mt-2 w-48 bg-[#252525] border border-[#333] rounded-md shadow-lg py-2 z-50"
					>
						<Link
							href="/dashboard"
							onClick={() => setIsProfileMenuOpen(false)}
							className="flex items-center px-4 py-2 text-white hover:bg-[#333] transition-colors duration-200"
						>
							<RiDashboardHorizontalLine className="mr-2" />
							Dashboard
						</Link>
						<Link
							href="/settings"
							onClick={() => setIsProfileMenuOpen(false)}
							className="flex items-center px-4 py-2 text-white hover:bg-[#333] transition-colors duration-200"
						>
							<RiSettings3Line className="mr-2" />
							Settings
						</Link>
						<button
							type="button"
							onClick={handleLogout}
							className="w-full text-left flex items-center px-4 py-2 text-red-400 hover:bg-[#333] transition-colors duration-200"
						>
							<RiLogoutBoxLine className="mr-2" />
							Logout
						</button>
					</motion.div>
				)}
			</div>
		) : (
			<>
				<Link
					href="/auth/register"
					className="text-white hover:text-green-80 transition-colors duration-300"
				>
					Sign Up
				</Link>
				<Link
					href="/auth/login"
					className="bg-green-80 text-gray-80 font-semibold py-2 px-6 rounded-full hover:bg-green-80/80 transition-colors duration-300"
				>
					Login
				</Link>
			</>
		)}
	</div>
)

// Mobile menu button component
const MobileMenuButton: React.FC<{
	setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
}> = ({ setIsMobileMenuOpen }) => (
	<div className="lg:hidden cursor-pointer h-fit w-fit">
		<button
			type="button"
			onClick={() => setIsMobileMenuOpen(true)}
			className="cursor-pointer text-green-80 focus:outline-none flex items-center"
		>
			<TbMenu3 className="w-6 h-6" />
		</button>
	</div>
)

// Mobile menu overlay component
const MobileMenu: React.FC<{
	mobileMenuRef: React.RefObject<HTMLDivElement>
	isMobileMenuOpen: boolean
	setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
	navLinks: NavLink[]
	pathname: string
	session: Session | null
	handleLogout: () => void
}> = ({
	mobileMenuRef,
	isMobileMenuOpen,
	setIsMobileMenuOpen,
	navLinks,
	pathname,
	session,
	handleLogout,
}) => (
	<motion.div
		ref={mobileMenuRef}
		initial={{ x: "100%" }}
		animate={{
			x: isMobileMenuOpen ? 0 : "100%",
			display: isMobileMenuOpen ? "block" : "none",
		}}
		transition={{ duration: 0.3 }}
		className={`border-[0.75px] border-gray-70 rounded-xl fixed top-6 right-2 bottom-6 w-72 h-auto bg-gray-80/80 backdrop-blur-md z-[100] shadow-lg lg:hidden flex flex-col justify-between`}
	>
		<div className="border-[0.5px] border-green-80  rounded-xl absolute top-2 right-2 flex justify-end p-2 z-50">
			<button
				type="button"
				onClick={() => setIsMobileMenuOpen(false)}
				className="text-green-80 focus:outline-none cursor-pointer flex"
			>
				<IoClose className="w-6 h-6" />
			</button>
		</div>
		<nav className="center relative z-0 flex flex-col justify-between h-full p-4 pt-16 space-y-4 text-base font-medium">
			<div className="flex flex-col items-center space-y-4 pt-[55%]">
				{navLinks.map((link) => (
					<Link
						key={link.href}
						href={link.href}
						onClick={() => setIsMobileMenuOpen(false)}
						className={`transition-colors duration-300 cursor-pointer ${
							pathname === link.href
								? "text-green-80"
								: "text-gray-20 cursor-pointer hover:text-green-80"
						}`}
					>
						{link.label}
					</Link>
				))}
			</div>

			<Separator className="w-full h-px bg-gray-60" />

			<div className="pt-6 mt-4 gap-4 flex items-center justify-center">
				{session ? (
					<>
						<Link
							href="/dashboard"
							onClick={() => setIsMobileMenuOpen(false)}
							className="flex items-center text-white hover:text-green-80 transition-colors duration-300"
						>
							<RiDashboardHorizontalLine className="mr-2" />
							Dashboard
						</Link>
						<Link
							href="/settings"
							onClick={() => setIsMobileMenuOpen(false)}
							className="flex items-center text-white hover:text-green-80 transition-colors duration-300"
						>
							<RiSettings3Line className="mr-2 h-4 w-4" />
							Settings
						</Link>
						<button
							type="button"
							onClick={() => {
								handleLogout()
								setIsMobileMenuOpen(false)
							}}
							className="w-full text-left flex items-center text-red-400 hover:text-red-300 transition-colors duration-200"
						>
							<RiLogoutBoxLine className="mr-2 h-4 w-4" />
							Logout
						</button>
					</>
				) : (
					<>
						<Link
							href="/auth/register"
							onClick={() => setIsMobileMenuOpen(false)}
							className="flex items-center text-white hover:text-green-80 transition-colors duration-300"
						>
							<IoPersonAddSharp className="mr-2 h-4 w-4" />
							Sign Up
						</Link>
						{" |"}
						<Link
							href="/auth/login"
							onClick={() => setIsMobileMenuOpen(false)}
							className="flex items-center text-white font-semibold hover:text-green-80 transition-colors duration-300"
						>
							<TbLogin2 className="mr-2 h-4 w-4" />
							Login
						</Link>
					</>
				)}
			</div>
		</nav>
	</motion.div>
)

export default Header
