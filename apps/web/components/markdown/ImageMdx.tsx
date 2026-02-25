"use client";

import { ComponentProps, useState, useEffect } from "react";
import NextImage from "next/image";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn } from "lucide-react";

type Height = ComponentProps<typeof NextImage>["height"];
type Width = ComponentProps<typeof NextImage>["width"];

type ImageProps = Omit<ComponentProps<"img">, "src"> & {
    src?: ComponentProps<typeof NextImage>["src"];
};

export default function Image({
    src,
    alt = "alt",
    width = 800,
    height = 350,
    ...props
}: ImageProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Lock scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            // Check for Escape key
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === "Escape") setIsOpen(false);
            };
            window.addEventListener("keydown", handleEsc);
            return () => {
                document.body.style.overflow = "auto";
                window.removeEventListener("keydown", handleEsc);
            };
        }
    }, [isOpen]);

    if (!src) return null;

    return (
        <>
            <button
                type="button"
                className="relative group cursor-zoom-in my-6 w-full flex justify-center rounded-lg"
                onClick={() => setIsOpen(true)}
                aria-label="Zoom image"
            >
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
                    <ZoomIn className="w-8 h-8 text-white drop-shadow-md" />
                </span>
                <NextImage
                    src={src}
                    alt={alt}
                    width={width as Width}
                    height={height as Height}
                    quality={85}
                    className="w-full h-auto rounded-lg transition-transform duration-300 group-hover:scale-[1.01]"
                    {...props}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <Portal>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-10 cursor-zoom-out"
                            onClick={() => setIsOpen(false)}
                        >
                            {/* Close Button */}
                            <button
                                className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-white/10 rounded-full transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Image Container */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative max-w-7xl w-full h-full flex items-center justify-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="relative w-full h-full flex items-center justify-center" onClick={() => setIsOpen(false)}>
                                    <NextImage
                                        src={src}
                                        alt={alt}
                                        width={1920}
                                        height={1080}
                                        className="object-contain max-h-[90vh] w-auto h-auto rounded-md shadow-2xl"
                                        quality={95}
                                    />
                                </div>
                            </motion.div>

                            {/* Caption */}
                            {alt && alt !== "alt" && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border border-white/10"
                                >
                                    {alt}
                                </motion.div>
                            )}

                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>
        </>
    );
}

const Portal = ({ children }: { children: React.ReactNode }) => {
    if (typeof window === "undefined") return null;
    return createPortal(children, document.body);
};
