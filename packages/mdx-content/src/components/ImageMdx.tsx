"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, type ComponentProps, type ComponentType } from "react";

export type ImageMdxProps = Omit<ComponentProps<"img">, "src"> & {
    src?: any;
    zoom?: boolean;
    ImageComponent?: ComponentType<any>;
};

export function ImageMdx({
    src,
    alt = "image",
    width = 800,
    height = 350,
    zoom = true,
    style,
    ImageComponent,
    ...props
}: ImageMdxProps) {
    const Image: any = ImageComponent ?? "img";
    const [isOpen, setIsOpen] = useState(false);
    const scrollYRef = useRef(0);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const dialogId = useId();

    useEffect(() => {
        if (!isOpen) return;

        scrollYRef.current = window.scrollY;
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollYRef.current}px`;
        document.body.style.width = "100%";

        closeButtonRef.current?.focus();

        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        const onFocusTrap = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;

            const dialog = document.getElementById(dialogId);
            const focusable = dialog?.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );

            if (!focusable || focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        };

        window.addEventListener("keydown", onEsc);
        window.addEventListener("keydown", onFocusTrap);

        return () => {
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.width = "";
            window.scrollTo(0, scrollYRef.current);
            window.removeEventListener("keydown", onEsc);
            window.removeEventListener("keydown", onFocusTrap);
        };
    }, [dialogId, isOpen]);

    if (!src) return null;

    const canZoom = zoom;

    return (
        <>
            <button
                type="button"
                onClick={() => canZoom && setIsOpen(true)}
                aria-label={canZoom ? "Zoom image" : "Image"}
                style={{
                    position: "relative",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    margin: "1rem 0",
                    cursor: canZoom ? "zoom-in" : "default",
                }}
            >
                <Image
                    src={src}
                    alt={alt}
                    width={typeof width === "number" ? width : parseInt(width as string, 10)}
                    height={typeof height === "number" ? height : parseInt(height as string, 10)}
                    style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: 10,
                        objectFit: "contain",
                        ...style,
                    }}
                    {...props}
                />
            </button>

            {canZoom && isOpen ? (
                <Portal>
                    <div
                        id={dialogId}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Image preview"
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 99999,
                            background: "rgba(0,0,0,0.88)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "1rem",
                        }}
                    >
                        <button
                            ref={closeButtonRef}
                            type="button"
                            aria-label="Close image preview"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            style={{
                                position: "absolute",
                                top: 16,
                                right: 16,
                                border: "1px solid rgba(255,255,255,0.24)",
                                borderRadius: 8,
                                background: "rgba(0,0,0,0.45)",
                                color: "#fff",
                                padding: "0.4rem 0.55rem",
                                cursor: "pointer",
                            }}
                        >
                            Close
                        </button>

                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                maxWidth: "92vw",
                                maxHeight: "90vh",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Image
                                src={src}
                                alt={alt}
                                width={1920}
                                height={1080}
                                style={{
                                    width: "auto",
                                    height: "auto",
                                    maxWidth: "92vw",
                                    maxHeight: "90vh",
                                    objectFit: "contain",
                                    borderRadius: 10,
                                }}
                            />
                        </div>
                    </div>
                </Portal>
            ) : null}
        </>
    );
}

function Portal({ children }: { children: React.ReactNode }) {
    if (typeof window === "undefined") return null;
    return createPortal(children, document.body);
}
