import React, { ReactNode } from "react";
import clsx from "clsx";

interface CardGroupProps {
  children: ReactNode;
  cols?: number;
  className?: string;
}

const CardGroup: React.FC<CardGroupProps> = ({ children, cols = 2, className }) => {
  const cardsArray = React.Children.toArray(children);

  // Static grid column classes for Tailwind v4 compatibility
  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[cols] || "grid-cols-1 sm:grid-cols-2";

  return (
    <div
      className={clsx(
        "grid gap-4 text-foreground",
        gridColsClass,
        className
      )}
    >
      {cardsArray.map((card, index) => (
        <div key={index}>{card}</div>
      ))}
    </div>
  );
};

export default CardGroup;
