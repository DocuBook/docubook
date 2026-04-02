type YoutubeMdxProps = {
    videoId: string;
    title?: string;
};

export function YoutubeMdx({ videoId, title = "YouTube video" }: YoutubeMdxProps) {
    const src = `https://www.youtube-nocookie.com/embed/${videoId}`;

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                paddingTop: "56.25%",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid hsl(var(--border, 210 14% 94%))",
                margin: "1rem 0",
            }}
        >
            <iframe
                src={src}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
        </div>
    );
}
