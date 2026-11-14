// Animation Variants
export const AnimateInViewLeftOrRightVariants = {
    hidden: (right: boolean) => ({
        x: right ? 100 : -100,
        opacity: 0,
    }),
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 20,
            duration: 0.5,
        },
    },
}

// Animation Variants
export const AnimateInFromBottomVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (index: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            delay: index * 0.1, // Stagger effect for one-at-a-time animation
            ease: "easeOut",
        },
    }),
}

// Utility function to generate random direction
const getRandomDirection = (index: number) => {
    const directions = [
        { x: -100, y: 0 }, // Left
        { x: 100, y: 0 },  // Right
        { x: 0, y: -100 }, // Top
        { x: 0, y: 100 },  // Bottom
    ];
    // Use index to deterministically select a direction for consistency
    return directions[index % directions.length];
};

// Animation variants for elements
export const RandomElementVariants = (index: number) => ({
    hidden: {
        ...getRandomDirection(index),
        opacity: 0,
    },
    visible: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.5,
            delay: index * 0.1, // Stagger effect for one-at-a-time animation
            ease: "easeOut",
        },
    },
});

export const zoomVariants = (index: number) => ({
    hidden: {
        scale: 0.6,
        opacity: 0,
    },
    visible: {
        scale: 1,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 20,
            duration: 0.3,
            delay: index * 0.2, // Stagger effect for one-at-a-time animation
            when: "beforeChildren",
            ease: "easeInOut",
        },
    },
}); 

export const linkVariants = (index: number) => ({
    hidden: { x: -50, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.4,
            delay: index * 0.1, // Stagger effect for links
            ease: "easeOut",
        },
    },
});

export const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: "easeOut",
        },
    },
};

export const cardVariants = (index: number) => ({
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: {
            duration: 0.4,
            delay: index * 0.1, // Stagger effect for cards
            ease: "easeOut",
        },
    },
});