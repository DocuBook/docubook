import React from "react";

interface YoutubeProps {
  videoId: string;
  className?: string;
}

const Youtube: React.FC<YoutubeProps> = ({ videoId, className }) => {
  return (
    <div className={`youtube ${className || ""}`}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&autohide=1&controls=1`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default Youtube;
