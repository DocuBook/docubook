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
        paddingBottom: "56.25%",
        height: 0,
        overflow: "hidden",
        background: "#000",
        borderRadius: 8,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
        margin: "1rem 0",
      }}
    >
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
          borderRadius: 8,
        }}
      />
    </div>
  );
}
